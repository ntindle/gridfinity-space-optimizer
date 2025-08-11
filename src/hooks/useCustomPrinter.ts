"use client";

import { useState, useEffect } from "react";
import { usePersistedState } from "./usePersistedState";
import { convertToMm, convertFromMm, validateDimension } from "@/services/unitConversion";
import type { PrinterSize } from "@/types";

/**
 * Input values for dimensions (as strings for form inputs)
 */
interface DimensionInputs {
  x: string;
  y: string;
  z: string;
}

/**
 * Input values for exclusion zones (as strings for form inputs)
 */
interface ExclusionZoneInputs {
  front: string;
  back: string;
  left: string;
  right: string;
}

/**
 * Validation errors for each dimension
 */
interface DimensionErrors {
  x: string | null;
  y: string | null;
  z: string | null;
}

/**
 * Validation errors for exclusion zones
 */
interface ExclusionZoneErrors {
  front: string | null;
  back: string | null;
  left: string | null;
  right: string | null;
}

/**
 * Return type for the custom printer hook
 */
export interface CustomPrinterState {
  customDimensions: PrinterSize;
  inputValues: DimensionInputs;
  errors: DimensionErrors;
  exclusionZoneInputs: ExclusionZoneInputs;
  exclusionZoneErrors: ExclusionZoneErrors;
  handleInputChange: (axis: "x" | "y" | "z", value: string) => void;
  handleExclusionZoneChange: (
    zone: "front" | "back" | "left" | "right",
    value: string
  ) => void;
  validateSingleDimension: (axis: "x" | "y" | "z") => boolean;
  validateAll: () => boolean;
  resetToDefault: () => void;
}

/**
 * Custom hook for managing custom printer dimensions
 */
