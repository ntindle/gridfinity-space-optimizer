"use client";

import { useState, useEffect } from "react";
import { usePersistedState } from "./usePersistedState";
import { convertToMm, convertFromMm, validateDimension } from "@/services/unitConversion";
import type { PrinterSize } from "@/types";

interface DimensionInputs {
  x: string;
  y: string;
  z: string;
}

interface ExclusionZoneInputs {
  front: string;
  back: string;
  left: string;
  right: string;
}

interface DimensionErrors {
  x: string | null;
  y: string | null;
  z: string | null;
}

interface ExclusionZoneErrors {
  front: string | null;
  back: string | null;
  left: string | null;
  right: string | null;
}

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

export const useCustomPrinter = (useMm = false): CustomPrinterState => {
  const [customDimensions, setCustomDimensions] =
    usePersistedState<PrinterSize>("gridfinity_customPrinterDimensions", {
      x: 200,
      y: 200,
      z: 200,
    });

  const [inputValues, setInputValues] = useState<DimensionInputs>({
    x: "",
    y: "",
    z: "",
  });

  const [errors, setErrors] = useState<DimensionErrors>({
    x: null,
    y: null,
    z: null,
  });

  const [exclusionZoneInputs, setExclusionZoneInputs] =
    useState<ExclusionZoneInputs>({
      front: "",
      back: "",
      left: "",
      right: "",
    });

  const [exclusionZoneErrors, setExclusionZoneErrors] =
    useState<ExclusionZoneErrors>({
      front: null,
      back: null,
      left: null,
      right: null,
    });

  const formatNumber = (value: number): string => {
    const rounded = Math.round(value * 10) / 10;
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
  };

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

  const handleInputChange = (axis: "x" | "y" | "z", value: string) => {
    setInputValues((prev) => ({
      ...prev,
      [axis]: value,
    }));

    if (errors[axis]) {
      setErrors((prev) => ({
        ...prev,
        [axis]: null,
      }));
    }

    const numericValue = Number.parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 0) {
      const mmValue = useMm ? numericValue : convertToMm(numericValue, "in");

      if (mmValue >= 10 && mmValue <= 1000) {
        setCustomDimensions((prev) => ({
          ...prev,
          [axis]: mmValue,
        }));
      }
    }
  };

  const handleExclusionZoneChange = (
    zone: "front" | "back" | "left" | "right",
    value: string
  ) => {
    setExclusionZoneInputs((prev) => ({
      ...prev,
      [zone]: value,
    }));

    setExclusionZoneErrors((prev) => ({
      ...prev,
      [zone]: null,
    }));

    if (value === "") {
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
        const mmValue = useMm ? numericValue : convertToMm(numericValue, "in");

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
