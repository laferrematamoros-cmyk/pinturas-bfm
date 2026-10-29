import { soloCubetas, soloGalones, combinado, masBarato } from "../src/lib/paintCalc.ts";

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log("  ✗", m); } else console.log("  ✓", m); };
const same = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} (${JSON.stringify(a)})`);

console.log("soloCubetas (cubeta real de 19 L):");
ok(soloCubetas(19) === 1, "19 L → 1 cubeta (antes decía 2)");
ok(soloCubetas(20) === 2, "20 L → 2 cubetas");
ok(soloCubetas(38) === 2, "38 L → 2 cubetas (antes decía 3)");
ok(soloCubetas(3) === 1, "3 L → mínimo 1 cubeta");

console.log("soloGalones:");
ok(soloGalones(4) === 1, "4 L → 1 galón");
ok(soloGalones(19) === 5, "19 L → 5 galones");

console.log("combinado:");
same(combinado(19), { cubetas: 1, galones: 0 }, "19 L → 1 cubeta, sin galones (antes 1 + 1 galón)");
same(combinado(23), { cubetas: 1, galones: 1 }, "23 L → 1 cubeta + 1 galón");
same(combinado(37), { cubetas: 1, galones: 5 }, "37 L → 1 cubeta + 5 galones");
same(combinado(10), { cubetas: 0, galones: 3 }, "10 L → 3 galones");

console.log("masBarato (cubeta $990, galón $220):");
same(masBarato(37, 990, 220), { cubetas: 2, galones: 0 }, "37 L: 5 galones ($1,100) cuestan más que otra cubeta");
same(masBarato(23, 990, 220), { cubetas: 1, galones: 1 }, "23 L: 1 cubeta + 1 galón");
same(masBarato(10, 990, 220), { cubetas: 0, galones: 3 }, "10 L: 3 galones ($660) en vez de una cubeta");
same(masBarato(19, 990, 220), { cubetas: 1, galones: 0 }, "19 L: 1 cubeta exacta");
same(masBarato(23, 990, null), { cubetas: 2, galones: 0 }, "sin precio de galón, solo cubetas");

// La calculadora por paredes ya hacía bien la cuenta: la nueva debe dar EXACTAMENTE lo mismo.
console.log("igual que la calculadora por paredes (1 a 600 L, varios precios):");
function paredesAntes(liters, cubPrice, galPrice, hasGalon) {
  if (hasGalon && cubPrice != null && galPrice != null) {
    const cubBase = Math.floor(liters / 19);
    const restante = liters - cubBase * 19;
    if (restante <= 0) return { cubetas: Math.max(1, cubBase), galones: 0 };
    const galRest = Math.ceil(restante / 4);
    return galRest * galPrice < cubPrice ? { cubetas: cubBase, galones: galRest } : { cubetas: cubBase + 1, galones: 0 };
  }
  return { cubetas: Math.max(1, Math.ceil(liters / 19)), galones: 0 };
}
let diffs = 0;
for (const [cub, gal] of [[990, 220], [1980, 490], [890, 195], [1280, 350], [990, null], [null, 220]]) {
  for (let l = 1; l <= 600; l++) {
    const a = JSON.stringify(paredesAntes(l, cub, gal, gal != null));
    const b = JSON.stringify(masBarato(l, cub, gal));
    if (a !== b) { diffs++; if (diffs <= 3) console.log("    distinto en", l, "L", cub, gal, a, b); }
  }
}
ok(diffs === 0, `3,600 casos sin diferencias (${diffs} distintos)`);

if (fail) { console.log(`\n${fail} FALLARON`); process.exit(1); }
console.log("\nTodo bien.");
