import User from '../models/User.js';
import { hashPassword, verifyPassword, generateToken } from '../utils/token.js';
import { saveBase64File } from '../utils/file.js';
import Song from '../models/Song.js';
import Playlist from '../models/Playlist.js';

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields (name, email, password) are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const hashedPassword = hashPassword(password);
    const userRole = role && ['listener', 'artist', 'admin'].includes(role) ? role : 'listener';

    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole,
      avatarUrl: "",
      paymentMethods: [
        { brand: 'Visa', last4: '4242', expiry: '12/2026', isDefault: true },
        { brand: 'Mastercard', last4: '8899', expiry: '05/2025', isDefault: false }
      ]
    });

    await user.save();

    const token = generateToken({ id: user._id, role: user.role });

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        paymentMethods: user.paymentMethods,
        likedSongs: [],
        following: [],
        likedPlaylists: []
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed', error: err.message });
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
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isValid = verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken({ id: user._id, role: user.role });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || "",
        paymentMethods: user.paymentMethods || [],
        likedSongs: (user.likedSongs || []).map(id => id.toString()),
        following: (user.following || []).map(id => id.toString()),
        likedPlaylists: (user.likedPlaylists || []).map(id => id.toString())
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
}

export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve profile', error: err.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const { name, email, avatar, removeAvatar } = req.body;
    
    if (name) req.user.name = name;
    
    if (email && email.toLowerCase() !== req.user.email.toLowerCase()) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
        return res.status(400).json({ message: 'Email này đã được sử dụng bởi người dùng khác.' });
      }
      req.user.email = email.toLowerCase();
    }

    if (removeAvatar) {
      req.user.avatarUrl = "";
    } else if (avatar) {
      const avatarPath = saveBase64File(avatar, 'avatars', 'png');
      if (avatarPath) {
        req.user.avatarUrl = avatarPath;
      }
    }

    await req.user.save();
    return res.status(200).json({
      message: 'Cập nhật thông tin thành công!',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatarUrl: req.user.avatarUrl || "",
        paymentMethods: req.user.paymentMethods || [],
        likedSongs: (req.user.likedSongs || []).map(id => id.toString()),
        following: (req.user.following || []).map(id => id.toString()),
        likedPlaylists: (req.user.likedPlaylists || []).map(id => id.toString())
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Cập nhật hồ sơ thất bại', error: err.message });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc' });
    }

    const isValid = verifyPassword(currentPassword, req.user.password);
    if (!isValid) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác' });
    }

    req.user.password = hashPassword(newPassword);
    await req.user.save();

    return res.status(200).json({ message: 'Mật khẩu đã được thay đổi thành công!' });
  } catch (err) {
    return res.status(500).json({ message: 'Thay đổi mật khẩu thất bại', error: err.message });
  }
}

