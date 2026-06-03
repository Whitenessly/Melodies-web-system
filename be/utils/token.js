import crypto from 'crypto';

const SECRET_KEY = process.env.TOKEN_SECRET || 'melodies-super-secret-key-12345';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedPassword) {
  const [salt, originalHash] = storedPassword.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

export function generateToken(payload) {
  const stringified = JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const base64Payload = Buffer.from(stringified).toString('base64');
  
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(base64Payload);
  const signature = hmac.digest('hex');
  
  return `${base64Payload}.${signature}`;
}

export function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  
  const [base64Payload, signature] = parts;
  
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(base64Payload);
  const expectedSignature = hmac.digest('hex');
  
  if (signature !== expectedSignature) return null;
  
  try {
    const decoded = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8'));
    if (decoded.exp < Date.now()) {
      return null; // Expired
    }
    return decoded;
  } catch (e) {
    return null;
  }
}
