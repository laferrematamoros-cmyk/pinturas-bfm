import {
  withoutPaused, colorHasActiveQuality, sanitizePaused, colorCountLabel,
} from "../src/lib/durability.ts";

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log("  ✗", m); } else console.log("  ✓", m); };
const same = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} (${JSON.stringify(a)})`);

const PRICES = { "2": "$ 890.00", "3": "$ 990.00", "4": "$ 1,280.00", "7": "$1,980.00" };

console.log("withoutPaused:");
same(withoutPaused(PRICES, []), PRICES, "sin pausadas devuelve los mismos precios");
same(withoutPaused(PRICES, [2, 4, 7]), { "3": "$ 990.00" }, "pausar 2, 4 y 7 deja solo 3");
ok(PRICES["7"] === "$1,980.00", "no modifica el mapa original");

console.log("colorHasActiveQuality:");
ok(colorHasActiveQuality([7], []), "sin pausadas todo se ve");
ok(!colorHasActiveQuality([7], [2, 4, 7]), "color solo de 7 años se esconde");
ok(!colorHasActiveQuality([4, 7], [2, 4, 7]), "color de 4 y 7 se esconde");
ok(colorHasActiveQuality([3, 4, 7], [2, 4, 7]), "color que trae 3 años se ve");
ok(!colorHasActiveQuality([], [2, 4, 7]), "con pausadas, color sin calidades marcadas se esconde");
ok(!colorHasActiveQuality(undefined, [2, 4, 7]), "con pausadas, color sin registro se esconde");
ok(colorHasActiveQuality([], []), "sin pausadas, color sin calidades se ve (como siempre)");
ok(colorHasActiveQuality(undefined, []), "sin pausadas, color sin registro se ve (como siempre)");

console.log("sanitizePaused:");
same(sanitizePaused([7, "4", 2, 2, 99, "x"]), [2, 4, 7], "filtra, quita repetidos y ordena");
same(sanitizePaused("7"), [], "lo que no es lista se vuelve vacío");

console.log("colorCountLabel:");
ok(colorCountLabel(2135) === "Más de 2,000", "2,135 → Más de 2,000");
ok(colorCountLabel(1056) === "Más de 1,000", "1,056 → Más de 1,000");
ok(colorCountLabel(1000) === "1,000", "1,000 exacto no dice 'más de'");
ok(colorCountLabel(987) === "Más de 900", "987 → Más de 900");
ok(colorCountLabel(42) === "42", "42 → 42");

if (fail) { console.log(`\n${fail} FALLARON`); process.exit(1); }
console.log("\nTodo bien.");
