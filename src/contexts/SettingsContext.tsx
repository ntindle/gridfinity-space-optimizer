import { createContext, useContext, ReactNode } from 'react';
import { useGridfinitySettings, type GridfinitySettings } from '@/hooks/useGridfinitySettings';

/**
 * Settings Context for Gridfinity Space Optimizer
 * Provides centralized access to all application settings
 */
const SettingsContext = createContext<GridfinitySettings | null>(null);

/**
 * Props for SettingsProvider
 */
interface SettingsProviderProps {
  children: ReactNode;
}

/**
 * Settings Provider component
 * Wraps the app to provide settings to all child components
 */
export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const settings = useGridfinitySettings();
  
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook to use settings from context
 * @returns Settings object with all settings and setters
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = (): GridfinitySettings => {
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

// eslint-disable-next-line react-refresh/only-export-components
export const useDrawerSettings = () => {
  const { drawerSize, setDrawerSize, useMm, setUseMm } = useSettings();
  return { drawerSize, setDrawerSize, useMm, setUseMm };
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePrinterSettings = () => {
  const { selectedPrinter, setSelectedPrinter, customPrinterSize, setCustomPrinterSize } = useSettings();
  return { selectedPrinter, setSelectedPrinter, customPrinterSize, setCustomPrinterSize };
};

// eslint-disable-next-line react-refresh/only-export-components
export const useBinOptions = () => {
  const { useHalfSize, setUseHalfSize, preferHalfSize, setPreferHalfSize, preferUniformBaseplates, setPreferUniformBaseplates } = useSettings();
  return { useHalfSize, setUseHalfSize, preferHalfSize, setPreferHalfSize, preferUniformBaseplates, setPreferUniformBaseplates };
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDrawerCount = () => {
  const { numDrawers, setNumDrawers } = useSettings();
  return { numDrawers, setNumDrawers };
};