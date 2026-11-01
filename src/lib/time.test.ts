import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isoDateFromInstantInTimeZone, todayIsoDateInTimeZone } from './time.js';

describe('isoDateFromInstantInTimeZone', () => {
  it('maps UTC instant to Moscow calendar day after midnight', () => {
    // 2 Nov 2025 00:15 Europe/Moscow == 1 Nov 2025 21:15 UTC
    const doneAt = '2025-11-01T21:15:00.000Z';
    assert.equal(isoDateFromInstantInTimeZone(doneAt, 'Europe/Moscow'), '2025-11-02');
  });

  it('keeps date-only strings unchanged', () => {
    assert.equal(isoDateFromInstantInTimeZone('2025-11-02', 'Europe/Moscow'), '2025-11-02');
  });

  it('falls back to Europe/Moscow for invalid timezone', () => {
    const doneAt = '2025-11-01T21:15:00.000Z';
    assert.equal(isoDateFromInstantInTimeZone(doneAt, 'Not/A_Zone'), '2025-11-02');
  });
});

describe('todayIsoDateInTimeZone', () => {
  it('uses user timezone, not UTC date prefix', () => {
    const instant = new Date('2025-11-01T21:15:00.000Z');
    assert.equal(todayIsoDateInTimeZone('Europe/Moscow', instant), '2025-11-02');
    assert.equal(todayIsoDateInTimeZone('UTC', instant), '2025-11-01');
  });
});
