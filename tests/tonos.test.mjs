import { tonosDeFamilia, luminosidad } from "../src/lib/tonos.ts";

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log("  ✗", m); } else console.log("  ✓", m); };
const hex = /^#[0-9a-f]{6}$/;

console.log("tonosDeFamilia:");
const az = tonosDeFamilia("#1E88E5");
ok(az.length === 4 && az.every((t) => hex.test(t)), `cuatro tonos #rrggbb (${az.join(" ")})`);
ok(az[0] === "#1e88e5", "el primero es la base en minúsculas");
ok(luminosidad(az[1]) > luminosidad(az[0]), "el segundo es más claro");
ok(luminosidad(az[2]) < luminosidad(az[0]), "el tercero es más oscuro");
ok(az[3] !== az[0], "el cuarto es un vecino distinto");
ok(tonosDeFamilia("#c9464f", "#e87ca0")[3] === "#e87ca0", "Rojos/Rosas usa su rosa como cuarto tono");
const gris = tonosDeFamilia("#666666");
ok(gris.every((t) => hex.test(t)) && luminosidad(gris[1]) > luminosidad(gris[0]), "también sirve con grises");
ok(tonosDeFamilia("#fff").every((t) => hex.test(t)), "acepta #rgb corto");

if (fail) { console.log(`\n${fail} FALLARON`); process.exit(1); }
console.log("\nTodo bien.");
