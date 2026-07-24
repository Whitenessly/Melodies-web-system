import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { hashPassword, verifyPassword, generateToken } from '../utils/token.js';

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashPassword(password),
      role: role || 'listener',
      premium_status: 'FREE'
    });

    const token = generateToken({ id: user._id, role: user.role });
    user.token = token;
    await user.save();
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        premium_status: user.premium_status,
        premium_expired_at: user.premium_expired_at,
        premium_auto_renew: user.premium_auto_renew,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Register failed', error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Account does not exist or incorrect email' });
    }

    const isMatch = verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    const token = generateToken({ id: user._id, role: user.role });
    user.token = token;
    await user.save();
    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        premium_status: user.premium_status,
        premium_expired_at: user.premium_expired_at,
        premium_auto_renew: user.premium_auto_renew,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
}

export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if subscription expired
    if (user.premium_status === 'PREMIUM' && user.premium_expired_at && new Date() > user.premium_expired_at) {
      user.premium_status = 'FREE';
      user.premium_expired_at = null;
      user.premium_auto_renew = true; // reset
      user.premium_warning_sent = false; // reset
      await user.save();
      console.log(`📉 User ${user.email} subscription expired. Downgraded to FREE.`);
    }

    // Send 1-day warning notification if card is removed
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (user.premium_status === 'PREMIUM' && user.premium_expired_at) {
      const timeLeft = user.premium_expired_at.getTime() - Date.now();
      if (timeLeft > 0 && timeLeft <= oneDayMs && user.paymentMethods.length === 0 && !user.premium_warning_sent) {
        const notification = new Notification({
          userId: user._id,
          title: 'Gói Premium sắp hết hạn',
          message: 'Gói cước Premium của bạn sẽ hết hạn trong vòng 24 giờ tới và bạn chưa liên kết thẻ thanh toán. Vui lòng thêm lại thẻ để duy trì dịch vụ.',
          type: 'system'
        });
        await notification.save();
        
        user.premium_warning_sent = true;
        await user.save();
        console.log(`✉️ Sent 1-day warning notification to ${user.email}`);
      }
    }

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch user profile', error: err.message });
  }
}

export async function updateMe(req, res) {
  try {
    const { name, avatarUrl, password, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (name) user.name = name;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    
    if (newPassword) {
      const curPass = password || currentPassword;
      if (!curPass) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      const isMatch = verifyPassword(curPass, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }
      user.password = hashPassword(newPassword);
      user.token = null;
    }

    await user.save();
    
    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      premium_status: user.premium_status,
      premium_expired_at: user.premium_expired_at,
      premium_auto_renew: user.premium_auto_renew,
      avatarUrl: user.avatarUrl
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
}

export async function deleteMe(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await User.findByIdAndDelete(req.user._id);
    return res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete account', error: err.message });
  }
}

export async function clearSearchHistory(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.searchHistory = [];
    await user.save();
    return res.json({ success: true, searchHistory: [] });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to clear search history', error: err.message });
  }
}

export async function removeSearchQuery(req, res) {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: 'Query parameter is required' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.searchHistory = (user.searchHistory || []).filter(h => h.toLowerCase() !== query.toLowerCase());
    await user.save();
    return res.json({ success: true, searchHistory: user.searchHistory });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to remove search query', error: err.message });
  }
}

// In-memory OTP store (email -> { otp, expiresAt })
const otpStore = {};

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    otpStore[email.toLowerCase()] = { otp, expiresAt };

    console.log(`[OTP DEBUG] Sent OTP ${otp} to ${email}`);

    return res.json({ 
      message: 'Mã OTP đã được gửi đến email của bạn.',
      otp: otp // Expose OTP for easy sandbox testing
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const record = otpStore[email.toLowerCase()];
    if (!record) {
      return res.status(400).json({ message: 'No OTP requested for this email' });
    }

    if (Date.now() > record.expiresAt) {
      delete otpStore[email.toLowerCase()];
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP code' });
    }

    return res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to verify OTP', error: err.message });
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const record = otpStore[email.toLowerCase()];
    if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
      return res.status(400).json({ message: 'Invalid or expired OTP session' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash password, reset token to null, and save
    user.password = hashPassword(newPassword);
    user.token = null;
    await user.save();

    // Clear OTP
    delete otpStore[email.toLowerCase()];

    return res.json({ message: 'Mật khẩu đã được thay đổi thành công!' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reset password', error: err.message });
  }
}

export async function changeEmailRequest(req, res) {
  try {
    const { newEmail } = req.body;
    if (!newEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if new email is in use
    const existing = await User.findOne({ email: newEmail.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email này đã được sử dụng bởi tài khoản khác.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Store in otpStore under newEmail.toLowerCase()
    otpStore[newEmail.toLowerCase()] = { otp, expiresAt, userId: req.user._id };

    console.log(`[OTP DEBUG] Email change OTP: ${otp} for email ${newEmail}`);

    return res.json({ 
      message: 'Mã OTP đã được gửi đến email mới của bạn.',
      otp: otp // Expose OTP for easy sandbox testing
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to request email change', error: err.message });
  }
}

export async function changeEmailVerify(req, res) {
  try {
    const { newEmail, otp } = req.body;
    if (!newEmail || !otp) {
      return res.status(400).json({ message: 'New email and OTP are required' });
    }

    const record = otpStore[newEmail.toLowerCase()];
    if (!record || record.userId.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: 'No OTP session found for this change request' });
    }

    if (Date.now() > record.expiresAt) {
      delete otpStore[newEmail.toLowerCase()];
      return res.status(400).json({ message: 'Mã xác thực đã hết hạn' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ message: 'Mã xác thực không chính xác' });
    }

    // Update user's email
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.email = newEmail.toLowerCase();
    await user.save();

    // Clear OTP
    delete otpStore[newEmail.toLowerCase()];

    return res.json({ 
      success: true,
      message: 'Email đã được thay đổi thành công!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        premium_status: user.premium_status,
        premium_expired_at: user.premium_expired_at,
        premium_auto_renew: user.premium_auto_renew,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to verify email change', error: err.message });
  }
}

export async function cancelSubscription(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.premium_auto_renew = false;
    await user.save();

    console.log(`📉 User ${user.email} cancelled Premium auto-renewal.`);
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to cancel subscription', error: err.message });
  }
}

export async function reactivateSubscription(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.paymentMethods.length === 0) {
      return res.status(400).json({ message: 'Vui lòng liên kết thẻ thanh toán trước khi bật lại gia hạn tự động.' });
    }

    user.premium_auto_renew = true;
    await user.save();

    console.log(`🚀 User ${user.email} reactivated Premium auto-renewal.`);
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reactivate subscription', error: err.message });
  }
}

