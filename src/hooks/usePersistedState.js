import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for persisting state to localStorage
 * @param {string} key - The localStorage key
 * @param {*} defaultValue - The default value if nothing is stored
 * @param {Object} options - Configuration options
 * @returns {Array} - [value, setValue] similar to useState
 */
export const usePersistedState = (key, defaultValue, options = {}) => {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    syncAcrossTabs = true,
  } = options;

  // Initialize state with value from localStorage or default
  const [state, setState] = useState(() => {
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

    const handleStorageChange = (e) => {
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
};