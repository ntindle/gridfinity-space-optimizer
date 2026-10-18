import { createContext, useContext, ReactNode } from 'react';
import { useGridfinitySettings, type GridfinitySettings } from '@/hooks/useGridfinitySettings';

const SettingsContext = createContext<GridfinitySettings | null>(null);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const settings = useGridfinitySettings();
  
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = (): GridfinitySettings => {
  const context = useContext(SettingsContext);
  
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  
  return context;
};


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

// eslint-disable-next-line react-refresh/only-export-components
export const useBinContents = () => {
  const { binContents, setBinContents } = useSettings();
  return { binContents, setBinContents };
};