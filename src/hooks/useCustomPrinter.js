import { useState, useEffect } from 'react';
import { usePersistedState } from './usePersistedState';
import { validateDimension, convertToMm, convertFromMm } from '../services/unitConversion';

/**
 * Custom hook for managing custom printer dimensions
 */
export const useCustomPrinter = (useMm = false) => {
  // Persisted custom printer dimensions (stored in mm)
  const [customDimensions, setCustomDimensions] = usePersistedState(
    'gridfinity_customPrinterDimensions',
    { x: 200, y: 200, z: 200 }
  );

  // Local state for input values (in current unit)
  const [inputValues, setInputValues] = useState({
    x: '',
    y: '',
    z: '',
  });

  // Validation errors
  const [errors, setErrors] = useState({
    x: null,
    y: null,
    z: null,
  });

  // Update input values when unit changes
  useEffect(() => {
    setInputValues({
      x: useMm ? customDimensions.x.toString() : convertFromMm(customDimensions.x, 'in').toFixed(1),
      y: useMm ? customDimensions.y.toString() : convertFromMm(customDimensions.y, 'in').toFixed(1),
      z: useMm ? customDimensions.z.toString() : convertFromMm(customDimensions.z, 'in').toFixed(1),
    });
  }, [useMm, customDimensions]);

  // Handle input change for a dimension
  const handleInputChange = (axis, value) => {
    setInputValues(prev => ({
      ...prev,
      [axis]: value,
    }));

    // Clear error for this axis
    setErrors(prev => ({
      ...prev,
      [axis]: null,
    }));

    // Try to parse and validate the value
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 0) {
      // Convert to mm for storage
      const mmValue = useMm ? numericValue : convertToMm(numericValue, 'in');
      
      // Validate
      const validation = validateDimension(mmValue, {
        min: 50,   // Minimum 50mm (about 2 inches)
        max: 600,  // Maximum 600mm (about 24 inches)
      });

      if (validation.valid) {
        setCustomDimensions(prev => ({
          ...prev,
          [axis]: mmValue,
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          [axis]: validation.error,
        }));
      }
    }
  };

  // Validate all dimensions
  const validateAll = () => {
    const newErrors = {};
    let isValid = true;

    ['x', 'y', 'z'].forEach(axis => {
      const value = parseFloat(inputValues[axis]);
      if (isNaN(value) || value <= 0) {
        newErrors[axis] = 'Please enter a valid dimension';
        isValid = false;
      } else {
        const mmValue = useMm ? value : convertToMm(value, 'in');
        const validation = validateDimension(mmValue, {
          min: 50,
          max: 600,
        });
        if (!validation.valid) {
          newErrors[axis] = validation.error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Reset to default dimensions
  const resetToDefault = () => {
    const defaults = { x: 200, y: 200, z: 200 };
    setCustomDimensions(defaults);
    setInputValues({
      x: useMm ? '200' : '7.9',
      y: useMm ? '200' : '7.9',
      z: useMm ? '200' : '7.9',
    });
    setErrors({ x: null, y: null, z: null });
  };

  return {
    customDimensions,
    inputValues,
    errors,
    handleInputChange,
    validateAll,
    resetToDefault,
  };
};