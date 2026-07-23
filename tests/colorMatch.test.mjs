import {
  hexToRgb, rgbToLab, deltaE, matchPercent, nearestColors, applyWhiteBalance,
} from "../src/lib/colorMatch.ts";

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log("  ✗", m); } else console.log("  ✓", m); };
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, `${m} (${a} ~ ${b})`);

console.log("hexToRgb:");
{
  const c = hexToRgb("#863B67");
  ok(c.r === 134 && c.g === 59 && c.b === 103, "#863B67 -> {134,59,103}");
}

console.log("rgbToLab (anclas conocidas):");
{
  const white = rgbToLab({ r: 255, g: 255, b: 255 });
  near(white.L, 100, 0.5, "blanco L=100"); near(white.a, 0, 1, "blanco a=0"); near(white.b, 0, 1, "blanco b=0");
  const black = rgbToLab({ r: 0, g: 0, b: 0 });
  near(black.L, 0, 0.5, "negro L=0");
  const red = rgbToLab({ r: 255, g: 0, b: 0 });
  near(red.L, 53.24, 0.6, "rojo L≈53.24");
  near(red.a, 80.09, 1.5, "rojo a≈80.09");
  near(red.b, 67.20, 1.5, "rojo b≈67.20");
}

console.log("deltaE:");
{
  const lab = rgbToLab({ r: 100, g: 120, b: 140 });
  near(deltaE(lab, lab), 0, 1e-9, "color consigo mismo = 0");
}

console.log("deltaE (distancia real):");
{
  const red = rgbToLab({ r: 255, g: 0, b: 0 });
  const green = rgbToLab({ r: 0, g: 255, b: 0 });
  const d = deltaE(red, green);
  ok(d > 100, "rojo vs verde es una distancia grande");
  near(d, 171.2, 8, "rojo vs verde ΔE≈171");
}

console.log("matchPercent:");
{
  ok(matchPercent(0) === 100, "ΔE 0 -> 100%");
  ok(matchPercent(1000) === 0, "ΔE enorme -> 0%");
  ok(matchPercent(5) < 100 && matchPercent(5) > matchPercent(20), "monótona decreciente");
}

console.log("nearestColors:");
{
  const catalog = [
    { name: "Rojo", hex: "#FF0000", code: "R1" },
    { name: "Verde", hex: "#00FF00", code: "G1" },
    { name: "Azul", hex: "#0000FF", code: "B1" },
  ];
  const res = nearestColors(hexToRgb("#FF0000"), catalog, 2);
  ok(res.length === 2, "devuelve n resultados");
  ok(res[0].color.code === "R1", "match exacto queda primero");
  ok(res[0].match === 100 && res[0].exact === true, "match exacto: 100% y exact=true");
  ok(res[0].deltaE <= res[1].deltaE, "ordenado por ΔE ascendente");
}

console.log("applyWhiteBalance:");
{
  const corr = applyWhiteBalance({ r: 200, g: 200, b: 200 }, { r: 200, g: 200, b: 200 });
  ok(corr.r === 255 && corr.g === 255 && corr.b === 255, "neutral == sample -> blanco puro");
  const safe = applyWhiteBalance({ r: 50, g: 50, b: 50 }, { r: 0, g: 0, b: 0 });
  ok(safe.r === 50, "neutral 0 no divide por cero");
}

console.log(fail === 0 ? "\nTODO OK" : `\n${fail} FALLAS`);
process.exit(fail ? 1 : 0);
