import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PrinterSize, Settings } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const printerSizes: Record<string, PrinterSize> = {
  "Anycubic Mega S": { x: 210, y: 210, z: 205 },
  "Anycubic Vyper": { x: 245, y: 245, z: 260 },
  "Bambu Lab A1 Mini": { x: 180, y: 180, z: 180 },
  "Bambu Lab A1": { x: 256, y: 256, z: 256 },
  "Bambu Lab P1S": { x: 256, y: 256, z: 256 },
  "Bambu Lab P1P": { x: 256, y: 256, z: 256 },
  "Bambu Lab X1C": { x: 256, y: 256, z: 256 },
  "Creality Ender 3": { x: 220, y: 220, z: 250 },
  "Creality Ender 5 Plus": { x: 350, y: 350, z: 400 },
  "Flashforge Adventurer 3": { x: 150, y: 150, z: 150 },
  "Prusa i3 MK3": { x: 250, y: 210, z: 200 },
  "Prusa i3 MK3S+": { x: 250, y: 210, z: 210 },
  "Prusa MK4": { x: 250, y: 210, z: 220 },
  "Ultimaker S5": { x: 330, y: 240, z: 300 },
  "Voron 2.4 (300mm)": { x: 300, y: 300, z: 300 },
  "Voron 2.4 (350mm)": { x: 350, y: 350, z: 350 },
}

export function saveUserSettings(settings: Partial<Settings>): void {
  localStorage.setItem('gridfinitySettings', JSON.stringify(settings));
}

export function loadUserSettings(): Partial<Settings> | null {
  const savedSettings = localStorage.getItem('gridfinitySettings');
  return savedSettings ? JSON.parse(savedSettings) : null;
}