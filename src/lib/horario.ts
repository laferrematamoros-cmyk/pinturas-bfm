// Horario de la tienda y su estado en vivo ("Abierta ahora · cierra 6:00 pm").
// Lógica pura: recibe la fecha y calcula con la hora de Matamoros (que, por ser frontera,
// sigue el horario de verano de EE. UU.). El texto de la pastilla sale de aquí mismo, así el
// letrero y el horario nunca se contradicen.

export const ZONA = "America/Matamoros";

/** Minutos desde medianoche [abre, cierra] por día (0 = domingo). Domingo cerrado. */
export const HORARIO: Record<number, [number, number] | null> = {
  0: null,
  1: [540, 1080], 2: [540, 1080], 3: [540, 1080], 4: [540, 1080], 5: [540, 1080],
  6: [480, 1020],
};
export const HORARIO_CORTO = "Lun–Vie 9–6 · Sáb 8–5";
export const HORARIO_LARGO = "Lun – Vie: 9:00 – 6:00 · Sáb: 8:00 – 5:00";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Día de la semana (0–6) y minutos desde medianoche, en Matamoros. */
export function horaLocal(fecha: Date): { dia: number; min: number } {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23",
  }).formatToParts(fecha);
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? "";
  return { dia: DIAS_EN.indexOf(v("weekday")), min: (Number(v("hour")) % 24) * 60 + Number(v("minute")) };
}

/** 540 → "9:00 am", 1080 → "6:00 pm". */
export function hora12(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

/** Si la tienda está abierta y el texto del letrero. */
export function estadoTienda(fecha: Date): { abierta: boolean; texto: string } {
  const { dia, min } = horaLocal(fecha);
  const hoy = HORARIO[dia];
  if (hoy && min >= hoy[0] && min < hoy[1]) {
    const faltan = hoy[1] - min;
    return { abierta: true, texto: faltan <= 60 ? `Abierta · cierra en ${faltan} min` : `Abierta ahora · cierra ${hora12(hoy[1])}` };
  }
  if (hoy && min < hoy[0]) return { abierta: false, texto: `Cerrada · abre hoy ${hora12(hoy[0])}` };
  for (let d = 1; d <= 7; d++) {
    const otro = (dia + d) % 7;
    const h = HORARIO[otro];
    if (h) return { abierta: false, texto: `Cerrada · abre ${d === 1 ? "mañana" : `el ${DIAS[otro]}`} ${hora12(h[0])}` };
  }
  return { abierta: false, texto: "Cerrada" };
}
