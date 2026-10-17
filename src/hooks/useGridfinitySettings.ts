import { usePersistedState } from './usePersistedState';
import type { DrawerSize, PrinterSize } from '@/types';

export interface GridfinitySettings {
  drawerSize: DrawerSize;
  setDrawerSize: (size: DrawerSize) => void;
  
  selectedPrinter: string;
  setSelectedPrinter: (printer: string) => void;
  
  useHalfSize: boolean;
  setUseHalfSize: (value: boolean) => void;
  preferHalfSize: boolean;
  setPreferHalfSize: (value: boolean) => void;
  preferUniformBaseplates: boolean;
  setPreferUniformBaseplates: (value: boolean) => void;
  
  numDrawers: number;
  setNumDrawers: (count: number) => void;
  
  useMm: boolean;
  setUseMm: (value: boolean) => void;
  
  customPrinterSize: PrinterSize;
  setCustomPrinterSize: (size: PrinterSize) => void;
  
  resetSettings: () => void;
}

export const useGridfinitySettings = (): GridfinitySettings => {
  const [drawerSize, setDrawerSize] = usePersistedState<DrawerSize>(
    'gridfinity_drawerSize',
    { width: 22.5, height: 16.5 }
  );

  const [selectedPrinter, setSelectedPrinter] = usePersistedState<string>(
    'gridfinity_selectedPrinter',
    'Bambu Lab A1'
  );

  const [useHalfSize, setUseHalfSize] = usePersistedState<boolean>(
    'gridfinity_useHalfSize',
    false
  );

  const [preferHalfSize, setPreferHalfSize] = usePersistedState<boolean>(
    'gridfinity_preferHalfSize',
    false
  );

  const [preferUniformBaseplates, setPreferUniformBaseplates] = usePersistedState<boolean>(
    'gridfinity_preferUniformBaseplates',
    false
  );

  const [numDrawers, setNumDrawers] = usePersistedState<number>(
    'gridfinity_numDrawers',
    1
  );

  const [useMm, setUseMm] = usePersistedState<boolean>(
    'gridfinity_useMm',
    false
  );

  const [customPrinterSize, setCustomPrinterSize] = usePersistedState<PrinterSize>(
    'gridfinity_customPrinterSize',
    { x: 200, y: 200, z: 200 }
  );

  const handleUseHalfSizeChange = (value: boolean) => {
    setUseHalfSize(value);
    if (value) setPreferHalfSize(false);
  };

  const handlePreferHalfSizeChange = (value: boolean) => {
    setPreferHalfSize(value);
    if (value) setUseHalfSize(false);
  };

  const resetSettings = () => {
    setDrawerSize({ width: 22.5, height: 16.5 });
    setSelectedPrinter('Bambu Lab A1');
    setUseHalfSize(false);
    setPreferHalfSize(false);
    setPreferUniformBaseplates(false);
    setNumDrawers(1);
    setUseMm(false);
    setCustomPrinterSize({ x: 200, y: 200, z: 200 });
  };

  return {
    drawerSize,
    setDrawerSize,
    
    selectedPrinter,
    setSelectedPrinter,
    
    useHalfSize,
    setUseHalfSize: handleUseHalfSizeChange,
    preferHalfSize,
    setPreferHalfSize: handlePreferHalfSizeChange,
    preferUniformBaseplates,
    setPreferUniformBaseplates,
    
    numDrawers,
    setNumDrawers,
    
    useMm,
    setUseMm,
    
    customPrinterSize,
    setCustomPrinterSize,
    
    resetSettings,
  };
};