import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password using bcrypt.
 * Use this for creating new users or updating passwords.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a stored bcrypt hash.
 * Returns true if they match.
 */
export async function comparePassword(
  plaintext: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hashedPassword);
}
