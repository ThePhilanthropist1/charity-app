import * as crypto from 'crypto';

// Generate salt and hash password
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

// Verify password
export function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(':');
  const computedHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return computedHash === storedHash;
}

// Generate JWT token
export function generateToken(userId: string, expiresIn: number = 7 * 24 * 60 * 60): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'your-secret-key')
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

// Verify JWT token
export function verifyToken(token: string): { userId: string; valid: boolean } {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) {
      return { userId: '', valid: false };
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'your-secret-key')
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return { userId: '', valid: false };
    }

    // Decode payload
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());

    // Check expiration
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return { userId: '', valid: false };
    }

    return { userId: decodedPayload.userId, valid: true };
  } catch (error) {
    console.error('[v0] Token verification error:', error);
    return { userId: '', valid: false };
  }
}

// Generate random code for verification
export function generateVerificationCode(length: number = 6): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

// Generate unique username from email
export function generateUsernameFromEmail(email: string): string {
  const username = email.split('@')[0];
  const randomSuffix = crypto.randomBytes(2).toString('hex');
  return `${username}_${randomSuffix}`;
}
