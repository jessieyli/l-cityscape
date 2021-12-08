import { Noise } from 'noisejs'

// Constants.
export const PHI = 1.618
export const NOISE_RATIO = 0.05
export const THEMES = {
  GOTHIC: { s: 0.2, l: 0.2 },
  PASTEL: { s: 0.2, l: 0.8 },
  CYBERPUNK: { s: 0.8, l: 0.8 },
  EVENING: { s: 0.8, l: 0.2 },
}
export const COLOR_SEED = 47
export const HEIGHT_SEED = 29
export const COLOR_BASE = 0.05

// Get base noise.
export function getBase(x, y, seed) {
  const noise = new Noise(seed)
  return (noise.simplex2(x / 100, y / 100) + 1) / 2
}

// Get random noise using murmurhash.
export function getNoise(x, y, p) {
  const str = '' + x + ('' + y) + ('' + p)
  for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
    (h = Math.imul(h ^ str.charCodeAt(i), 3432918353)), (h = (h << 13) | (h >>> 19))
  return (function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 2147483647
  })()
}

// Get primary color.
export function getPrimaryColor(x, y, s, l) {
  const base = getBase(x, y, COLOR_SEED)
  const noise = getNoise(x, y, COLOR_SEED)
  const h = base + noise * NOISE_RATIO
  const hslStr = hsl2string(h, s, l)
  return hslStr
}

// Get secondary color.
export function getSecondaryColor(x, y, s, l) {
  const base = getBase(x, y, COLOR_SEED)
  const noise = getNoise(x, y, COLOR_SEED)
  const h = base + noise + PHI
  const hslStr = hsl2string(h, s, l)
  return hslStr
}

// Convert HSL values to string.
export function hsl2string(h, s, l) {
  return `hsl(${Math.round(h * 255)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}
