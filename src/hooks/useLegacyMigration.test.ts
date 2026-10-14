import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLegacyMigration } from './useLegacyMigration';

const store: Record<string, string> = {};

function storageValue(key: string): string | null {
  return store[key] ?? null;
}

describe('useLegacyMigration', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
    global.localStorage = {
      getItem: vi.fn((key: string) => storageValue(key)),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        for (const key of Object.keys(store)) {
          delete store[key];
        }
      }),
      length: 0,
      key: vi.fn(() => null),
    } as unknown as Storage;
  });

  it('migrates valid legacy settings to per-key entries and marks migration done', () => {
    store['gridfinitySettings'] = JSON.stringify({
      drawerSize: { width: 22.5, height: 16.5 },
      selectedPrinter: 'Bambu Lab A1',
      useHalfSize: true,
      preferHalfSize: false,
      numDrawers: 2,
      useMm: true,
    });
    renderHook(() => useLegacyMigration());
    expect(store['gridfinity_drawerSize']).toBe(JSON.stringify({ width: 22.5, height: 16.5 }));
    expect(store['gridfinity_selectedPrinter']).toBe(JSON.stringify('Bambu Lab A1'));
    expect(store['gridfinity_useHalfSize']).toBe('true');
    expect(store['gridfinity_preferHalfSize']).toBe('false');
    expect(store['gridfinity_numDrawers']).toBe('2');
    expect(store['gridfinity_useMm']).toBe('true');
    expect(store['gridfinity_migration_v1']).toBe('true');
  });

  it('survives corrupt legacy settings without throwing and writes nothing', () => {
    store['gridfinitySettings'] = '{not json';
    expect(() => renderHook(() => useLegacyMigration())).not.toThrow();
    expect(store['gridfinity_drawerSize']).toBeUndefined();
    expect(store['gridfinity_migration_v1']).toBeUndefined();
  });

  it('marks migration done when no legacy settings exist', () => {
    renderHook(() => useLegacyMigration());
    expect(store['gridfinity_migration_v1']).toBe('true');
  });

  it('does nothing when migration already ran', () => {
    store['gridfinity_migration_v1'] = 'true';
    store['gridfinitySettings'] = JSON.stringify({ numDrawers: 3 });
    renderHook(() => useLegacyMigration());
    expect(store['gridfinity_numDrawers']).toBeUndefined();
  });
});
