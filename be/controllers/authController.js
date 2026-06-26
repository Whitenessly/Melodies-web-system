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
    const { name, avatarUrl } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (name) user.name = name;
    if (avatarUrl) user.avatarUrl = avatarUrl;
    
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
