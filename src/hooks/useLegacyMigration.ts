import { useEffect } from 'react';

interface LegacySettings {
  drawerSize?: { width: number; height: number };
  selectedPrinter?: string;
  useHalfSize?: boolean;
  preferHalfSize?: boolean;
  numDrawers?: number;
  useMm?: boolean;
}

export const useLegacyMigration = (): void => {
  useEffect(() => {
    const migrationDone = localStorage.getItem('gridfinity_migration_v1');
    if (migrationDone) return;

    const legacySettings = localStorage.getItem('gridfinitySettings');
    if (legacySettings) {
      try {
        const settings: LegacySettings = JSON.parse(legacySettings);
        
        if (settings.drawerSize) {
          localStorage.setItem('gridfinity_drawerSize', JSON.stringify(settings.drawerSize));
        }
        if (settings.selectedPrinter) {
          localStorage.setItem('gridfinity_selectedPrinter', JSON.stringify(settings.selectedPrinter));
        }
        if (settings.useHalfSize !== undefined) {
          localStorage.setItem('gridfinity_useHalfSize', JSON.stringify(settings.useHalfSize));
        }
        if (settings.preferHalfSize !== undefined) {
          localStorage.setItem('gridfinity_preferHalfSize', JSON.stringify(settings.preferHalfSize));
        }
        if (settings.numDrawers !== undefined) {
          localStorage.setItem('gridfinity_numDrawers', JSON.stringify(settings.numDrawers));
        }
        if (settings.useMm !== undefined) {
          localStorage.setItem('gridfinity_useMm', JSON.stringify(settings.useMm));
        }
        
        localStorage.setItem('gridfinity_migration_v1', 'true');
      } catch {
        return;
      }
    } else {
      localStorage.setItem('gridfinity_migration_v1', 'true');
    }
  }, []);
};