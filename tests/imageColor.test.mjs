import { averageRegion } from "../src/lib/imageColor.ts";

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log("  ✗", m); } else console.log("  ✓", m); };

// Imagen 2x1: pixel izquierdo rojo opaco, derecho azul opaco
const img = { width: 2, height: 1, data: new Uint8ClampedArray([255,0,0,255,  0,0,255,255]) };

console.log("averageRegion:");
{
  const solo = averageRegion(img, 0, 0, 0); // radio 0 = solo ese pixel
  ok(solo.r === 255 && solo.g === 0 && solo.b === 0, "radio 0 devuelve el pixel exacto");
  const prom = averageRegion(img, 0, 0, 1); // cubre ambos pixeles
  ok(prom.r === 128 && prom.b === 128 && prom.g === 0, "promedia rojo+azul -> morado");
}

// Ignora transparentes
const img2 = { width: 2, height: 1, data: new Uint8ClampedArray([255,0,0,255,  0,0,255,0]) };
{
  const prom = averageRegion(img2, 0, 0, 1);
  ok(prom.r === 255 && prom.b === 0, "ignora pixeles con alpha 0");
}

console.log(fail === 0 ? "\nTODO OK" : `\n${fail} FALLAS`);
process.exit(fail ? 1 : 0);
