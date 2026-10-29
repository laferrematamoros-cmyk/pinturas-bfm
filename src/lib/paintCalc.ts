// Cuántas cubetas (19 L) y galones (4 L) hacen falta para cierta cantidad de litros.
// Una sola cuenta para las dos calculadoras (la de la página y la de paredes del kiosko).

export const CUBETA_L = 19;
export const GALON_L = 4;

/** Solo cubetas, redondeando hacia arriba (mínimo 1). */
export function soloCubetas(liters: number): number {
  return Math.max(1, Math.ceil(liters / CUBETA_L));
}

/** Solo galones, redondeando hacia arriba (mínimo 1). */
export function soloGalones(liters: number): number {
  return Math.max(1, Math.ceil(liters / GALON_L));
}

/** Cubetas completas y galones para lo que sobra. */
export function combinado(liters: number): { cubetas: number; galones: number } {
  const cubetas = Math.floor(liters / CUBETA_L);
  const resto = liters - cubetas * CUBETA_L;
  return { cubetas, galones: resto > 0 ? Math.ceil(resto / GALON_L) : 0 };
}

/**
 * Lo más barato: cubetas completas y, para el resto, galones o una cubeta más.
 * Sin precio de galón (o de cubeta) se resuelve solo con cubetas.
 */
export function masBarato(
  liters: number, cubPrice: number | null, galPrice: number | null
): { cubetas: number; galones: number } {
  if (cubPrice == null || galPrice == null) return { cubetas: soloCubetas(liters), galones: 0 };
  const { cubetas, galones } = combinado(liters);
  if (galones === 0) return { cubetas: Math.max(1, cubetas), galones: 0 };
  return galones * galPrice < cubPrice ? { cubetas, galones } : { cubetas: cubetas + 1, galones: 0 };
}
