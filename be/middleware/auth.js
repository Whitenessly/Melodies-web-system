import { verifyToken } from '../utils/token.js';
import User from '../models/User.js';

export async function authenticate(req, res, next) {
  try {
    console.log('🔐 AUTH MIDDLEWARE - Path:', req.path);
    const authHeader = req.headers.authorization;
    console.log('🔐 Authorization header:', authHeader ? 'present' : 'MISSING');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔐 AUTH FAILED: Missing or malformed Authorization header');
      return res.status(401).json({ message: 'Missing or malformed Authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    const user = await User.findById(decoded.id);
    if (!user || !user.token || user.token !== token) {
      return res.status(401).json({ message: 'Session expired or logged out. Please log in again.' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Authentication error', error: err.message });
  }
}

export function authorize(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
}

export async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await User.findById(decoded.id);
        if (user && user.token && user.token === token) {
          req.user = user;
        }
      }
    }
    next();
  } catch (err) {
    next();
  }
}
