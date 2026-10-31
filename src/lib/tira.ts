// Cuentas de la cuadrícula "color protagonista" y de la tira de tonos: qué letra se lee
// sobre cada color, qué color queda bajo el dedo y dónde acaba cada fila. Lógica pura (sin
// DOM) para probarla en Node.

/** Color de la letra oscura de las tarjetas (no es negro puro). */
export const LETRA_NEGRA = "#1d1d1f";

function canal(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminancia relativa WCAG (0–1) de un color #rrggbb o #rgb. */
export function luminanciaRelativa(hex: string): number {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.padEnd(6, "0"), 16);
  return 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
}

/** Contraste WCAG entre dos colores (1–21). */
export function contraste(a: string, b: string): number {
  const la = luminanciaRelativa(a), lb = luminanciaRelativa(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** La letra que mejor se lee sobre `fondo`: la que da más contraste. */
export function letraSobre(fondo: string): "negra" | "blanca" {
  return contraste(fondo, LETRA_NEGRA) >= contraste(fondo, "#ffffff") ? "negra" : "blanca";
}

/** Índice del color que queda bajo el dedo, con `x` medido desde la orilla izquierda. */
export function indiceEnTira(x: number, ancho: number, total: number): number {
  if (total <= 0 || ancho <= 0) return 0;
  return Math.min(total - 1, Math.max(0, Math.floor((x / ancho) * total)));
}

/** Último índice de la fila en la que está `indice` (la ficha se abre después de él). */
export function finDeFila(indice: number, columnas: number, total: number): number {
  const c = Math.max(1, columnas);
  return Math.min(total - 1, Math.floor(indice / c) * c + c - 1);
}

/** Cuántos colores hay que tener cargados para que exista el de `indice` (por lotes). */
export function cargaParaVer(indice: number, lote: number, total: number): number {
  return Math.min(total, Math.ceil((indice + 1) / lote) * lote);
}

const pct = (v: number) => `${Number(v.toFixed(3))}%`;

/** Degradado con un tramo duro por color: la tira entera en un solo elemento. */
export function degradadoTira(colores: string[]): string {
  if (colores.length === 0) return "none";
  const paso = 100 / colores.length;
  const tramos = colores.map((c, i) => `${c} ${pct(i * paso)} ${pct((i + 1) * paso)}`);
  return `linear-gradient(90deg, ${tramos.join(", ")})`;
}
