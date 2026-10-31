import { hexALab, tonosVecinos } from "../src/lib/vecinos.ts";

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log("  ✗", m); } else console.log("  ✓", m); };
const cerca = (a, b, t = 0.5) => Math.abs(a - b) <= t;
const c = (code, hex) => ({ code, hex });

console.log("hexALab:");
const blanco = hexALab("#ffffff"), negro = hexALab("#000000");
ok(cerca(blanco[0], 100) && cerca(blanco[1], 0) && cerca(blanco[2], 0), `blanco ≈ L100 (${blanco.map((v) => v.toFixed(1))})`);
ok(cerca(negro[0], 0), "negro ≈ L0");
ok(hexALab("#ff0000")[1] > 60, "rojo tiene a* alto");
ok(hexALab("#0000ff")[2] < -60, "azul tiene b* muy negativo");

console.log("tonosVecinos:");
const grises = ["#111111", "#333333", "#555555", "#777777", "#999999", "#bbbbbb", "#dddddd", "#f5f5f5"].map((h, i) => c(`G${i}`, h));
const medio = grises[4]; // #999999
const v = tonosVecinos(medio, grises);
ok(v.claros.map((x) => x.code).join() === "G7,G6,G5", `claros: los 3 de arriba, de claro a oscuro (${v.claros.map((x) => x.code)})`);
ok(v.oscuros.map((x) => x.code).join() === "G3,G2,G1", `oscuros: los 3 de abajo, del más cercano al más oscuro (${v.oscuros.map((x) => x.code)})`);
ok(![...v.claros, ...v.oscuros].some((x) => x.code === medio.code), "no se incluye a sí mismo");
ok(tonosVecinos(grises[7], grises).claros.length === 0, "el más claro no tiene claros");
ok(tonosVecinos(grises[0], grises).oscuros.length === 0, "el más oscuro no tiene oscuros");
ok(tonosVecinos(medio, grises, 1).claros.length === 1, "respeta n");

const rosa = c("R", "#e3979b");
const mezcla = [rosa, c("rosaClaro", "#ecd0cf"), c("verdeClaro", "#c8e6c9"), c("rosaOscuro", "#ce586c"), c("azulOscuro", "#3f5f9f")];
const p = tonosVecinos(rosa, mezcla, 1);
ok(p.claros[0]?.code === "rosaClaro", "entre dos más claros prefiere el del mismo matiz");
ok(p.oscuros[0]?.code === "rosaOscuro", "entre dos más oscuros prefiere el del mismo matiz");

const repetidos = [rosa, c("A", "#ecd0cf"), c("B", "#ECD0CF"), c("C", "#e3979b")];
const r = tonosVecinos(rosa, repetidos);
ok(r.claros.length === 1, "no repite el mismo hex con otro código");
ok(r.oscuros.length === 0, "un color idéntico al actual no cuenta como más oscuro");

if (fail) { console.log(`\n${fail} FALLARON`); process.exit(1); }
console.log("\nTodo bien.");
