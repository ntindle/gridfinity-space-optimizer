import { usePersistedState } from './usePersistedState';

/**
 * Custom hook for managing all Gridfinity settings
 * Centralizes all settings state and provides a clean API
 */
export const useGridfinitySettings = () => {
  // Drawer dimensions (stored in inches internally)
  const [drawerSize, setDrawerSize] = usePersistedState(
    'gridfinity_drawerSize',
    { width: 22.5, height: 16.5 }
  );

  // Selected printer
  const [selectedPrinter, setSelectedPrinter] = usePersistedState(
    'gridfinity_selectedPrinter',
    'Bambu Lab A1'
  );

  // Bin options
  const [useHalfSize, setUseHalfSize] = usePersistedState(
    'gridfinity_useHalfSize',
    false
  );

  const [preferHalfSize, setPreferHalfSize] = usePersistedState(
    'gridfinity_preferHalfSize',
    false
  );

  // Number of drawers
  const [numDrawers, setNumDrawers] = usePersistedState(
    'gridfinity_numDrawers',
    1
  );

  // Unit preference
  const [useMm, setUseMm] = usePersistedState(
    'gridfinity_useMm',
    false
  );

  // Custom printer dimensions
  const [customPrinterSize, setCustomPrinterSize] = usePersistedState(
    'gridfinity_customPrinterSize',
    { x: 200, y: 200, z: 200 }
  );

  // Handle mutual exclusivity of bin options
  const handleUseHalfSizeChange = (value) => {
    setUseHalfSize(value);
    if (value) setPreferHalfSize(false);
  };

  const handlePreferHalfSizeChange = (value) => {
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