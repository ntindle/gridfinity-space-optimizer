import { useEffect } from 'react';

/**
 * Legacy settings structure (for migration)
 */
interface LegacySettings {
  drawerSize?: { width: number; height: number };
  selectedPrinter?: string;
  useHalfSize?: boolean;
  preferHalfSize?: boolean;
  numDrawers?: number;
  useMm?: boolean;
}

/**
 * Migrate legacy localStorage data to new format
 * This ensures backward compatibility with existing user data
 */
export const useLegacyMigration = (): void => {
  useEffect(() => {
    // Check if migration has already been done
    const migrationDone = localStorage.getItem('gridfinity_migration_v1');
    if (migrationDone) return;

    // Check for legacy settings
    const legacySettings = localStorage.getItem('gridfinitySettings');
    if (legacySettings) {
      try {
        const settings: LegacySettings = JSON.parse(legacySettings);
        
        // Migrate each setting to new key format
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
        
        // Mark migration as done
        localStorage.setItem('gridfinity_migration_v1', 'true');
      } catch {
        // Silently handle migration errors - don't break the app
      }
    } else {
      // No legacy settings, just mark migration as done
      localStorage.setItem('gridfinity_migration_v1', 'true');
    }
  }, []);
};