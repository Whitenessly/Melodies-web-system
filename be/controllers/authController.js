import User from '../models/User.js';
import { hashPassword, verifyPassword, generateToken } from '../utils/token.js';

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
      role: userRole
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
        likedSongs: [],
        following: []
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
        likedSongs: (user.likedSongs || []).map(id => id.toString()),
        following: (user.following || []).map(id => id.toString())
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
    const { name } = req.body;
    if (name) req.user.name = name;
    await req.user.save();
    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        likedSongs: (req.user.likedSongs || []).map(id => id.toString()),
        following: (req.user.following || []).map(id => id.toString())
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Profile update failed', error: err.message });
  }
}
