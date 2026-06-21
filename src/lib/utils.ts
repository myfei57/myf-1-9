import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface AccentClasses {
  bg: string;
  text: string;
  border: string;
  ring: string;
}

const ACCENT_CLASS_MAP: Record<string, AccentClasses> = {
  'neon-blue': { bg: 'bg-neon-blue/15', text: 'text-neon-blue', border: 'border-neon-blue/60', ring: 'ring-neon-blue' },
  'neon-green': { bg: 'bg-neon-green/15', text: 'text-neon-green', border: 'border-neon-green/60', ring: 'ring-neon-green' },
  'neon-orange': { bg: 'bg-neon-orange/15', text: 'text-neon-orange', border: 'border-neon-orange/60', ring: 'ring-neon-orange' },
  'neon-red': { bg: 'bg-neon-red/15', text: 'text-neon-red', border: 'border-neon-red/60', ring: 'ring-neon-red' },
  'neon-purple': { bg: 'bg-neon-purple/15', text: 'text-neon-purple', border: 'border-neon-purple/60', ring: 'ring-neon-purple' },
  'neon-cyan': { bg: 'bg-neon-cyan/15', text: 'text-neon-cyan', border: 'border-neon-cyan/60', ring: 'ring-neon-cyan' },
  'rarity-common': { bg: 'bg-rarity-common/15', text: 'text-rarity-common', border: 'border-rarity-common/60', ring: 'ring-rarity-common' },
};

export function accentClasses(color: string): AccentClasses {
  return ACCENT_CLASS_MAP[color] ?? ACCENT_CLASS_MAP['neon-blue'];
}

