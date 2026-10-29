import { aligerar } from "../src/lib/catalogData.ts";

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log("  ✗", m); } else console.log("  ✓", m); };
const same = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} (${JSON.stringify(a)})`);

const crudo = {
  colorSettings: {
    "00NN 05/000": { hex: null, durability_years: [4, 7], prices: {} },
    "VC-0115": { hex: "#f5951c", durability_years: [2], prices: {} },
    "SIN-NADA": { hex: null, durability_years: [], prices: {} },
  },
  customColors: {
    Azules: [
      { id: "a1", family_name: "Azules", name: "Gota Azul", hex: "#123456", code: "30BB 08/263", position: 3, created_at: "2026-05-13T18:42:40Z", page_number: null },
      { id: "a2", family_name: "Azules", name: "Cielo", hex: "#abcdef", code: "X-1", position: 4, created_at: "2026-05-13T18:42:41Z", page_number: 12 },
    ],
  },
  site: { name: "BFM PINTURAS" },
  durabilityPaused: [2, 4, 7],
  colorOrders: { Azules: ["X-1", "30BB 08/263"] },
};

const d = aligerar(crudo);

console.log("ajustes por color:");
same(d.overrides, { "VC-0115": "#f5951c" }, "solo viajan los HEX que existen");
same(d.durability, { "00NN 05/000": [4, 7], "VC-0115": [2] }, "solo las calidades marcadas (sin entradas vacías)");
ok(!("colorSettings" in d), "ya no viaja colorSettings completo");

console.log("colores personalizados:");
same(d.customColors.Azules[0], { id: "a1", name: "Gota Azul", hex: "#123456", code: "30BB 08/263" }, "sin family_name, position, created_at ni pageNumber vacío");
same(d.customColors.Azules[1].pageNumber, "12", "el número de página viaja como texto");

console.log("el resto pasa igual:");
same(d.site, { name: "BFM PINTURAS" }, "site");
same(d.durabilityPaused, [2, 4, 7], "calidades pausadas");
same(d.colorOrders, { Azules: ["X-1", "30BB 08/263"] }, "orden de colores");

if (fail) { console.log(`\n${fail} FALLARON`); process.exit(1); }
console.log("\nTodo bien.");
