import { describe, expect, it } from 'vitest';
import { INITIAL_SERVICES, INITIAL_SETTINGS } from '../shared/seedData';

describe('STAVPARTA baseline sanity checks', () => {
  it('exposes headquarters in Zábřeh na Moravě', () => {
    expect(INITIAL_SETTINGS.headquarters).toBe('Zábřeh na Moravě');
    expect(INITIAL_SETTINGS.operatingRegion).toContain('Olomoucký kraj');
  });

  it('defines active core building and renovation services', () => {
    expect(INITIAL_SERVICES.length).toBeGreaterThanOrEqual(6);
    expect(INITIAL_SERVICES.every((s) => s.slug.length > 0 && s.isActive)).toBe(true);
  });
});
