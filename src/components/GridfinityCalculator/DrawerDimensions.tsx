"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import MeasureGuide from "./MeasureGuide"

const DrawerDimensions = ({ drawerSize, setDrawerSize, useMm, setUseMm }) => {
  const [localWidth, setLocalWidth] = useState("")
  const [localHeight, setLocalHeight] = useState("")
  const [prevSynced, setPrevSynced] = useState({
    width: null,
    height: null,
    useMm: null,
  })

  const convertToInches = (value) => value / 25.4

  const formatDimension = (value) => {
    if (useMm) {
      return value ? String(Math.round(value * 25.4 * 100) / 100) : ""
    }
    return value ? String(value) : ""
  }

  if (
    drawerSize.width !== prevSynced.width ||
    drawerSize.height !== prevSynced.height ||
    useMm !== prevSynced.useMm
  ) {
    setPrevSynced({ width: drawerSize.width, height: drawerSize.height, useMm })
    setLocalWidth(formatDimension(drawerSize.width))
    setLocalHeight(formatDimension(drawerSize.height))
  }

  const handleInputChange = (dimension) => (e) => {
    const value = e.target.value

    if (dimension === "width") {
      setLocalWidth(value)
    } else {
      setLocalHeight(value)
    }
  }

  const handleInputBlur = (dimension) => (e) => {
    const value = e.target.value
    const numericValue = Number.parseFloat(value)

    if (!isNaN(numericValue) && numericValue >= 0) {
      const inchesValue = useMm ? convertToInches(numericValue) : numericValue
      setDrawerSize((prevSize) => ({
        ...prevSize,
        [dimension]: inchesValue,
      }))
    } else if (value === "" || value === "0") {
      setDrawerSize((prevSize) => ({
        ...prevSize,
        [dimension]: 0,
      }))
      if (dimension === "width") {
        setLocalWidth("")
      } else {
        setLocalHeight("")
      }
    } else {
      if (useMm) {
        const displayValue = drawerSize[dimension] ? String(Math.round(drawerSize[dimension] * 25.4 * 100) / 100) : ""
        if (dimension === "width") {
          setLocalWidth(displayValue)
        } else {
          setLocalHeight(displayValue)
        }
      } else {
        const displayValue = drawerSize[dimension] ? String(drawerSize[dimension]) : ""
        if (dimension === "width") {
          setLocalWidth(displayValue)
        } else {
          setLocalHeight(displayValue)
        }
      }
    }
  }

  const handleUnitToggle = (checked) => {
    setUseMm(checked)
  }

  return (
    <div className="w-full max-w-sm space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Drawer Dimensions</h3>
        <div className="flex items-center space-x-2">
          <Label htmlFor="unit-toggle">Inches</Label>
          <Switch id="unit-toggle" checked={useMm} onCheckedChange={handleUnitToggle} />
          <Label htmlFor="unit-toggle">mm</Label>
        </div>
      </div>
      <div className="flex items-end space-x-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="drawerWidth">Width ({useMm ? "mm" : "inches"})</Label>
          <Input
            id="drawerWidth"
            type="text"
            inputMode="decimal"
            value={localWidth}
            onChange={handleInputChange("width")}
            onBlur={handleInputBlur("width")}
            className="w-full"
            placeholder="0"
            onFocus={(e) => e.target.select()}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="drawerHeight">Height ({useMm ? "mm" : "inches"})</Label>
          <Input
            id="drawerHeight"
            type="text"
            inputMode="decimal"
            value={localHeight}
            onChange={handleInputChange("height")}
            onBlur={handleInputBlur("height")}
            className="w-full"
            placeholder="0"
            onFocus={(e) => e.target.select()}
          />
        </div>
      </div>
      <MeasureGuide />
    </div>
  )
}

export default DrawerDimensions
