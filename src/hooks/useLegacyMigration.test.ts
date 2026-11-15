import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLegacyMigration } from './useLegacyMigration';
import { useGridfinitySettings } from './useGridfinitySettings';
import { renderHook } from '@testing-library/react';

const store: Record<string, string> = {};

const storageValue = (key: string): string | null => store[key] ?? null;

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

describe('legacy settings reach the settings provider', () => {
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
      clear: vi.fn(),
      length: 0,
      key: vi.fn(() => null),
    } as unknown as Storage;
  });

  it('migrates before the per-key settings are read, so the old values win over defaults', () => {
    store['gridfinitySettings'] = JSON.stringify({
      drawerSize: { width: 30, height: 20 },
      selectedPrinter: 'Prusa MK4',
      useHalfSize: true,
      numDrawers: 4,
      useMm: true,
    });

    const { result } = renderHook(() => useGridfinitySettings());

    expect(result.current.drawerSize).toEqual({ width: 30, height: 20 });
    expect(result.current.selectedPrinter).toBe('Prusa MK4');
    expect(result.current.useHalfSize).toBe(true);
    expect(result.current.numDrawers).toBe(4);
    expect(result.current.useMm).toBe(true);
    expect(store['gridfinity_drawerSize']).toBe(JSON.stringify({ width: 30, height: 20 }));
  });

  it('falls back to defaults when a stored setting is null', () => {
    store['gridfinity_migration_v1'] = 'true';
    store['gridfinity_drawerSize'] = 'null';

    const { result } = renderHook(() => useGridfinitySettings());

    expect(result.current.drawerSize).toEqual({ width: 22.5, height: 16.5 });
  });
});
