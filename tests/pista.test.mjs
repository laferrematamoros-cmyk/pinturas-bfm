import { relativa, variablesDelRecorrido, DEDO, KIOSKO_INACTIVO_MS } from "../src/lib/pista.ts";

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log("  ✗", m); } else console.log("  ✓", m); };
const same = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} (${JSON.stringify(a)})`);

const cont = { left: 100, top: 200, width: 400, height: 200 };
const naranjas = { left: 160, top: 220, width: 48, height: 48 };
const verdes = { left: 280, top: 220, width: 48, height: 48 };

console.log("constantes:");
ok(KIOSKO_INACTIVO_MS === 60000, "el kiosko espera 60 s");
same(DEDO, { ancho: 28, punta: 4 }, "tamaño del dedo");

console.log("relativa:");
same(relativa(cont, naranjas), { left: 60, top: 20, width: 48, height: 48 }, "caja relativa al contenedor");
same(relativa(cont, { left: 100.4, top: 200.6, width: 47.6, height: 48.2 }), { left: 0, top: 1, width: 48, height: 48 }, "redondea a píxeles");

console.log("variablesDelRecorrido:");
// Centro de Naranjas: (84, 44) relativo → punta del dedo en x 84-14=70, y 44-4=40.
// Centro de Verdes: (204, 44) → x 190, y 40. Salida: 60 px a la izquierda y 40 abajo del 1er toque.
same(
  variablesDelRecorrido(cont, [naranjas, verdes]),
  { "--x0": "10px", "--y0": "80px", "--x1": "70px", "--y1": "40px", "--x2": "190px", "--y2": "40px" },
  "toca el centro de los dos círculos"
);
// En teléfono Verdes puede quedar en la segunda fila: el dedo baja.
same(
  variablesDelRecorrido(cont, [naranjas, { left: 130, top: 290, width: 48, height: 48 }]),
  { "--x0": "10px", "--y0": "80px", "--x1": "70px", "--y1": "40px", "--x2": "40px", "--y2": "110px" },
  "sigue al círculo aunque esté en otra fila"
);
ok(variablesDelRecorrido(cont, [naranjas]) === null, "con un solo círculo no hay recorrido");
ok(variablesDelRecorrido(cont, []) === null, "sin círculos no hay recorrido");

if (fail) { console.log(`\n${fail} FALLARON`); process.exit(1); }
console.log("\nTodo bien.");
