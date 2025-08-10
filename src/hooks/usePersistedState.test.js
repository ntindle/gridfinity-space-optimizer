import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedState } from './usePersistedState';

describe('usePersistedState', () => {
  let mockStorage = {};

  beforeEach(() => {
    // Reset mock storage
    mockStorage = {};
    
    // Mock localStorage methods
    global.localStorage = {
      getItem: vi.fn((key) => mockStorage[key] || null),
      setItem: vi.fn((key, value) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    };
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  it('should initialize with default value when localStorage is empty', () => {
    const { result } = renderHook(() => 
      usePersistedState('test-key', 'default-value')
    );

    expect(result.current[0]).toBe('default-value');
  });

  it('should initialize with value from localStorage when available', () => {
    mockStorage['test-key'] = JSON.stringify('stored-value');
    
    const { result } = renderHook(() => 
      usePersistedState('test-key', 'default-value')
    );

    expect(result.current[0]).toBe('stored-value');
  });

  it('should update localStorage when state changes', () => {
    const { result } = renderHook(() => 
      usePersistedState('test-key', 'initial')
    );

    act(() => {
      result.current[1]('updated');
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('updated'));
    expect(result.current[0]).toBe('updated');
  });

  it('should handle complex objects', () => {
    const complexObject = { 
      name: 'test', 
      values: [1, 2, 3], 
      nested: { key: 'value' } 
    };

    const { result } = renderHook(() => 
      usePersistedState('test-key', complexObject)
    );

    expect(result.current[0]).toEqual(complexObject);

    const updatedObject = { ...complexObject, name: 'updated' };
    act(() => {
      result.current[1](updatedObject);
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(updatedObject));
  });

  it('should handle localStorage errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock localStorage.getItem to throw an error
    global.localStorage.getItem = vi.fn(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => 
      usePersistedState('test-key', 'default')
    );

    expect(result.current[0]).toBe('default');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should provide reset function', () => {
    const { result } = renderHook(() => 
      usePersistedState('test-key', 'default')
    );

    act(() => {
      result.current[1]('changed');
    });
    expect(result.current[0]).toBe('changed');

    act(() => {
      result.current[2](); // Call reset
    });
    expect(result.current[0]).toBe('default');
  });

  it('should sync across tabs when enabled', () => {
    const { result } = renderHook(() => 
      usePersistedState('test-key', 'initial', { syncAcrossTabs: true })
    );

    // Simulate storage event from another tab
    const storageEvent = new StorageEvent('storage', {
      key: 'test-key',
      newValue: JSON.stringify('from-another-tab'),
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    expect(result.current[0]).toBe('from-another-tab');
  });

  it('should not sync across tabs when disabled', () => {
    const { result } = renderHook(() => 
      usePersistedState('test-key', 'initial', { syncAcrossTabs: false })
    );

    const storageEvent = new StorageEvent('storage', {
      key: 'test-key',
      newValue: JSON.stringify('from-another-tab'),
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    expect(result.current[0]).toBe('initial');
  });

  it('should use custom serialization/deserialization', () => {
    const customSerialize = vi.fn((value) => `custom:${value}`);
    const customDeserialize = vi.fn((value) => value.replace('custom:', ''));

    const { result } = renderHook(() => 
      usePersistedState('test-key', 'initial', {
        serialize: customSerialize,
        deserialize: customDeserialize,
      })
    );

    act(() => {
      result.current[1]('updated');
    });

    expect(customSerialize).toHaveBeenCalledWith('updated');
    expect(localStorage.setItem).toHaveBeenCalledWith('test-key', 'custom:updated');
  });

  it('should handle malformed localStorage data', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockStorage['test-key'] = 'not-valid-json';

    const { result } = renderHook(() => 
      usePersistedState('test-key', 'default')
    );

    expect(result.current[0]).toBe('default');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});