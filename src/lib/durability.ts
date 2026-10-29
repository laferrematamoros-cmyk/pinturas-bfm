// Calidades (años de durabilidad) pausadas: se esconden al público sin borrar
// sus precios, para poder volver a prenderlas tal como estaban.

export const DURABILITY_YEARS = [2, 3, 4, 7] as const;

/** Copia de un mapa de precios ("años" → precio) sin las calidades pausadas. */
export function withoutPaused(prices: Record<string, string>, paused: number[]): Record<string, string> {
  if (paused.length === 0) return prices;
  const out: Record<string, string> = {};
  for (const [years, price] of Object.entries(prices)) {
    if (!paused.includes(Number(years))) out[years] = price;
  }
  return out;
}

/**
 * ¿El público puede ver un color? Sin calidades pausadas, todos (como siempre).
 * Con alguna pausada, solo los que traen marcada al menos una calidad activa:
 * un color sin calidades marcadas se esconde, porque no se sabe si se puede igualar.
 */
export function colorHasActiveQuality(colorYears: number[] | undefined, paused: number[]): boolean {
  if (paused.length === 0) return true;
  if (!colorYears || colorYears.length === 0) return false;
  return colorYears.some((y) => !paused.includes(y));
}

/** Limpia lo que llega del cliente: solo calidades conocidas, sin repetir, ordenadas. */
export function sanitizePaused(years: unknown): number[] {
  if (!Array.isArray(years)) return [];
  const known: readonly number[] = DURABILITY_YEARS;
  return [...new Set(years.map(Number).filter((y) => known.includes(y)))].sort((a, b) => a - b);
}

/** "Más de 2,000" para 2,135; "1,000" para exactamente 1,000. Redondea hacia abajo. */
export function colorCountLabel(n: number): string {
  const step = n >= 1000 ? 1000 : n >= 100 ? 100 : 1;
  const rounded = Math.floor(n / step) * step;
  const fmt = rounded.toLocaleString("en-US");
  return n > rounded ? `Más de ${fmt}` : fmt;
}
