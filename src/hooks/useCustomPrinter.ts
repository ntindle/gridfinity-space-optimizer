"use client";

import { useState } from "react";
import { usePersistedState } from "./usePersistedState";
import { convertToMm, convertFromMm } from "@/services/unitConversion";
import { unitMath } from "@/services/unitMath";
import { FULL_GRID_SIZE } from "@/utils/gridfinityUtils";
import type { PrinterSize } from "@/types";

const MIN_BED_MM = 50;
const MAX_BED_MM = 600;

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
  loadDimensions: (dimensions: PrinterSize) => void;
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

  const formatLimit = (mm: number): string =>
    useMm ? `${mm} mm` : `${unitMath.round(convertFromMm(mm, "in"), 2)} in`;

  const rangeError = (mmValue: number): string | null => {
    if (mmValue < MIN_BED_MM) return `Minimum ${formatLimit(MIN_BED_MM)}`;
    if (mmValue > MAX_BED_MM) return `Maximum ${formatLimit(MAX_BED_MM)}`;
    return null;
  };

  const syncInputsFromDimensions = (dimensions: PrinterSize = customDimensions) => {
    setInputValues({
      x: useMm
        ? dimensions.x.toString()
        : formatNumber(convertFromMm(dimensions.x, "in")),
      y: useMm
        ? dimensions.y.toString()
        : formatNumber(convertFromMm(dimensions.y, "in")),
      z: useMm
        ? dimensions.z.toString()
        : formatNumber(convertFromMm(dimensions.z, "in")),
    });

    const zone = dimensions.exclusionZone || {};
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
  };

  const [prevSyncedDimensions, setPrevSyncedDimensions] = useState({
    useMm: null,
    x: null,
    y: null,
    z: null,
    exclusionZone: null,
  });

  if (
    useMm !== prevSyncedDimensions.useMm ||
    customDimensions.x !== prevSyncedDimensions.x ||
    customDimensions.y !== prevSyncedDimensions.y ||
    customDimensions.z !== prevSyncedDimensions.z ||
    customDimensions.exclusionZone !== prevSyncedDimensions.exclusionZone
  ) {
    setPrevSyncedDimensions({
      useMm,
      x: customDimensions.x,
      y: customDimensions.y,
      z: customDimensions.z,
      exclusionZone: customDimensions.exclusionZone,
    });
    syncInputsFromDimensions();
  }

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
        const error = rangeError(useMm ? value : convertToMm(value, "in"));
        if (error) {
          newErrors[axis] = error;
          isValid = false;
        }
      }
    });
    setErrors(newErrors);

    if (Object.values(exclusionZoneErrors).some(Boolean)) {
      return false;
    }

    const { left = 0, right = 0, front = 0, back = 0 } = customDimensions.exclusionZone ?? {};
    const tooSmall = `Leaves less than ${formatLimit(FULL_GRID_SIZE)} to print on`;
    const zoneErrors: Partial<ExclusionZoneErrors> = {};
    if (unitMath.subtract(customDimensions.x, unitMath.add(left, right)) < FULL_GRID_SIZE) {
      zoneErrors[right ? "right" : "left"] = tooSmall;
    }
    if (unitMath.subtract(customDimensions.y, unitMath.add(front, back)) < FULL_GRID_SIZE) {
      zoneErrors[back ? "back" : "front"] = tooSmall;
    }
    if (Object.keys(zoneErrors).length > 0) {
      setExclusionZoneErrors((prev) => ({ ...prev, ...zoneErrors }));
      return false;
    }

    return isValid;
  };

  const loadDimensions = (dimensions: PrinterSize) => {
    setCustomDimensions(dimensions);
    syncInputsFromDimensions(dimensions);
    setErrors({ x: null, y: null, z: null });
    setExclusionZoneErrors({
      front: null,
      back: null,
      left: null,
      right: null,
    });
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

    const error = rangeError(useMm ? value : convertToMm(value, "in"));
    if (error) {
      setErrors((prev) => ({
        ...prev,
        [axis]: error,
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
    loadDimensions,
  };
};
