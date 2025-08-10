import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

/**
 * Options for persisted state hook
 */
export interface PersistedStateOptions<T> {
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  syncAcrossTabs?: boolean;
}

/**
 * Custom hook for persisting state to localStorage with TypeScript support
 * @param key - The localStorage key
 * @param defaultValue - The default value if nothing is stored
 * @param options - Configuration options
 * @returns [value, setValue, reset] - Similar to useState with an additional reset function
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  options: PersistedStateOptions<T> = {}
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    syncAcrossTabs = true,
  } = options;

  // Initialize state with value from localStorage or default
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return defaultValue;
    }
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, serialize(state));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, state, serialize]);

  // Sync across tabs if enabled
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setState(deserialize(e.newValue));
        } catch (error) {
          console.error(`Error syncing ${key} from another tab:`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserialize, syncAcrossTabs]);

  // Reset to default value
  const reset = useCallback(() => {
    setState(defaultValue);
  }, [defaultValue]);

  return [state, setState, reset];
}