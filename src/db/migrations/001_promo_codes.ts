/**
 * Startup migration `001_promo_codes`.
 * Column `code` stores an HMAC-SHA256 hex digest of the normalized promo code, never plaintext.
 */
export const PROMO_MIGRATION_ID = '001_promo_codes';

export const PROMO_MIGRATION_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS promo_codes (
    code TEXT PRIMARY KEY NOT NULL,
    max_activations INTEGER NOT NULL CHECK (max_activations > 0),
    used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0 AND used_count <= max_activations),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS promo_code_activations (
    telegram_id TEXT PRIMARY KEY NOT NULL,
    code TEXT NOT NULL REFERENCES promo_codes (code),
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_promo_code_activations_code ON promo_code_activations (code)`,
];
