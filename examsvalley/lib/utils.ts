// EXTRACTED FROM: client/src/lib/utils.ts
// CONVERTED TO:   lib/utils.ts
// BUCKET:         A_reuse
// WEB LIBRARIES REPLACED: none (clsx and tailwind-merge work with NativeWind)
// LOGIC CHANGES: none

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
