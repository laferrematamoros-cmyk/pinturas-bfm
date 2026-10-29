// Pista animada de los círculos de familias ("el dedito"): por dónde pasa el dedo y
// dónde van los anillos. Lógica pura (sin DOM) para poder probarla en Node.

/** En el kiosko, la pista vuelve tras este tiempo sin ninguna interacción. */
export const KIOSKO_INACTIVO_MS = 60_000;

/** Tamaño del 👆 (px) y cuánto baja su punta desde el borde superior del emoji. */
export const DEDO = { ancho: 28, punta: 4 };

export interface Caja { left: number; top: number; width: number; height: number }

/** Caja de un círculo relativa al contenedor, en píxeles enteros. */
export function relativa(cont: Caja, c: Caja): Caja {
  return {
    left: Math.round(c.left - cont.left),
    top: Math.round(c.top - cont.top),
    width: Math.round(c.width),
    height: Math.round(c.height),
  };
}

/**
 * Variables CSS del recorrido del dedo: sale abajo a la izquierda del primer círculo
 * y toca el centro del primero y del segundo. Con menos de dos círculos: null.
 */
export function variablesDelRecorrido(cont: Caja, objetivos: Caja[]): Record<string, string> | null {
  if (objetivos.length < 2) return null;
  const [a, b] = objetivos.map((c) => relativa(cont, c));
  const punta = (c: Caja) => ({ x: c.left + c.width / 2 - DEDO.ancho / 2, y: c.top + c.height / 2 - DEDO.punta });
  const p1 = punta(a);
  const p2 = punta(b);
  const p0 = { x: p1.x - 60, y: p1.y + 40 };
  const px = (n: number) => `${Math.round(n)}px`;
  return { "--x0": px(p0.x), "--y0": px(p0.y), "--x1": px(p1.x), "--y1": px(p1.y), "--x2": px(p2.x), "--y2": px(p2.y) };
}