export const useCustomPrinter = (useMm = false): CustomPrinterState => {
  // Persisted custom printer dimensions (stored in mm)
  const [customDimensions, setCustomDimensions] =
    usePersistedState<PrinterSize>("gridfinity_customPrinterDimensions", {
      x: 200,
      y: 200,
      z: 200,
    });

  // Local state for input values (in current unit)
  const [inputValues, setInputValues] = useState<DimensionInputs>({
    x: "",
    y: "",
    z: "",
  });

  // Validation errors
  const [errors, setErrors] = useState<DimensionErrors>({
    x: null,
    y: null,
    z: null,
  });

  // Exclusion zone inputs
  const [exclusionZoneInputs, setExclusionZoneInputs] =
    useState<ExclusionZoneInputs>({
      front: "",
      back: "",
      left: "",
      right: "",
    });

  // Exclusion zone errors
  const [exclusionZoneErrors, setExclusionZoneErrors] =
    useState<ExclusionZoneErrors>({
      front: null,
      back: null,
      left: null,
      right: null,
    });

  // Helper function to format numbers without unnecessary decimals
  const formatNumber = (value: number): string => {
    const rounded = Math.round(value * 10) / 10;
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
  };

  // Update input values when unit changes or dimensions change
  useEffect(() => {
    setInputValues({
      x: useMm
        ? customDimensions.x.toString()
        : formatNumber(convertFromMm(customDimensions.x, "in")),
      y: useMm
        ? customDimensions.y.toString()
        : formatNumber(convertFromMm(customDimensions.y, "in")),
      z: useMm
        ? customDimensions.z.toString()
        : formatNumber(convertFromMm(customDimensions.z, "in")),
    });

    // Update exclusion zone inputs
    const zone = customDimensions.exclusionZone || {};
    setExclusionZoneInputs({
      front: zone.front
        ? useMm
          ? zone.front.toString()
          : formatNumber(convertFromMm(zone.front, "in"))
        : "",
      back: zone.back
        ? useMm
          ? zone.back.toString()
          : formatNumber(convertFromMm(zone.back, "in"))
        : "",
      left: zone.left
        ? useMm
          ? zone.left.toString()
          : formatNumber(convertFromMm(zone.left, "in"))
        : "",
      right: zone.right
        ? useMm
          ? zone.right.toString()
          : formatNumber(convertFromMm(zone.right, "in"))
        : "",
    });
  }, [
    useMm,
    customDimensions.x,
    customDimensions.y,
    customDimensions.z,
    customDimensions.exclusionZone,
  ]);

  // Handle input change for a dimension
  const handleInputChange = (axis: "x" | "y" | "z", value: string) => {
    // Always allow the user to type freely
    setInputValues((prev) => ({
      ...prev,
      [axis]: value,
    }));

    // Clear error when user starts typing
    if (errors[axis]) {
      setErrors((prev) => ({
        ...prev,
        [axis]: null,
      }));
    }

    // Only update the actual dimension if we have a valid positive number
    const numericValue = Number.parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 0) {
      // Convert to mm for storage
      const mmValue = useMm ? numericValue : convertToMm(numericValue, "in");

      // Only do basic range check, don't show errors while typing
      if (mmValue >= 10 && mmValue <= 1000) {
        setCustomDimensions((prev) => ({
          ...prev,
          [axis]: mmValue,
        }));
      }
    }
  };

  // Handle exclusion zone input change
  const handleExclusionZoneChange = (
    zone: "front" | "back" | "left" | "right",
    value: string
  ) => {
    setExclusionZoneInputs((prev) => ({
      ...prev,
      [zone]: value,
    }));

    // Clear error for this zone
    setExclusionZoneErrors((prev) => ({
      ...prev,
      [zone]: null,
    }));

    // Parse the value
    if (value === "") {
      // Clear the exclusion zone value
      setCustomDimensions((prev) => ({
        ...prev,
        exclusionZone: {
          ...prev.exclusionZone,
          [zone]: undefined,
        },
      }));
    } else {
      const numericValue = Number.parseFloat(value);
      if (!isNaN(numericValue) && numericValue >= 0) {
        // Convert to mm for storage
        const mmValue = useMm ? numericValue : convertToMm(numericValue, "in");

        // Basic validation
        const maxDimension =
          zone === "front" || zone === "back"
            ? customDimensions.y
            : customDimensions.x;
        if (mmValue < maxDimension) {
          setCustomDimensions((prev) => ({
            ...prev,
            exclusionZone: {
              ...prev.exclusionZone,
              [zone]: mmValue,
            },
          }));
        } else {
          setExclusionZoneErrors((prev) => ({
            ...prev,
            [zone]: "Exclusion zone cannot exceed bed dimension",
          }));
        }
      }
    }
  };

  // Validate all dimensions
  const validateAll = (): boolean => {
    const newErrors: DimensionErrors = { x: null, y: null, z: null };
    let isValid = true;
    (["x", "y", "z"] as const).forEach((axis) => {
      const value = Number.parseFloat(inputValues[axis]);
      if (isNaN(value) || value <= 0) {
        newErrors[axis] = "Please enter a valid dimension";
        isValid = false;
      } else {
        const mmValue = useMm ? value : convertToMm(value, "in");
        const validation = validateDimension(mmValue, {
          min: 50,
          max: 600,
        });
        if (!validation.valid) {
          newErrors[axis] = validation.error || "Invalid dimension";
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Reset to default dimensions
  const resetToDefault = () => {
    const defaults: PrinterSize = { x: 200, y: 200, z: 200 };
    setCustomDimensions(defaults);
    const inchValue = formatNumber(convertFromMm(200, "in"));
    setInputValues({
      x: useMm ? "200" : inchValue,
      y: useMm ? "200" : inchValue,
      z: useMm ? "200" : inchValue,
    });
    setExclusionZoneInputs({
      front: "",
      back: "",
      left: "",
      right: "",
    });
    setErrors({ x: null, y: null, z: null });
    setExclusionZoneErrors({
      front: null,
      back: null,
      left: null,
      right: null,
    });
  };

  // Validate a single dimension (for onBlur)
  const validateSingleDimension = (axis: "x" | "y" | "z") => {
    const value = Number.parseFloat(inputValues[axis]);
    if (isNaN(value) || value <= 0) {
      setErrors((prev) => ({
        ...prev,
        [axis]: "Please enter a valid dimension",
      }));
      return false;
    }

    const mmValue = useMm ? value : convertToMm(value, "in");
    if (mmValue < 50) {
      setErrors((prev) => ({
        ...prev,
        [axis]: `Minimum ${useMm ? "50mm" : "2 inches"}`,
      }));
      return false;
    }
    if (mmValue > 600) {
      setErrors((prev) => ({
        ...prev,
        [axis]: `Maximum ${useMm ? "600mm" : "24 inches"}`,
      }));
      return false;
    }

    setErrors((prev) => ({
      ...prev,
      [axis]: null,
    }));
    return true;
  };


  return {
    customDimensions,
    inputValues,
    errors,
    exclusionZoneInputs,
    exclusionZoneErrors,
    handleInputChange,
    handleExclusionZoneChange,
    validateSingleDimension,
    validateAll,
    resetToDefault,
  };
};
