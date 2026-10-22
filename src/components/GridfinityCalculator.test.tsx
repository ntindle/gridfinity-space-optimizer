/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GridfinityCalculator from './GridfinityCalculator';
import { SettingsProvider } from '../contexts/SettingsContext';
import { saveUserSettings, loadUserSettings } from '../lib/utils';
import { toast } from 'sonner';
import type { Settings } from '@/types/gridfinity';
import type { ReactElement } from 'react';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../lib/utils', () => ({
  cn: vi.fn((inputs) => inputs),
  printerSizes: {
    'Test Printer': { x: 200, y: 200, z: 200 },
    'Bambu Lab A1': { x: 220, y: 220, z: 250 },
  },
  saveUserSettings: vi.fn(),
  loadUserSettings: vi.fn(),
}));

const widthInput = () => screen.getByRole('textbox', { name: /^Width/ });
const depthInput = () => screen.getByRole('textbox', { name: /^Depth/ });

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
    
    expect(screen.getByRole('heading', { name: 'Drawer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Printer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Grid' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Drawer' })).toBeInTheDocument();
    expect(screen.getByLabelText(/identical drawers/i)).toBeInTheDocument();
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
    
    await userEvent.clear(widthInput());
    await userEvent.type(widthInput(), '20');
    
    await userEvent.tab();
    
    await waitFor(() => {
      expect(vi.mocked(saveUserSettings).mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('should display results when calculation completes', async () => {
    renderWithProviders(<GridfinityCalculator />);
    
    await waitFor(() => {
      expect(screen.getByText(/Results for \d+ drawer/)).toBeInTheDocument();
      expect(screen.getByText('Parts to print')).toBeInTheDocument();
    });
  });

  it('should toggle between inches and millimeters', async () => {
    renderWithProviders(<GridfinityCalculator />);
    
    expect(screen.getByRole('button', { name: 'in inches' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('textbox', { name: 'Width (inches)' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'mm millimeters' }));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Width (mm)' })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'mm millimeters' })).toHaveAttribute('aria-pressed', 'true');
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

  it('should handle the half-size grid option', async () => {
    renderWithProviders(<GridfinityCalculator />);
    
    const halfSizeCheckbox = screen.getByLabelText('Half-size grid');
    
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
    
    await userEvent.clear(widthInput());
    await userEvent.type(widthInput(), '0');
    await userEvent.tab();

    expect(screen.getByRole('heading', { name: 'Drawer' })).toBeInTheDocument();
    expect(await screen.findByText('Enter your drawer size')).toBeInTheDocument();
  });

  it('should recalculate when dimensions change', async () => {
    renderWithProviders(<GridfinityCalculator />);
    
    const initialSaveCount = vi.mocked(saveUserSettings).mock.calls.length;
    
    await userEvent.clear(depthInput());
    await userEvent.type(depthInput(), '25');
    
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
      bins: [],
    });
    window.history.pushState(null, '', `/?share=${shared}`);
    try {
      renderWithProviders(<GridfinityCalculator />);

      await waitFor(() => {
        expect(widthInput()).toHaveValue('15');
      });
      expect(depthInput()).toHaveValue('12');
      expect(window.location.search).not.toContain('share=');
      expect(toast.success).toHaveBeenCalledWith('Opened a shared layout', expect.anything());
    } finally {
      window.history.pushState(null, '', '/');
    }
  });

  it('should ignore an invalid ?share= param and render defaults', async () => {
    window.history.pushState(null, '', '/?share=not-a-valid-payload');
    try {
      renderWithProviders(<GridfinityCalculator />);

      await waitFor(() => {
        expect(widthInput()).toHaveValue('22.5');
      });
      expect(window.location.search).not.toContain('share=');
      expect(toast.error).toHaveBeenCalledWith("That share link couldn't be opened", expect.anything());
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
      bins: [],
    });
    window.history.pushState(null, '', `/?share=${shared}`);
    try {
      renderWithProviders(<GridfinityCalculator />);

      await waitFor(() => {
        expect(widthInput()).toHaveValue('381');
      });
      expect(depthInput()).toHaveValue('304.8');
      expect(screen.getByLabelText(/identical drawers/i)).toHaveValue('2');
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
      bins: [],
    });
    window.history.pushState(null, '', `/?share=${shared}`);
    try {
      renderWithProviders(<GridfinityCalculator />);

      await waitFor(() => {
        expect(widthInput()).toHaveValue('15');
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
        bins: [],
      });
      window.history.pushState(null, '', `/?share=${shared}`);
      try {
        renderWithProviders(<GridfinityCalculator />);

        await waitFor(() => {
          expect(widthInput()).toHaveValue('15');
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

  it('lists half-size grid pieces as half-size baseplates', async () => {
    vi.mocked(loadUserSettings).mockReturnValue({
      drawerSize: { width: 15, height: 12 },
      selectedPrinter: 'Bambu Lab A1',
      useHalfSize: true,
      preferHalfSize: false,
      numDrawers: 1,
      useMm: false,
    });
    renderWithProviders(<GridfinityCalculator />);

    expect(
      (await screen.findAllByRole('button', { name: /^Half-size baseplate \d+ × \d+ —/ })).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/^\d+ baseplates · \d+ spacers?$/).length).toBeGreaterThan(0);
  });

  it('makes a label for each bin you add', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GridfinityCalculator />);

    expect(await screen.findByText(/Add bins to the drawer/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /print labels/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add bin' }));

    expect(await screen.findByRole('button', { name: /print labels/i })).toBeInTheDocument();
    expect(screen.getAllByText(/^1 bin · \d+ baseplates/).length).toBeGreaterThan(0);
  });

  it('should render exactly one element for each guided-tour anchor id', async () => {
    renderWithProviders(<GridfinityCalculator />);

    await waitFor(() => {
      expect(screen.getByText(/Results for \d+ drawer/)).toBeInTheDocument();
    });

    for (const id of ['drawer', 'printer', 'grid', 'results', 'download']) {
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

  it('keeps placed bins through layout changes and flags the ones that stop fitting', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GridfinityCalculator />);

    await user.click(await screen.findByRole('button', { name: 'Add bin' }));
    await user.type(screen.getByLabelText('Contents'), 'Screws');
    await user.tab();
    const placed = () =>
      within(screen.getByRole('group', { name: 'Bins in the drawer' })).getAllByRole('button');
    expect(placed()[0]).toHaveAccessibleName('Bin 1 × 1, 3 units tall, Screws');

    await user.click(screen.getByLabelText('Half-size grid'));
    expect(placed()[0]).toHaveAccessibleName('Bin 1 × 1, 3 units tall, Screws');
    await user.click(screen.getByLabelText('Half-size grid'));

    placed()[0].focus();
    for (let step = 0; step < 4; step += 1) {
      await user.keyboard('{ArrowRight}');
    }
    await user.clear(widthInput());
    await user.type(widthInput(), '6');
    await user.tab();

    await waitFor(() => {
      expect(placed()[0]).toHaveAccessibleName('Bin 1 × 1, 3 units tall, Screws, needs attention');
    });
    expect(screen.queryByText(/^1 bin/)).not.toBeInTheDocument();
  }, 15_000);

  it('downloads every part in one zip', async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => 'blob:print-files');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));
    const saved: string[] = [];
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        saved.push(this.download);
      });
    try {
      renderWithProviders(<GridfinityCalculator />);
      await user.clear(widthInput());
      await user.type(widthInput(), '8');
      await user.clear(depthInput());
      await user.type(depthInput(), '4');
      await user.tab();
      await user.click(await screen.findByRole('button', { name: 'Add bin' }));
      await user.click(screen.getByRole('button', { name: /^Download files/ }));

      await waitFor(
        () => {
          expect(saved).toEqual(['gridfinity-8x4in.zip']);
        },
        { timeout: 15_000 },
      );
      const blob = (createObjectURL.mock.calls[0] as unknown as [Blob])[0];
      expect(blob.type).toBe('application/zip');
      expect(blob.size).toBeGreaterThan(1000);
      expect(toast.success).toHaveBeenCalledWith(
        'Downloaded gridfinity-8x4in.zip',
        expect.objectContaining({ description: expect.stringMatching(/STL files and \d+ prints? as 3MF plates/) }),
      );
    } finally {
      click.mockRestore();
    }
  }, 30_000);

  it('explains when the printer bed is too small to print a single grid cell', async () => {
    vi.mocked(loadUserSettings).mockReturnValue(null);
    const { encodeShareSettings } = await import('../utils/shareLayout');
    const shared = encodeShareSettings({
      drawerSize: { width: 15, height: 12 },
      selectedPrinter: 'Custom Printer',
      customPrinterSize: { x: 100, y: 100, z: 100, exclusionZone: { left: 30, right: 30 } },
      useHalfSize: false,
      preferHalfSize: false,
      preferUniformBaseplates: false,
      numDrawers: 1,
      useMm: false,
      bins: [],
    });
    window.history.pushState(null, '', `/?share=${shared}`);
    try {
      renderWithProviders(<GridfinityCalculator />);
      expect(await screen.findByText('Your printer bed is too small')).toBeInTheDocument();
    } finally {
      window.history.pushState(null, '', '/');
    }
  });
});
