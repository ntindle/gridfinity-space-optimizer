import { usePersistedState } from './usePersistedState';
import type { DrawerSize, PrinterSize } from '@/types';

/**
 * Return type for the Gridfinity settings hook
 */
export interface GridfinitySettings {
  // Drawer settings
  drawerSize: DrawerSize;
  setDrawerSize: (size: DrawerSize) => void;
  
  // Printer settings
  selectedPrinter: string;
  setSelectedPrinter: (printer: string) => void;
  
  // Bin options
  useHalfSize: boolean;
  setUseHalfSize: (value: boolean) => void;
  preferHalfSize: boolean;
  setPreferHalfSize: (value: boolean) => void;
  
  // Drawer count
  numDrawers: number;
  setNumDrawers: (count: number) => void;
  
  // Unit preference
  useMm: boolean;
  setUseMm: (value: boolean) => void;
  
  // Custom printer
  customPrinterSize: PrinterSize;
  setCustomPrinterSize: (size: PrinterSize) => void;
  
  // Utility functions
  resetSettings: () => void;
}

/**
 * Custom hook for managing all Gridfinity settings
 * Centralizes all settings state and provides a clean API
 */
export const useGridfinitySettings = (): GridfinitySettings => {
  // Drawer dimensions (stored in inches internally)
  const [drawerSize, setDrawerSize] = usePersistedState<DrawerSize>(
    'gridfinity_drawerSize',
    { width: 22.5, height: 16.5 }
  );

  // Selected printer
  const [selectedPrinter, setSelectedPrinter] = usePersistedState<string>(
    'gridfinity_selectedPrinter',
    'Bambu Lab A1'
  );

  // Bin options
  const [useHalfSize, setUseHalfSize] = usePersistedState<boolean>(
    'gridfinity_useHalfSize',
    false
  );

  const [preferHalfSize, setPreferHalfSize] = usePersistedState<boolean>(
    'gridfinity_preferHalfSize',
    false
  );

  // Number of drawers
  const [numDrawers, setNumDrawers] = usePersistedState<number>(
    'gridfinity_numDrawers',
    1
  );

  // Unit preference
  const [useMm, setUseMm] = usePersistedState<boolean>(
    'gridfinity_useMm',
    false
  );

  // Custom printer dimensions
  const [customPrinterSize, setCustomPrinterSize] = usePersistedState<PrinterSize>(
    'gridfinity_customPrinterSize',
    { x: 200, y: 200, z: 200 }
  );

  // Handle mutual exclusivity of bin options
  const handleUseHalfSizeChange = (value: boolean) => {
    setUseHalfSize(value);
    if (value) setPreferHalfSize(false);
  };

  const handlePreferHalfSizeChange = (value: boolean) => {
    setPreferHalfSize(value);
    if (value) setUseHalfSize(false);
  };

  // Reset all settings to defaults
  const resetSettings = () => {
    setDrawerSize({ width: 22.5, height: 16.5 });
    setSelectedPrinter('Bambu Lab A1');
    setUseHalfSize(false);
    setPreferHalfSize(false);
    setNumDrawers(1);
    setUseMm(false);
    setCustomPrinterSize({ x: 200, y: 200, z: 200 });
  };

  return {
    // Drawer settings
    drawerSize,
    setDrawerSize,
    
    // Printer settings
    selectedPrinter,
    setSelectedPrinter,
    
    // Bin options
    useHalfSize,
    setUseHalfSize: handleUseHalfSizeChange,
    preferHalfSize,
    setPreferHalfSize: handlePreferHalfSizeChange,
    
    // Drawer count
    numDrawers,
    setNumDrawers,
    
    // Unit preference
    useMm,
    setUseMm,
    
    // Custom printer
    customPrinterSize,
    setCustomPrinterSize,
    
    // Utility functions
    resetSettings,
  };
};