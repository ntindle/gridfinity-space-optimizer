import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

export interface PersistedStateOptions<T> {
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  syncAcrossTabs?: boolean;
}

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

  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, serialize(state));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, state, serialize]);

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

  const reset = useCallback(() => {
    setState(defaultValue);
  }, [defaultValue]);

  return [state, setState, reset];
}