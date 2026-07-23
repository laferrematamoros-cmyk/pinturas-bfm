// Matemática pura de color: conversión y match perceptual contra el catálogo.
// Sin dependencias de navegador → testeable en Node.

export type Rgb = { r: number; g: number; b: number };
export type Lab = { L: number; a: number; b: number };
export type CatalogColor = { name: string; hex: string; code: string };
export type Candidate = { color: CatalogColor; deltaE: number; match: number; exact: boolean };

// ΔE por debajo de este umbral se considera "coincidencia exacta" (apenas perceptible).
export const EXACT_DELTA_E = 2.3;

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToLab({ r, g, b }: Rgb): Lab {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const R = lin(r), G = lin(g), B = lin(b);
  let X = R * 0.4124 + G * 0.3576 + B * 0.1805;
  let Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  let Z = R * 0.0193 + G * 0.1192 + B * 0.9505;
  X /= 0.95047; Y /= 1.0; Z /= 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(X), fy = f(Y), fz = f(Z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

// CIE76: distancia euclidiana en CIELAB. Simple y robusto para elegir entre ~336
// colores; muy superior a RGB. (CIEDE2000 sería una mejora futura opcional.)
export function deltaE(a: Lab, b: Lab): number {
  return Math.sqrt((a.L - b.L) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
}

// Mapea ΔE (0 = idéntico) a un porcentaje amigable 0-100.
export function matchPercent(dE: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - dE * 2)));
}

export function nearestColors(sample: Rgb, catalog: CatalogColor[], n: number): Candidate[] {
  const sampleLab = rgbToLab(sample);
  const scored: Candidate[] = catalog.map((color) => {
    const dE = deltaE(sampleLab, rgbToLab(hexToRgb(color.hex)));
    return { color, deltaE: dE, match: matchPercent(dE), exact: dE <= EXACT_DELTA_E };
  });
  scored.sort((x, y) => x.deltaE - y.deltaE);
  return scored.slice(0, n);
}

// Corrección de balance de blancos (von Kries simplificado): escala cada canal para
// que `neutral` (lo que debería ser blanco) mapee a blanco puro, y aplica el mismo
// factor al `sample`. Evita división por cero y satura a 255.
export function applyWhiteBalance(sample: Rgb, neutral: Rgb): Rgb {
  const scale = (s: number, ne: number) =>
    Math.round(Math.min(255, ne <= 0 ? s : s * (255 / ne)));
  return { r: scale(sample.r, neutral.r), g: scale(sample.g, neutral.g), b: scale(sample.b, neutral.b) };
}
