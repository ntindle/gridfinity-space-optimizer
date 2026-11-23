/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGridfinitySettings } from './useGridfinitySettings';

interface MockStorage {
  [key: string]: string;
}

describe('useGridfinitySettings scoop/vase mode', () => {
  let mockStorage: MockStorage = {};

  beforeEach(() => {
    mockStorage = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
      length: 0,
      key: vi.fn(() => null),
    } as Storage;
  });

  it('turns vase mode off when scoop is switched on', () => {
    const { result } = renderHook(() => useGridfinitySettings());
    act(() => {
      result.current.setVaseMode(true);
    });
    expect(result.current.vaseMode).toBe(true);
    act(() => {
      result.current.setScoop(true);
    });
    expect(result.current.scoop).toBe(true);
    expect(result.current.vaseMode).toBe(false);
  });

  it('turns scoop off when vase mode is switched on', () => {
    const { result } = renderHook(() => useGridfinitySettings());
    act(() => {
      result.current.setScoop(true);
    });
    expect(result.current.scoop).toBe(true);
    act(() => {
      result.current.setVaseMode(true);
    });
    expect(result.current.vaseMode).toBe(true);
    expect(result.current.scoop).toBe(false);
  });

  it('drops vase mode when persisted settings restore both on', () => {
    mockStorage['gridfinity_scoop'] = 'true';
    mockStorage['gridfinity_vaseMode'] = 'true';
    const { result } = renderHook(() => useGridfinitySettings());
    expect(result.current.scoop).toBe(true);
    expect(result.current.vaseMode).toBe(false);
    expect(mockStorage['gridfinity_vaseMode']).toBe('false');
  });
});
