// "¿Más claro o más oscuro?" de la ficha del color: los tonos más parecidos al elegido,
// unos más claros y otros más oscuros. Lógica pura (sin DOM) para probarla en Node.

function lineal(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

/** Color #rrggbb (o #rgb) en CIE Lab [L*, a*, b*], con blanco D65. */
export function hexALab(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((x) => x + x).join("");
  const n = parseInt(h.padEnd(6, "0"), 16);
  const r = lineal((n >> 16) & 255), g = lineal((n >> 8) & 255), b = lineal(n & 255);
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/**
 * Hasta `n` tonos más claros y `n` más oscuros que `actual`, los más parecidos (distancia Lab
 * con la mitad de peso a la claridad, para que cuente más el matiz). Ambas listas van de claro
 * a oscuro, como se dibujan: [claros…] actual [oscuros…].
 */
export function tonosVecinos<T extends { hex: string; code: string }>(actual: T, candidatos: T[], n = 3): { claros: T[]; oscuros: T[] } {
  const [l0, a0, b0] = hexALab(actual.hex);
  const vistos = new Set([actual.hex.toLowerCase()]);
  const claros: { t: T; l: number; d: number }[] = [];
  const oscuros: { t: T; l: number; d: number }[] = [];
  for (const t of candidatos) {
    const hex = t.hex.toLowerCase();
    if (t.code === actual.code || vistos.has(hex)) continue;
    vistos.add(hex);
    const [l, a, b] = hexALab(hex);
    const d = Math.hypot((l - l0) * 0.5, a - a0, b - b0);
    if (l > l0 + 1) claros.push({ t, l, d });
    else if (l < l0 - 1) oscuros.push({ t, l, d });
  }
  const elegir = (lista: { t: T; l: number; d: number }[]) =>
    lista.sort((x, y) => x.d - y.d).slice(0, n).sort((x, y) => y.l - x.l).map((x) => x.t);
  return { claros: elegir(claros), oscuros: elegir(oscuros) };
}
