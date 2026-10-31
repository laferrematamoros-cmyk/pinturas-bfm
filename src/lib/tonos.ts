// Tonos de una familia para la aurora y la barra de color: base, claro, oscuro y un
// vecino de matiz. Lógica pura (sin DOM) para probarla en Node.

function hexARgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim().toLowerCase();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbAHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return [h, s, l];
}

function hslAHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return "#" + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
}

const limita = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Luminosidad HSL (0–1) de un color #rrggbb. */
export function luminosidad(hex: string): number {
  return rgbAHsl(...hexARgb(hex))[2];
}

/**
 * Cuatro tonos para la aurora: [base, claro, oscuro, vecino]. Con `extra` (p. ej. el rosa de
 * Rojos/Rosas) el vecino es ese color; en grises el vecino es un poco más claro.
 */
export function tonosDeFamilia(base: string, extra?: string): [string, string, string, string] {
  const [h, s, l] = rgbAHsl(...hexARgb(base));
  const b = hslAHex(h, s, l);
  const claro = hslAHex(h, s, limita(l + 0.2, 0, 0.94));
  const oscuro = hslAHex(h, s, limita(l - 0.2, 0.06, 1));
  const vecino = extra
    ? hslAHex(...rgbAHsl(...hexARgb(extra)))
    : s < 0.08 ? hslAHex(h, s, limita(l + 0.1, 0, 0.94)) : hslAHex((h + 25) % 360, s, l);
  return [b, claro, oscuro, vecino];
}