export async function addPaymentMethod(req, res) {
  try {
    const { cardNumber, cardholderName, cvv, expiry, isDefault } = req.body;
    if (!cardNumber || !cardholderName || !cvv || !expiry) {
      return res.status(400).json({ message: 'Thông tin thẻ không đầy đủ (Yêu cầu nhập số thẻ, tên chủ thẻ, cvv, ngày hết hạn).' });
    }

    // Basic Validation
    const sanitizedCardNumber = cardNumber.replace(/\s+/g, '');
    if (!/^\d{15,16}$/.test(sanitizedCardNumber)) {
      return res.status(400).json({ message: 'Số thẻ phải chứa 15 hoặc 16 chữ số.' });
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      return res.status(400).json({ message: 'Mã CVV phải chứa 3 hoặc 4 chữ số.' });
    }
    if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(expiry)) {
      return res.status(400).json({ message: 'Ngày hết hạn phải đúng định dạng MM/YYYY.' });
    }

    // Auto detect brand
    let brand = 'Visa';
    if (sanitizedCardNumber.startsWith('5')) {
      brand = 'Mastercard';
    } else if (sanitizedCardNumber.startsWith('3')) {
      brand = 'American Express';
    }

    const last4 = sanitizedCardNumber.slice(-4);

    if (isDefault) {
      req.user.paymentMethods.forEach(method => {
        method.isDefault = false;
      });
    }

    req.user.paymentMethods.push({
      brand,
      cardholderName: cardholderName.trim(),
      last4,
      expiry,
      isDefault: isDefault || req.user.paymentMethods.length === 0
    });

    await req.user.save();

    return res.status(200).json({
      message: 'Thêm phương thức thanh toán thành công!',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatarUrl: req.user.avatarUrl || "",
        paymentMethods: req.user.paymentMethods || [],
        likedSongs: (req.user.likedSongs || []).map(id => id.toString()),
        following: (req.user.following || []).map(id => id.toString()),
        likedPlaylists: (req.user.likedPlaylists || []).map(id => id.toString())
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Thêm phương thức thanh toán thất bại', error: err.message });
  }
}

export async function setDefaultPaymentMethod(req, res) {
  try {
    const { cardId } = req.params;
    if (!cardId) {
      return res.status(400).json({ message: 'Card ID là bắt buộc.' });
    }

    const index = req.user.paymentMethods.findIndex(card => card._id.toString() === cardId);
    if (index === -1) {
      return res.status(404).json({ message: 'Không tìm thấy thẻ.' });
    }

    req.user.paymentMethods.forEach((card, idx) => {
      card.isDefault = (idx === index);
    });

    await req.user.save();

    return res.status(200).json({
      message: 'Đặt phương thức thanh toán mặc định thành công!',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatarUrl: req.user.avatarUrl || "",
        paymentMethods: req.user.paymentMethods || [],
        likedSongs: (req.user.likedSongs || []).map(id => id.toString()),
        following: (req.user.following || []).map(id => id.toString()),
        likedPlaylists: (req.user.likedPlaylists || []).map(id => id.toString())
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Cập nhật thẻ mặc định thất bại', error: err.message });
  }
}

export async function deletePaymentMethod(req, res) {
  try {
    const { cardId } = req.params;
    if (!cardId) {
      return res.status(400).json({ message: 'Card ID là bắt buộc.' });
    }

    const index = req.user.paymentMethods.findIndex(card => card._id.toString() === cardId);
    if (index === -1) {
      return res.status(404).json({ message: 'Không tìm thấy thẻ.' });
    }

    const wasDefault = req.user.paymentMethods[index].isDefault;
    req.user.paymentMethods.splice(index, 1);

    // If we deleted the default card, set the first remaining card as default
    if (wasDefault && req.user.paymentMethods.length > 0) {
      req.user.paymentMethods[0].isDefault = true;
    }

    await req.user.save();

    return res.status(200).json({
      message: 'Xóa phương thức thanh toán thành công!',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatarUrl: req.user.avatarUrl || "",
        paymentMethods: req.user.paymentMethods || [],
        likedSongs: (req.user.likedSongs || []).map(id => id.toString()),
        following: (req.user.following || []).map(id => id.toString()),
        likedPlaylists: (req.user.likedPlaylists || []).map(id => id.toString())
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Xóa phương thức thanh toán thất bại', error: err.message });
  }
}

export async function deleteOwnAccount(req, res) {
  try {
    const userId = req.user._id;

    // Delete user
    await User.findByIdAndDelete(userId);

    // Cleanup artist songs if the user was an artist
    if (req.user.role === 'artist') {
      const songs = await Song.find({ artistId: userId });
      for (const song of songs) {
        await Playlist.updateMany({ songs: song._id }, { $pull: { songs: song._id } });
        await User.updateMany({ likedSongs: song._id }, { $pull: { likedSongs: song._id } });
        await Song.findByIdAndDelete(song._id);
      }
    }

    // Also remove from followings/followers list
    await User.updateMany({}, { $pull: { following: userId } });

    // Delete playlists owned by this user
    await Playlist.deleteMany({ ownerId: userId });

    return res.status(200).json({ message: 'Tài khoản đã được xóa thành công.' });
  } catch (err) {
    return res.status(500).json({ message: 'Xóa tài khoản thất bại', error: err.message });
  }
}
