import * as crypto from 'crypto';

// ── PASSWORD HASHING ──────────────────────────────────────────────────────────
// PBKDF2 with 600,000 iterations (OWASP 2023 recommendation for SHA-512)

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 600000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;

    // Support legacy 1000-iteration hashes — verify and flag for rehash
    // Try 600k first (new), fall back to 1000 (old)
    const newHash = crypto
      .pbkdf2Sync(password, salt, 600000, 64, 'sha512')
      .toString('hex');

    if (crypto.timingSafeEqual(Buffer.from(newHash, 'hex'), Buffer.from(hash, 'hex'))) {
      return true;
    }

    // Legacy fallback — 1000 iterations
    const legacyHash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');

    // Use timingSafeEqual to prevent timing attacks
    if (legacyHash.length !== hash.length) return false;
    return crypto.timingSafeEqual(
      Buffer.from(legacyHash, 'hex'),
      Buffer.from(hash, 'hex')
    );
  } catch {
    return false;
  }
}

// ── JWT TOKEN ─────────────────────────────────────────────────────────────────

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'your-secret-key' || secret.length < 32) {
    // In production this should always be set — throw to make the issue obvious
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is not set or is too short. Minimum 32 characters required.');
    }
    // In dev, warn loudly but continue
    console.warn('⚠️  WARNING: JWT_SECRET is not set or insecure. Set a strong secret in your .env file.');
    return 'dev-only-secret-change-in-production-minimum-32-chars';
  }
  return secret;
}

export function generateToken(userId: string, expiresIn: number = 7 * 24 * 60 * 60): string {
  const secret = getJwtSecret();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): { userId: string; valid: boolean } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { userId: '', valid: false };
    const [header, payload, signature] = parts;
    if (!header || !payload || !signature) return { userId: '', valid: false };

    const secret = getJwtSecret();
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    // Constant-time comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSig);
    if (sigBuffer.length !== expectedBuffer.length) return { userId: '', valid: false };
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return { userId: '', valid: false };

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!decoded.userId || !decoded.exp) return { userId: '', valid: false };
    if (decoded.exp < Math.floor(Date.now() / 1000)) return { userId: '', valid: false };

    return { userId: decoded.userId, valid: true };
  } catch {
    return { userId: '', valid: false };
  }
}

// ── UTILITIES ─────────────────────────────────────────────────────────────────

export function generateVerificationCode(length: number = 6): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

export function generateUsernameFromEmail(email: string): string {
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
  const suffix = crypto.randomBytes(2).toString('hex');
  return `${base}_${suffix}`;
}