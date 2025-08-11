/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomPrinterDialog from './CustomPrinterDialog';
import { useCustomPrinter } from '../../hooks/useCustomPrinter';

// Mock the useCustomPrinter hook
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

    expect(screen.getByText('Custom Printer Settings')).toBeInTheDocument();
    expect(screen.getByText(/Configure your custom 3D printer dimensions/)).toBeInTheDocument();
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

    expect(screen.getByText(/X \(mm\)/)).toBeInTheDocument();
    expect(screen.getByText(/Y \(mm\)/)).toBeInTheDocument();
    expect(screen.getByText(/Z \(mm\)/)).toBeInTheDocument();
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

    expect(screen.getByText(/X \(in\)/)).toBeInTheDocument();
    expect(screen.getByText(/Y \(in\)/)).toBeInTheDocument();
    expect(screen.getByText(/Z \(in\)/)).toBeInTheDocument();
  });

  // Preview section was removed from the component
  it.skip('should show preview with current dimensions', () => {
    // This test is skipped as the preview was removed
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
    // Use fireEvent.change for more predictable behavior in tests
    fireEvent.change(xInput, { target: { value: '250' } });

    // Check that handleInputChange was called with the correct value
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
    expect(xInput).toHaveClass('border-red-500');
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
    });

    render(
      <CustomPrinterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        useMm={true}
      />
    );

    const resetButton = screen.getByText('Reset to Default');
    await userEvent.click(resetButton);

    expect(mockResetToDefault).toHaveBeenCalled();
  });

  // Step attributes test removed - inputs are now text type
  it.skip('should have correct step values for inputs', () => {
    // Text inputs don't have step attributes
  });

  // Step attributes test removed - inputs are now text type
  it.skip('should have correct step values for inch inputs', () => {
    // Text inputs don't have step attributes
  });
});