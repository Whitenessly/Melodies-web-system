import User from '../models/User.js';
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

    await user.save();
    
    const token = generateToken({ id: user._id, role: user.role });
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        premium_status: user.premium_status,
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
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: user._id, role: user.role });
    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        premium_status: user.premium_status,
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
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch user profile', error: err.message });
  }
}

export async function updateMe(req, res) {
  try {
    const { name, avatarUrl, password, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (name) user.name = name;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    
    if (newPassword) {
      if (!password) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      const isMatch = verifyPassword(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }
      user.password = hashPassword(newPassword);
    }

    await user.save();
    
    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      premium_status: user.premium_status,
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

    const user = await User.findOne({ email });
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

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash password and save
    user.password = hashPassword(newPassword);
    await user.save();

    // Clear OTP
    delete otpStore[email.toLowerCase()];

    return res.json({ message: 'Mật khẩu đã được thay đổi thành công!' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reset password', error: err.message });
  }
}
