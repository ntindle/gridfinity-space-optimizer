/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomPrinterDialog from './CustomPrinterDialog';
import { useCustomPrinter } from '../../hooks/useCustomPrinter';

vi.mock('../../hooks/useCustomPrinter', () => ({
  useCustomPrinter: vi.fn(() => ({
    customDimensions: { x: 200, y: 200, z: 200 },
    inputValues: { x: '200', y: '200', z: '200' },
    errors: { x: null, y: null, z: null },
    exclusionZoneInputs: { front: '', back: '', left: '', right: '' },
    exclusionZoneErrors: { front: null, back: null, left: null, right: null },
    handleInputChange: vi.fn(),
    handleExclusionZoneChange: vi.fn(),
    validateSingleDimension: vi.fn(() => true),
    validateAll: vi.fn(() => true),
    resetToDefault: vi.fn(),
    loadDimensions: vi.fn(),
  })),
}));

const mockUseCustomPrinter = vi.mocked(useCustomPrinter);

describe('CustomPrinterDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(
      <CustomPrinterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        useMm={true}
      />
    );

    expect(screen.getByRole('heading', { name: 'Custom printer' })).toBeInTheDocument();
    expect(screen.getByText(/Enter your print bed size/)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const { container } = render(
      <CustomPrinterDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        useMm={true}
      />
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should display dimension inputs with correct units for mm', () => {
    render(
      <CustomPrinterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        useMm={true}
      />
    );

    expect(screen.getByRole('textbox', { name: /^X \(mm\)/ })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /^Y \(mm\)/ })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /^Z \(mm\)/ })).toBeInTheDocument();
  });

  it('should display dimension inputs with correct units for inches', () => {
    render(
      <CustomPrinterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        useMm={false}
      />
    );

    expect(screen.getByRole('textbox', { name: /^X \(in\)/ })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /^Y \(in\)/ })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /^Z \(in\)/ })).toBeInTheDocument();
  });

  it.skip('should show preview with current dimensions', () => {
  });

  it('should handle input changes', async () => {
    const mockHandleInputChange = vi.fn();
    
    mockUseCustomPrinter.mockReturnValue({
      customDimensions: { x: 200, y: 200, z: 200 },
      inputValues: { x: '200', y: '200', z: '200' },
      errors: { x: null, y: null, z: null },
      exclusionZoneInputs: { front: '', back: '', left: '', right: '' },
      exclusionZoneErrors: { front: null, back: null, left: null, right: null },
      handleInputChange: mockHandleInputChange,
      handleExclusionZoneChange: vi.fn(),
      validateSingleDimension: vi.fn(() => true),
      validateAll: vi.fn(() => true),
      resetToDefault: vi.fn(),
      loadDimensions: vi.fn(),
    });

    render(
      <CustomPrinterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        useMm={true}
      />
    );

    const xInput = screen.getByRole('textbox', { name: /X \(mm\)/i });
    fireEvent.change(xInput, { target: { value: '250' } });

    expect(mockHandleInputChange).toHaveBeenCalledWith('x', '250');
  });

  it('should display validation errors', async () => {
    mockUseCustomPrinter.mockReturnValue({
      customDimensions: { x: 200, y: 200, z: 200 },
      inputValues: { x: '10', y: '200', z: '200' },
      errors: { 
        x: 'Dimension must be at least 50mm', 
        y: null, 
        z: null 
      },
      exclusionZoneInputs: { front: '', back: '', left: '', right: '' },
      exclusionZoneErrors: { front: null, back: null, left: null, right: null },
      handleInputChange: vi.fn(),
      handleExclusionZoneChange: vi.fn(),
      validateSingleDimension: vi.fn(() => true),
      validateAll: vi.fn(() => false),
      resetToDefault: vi.fn(),
      loadDimensions: vi.fn(),
    });

    render(
      <CustomPrinterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        useMm={true}
      />
    );

    expect(screen.getByText('Dimension must be at least 50mm')).toBeInTheDocument();
    
    const xInput = screen.getByRole('textbox', { name: /X \(mm\)/i });
    expect(xInput).toHaveAttribute('aria-invalid', 'true');
    expect(xInput).toHaveAccessibleDescription('Dimension must be at least 50mm');
  });

  it('should call onConfirm with valid dimensions', async () => {
    const mockValidateAll = vi.fn(() => true);
    const customDimensions = { x: 250, y: 250, z: 250 };
    
    mockUseCustomPrinter.mockReturnValue({
      customDimensions,
      inputValues: { x: '250', y: '250', z: '250' },
      errors: { x: null, y: null, z: null },
      exclusionZoneInputs: { front: '', back: '', left: '', right: '' },
      exclusionZoneErrors: { front: null, back: null, left: null, right: null },
      handleInputChange: vi.fn(),
      handleExclusionZoneChange: vi.fn(),
      validateSingleDimension: vi.fn(() => true),
      validateAll: mockValidateAll,
      resetToDefault: vi.fn(),
      loadDimensions: vi.fn(),
    });

    render(
      <CustomPrinterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        useMm={true}
      />
    );

    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);

    expect(mockValidateAll).toHaveBeenCalled();
    expect(mockOnConfirm).toHaveBeenCalledWith(customDimensions);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should not confirm with invalid dimensions', async () => {
    const mockValidateAll = vi.fn(() => false);
    
    mockUseCustomPrinter.mockReturnValue({
      customDimensions: { x: 10, y: 200, z: 200 },
      inputValues: { x: '10', y: '200', z: '200' },
      errors: { x: 'Too small', y: null, z: null },
      exclusionZoneInputs: { front: '', back: '', left: '', right: '' },
      exclusionZoneErrors: { front: null, back: null, left: null, right: null },
      handleInputChange: vi.fn(),
      handleExclusionZoneChange: vi.fn(),
      validateSingleDimension: vi.fn(() => true),
      validateAll: mockValidateAll,
      resetToDefault: vi.fn(),
      loadDimensions: vi.fn(),
    });

    render(
      <CustomPrinterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        useMm={true}
      />
    );

    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);

    expect(mockValidateAll).toHaveBeenCalled();
    expect(mockOnConfirm).not.toHaveBeenCalled();
    expect(mockOnOpenChange).not.toHaveBeenCalled();
  });

  it('should handle reset to default', async () => {
    const mockResetToDefault = vi.fn();
    
    mockUseCustomPrinter.mockReturnValue({
      customDimensions: { x: 200, y: 200, z: 200 },
      inputValues: { x: '200', y: '200', z: '200' },
      errors: { x: null, y: null, z: null },
      exclusionZoneInputs: { front: '', back: '', left: '', right: '' },
      exclusionZoneErrors: { front: null, back: null, left: null, right: null },
      handleInputChange: vi.fn(),
      handleExclusionZoneChange: vi.fn(),
      validateSingleDimension: vi.fn(() => true),
      validateAll: vi.fn(() => true),
      resetToDefault: mockResetToDefault,
      loadDimensions: vi.fn(),
    });

    render(
      <CustomPrinterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        useMm={true}
      />
    );

    const resetButton = screen.getByRole('button', { name: 'Reset to default' });
    await userEvent.click(resetButton);

    expect(mockResetToDefault).toHaveBeenCalled();
  });

  it.skip('should have correct step values for inputs', () => {
  });

  it.skip('should have correct step values for inch inputs', () => {
  });

  it('loads the printer in use each time it opens', () => {
    const loadDimensions = vi.fn();
    mockUseCustomPrinter.mockReturnValue({
      customDimensions: { x: 200, y: 200, z: 200 },
      inputValues: { x: '200', y: '200', z: '200' },
      errors: { x: null, y: null, z: null },
      exclusionZoneInputs: { front: '', back: '', left: '', right: '' },
      exclusionZoneErrors: { front: null, back: null, left: null, right: null },
      handleInputChange: vi.fn(),
      handleExclusionZoneChange: vi.fn(),
      validateSingleDimension: vi.fn(() => true),
      validateAll: vi.fn(() => true),
      resetToDefault: vi.fn(),
      loadDimensions,
    });
    const applied = { x: 300, y: 250, z: 200, exclusionZone: { left: 20 } };

    const { rerender } = render(
      <CustomPrinterDialog open={false} onOpenChange={mockOnOpenChange} useMm={true} initialDimensions={applied} />
    );
    expect(loadDimensions).not.toHaveBeenCalled();

    rerender(
      <CustomPrinterDialog open={true} onOpenChange={mockOnOpenChange} useMm={true} initialDimensions={applied} />
    );
    expect(loadDimensions).toHaveBeenCalledWith(applied);
  });
});