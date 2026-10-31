import { estadoTienda, hora12, horaLocal, HORARIO_CORTO } from "../src/lib/horario.ts";

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log("  ✗", m); } else console.log("  ✓", m); };
const igual = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} (${JSON.stringify(a)})`);

console.log("hora12:");
ok(hora12(540) === "9:00 am", "9:00 am");
ok(hora12(1080) === "6:00 pm", "6:00 pm");
ok(hora12(720) === "12:00 pm", "mediodía");
ok(hora12(0) === "12:00 am", "medianoche");

console.log("horaLocal (Matamoros):");
// Enero: horario de invierno (UTC-6). Miércoles 14 de enero de 2026, 12:00 → 18:00 UTC.
igual(horaLocal(new Date("2026-01-14T18:00:00Z")), { dia: 3, min: 720 }, "miércoles 12:00 en invierno");
// Julio: horario de verano (UTC-5). Miércoles 15 de julio de 2026, 12:00 → 17:00 UTC.
igual(horaLocal(new Date("2026-07-15T17:00:00Z")), { dia: 3, min: 720 }, "miércoles 12:00 en verano (Matamoros sigue el horario de EE. UU.)");

console.log("estadoTienda:");
igual(estadoTienda(new Date("2026-01-14T18:00:00Z")), { abierta: true, texto: "Abierta ahora · cierra 6:00 pm" }, "entre semana a mediodía");
igual(estadoTienda(new Date("2026-01-14T23:35:00Z")), { abierta: true, texto: "Abierta · cierra en 25 min" }, "a las 5:35 pm avisa que cierra pronto");
igual(estadoTienda(new Date("2026-01-14T14:00:00Z")), { abierta: false, texto: "Cerrada · abre hoy 9:00 am" }, "a las 8:00 am");
igual(estadoTienda(new Date("2026-01-15T01:00:00Z")), { abierta: false, texto: "Cerrada · abre mañana 9:00 am" }, "miércoles 7:00 pm");
igual(estadoTienda(new Date("2026-01-17T15:00:00Z")), { abierta: true, texto: "Abierta ahora · cierra 5:00 pm" }, "sábado 9:00 am (cierra a las 5)");
igual(estadoTienda(new Date("2026-01-17T23:30:00Z")), { abierta: false, texto: "Cerrada · abre el lunes 9:00 am" }, "sábado 5:30 pm → el domingo no abre");
igual(estadoTienda(new Date("2026-01-18T18:00:00Z")), { abierta: false, texto: "Cerrada · abre mañana 9:00 am" }, "domingo a mediodía");
igual(estadoTienda(new Date("2026-01-14T15:00:00Z")).abierta, true, "a las 9:00 en punto ya está abierta");
igual(estadoTienda(new Date("2026-01-15T00:00:00Z")).abierta, false, "a las 6:00 pm en punto ya cerró");

console.log("texto del horario:");
ok(HORARIO_CORTO === "Lun–Vie 9–6 · Sáb 8–5", "horario corto");

if (fail) { console.log(`\n${fail} FALLARON`); process.exit(1); }
console.log("\nTodo bien.");
