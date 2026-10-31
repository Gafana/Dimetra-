import { execute, query, queryOne, withTransaction } from '../db/pool.js';
import {
  generatePromoCode,
  hashPromoCode,
  isExactPromoCode,
  readPromoPepper,
} from '../lib/promoCode.js';

export class PromoConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PromoConfigError';
  }
}

export interface IssuedPromoCode {
  plain: string;
  codeHash: string;
  maxActivations: number;
  expiresAt: Date;
}

export interface UserAccess {
  admitted: boolean;
  activated: boolean;
  hasGardenData: boolean;
}

export type RedeemResult =
  | { ok: true; codeHash: string | null }
  | { ok: false; reason: 'invalid' | 'config' | 'error' };

interface AccessRow {
  activated: boolean;
  has_rooms: boolean;
  has_plants: boolean;
}

export async function getUserAccess(telegramId: string): Promise<UserAccess> {
  const row = await queryOne<AccessRow>(
    `SELECT
       EXISTS (SELECT 1 FROM promo_code_activations WHERE telegram_id = $1) AS activated,
       EXISTS (SELECT 1 FROM rooms WHERE telegram_chat_id = $1) AS has_rooms,
       EXISTS (SELECT 1 FROM user_plants WHERE telegram_chat_id = $1) AS has_plants`,
    [telegramId],
  );

  const activated = row?.activated === true;
  const hasGardenData = row?.has_rooms === true || row?.has_plants === true;
  // user_settings alone does not admit: /start used to create it before any plants or rooms existed.
  return {
    admitted: activated || hasGardenData,
    activated,
    hasGardenData,
  };
}

export async function isAdmitted(telegramId: string): Promise<boolean> {
  const access = await getUserAccess(telegramId);
  return access.admitted;
}

export async function createPromoCode(input: {
  maxActivations: number;
  expiresAt: Date;
}): Promise<IssuedPromoCode> {
  const pepper = readPromoPepper();
  if (!pepper) {
    throw new PromoConfigError('PROMO_CODE_PEPPER is missing or shorter than 16 characters');
  }
  if (
    !Number.isInteger(input.maxActivations) ||
    input.maxActivations < 1 ||
    input.maxActivations > 1000
  ) {
    throw new Error('Invalid promo activation limit');
  }
  if (
    !(input.expiresAt instanceof Date) ||
    Number.isNaN(input.expiresAt.getTime()) ||
    input.expiresAt.getTime() <= Date.now()
  ) {
    throw new Error('Invalid promo expiry');
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const plain = generatePromoCode();
    const codeHash = hashPromoCode(plain, pepper);
    const rows = await query<{ code: string }>(
      `INSERT INTO promo_codes (code, max_activations, used_count, expires_at, created_at)
       VALUES ($1, $2, 0, $3, NOW())
       ON CONFLICT (code) DO NOTHING
       RETURNING code`,
      [codeHash, input.maxActivations, input.expiresAt.toISOString()],
    );
    if (rows.length > 0) {
      return {
        plain,
        codeHash,
        maxActivations: input.maxActivations,
        expiresAt: input.expiresAt,
      };
    }
  }

  throw new Error('Failed to generate a unique promo code');
}

export async function deleteUnusedPromoCode(codeHash: string): Promise<void> {
  await execute(
    `DELETE FROM promo_codes AS promo
     WHERE promo.code = $1
       AND promo.used_count = 0
       AND NOT EXISTS (
         SELECT 1 FROM promo_code_activations AS activation
         WHERE activation.code = promo.code
       )`,
    [codeHash],
  );
}

export async function redeemPromoCode(telegramId: string, plain: string): Promise<RedeemResult> {
  const pepper = readPromoPepper();
  if (!pepper) {
    console.error('PROMO_CODE_PEPPER is missing or shorter than 16 characters');
    return { ok: false, reason: 'config' };
  }
  if (!isExactPromoCode(plain)) {
    return { ok: false, reason: 'invalid' };
  }

  const codeHash = hashPromoCode(plain, pepper);

  try {
    return await withTransaction(async (client) => {
      const existing = await client.query(
        `SELECT telegram_id FROM promo_code_activations WHERE telegram_id = $1 FOR UPDATE`,
        [telegramId],
      );
      if (existing.rows.length > 0) {
        return { ok: true, codeHash: null };
      }

      const updated = await client.query(
        `UPDATE promo_codes
         SET used_count = used_count + 1
         WHERE code = $1
           AND used_count < max_activations
           AND expires_at > NOW()
         RETURNING code`,
        [codeHash],
      );
      if (updated.rows.length !== 1) {
        return { ok: false, reason: 'invalid' };
      }

      await client.query(
        `INSERT INTO promo_code_activations (telegram_id, code, activated_at)
         VALUES ($1, $2, NOW())`,
        [telegramId, codeHash],
      );

      return { ok: true, codeHash };
    });
  } catch (error) {
    console.error(
      `Failed to redeem promo code for ${telegramId}:`,
      error instanceof Error ? error.message : 'unknown',
    );
    return { ok: false, reason: 'error' };
  }
}
