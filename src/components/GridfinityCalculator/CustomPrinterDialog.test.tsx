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
    handleInputChange: vi.fn(),
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

    expect(screen.getByText('Custom Printer Dimensions')).toBeInTheDocument();
    expect(screen.getByText(/Enter your 3D printer's build volume/)).toBeInTheDocument();
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

    expect(screen.getByLabelText('X (mm)')).toBeInTheDocument();
    expect(screen.getByLabelText('Y (mm)')).toBeInTheDocument();
    expect(screen.getByLabelText('Z (mm)')).toBeInTheDocument();
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

    expect(screen.getByLabelText('X (")')).toBeInTheDocument();
    expect(screen.getByLabelText('Y (")')).toBeInTheDocument();
    expect(screen.getByLabelText('Z (")')).toBeInTheDocument();
  });

  it('should show preview with current dimensions', () => {
    render(
      <CustomPrinterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        useMm={true}
      />
    );

    expect(screen.getByText('Preview:')).toBeInTheDocument();
    expect(screen.getByText('200 × 200 × 200 mm')).toBeInTheDocument();
  });

  it('should handle input changes', async () => {
    const mockHandleInputChange = vi.fn();
    
    mockUseCustomPrinter.mockReturnValue({
      customDimensions: { x: 200, y: 200, z: 200 },
      inputValues: { x: '200', y: '200', z: '200' },
      errors: { x: null, y: null, z: null },
      handleInputChange: mockHandleInputChange,
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

    const xInput = screen.getByLabelText('X (mm)');
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
      handleInputChange: vi.fn(),
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
    
    const xInput = screen.getByLabelText('X (mm)');
    expect(xInput).toHaveClass('border-red-500');
  });

  it('should call onConfirm with valid dimensions', async () => {
    const mockValidateAll = vi.fn(() => true);
    const customDimensions = { x: 250, y: 250, z: 250 };
    
    mockUseCustomPrinter.mockReturnValue({
      customDimensions,
      inputValues: { x: '250', y: '250', z: '250' },
      errors: { x: null, y: null, z: null },
      handleInputChange: vi.fn(),
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

    const applyButton = screen.getByText('Apply');
    await userEvent.click(applyButton);

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
      handleInputChange: vi.fn(),
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

    const applyButton = screen.getByText('Apply');
    await userEvent.click(applyButton);

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
      handleInputChange: vi.fn(),
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

  it('should have correct step values for inputs', () => {
    render(
      <CustomPrinterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        useMm={true}
      />
    );

    const xInput = screen.getByLabelText('X (mm)');
    expect(xInput).toHaveAttribute('step', '1');
    expect(xInput).toHaveAttribute('min', '0');
  });

  it('should have correct step values for inch inputs', () => {
    render(
      <CustomPrinterDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        useMm={false}
      />
    );

    const xInput = screen.getByLabelText('X (")');
    expect(xInput).toHaveAttribute('step', '0.1');
  });
});