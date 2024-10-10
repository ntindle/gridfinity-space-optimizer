import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const printerSizes = {
  "Bambu Lab A1 Mini": { x: 180, y: 180, z: 180 },
  "Bambu Lab A1": { x: 220, y: 220, z: 250 },
  "Bambu Lab X1C": { x: 256, y: 256, z: 256 },
  "Prusa i3 MK3S+": { x: 250, y: 210, z: 210 },
  "Creality Ender 3": { x: 220, y: 220, z: 250 },
  "Creality Ender 5 Plus": { x: 350, y: 350, z: 400 },
  "Anycubic Mega S": { x: 210, y: 210, z: 205 },
  "Anycubic Vyper": { x: 245, y: 245, z: 260 },
  "Flashforge Adventurer 3": { x: 150, y: 150, z: 150 },
  "Ultimaker S5": { x: 330, y: 240, z: 300 },
  "Voron 2.4 (300mm)": { x: 300, y: 300, z: 300 },
  "Voron 2.4 (350mm)": { x: 350, y: 350, z: 350 },
  "Custom": { x: 0, y: 0, z: 0 }, // Allow users to input custom dimensions
}