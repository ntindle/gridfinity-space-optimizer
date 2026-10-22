/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrinterSettings from './PrinterSettings';
import type { PrinterSize } from '@/types';

const renderPrinter = (printerSize: PrinterSize, options: { useMm?: boolean; useHalfSize?: boolean } = {}) =>
  render(
    <PrinterSettings
      selectedPrinter="Bambu Lab A1"
      setSelectedPrinter={vi.fn()}
      printerSize={printerSize}
      setPrinterSize={vi.fn()}
      useMm={options.useMm ?? true}
      useHalfSize={options.useHalfSize}
    />
  );

describe('PrinterSettings', () => {
  it('names the printer in the picker and states the largest piece the bed fits', () => {
    renderPrinter({ x: 256, y: 256, z: 256 });
    expect(screen.getByRole('combobox', { name: 'Printer: Bambu Lab A1' })).toBeInTheDocument();
    expect(screen.getByText(/256 × 256 mm bed/)).toHaveTextContent('pieces up to 6 × 6');
  });

  it('counts half-size cells when half-size bins only is on', () => {
    renderPrinter({ x: 256, y: 256, z: 256 }, { useHalfSize: true });
    expect(screen.getByText(/256 × 256 mm bed/)).toHaveTextContent('pieces up to 12 × 12');
  });

  it('subtracts exclusion zones from the usable bed', () => {
    renderPrinter({ x: 256, y: 256, z: 256, exclusionZone: { left: 20, front: 10 } });
    expect(screen.getByText(/minus exclusion zones/)).toHaveTextContent('pieces up to 5 × 5');
  });

  it('switches to a preset without overwriting the saved custom printer', async () => {
    const user = userEvent.setup();
    const setSelectedPrinter = vi.fn();
    const setPrinterSize = vi.fn();
    render(
      <PrinterSettings
        selectedPrinter="Custom Printer"
        setSelectedPrinter={setSelectedPrinter}
        printerSize={{ x: 300, y: 300, z: 300 }}
        setPrinterSize={setPrinterSize}
        useMm
      />
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: /Prusa MK4/ }));

    expect(setSelectedPrinter).toHaveBeenCalledWith('Prusa MK4');
    expect(setPrinterSize).not.toHaveBeenCalled();
  });

  it('finds the custom printer option by searching for it', async () => {
    const user = userEvent.setup();
    renderPrinter({ x: 256, y: 256, z: 256 });

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Search printers…'), 'custom');

    expect(screen.getByRole('option', { name: /Custom Printer/ })).toBeInTheDocument();
  });
});
