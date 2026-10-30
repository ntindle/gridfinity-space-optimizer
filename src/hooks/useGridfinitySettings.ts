import { useState, type Dispatch, type SetStateAction } from 'react';
import { usePersistedState } from './usePersistedState';
import { migrateLegacySettings } from './useLegacyMigration';
import { sanitizeBins } from '@/utils/bins';
import {
  DEFAULT_ESTIMATE_SETTINGS,
  sanitizeEstimateSettings,
  type EstimateSettings,
} from '@/utils/partVolumes';
import type { Bin, DrawerSize, PrinterSize } from '@/types';

export const TEST_FIT_STORAGE_KEY = 'gridfinity_testFit';
export const ESTIMATE_SETTINGS_STORAGE_KEY = 'gridfinity_estimateSettings';
export const LABEL_TABS_STORAGE_KEY = 'gridfinity_labelTabs';
export const DIVIDERS_STORAGE_KEY = 'gridfinity_dividers';

const estimateSettingsStorage = {
  deserialize: (value: string): EstimateSettings =>
    sanitizeEstimateSettings(JSON.parse(value)),
};

const binStorage = {
  deserialize: (value: string): Bin[] => sanitizeBins(JSON.parse(value)),
};

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

  bins: Bin[];
  setBins: Dispatch<SetStateAction<Bin[]>>;

  testFit: boolean;
  setTestFit: (value: boolean) => void;

  labelTabs: boolean;
  setLabelTabs: (value: boolean) => void;

  dividers: boolean;
  setDividers: (value: boolean) => void;

  estimateSettings: EstimateSettings;
  setEstimateSettings: (settings: EstimateSettings) => void;

  resetSettings: () => void;
}

export const useGridfinitySettings = (): GridfinitySettings => {
  useState(migrateLegacySettings);

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

  const [bins, setBins] = usePersistedState<Bin[]>('gridfinity_bins', [], binStorage);

  const [testFit, setTestFit] = usePersistedState<boolean>(TEST_FIT_STORAGE_KEY, false);

  const [labelTabs, setLabelTabs] = usePersistedState<boolean>(LABEL_TABS_STORAGE_KEY, false);

  const [dividers, setDividers] = usePersistedState<boolean>(DIVIDERS_STORAGE_KEY, false);

  const [estimateSettings, setEstimateSettings] = usePersistedState<EstimateSettings>(
    ESTIMATE_SETTINGS_STORAGE_KEY,
    DEFAULT_ESTIMATE_SETTINGS,
    estimateSettingsStorage
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
    setBins([]);
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

    bins,
    setBins,

    testFit,
    setTestFit,

    labelTabs,
    setLabelTabs,

    dividers,
    setDividers,

    estimateSettings,
    setEstimateSettings,

    resetSettings,
  };
};