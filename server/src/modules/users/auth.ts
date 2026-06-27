import crypto from 'node:crypto'

const SCRYPT_KEY_LENGTH = 64

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex')

  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string) {
  const parts = storedHash.split(':')

  if (parts.length === 3 && parts[0] === 'scrypt') {
    const [, salt, hash] = parts
    const derived = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH)
    const stored = Buffer.from(hash, 'hex')

    if (stored.length !== derived.length) {
      return false
    }

    return crypto.timingSafeEqual(stored, derived)
  }

  // Legacy fallback for users created before session-based auth.
  if (/^[a-f0-9]{64}$/i.test(storedHash)) {
    const legacyHash = crypto.createHash('sha256').update(password).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(legacyHash, 'hex'))
  }

  return false
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString('hex')
}
