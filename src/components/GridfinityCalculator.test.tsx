/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GridfinityCalculator from './GridfinityCalculator';
import { SettingsProvider } from '../contexts/SettingsContext';
import { saveUserSettings, loadUserSettings } from '../lib/utils';
import type { Settings } from '@/types/gridfinity';
import type { ReactElement } from 'react';

vi.mock('../lib/utils', () => ({
  cn: vi.fn((inputs) => inputs),
  printerSizes: {
    'Test Printer': { x: 200, y: 200, z: 200 },
    'Bambu Lab A1': { x: 220, y: 220, z: 250 },
  },
  saveUserSettings: vi.fn(),
  loadUserSettings: vi.fn(),
}));

const renderWithProviders = (component: ReactElement) => {
  return render(
    <SettingsProvider>
      {component}
    </SettingsProvider>
  );
};

describe('GridfinityCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadUserSettings).mockReturnValue(null);
  });

  it('should render all main sections', () => {
    renderWithProviders(<GridfinityCalculator />);
    
    expect(screen.getByText('Drawer Dimensions')).toBeInTheDocument();
    expect(screen.getByText('Printer Settings')).toBeInTheDocument();
    expect(screen.getByText('Bin Options')).toBeInTheDocument();
    expect(screen.getByText('Drawer Options')).toBeInTheDocument();
  });

  it('should load saved settings on mount', () => {
    const savedSettings: Partial<Settings> = {
      drawerSize: { width: 15, height: 12 },
      selectedPrinter: 'Test Printer',
      useHalfSize: true,
      preferHalfSize: false,
      numDrawers: 3,
      useMm: true,
    };
    
    vi.mocked(loadUserSettings).mockReturnValue(savedSettings);
    renderWithProviders(<GridfinityCalculator />);
    
    expect(loadUserSettings).toHaveBeenCalled();
  });

  it('should save settings when values change', async () => {
    renderWithProviders(<GridfinityCalculator />);
    
    await waitFor(() => {
      expect(saveUserSettings).toHaveBeenCalled();
    });
    
    const initialCallCount = vi.mocked(saveUserSettings).mock.calls.length;
    
    const widthInput = screen.getByLabelText(/width/i);
    await userEvent.clear(widthInput);
    await userEvent.type(widthInput, '20');
    
    await userEvent.tab();
    
    await waitFor(() => {
      expect(vi.mocked(saveUserSettings).mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('should display results when calculation completes', async () => {
    renderWithProviders(<GridfinityCalculator />);
    
    await waitFor(() => {
      expect(screen.getByText(/Results for \d+ drawer/)).toBeInTheDocument();
      expect(screen.getByText('Visual Preview')).toBeInTheDocument();
    });
  });

  it('should toggle between inches and millimeters', async () => {
    renderWithProviders(<GridfinityCalculator />);
    
    const unitToggle = document.getElementById('unit-toggle');
    
    const inchesLabel = screen.getByText('Inches');
    expect(inchesLabel).toBeInTheDocument();
    
    if (unitToggle) {
      await userEvent.click(unitToggle);
    }
    
    await waitFor(() => {
      expect(screen.getByText(/Width \(mm\)/)).toBeInTheDocument();
    });
  });

  it('should update printer selection', async () => {
    renderWithProviders(<GridfinityCalculator />);
    
    const printerButton = screen.getByRole('combobox');
    await userEvent.click(printerButton);
    
    const testPrinter = await screen.findByText('Test Printer');
    await userEvent.click(testPrinter);
    
    await waitFor(() => {
      const calls = vi.mocked(saveUserSettings).mock.calls;
      const hasTestPrinter = calls.some((call) => 
        call[0]?.selectedPrinter === 'Test Printer'
      );
      expect(hasTestPrinter).toBe(true);
    });
  });

  it('should handle half-size bin options', async () => {
    renderWithProviders(<GridfinityCalculator />);
    
    const halfSizeCheckbox = screen.getByLabelText('Use only half-size bins (21x21mm)');
    
    await userEvent.click(halfSizeCheckbox);
    
    await waitFor(() => {
      const calls = vi.mocked(saveUserSettings).mock.calls;
      const hasHalfSize = calls.some((call) => 
        call[0]?.useHalfSize === true
      );
      expect(hasHalfSize).toBe(true);
    });
  });

  it('should update number of drawers', async () => {
    renderWithProviders(<GridfinityCalculator />);
    
    const drawerInput = document.getElementById('numDrawers');
    if (drawerInput) {
      await userEvent.clear(drawerInput);
      await userEvent.type(drawerInput, '5');
    }
    
    await waitFor(() => {
      const calls = vi.mocked(saveUserSettings).mock.calls;
      const hasFiveDrawers = calls.some((call) => 
        call[0]?.numDrawers === 5
      );
      expect(hasFiveDrawers).toBe(true);
    });
  });

  it('should handle invalid drawer dimensions gracefully', async () => {
    renderWithProviders(<GridfinityCalculator />);
    
    const widthInput = screen.getByLabelText(/width/i);
    await userEvent.clear(widthInput);
    await userEvent.type(widthInput, '0');
    
    expect(screen.getByText('Drawer Dimensions')).toBeInTheDocument();
  });

  it('should recalculate when dimensions change', async () => {
    renderWithProviders(<GridfinityCalculator />);
    
    const initialSaveCount = vi.mocked(saveUserSettings).mock.calls.length;
    
    const heightInput = screen.getByLabelText(/height/i);
    await userEvent.clear(heightInput);
    await userEvent.type(heightInput, '25');
    
    await userEvent.tab();
    
    await waitFor(() => {
      expect(vi.mocked(saveUserSettings).mock.calls.length).toBeGreaterThan(initialSaveCount);
      const lastCall = vi.mocked(saveUserSettings).mock.calls[vi.mocked(saveUserSettings).mock.calls.length - 1][0];
      expect(lastCall.drawerSize.height).toBe(25);
    });
  });

  it('should apply a shared layout from the ?share= URL param on mount', async () => {
    const { encodeShareSettings } = await import('../utils/shareLayout');
    const shared = encodeShareSettings({
      drawerSize: { width: 15, height: 12 },
      selectedPrinter: 'Bambu Lab A1',
      customPrinterSize: null,
      useHalfSize: false,
      preferHalfSize: false,
      preferUniformBaseplates: false,
      numDrawers: 2,
      useMm: false,
    });
    window.history.pushState(null, '', `/?share=${shared}`);
    try {
      renderWithProviders(<GridfinityCalculator />);

      await waitFor(() => {
        expect(screen.getByLabelText(/width/i)).toHaveValue('15');
      });
      expect(screen.getByLabelText(/height/i)).toHaveValue('12');
      expect(window.location.search).not.toContain('share=');
    } finally {
      window.history.pushState(null, '', '/');
    }
  });

  it('should ignore an invalid ?share= param and render defaults', async () => {
    window.history.pushState(null, '', '/?share=not-a-valid-payload');
    try {
      renderWithProviders(<GridfinityCalculator />);

      await waitFor(() => {
        expect(screen.getByLabelText(/width/i)).toHaveValue('22.5');
      });
      expect(window.location.search).not.toContain('share=');
    } finally {
      window.history.pushState(null, '', '/');
    }
  });

  it('should apply all shared fields (printer, drawers, units, flags) from ?share=', async () => {
    const { encodeShareSettings } = await import('../utils/shareLayout');
    const shared = encodeShareSettings({
      drawerSize: { width: 15, height: 12 },
      selectedPrinter: 'Test Printer',
      customPrinterSize: null,
      useHalfSize: false,
      preferHalfSize: true,
      preferUniformBaseplates: true,
      numDrawers: 2,
      useMm: true,
    });
    window.history.pushState(null, '', `/?share=${shared}`);
    try {
      renderWithProviders(<GridfinityCalculator />);

      await waitFor(() => {
        expect(screen.getByLabelText(/width/i)).toHaveValue('381');
      });
      expect(screen.getByLabelText(/height/i)).toHaveValue('304.8');
      expect(screen.getByLabelText(/number of duplicate drawers/i)).toHaveValue('2');
      await waitFor(() => {
        const match = vi.mocked(saveUserSettings).mock.calls.some((call) =>
          call[0]?.selectedPrinter === 'Test Printer' &&
          call[0]?.numDrawers === 2 &&
          call[0]?.useMm === true &&
          call[0]?.preferHalfSize === true &&
          call[0]?.drawerSize?.width === 15 &&
          call[0]?.drawerSize?.height === 12,
        );
        expect(match).toBe(true);
      });
    } finally {
      window.history.pushState(null, '', '/');
    }
  });

  it('should apply a shared custom-printer size from ?share=', async () => {
    const { encodeShareSettings } = await import('../utils/shareLayout');
    const shared = encodeShareSettings({
      drawerSize: { width: 15, height: 12 },
      selectedPrinter: 'Custom Printer',
      customPrinterSize: { x: 300, y: 300, z: 300, exclusionZone: { front: 10 } },
      useHalfSize: false,
      preferHalfSize: false,
      preferUniformBaseplates: false,
      numDrawers: 1,
      useMm: false,
    });
    window.history.pushState(null, '', `/?share=${shared}`);
    try {
      renderWithProviders(<GridfinityCalculator />);

      await waitFor(() => {
        expect(screen.getByLabelText(/width/i)).toHaveValue('15');
      });
      const writes = (localStorage.setItem as unknown as Mock).mock.calls
        .filter(([key]) => key === 'gridfinity_customPrinterSize')
        .map(([, value]) => value);
      expect(writes).toContain(
        JSON.stringify({ x: 300, y: 300, z: 300, exclusionZone: { front: 10 } }),
      );
    } finally {
      window.history.pushState(null, '', '/');
    }
  });

  it('should not clobber the stored custom-printer size when opening a preset-printer share link', async () => {
    const seeded = JSON.stringify({ x: 300, y: 300, z: 300 });
    const getItem = localStorage.getItem as unknown as Mock;
    getItem.mockImplementation((key: string) =>
      key === 'gridfinity_customPrinterSize' ? seeded : undefined,
    );
    try {
      const { encodeShareSettings } = await import('../utils/shareLayout');
      const shared = encodeShareSettings({
        drawerSize: { width: 15, height: 12 },
        selectedPrinter: 'Bambu Lab A1',
        customPrinterSize: null,
        useHalfSize: false,
        preferHalfSize: false,
        preferUniformBaseplates: false,
        numDrawers: 1,
        useMm: false,
      });
      window.history.pushState(null, '', `/?share=${shared}`);
      try {
        renderWithProviders(<GridfinityCalculator />);

        await waitFor(() => {
          expect(screen.getByLabelText(/width/i)).toHaveValue('15');
        });
        const writes = (localStorage.setItem as unknown as Mock).mock.calls
          .filter(([key]) => key === 'gridfinity_customPrinterSize')
          .map(([, value]) => value);
        expect(writes.length).toBeGreaterThan(0);
        expect(writes).not.toContain(JSON.stringify({ x: 200, y: 200, z: 200 }));
        expect(writes.every((value) => value === seeded)).toBe(true);
      } finally {
        window.history.pushState(null, '', '/');
      }
    } finally {
      getItem.mockReset();
      (localStorage.setItem as unknown as Mock).mockClear();
    }
  });

  it('should show the half-size bins results section when useHalfSize is on', async () => {
    vi.mocked(loadUserSettings).mockReturnValue({
      drawerSize: { width: 15, height: 12 },
      selectedPrinter: 'Bambu Lab A1',
      useHalfSize: true,
      preferHalfSize: false,
      numDrawers: 1,
      useMm: false,
    });
    renderWithProviders(<GridfinityCalculator />);

    await waitFor(() => {
      expect(screen.getByText('Half-size Bins:')).toBeInTheDocument();
    });
  });

  it('should render the bin labels section once the layout is calculated', async () => {
    renderWithProviders(<GridfinityCalculator />);

    await waitFor(() => {
      expect(screen.getByText('Bin labels')).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /print labels/i })
    ).toBeInTheDocument();
  });

  it('should render exactly one element for each guided-tour anchor id', async () => {
    renderWithProviders(<GridfinityCalculator />);

    await waitFor(() => {
      expect(screen.getByText(/Results for \d+ drawer/)).toBeInTheDocument();
    });

    for (const id of ['drawer', 'printer', 'bins', 'results', 'share']) {
      expect(document.querySelectorAll(`[data-tour="${id}"]`).length).toBe(1);
    }
  });

  it('should open the guided tour when Take the tour is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GridfinityCalculator />);

    await waitFor(() => {
      expect(screen.getByText(/Results for \d+ drawer/)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Take the tour' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Measure your drawer')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });
});
