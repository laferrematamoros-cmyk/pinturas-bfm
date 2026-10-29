// Lo que la página de verdad necesita de loadInitialData(), sin columnas ni
// campos vacíos. Viaja dentro del HTML en cada visita, así que cada byte cuenta:
// de ~626 KB baja a la mitad o menos (ver tests/catalogData.test.mjs).
import type { loadInitialData } from "./actions";

type DatosCrudos = Awaited<ReturnType<typeof loadInitialData>>;

export interface ColorLigero {
  id: string;
  name: string;
  hex: string;
  code: string;
  pageNumber?: string; // solo si tiene número de página
}

export function aligerar(d: DatosCrudos) {
  const { colorSettings, customColors, ...resto } = d;

  // De 2,135 ajustes por color casi ninguno trae HEX propio y ninguno usa "prices":
  // solo viajan los HEX que existen y las calidades marcadas.
  const overrides: Record<string, string> = {};
  const durability: Record<string, number[]> = {};
  for (const [code, val] of Object.entries(colorSettings)) {
    if (val.hex) overrides[code] = val.hex;
    if (val.durability_years?.length) durability[code] = val.durability_years;
  }

  // Colores personalizados: sin family_name (ya es la llave), position ni created_at.
  const colores: Record<string, ColorLigero[]> = {};
  for (const [family, list] of Object.entries(customColors)) {
    colores[family] = list.map((c) => ({
      id: c.id,
      name: c.name,
      hex: c.hex,
      code: c.code,
      ...(c.page_number != null ? { pageNumber: String(c.page_number) } : {}),
    }));
  }

  return { ...resto, overrides, durability, customColors: colores };
}

export type DatosCatalogo = ReturnType<typeof aligerar>;
