import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { useGridfinitySettings } from '@/hooks/useGridfinitySettings';

/**
 * Settings Context for Gridfinity Space Optimizer
 * Provides centralized access to all application settings
 */
const SettingsContext = createContext(null);

/**
 * Settings Provider component
 * Wraps the app to provide settings to all child components
 */
export const SettingsProvider = ({ children }) => {
  const settings = useGridfinitySettings();
  
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
};

SettingsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook to use settings from context
 * @returns {Object} Settings object with all settings and setters
 */
export const useSettings = () => {
  const context = useContext(SettingsContext);
  
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  
  return context;
};

/**
 * Export individual setting hooks for convenience
 * These provide focused access to specific settings
 */

export const useDrawerSettings = () => {
  const { drawerSize, setDrawerSize, useMm, setUseMm } = useSettings();
  return { drawerSize, setDrawerSize, useMm, setUseMm };
};

export const usePrinterSettings = () => {
  const { selectedPrinter, setSelectedPrinter, customPrinterSize, setCustomPrinterSize } = useSettings();
  return { selectedPrinter, setSelectedPrinter, customPrinterSize, setCustomPrinterSize };
};

export const useBinOptions = () => {
  const { useHalfSize, setUseHalfSize, preferHalfSize, setPreferHalfSize } = useSettings();
  return { useHalfSize, setUseHalfSize, preferHalfSize, setPreferHalfSize };
};

export const useDrawerCount = () => {
  const { numDrawers, setNumDrawers } = useSettings();
  return { numDrawers, setNumDrawers };
};