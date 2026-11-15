import { useId, useState } from "react"
import type React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { unitMath } from "@/services/unitMath"
import { parseDecimal } from "@/utils/format"
import type { DrawerSize } from "@/types"
import MeasureGuide from "./MeasureGuide"

type Dimension = "width" | "height"

const MAX_INCHES = 200

interface DrawerDimensionsProps {
  drawerSize: DrawerSize
  setDrawerSize: React.Dispatch<React.SetStateAction<DrawerSize>>
  useMm: boolean
}

const DrawerDimensions = ({ drawerSize, setDrawerSize, useMm }: DrawerDimensionsProps) => {
  const [localWidth, setLocalWidth] = useState("")
  const [localHeight, setLocalHeight] = useState("")
  const [errors, setErrors] = useState<Record<Dimension, string | null>>({
    width: null,
    height: null,
  })
  const [prevSynced, setPrevSynced] = useState({
    width: null as number | null,
    height: null as number | null,
    useMm: null as boolean | null,
  })

  const formatDimension = (value: number) => {
    if (!value) return ""
    return useMm
      ? String(unitMath.round(unitMath.convert(value, "inch", "mm"), 2))
      : String(unitMath.round(value, 3))
  }

  if (
    drawerSize.width !== prevSynced.width ||
    drawerSize.height !== prevSynced.height ||
    useMm !== prevSynced.useMm
  ) {
    setPrevSynced({ width: drawerSize.width, height: drawerSize.height, useMm })
    setLocalWidth(formatDimension(drawerSize.width))
    setLocalHeight(formatDimension(drawerSize.height))
    setErrors({ width: null, height: null })
  }

  const setLocal = (dimension: Dimension, value: string) => {
    if (dimension === "width") {
      setLocalWidth(value)
    } else {
      setLocalHeight(value)
    }
  }

  const setError = (dimension: Dimension, message: string | null) =>
    setErrors((prev) => ({ ...prev, [dimension]: message }))

  const commit = (dimension: Dimension, value: string) => {
    const numericValue = parseDecimal(value)

    if (value.trim() !== "" && value.trim() === formatDimension(drawerSize[dimension])) {
      setError(dimension, null)
      return
    }

    if (value.trim() === "") {
      setError(dimension, null)
      setDrawerSize((prevSize) => ({ ...prevSize, [dimension]: 0 }))
      setLocal(dimension, "")
      return
    }

    if (isNaN(numericValue) || numericValue < 0) {
      setError(dimension, "Enter a number, like 22.5")
      return
    }

    const inchesValue = useMm ? unitMath.convert(numericValue, "mm", "inch") : numericValue
    if (inchesValue > MAX_INCHES) {
      setError(
        dimension,
        useMm ? `Up to ${unitMath.convert(MAX_INCHES, "inch", "mm")} mm` : `Up to ${MAX_INCHES} in`
      )
      return
    }

    setError(dimension, null)
    setDrawerSize((prevSize) => ({ ...prevSize, [dimension]: inchesValue }))
  }

  const unit = useMm ? "mm" : "in"

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <DimensionField
          id="drawerWidth"
          label="Width"
          unit={unit}
          unitName={useMm ? "mm" : "inches"}
          value={localWidth}
          error={errors.width}
          onChange={(value) => {
            setLocal("width", value)
            if (errors.width) setError("width", null)
          }}
          onCommit={(value) => commit("width", value)}
        />
        <DimensionField
          id="drawerHeight"
          label="Depth"
          unit={unit}
          unitName={useMm ? "mm" : "inches"}
          value={localHeight}
          error={errors.height}
          onChange={(value) => {
            setLocal("height", value)
            if (errors.height) setError("height", null)
          }}
          onCommit={(value) => commit("height", value)}
        />
      </div>
      <MeasureGuide />
    </div>
  )
}

interface DimensionFieldProps {
  id: string
  label: string
  unit: string
  unitName: string
  value: string
  error: string | null
  onChange: (value: string) => void
  onCommit: (value: string) => void
}

const DimensionField = ({
  id,
  label,
  unit,
  unitName,
  value,
  error,
  onChange,
  onCommit,
}: DimensionFieldProps) => {
  const errorId = useId()

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onCommit(event.currentTarget.value)
    }
  }

  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-medium text-muted-foreground">
        {label}{" "}
        <span className="sr-only">({unitName})</span>
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onCommit(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={(e) => e.target.select()}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="pr-10 tabular-nums"
          placeholder="0"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
        >
          {unit}
        </span>
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default DrawerDimensions
