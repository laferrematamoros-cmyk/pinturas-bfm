# "Encuentra tu color con una foto" (kiosko) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que en el kiosko (tablet en tienda) un cliente suba una foto, toque un punto, y vea los tonos más cercanos del catálogo para elegir y continuar al pedido.

**Architecture:** Todo ocurre en el navegador (sin subir la foto). Matemática de color pura y testeable en `src/lib/colorMatch.ts`; muestreo de imagen en `src/lib/imageColor.ts`; la ventana UI en `src/components/ColorFromPhoto.tsx`. `page.tsx` solo agrega el botón flotante (solo en `kioskMode`) y le pasa la lista de colores visibles; al elegir un resultado reutiliza `setPendingColorCode` para abrir la ficha existente.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript. Sin framework de test: las funciones puras se prueban con Node 24 (que corre `.ts` por type-stripping) mediante archivos `.mjs` que se ejecutan con `node`. Sin dependencias nuevas.

**Notas del repo (respetar):**
- Alias de import: `@/*` → `./src/*`.
- Los `z-[NN]` arbitrarios de Tailwind NO compilan en este proyecto → en overlays/modales usar `style={{ zIndex: N }}` inline. Las clases estándar como `z-40` sí compilan.
- El modo kiosko es el estado `kioskMode` (page.tsx:2068), activado por `?kiosko=1`.
- Abrir la ficha de un color por código: `setPendingColorCode(code)` (page.tsx:2074, efecto 2303-2331).
- Correr un test: `node tests/<archivo>.test.mjs` desde la raíz del repo.

---

### Task 1: Matemática de color pura (`colorMatch.ts`)

**Files:**
- Create: `src/lib/colorMatch.ts`
- Test: `tests/colorMatch.test.mjs`

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/colorMatch.test.mjs`:

```js
import {
  hexToRgb, rgbToLab, deltaE, matchPercent, nearestColors, applyWhiteBalance, EXACT_DELTA_E,
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
}

console.log("deltaE:");
{
  const lab = rgbToLab({ r: 100, g: 120, b: 140 });
  near(deltaE(lab, lab), 0, 1e-9, "color consigo mismo = 0");
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
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `node tests/colorMatch.test.mjs`
Expected: FALLA (`Cannot find module '../src/lib/colorMatch.ts'` o error de import).

- [ ] **Step 3: Implementar `colorMatch.ts`**

Crear `src/lib/colorMatch.ts`:

```ts
// Matemática pura de color: conversión y match perceptual contra el catálogo.
// Sin dependencias de navegador → testeable en Node.

export type Rgb = { r: number; g: number; b: number };
export type Lab = { L: number; a: number; b: number };
export type CatalogColor = { name: string; hex: string; code: string };
export type Candidate = { color: CatalogColor; deltaE: number; match: number; exact: boolean };

// ΔE por debajo de este umbral se considera "coincidencia exacta" (apenas perceptible).
export const EXACT_DELTA_E = 2.3;

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToLab({ r, g, b }: Rgb): Lab {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const R = lin(r), G = lin(g), B = lin(b);
  let X = R * 0.4124 + G * 0.3576 + B * 0.1805;
  let Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  let Z = R * 0.0193 + G * 0.1192 + B * 0.9505;
  X /= 0.95047; Y /= 1.0; Z /= 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(X), fy = f(Y), fz = f(Z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

// CIE76: distancia euclidiana en CIELAB. Simple y robusto para elegir entre ~336
// colores; muy superior a RGB. (CIEDE2000 sería una mejora futura opcional.)
export function deltaE(a: Lab, b: Lab): number {
  return Math.sqrt((a.L - b.L) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
}

// Mapea ΔE (0 = idéntico) a un porcentaje amigable 0-100.
export function matchPercent(dE: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - dE * 2)));
}

export function nearestColors(sample: Rgb, catalog: CatalogColor[], n: number): Candidate[] {
  const sampleLab = rgbToLab(sample);
  const scored: Candidate[] = catalog.map((color) => {
    const dE = deltaE(sampleLab, rgbToLab(hexToRgb(color.hex)));
    return { color, deltaE: dE, match: matchPercent(dE), exact: dE <= EXACT_DELTA_E };
  });
  scored.sort((x, y) => x.deltaE - y.deltaE);
  return scored.slice(0, n);
}

// Corrección de balance de blancos (von Kries simplificado): escala cada canal para
// que `neutral` (lo que debería ser blanco) mapee a blanco puro, y aplica el mismo
// factor al `sample`. Evita división por cero y satura a 255.
export function applyWhiteBalance(sample: Rgb, neutral: Rgb): Rgb {
  const scale = (s: number, ne: number) =>
    Math.round(Math.min(255, ne <= 0 ? s : s * (255 / ne)));
  return { r: scale(sample.r, neutral.r), g: scale(sample.g, neutral.g), b: scale(sample.b, neutral.b) };
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `node tests/colorMatch.test.mjs`
Expected: `TODO OK` (exit 0).

- [ ] **Step 5: Commit**

```bash
git add src/lib/colorMatch.ts tests/colorMatch.test.mjs
git commit -m "feat(color): matemática pura de match de color (CIELAB) + tests"
```

---

### Task 2: Muestreo de imagen (`imageColor.ts`)

**Files:**
- Create: `src/lib/imageColor.ts`
- Test: `tests/imageColor.test.mjs`

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/imageColor.test.mjs` (usa un `ImageData` sintético; `averageRegion` es pura):

```js
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
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `node tests/imageColor.test.mjs`
Expected: FALLA (módulo no encontrado).

- [ ] **Step 3: Implementar `imageColor.ts`**

Crear `src/lib/imageColor.ts`:

```ts
// Utilidades de imagen. `averageRegion` es pura (recibe ImageData-like) → testeable.
// `loadImageToCanvas` sí usa APIs de navegador.
import type { Rgb } from "@/lib/colorMatch";

type ImageDataLike = { width: number; height: number; data: Uint8ClampedArray | number[] };

// Promedia los pixeles OPACOS dentro de un cuadrado de lado (2*radius+1) centrado en (x,y).
export function averageRegion(img: ImageDataLike, x: number, y: number, radius: number): Rgb {
  let r = 0, g = 0, b = 0, count = 0;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const px = x + dx, py = y + dy;
      if (px < 0 || py < 0 || px >= img.width || py >= img.height) continue;
      const i = (py * img.width + px) * 4;
      if (img.data[i + 3] === 0) continue; // transparente
      r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; count++;
    }
  }
  if (count === 0) return { r: 0, g: 0, b: 0 };
  return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
}

// Carga un File a un canvas offscreen, respetando orientación EXIF y reduciendo si
// excede maxDim (por rendimiento en tablet).
export async function loadImageToCanvas(file: File, maxDim: number): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas;
}
```

Nota: el `import type { Rgb }` es solo de tipo → Node lo borra al hacer type-stripping, por eso el test corre sin resolver el alias `@/`.

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `node tests/imageColor.test.mjs`
Expected: `TODO OK` (exit 0).

- [ ] **Step 5: Commit**

```bash
git add src/lib/imageColor.ts tests/imageColor.test.mjs
git commit -m "feat(color): muestreo de imagen (averageRegion + carga a canvas) + tests"
```

---

### Task 3: La ventana `ColorFromPhoto.tsx`

**Files:**
- Create: `src/components/ColorFromPhoto.tsx`

(Componente de UI: sin test unitario; se verifica con build en Task 5 y prueba manual en Task 6.)

- [ ] **Step 1: Crear el componente completo**

Crear `src/components/ColorFromPhoto.tsx`:

```tsx
"use client";
import { useRef, useState } from "react";
import {
  nearestColors, applyWhiteBalance,
  type CatalogColor, type Candidate, type Rgb,
} from "@/lib/colorMatch";
import { averageRegion, loadImageToCanvas } from "@/lib/imageColor";

type Props = {
  open: boolean;
  colors: CatalogColor[];
  onClose: () => void;
  onPickColor: (code: string) => void;
};

const MAX_DIM = 2000;
const SAMPLE_RADIUS = 6;
const RESULTS = 4;

export default function ColorFromPhoto({ open, colors, onClose, onPickColor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loupeRef = useRef<HTMLCanvasElement | null>(null);
  const imgDataRef = useRef<ImageData | null>(null);
  const draggingRef = useRef(false);

  const [hasImage, setHasImage] = useState(false);
  const [sample, setSample] = useState<Rgb | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  const [loupePos, setLoupePos] = useState<{ x: number; y: number } | null>(null);
  const [lastRaw, setLastRaw] = useState<Rgb | null>(null);
  const [neutral, setNeutral] = useState<Rgb | null>(null);
  const [wbMode, setWbMode] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function reset() {
    imgDataRef.current = null;
    setHasImage(false); setSample(null); setCandidates([]); setMarker(null);
    setLoupePos(null); setLastRaw(null); setNeutral(null); setWbMode(false); setError("");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    reset();
    try {
      const off = await loadImageToCanvas(file, MAX_DIM);
      const canvas = canvasRef.current!;
      canvas.width = off.width; canvas.height = off.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(off, 0, 0);
      imgDataRef.current = ctx.getImageData(0, 0, off.width, off.height);
      setHasImage(true);
    } catch {
      setError("No se pudo cargar la imagen. Intenta con otra.");
    }
    e.target.value = "";
  }

  function toImageCoords(clientX: number, clientY: number) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.round((clientY - rect.top) * (canvas.height / rect.height));
    return { x, y, rect };
  }

  function drawLoupe(ix: number, iy: number) {
    const canvas = canvasRef.current!, loupe = loupeRef.current;
    if (!loupe) return;
    const lctx = loupe.getContext("2d")!;
    const size = loupe.width, zoom = 6, src = size / zoom;
    lctx.imageSmoothingEnabled = false;
    lctx.clearRect(0, 0, size, size);
    lctx.drawImage(canvas, ix - src / 2, iy - src / 2, src, src, 0, 0, size, size);
    lctx.strokeStyle = "rgba(0,0,0,0.7)"; lctx.lineWidth = 1;
    lctx.beginPath();
    lctx.moveTo(size / 2, 0); lctx.lineTo(size / 2, size);
    lctx.moveTo(0, size / 2); lctx.lineTo(size, size / 2);
    lctx.stroke();
  }

  function applyAndShow(rawColor: Rgb, neutralColor: Rgb | null) {
    const corrected = neutralColor ? applyWhiteBalance(rawColor, neutralColor) : rawColor;
    setSample(corrected);
    setCandidates(nearestColors(corrected, colors, RESULTS));
  }

  function pick(clientX: number, clientY: number, commit: boolean) {
    const img = imgDataRef.current;
    if (!img) return;
    const { x, y, rect } = toImageCoords(clientX, clientY);
    if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
    const raw = averageRegion(img, x, y, SAMPLE_RADIUS);
    const canvas = canvasRef.current!;
    setMarker({ x: (x * rect.width) / canvas.width, y: (y * rect.height) / canvas.height });
    setLoupePos({ x: clientX - rect.left, y: clientY - rect.top });
    drawLoupe(x, y);
    if (!commit) return;
    setLoupePos(null);
    if (wbMode) {
      if (raw.r < 40 && raw.g < 40 && raw.b < 40) {
        setError("Elige un punto más claro (blanco o gris) para corregir la luz.");
        return;
      }
      setNeutral(raw); setWbMode(false); setError("");
      if (lastRaw) applyAndShow(lastRaw, raw);
      return;
    }
    setLastRaw(raw);
    applyAndShow(raw, neutral);
  }

  const onDown = (e: React.PointerEvent) => { draggingRef.current = true; pick(e.clientX, e.clientY, false); };
  const onMove = (e: React.PointerEvent) => { if (draggingRef.current) pick(e.clientX, e.clientY, false); };
  const onUp = (e: React.PointerEvent) => { draggingRef.current = false; pick(e.clientX, e.clientY, true); };

  const sampleHex = sample
    ? "#" + [sample.r, sample.g, sample.b].map((v) => v.toString(16).padStart(2, "0")).join("")
    : null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-3" style={{ zIndex: 60 }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Encuentra tu color con una foto</h2>
          <button onClick={() => { reset(); onClose(); }} aria-label="Cerrar" className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        {!hasImage && (
          <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400">
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <div className="text-4xl mb-2">📷</div>
            <div className="font-medium">Toca para subir una foto</div>
            <div className="text-sm text-gray-500 mt-1">Con luz de día, sin flash y evitando sombras.</div>
          </label>
        )}

        {hasImage && (
          <>
            <div className="relative select-none touch-none">
              <canvas
                ref={canvasRef}
                onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={() => { draggingRef.current = false; setLoupePos(null); }}
                className="w-full h-auto rounded-lg border border-gray-200"
                style={{ touchAction: "none" }}
              />
              {marker && (
                <div className="absolute w-4 h-4 rounded-full border-2 border-white shadow -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                     style={{ left: marker.x, top: marker.y, backgroundColor: sampleHex ?? "transparent" }} />
              )}
              <canvas ref={loupeRef} width={96} height={96}
                      className="absolute rounded-full border-2 border-white shadow-lg pointer-events-none bg-white"
                      style={{ left: (loupePos?.x ?? 0) - 48, top: (loupePos?.y ?? 0) - 110, display: loupePos ? "block" : "none" }} />
            </div>

            <p className="text-sm text-gray-600">Toca (o arrastra) sobre la foto para elegir el tono.</p>

            <button
              onClick={() => { setWbMode((v) => !v); setError(""); }}
              className={`text-sm rounded-lg px-3 py-2 border ${wbMode ? "bg-black text-white" : "bg-gray-50"}`}
            >
              {wbMode ? "Ahora toca algo blanco de la foto…" : (neutral ? "Luz corregida ✓ — corregir de nuevo" : "¿La foto se ve con luz rara? Corregir luz")}
            </button>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {candidates.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Color detectado:</span>
                  <span className="inline-block w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: sampleHex ?? "transparent" }} />
                  <span>{sampleHex}</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {candidates.map((c) => (
                    <button key={c.color.code}
                            onClick={() => { onPickColor(c.color.code); reset(); onClose(); }}
                            className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:border-gray-400 text-left">
                      <span className="w-12 h-12 rounded-lg border border-gray-300 flex-shrink-0" style={{ backgroundColor: c.color.hex }} />
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium truncate">{c.color.name}</span>
                        <span className="block text-xs text-gray-500">{c.color.code}</span>
                      </span>
                      <span className="text-right flex-shrink-0">
                        <span className="block text-sm font-semibold">{c.match}%</span>
                        {c.exact && <span className="block text-xs text-green-600">Coincidencia exacta</span>}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">Tonos aproximados. Para el color final, confirma con una muestra física bajo la luz del lugar.</p>
              </div>
            )}

            <button onClick={reset} className="text-sm text-gray-500 underline self-start">Cambiar foto</button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar que compila (typecheck vía build parcial)**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos referidos a `ColorFromPhoto.tsx`, `colorMatch.ts`, `imageColor.ts`. (Si `tsc` no está configurado para correr solo, se valida en Task 5 con `npm run build`.)

- [ ] **Step 3: Commit**

```bash
git add src/components/ColorFromPhoto.tsx
git commit -m "feat(color): ventana ColorFromPhoto (subir foto, lupa, corrección de luz, resultados)"
```

---

### Task 4: Integrar en `page.tsx` (solo kiosko)

**Files:**
- Modify: `src/app/page.tsx` (import nuevo; estado `photoOpen`; memo `allVisibleColors`; botón flotante + render, condicionado a `kioskMode`)

- [ ] **Step 1: Agregar el import del componente**

En `src/app/page.tsx`, junto a los imports de arriba (después de `import Navbar from "@/components/Navbar";`, línea 4), agregar:

```tsx
import ColorFromPhoto from "@/components/ColorFromPhoto";
```

- [ ] **Step 2: Agregar el estado `photoOpen`**

Justo después de la línea `const [pendingColorCode, setPendingColorCode] = useState<string | null>(null);` (page.tsx:2074), agregar:

```tsx
  const [photoOpen, setPhotoOpen] = useState(false);
```

- [ ] **Step 3: Agregar el memo `allVisibleColors`**

Justo después del `useMemo` `allFavoriteColors` (termina en page.tsx:3034), agregar:

```tsx
  // Todos los colores visibles del catálogo (base + custom − ocultos), con el HEX
  // efectivo (aplicando overrides). Para el buscador por foto del kiosko.
  const allVisibleColors = useMemo(() => {
    const builtIn = colorFamilies.flatMap((f) =>
      f.colors
        .filter((c) => !deletedColorCodes.includes(c.code))
        .map((c) => {
          const ov = nameOverrides[c.code];
          return {
            name: ov ? ov.name : c.name,
            code: ov ? ov.code : c.code,
            hex: overrides[c.code] ?? c.hex,
          };
        })
    );
    const custom = Object.values(customColors).flat().map((c) => ({
      name: c.name, code: c.code, hex: overrides[c.code] ?? c.hex,
    }));
    return [...custom, ...builtIn];
  }, [deletedColorCodes, nameOverrides, customColors, overrides]);
```

- [ ] **Step 4: Agregar el botón flotante + la ventana (solo kiosko)**

Justo después del render de `<Navbar ... />` (page.tsx:3046), agregar:

```tsx
      {kioskMode && (
        <>
          <button
            onClick={() => setPhotoOpen(true)}
            aria-label="Encuentra tu color con una foto"
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-black text-white px-5 py-3 shadow-lg active:scale-95 transition"
          >
            <span className="text-xl">📷</span>
            <span className="text-sm font-medium">Encuentra tu color</span>
          </button>
          <ColorFromPhoto
            open={photoOpen}
            colors={allVisibleColors}
            onClose={() => setPhotoOpen(false)}
            onPickColor={(code) => { setPhotoOpen(false); setPendingColorCode(code); }}
          />
        </>
      )}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(color): botón flotante 'Encuentra tu color' + integración en kiosko"
```

---

### Task 5: Verificación de build y lint

- [ ] **Step 1: Correr los tests puros**

Run: `node tests/colorMatch.test.mjs && node tests/imageColor.test.mjs`
Expected: ambos imprimen `TODO OK` (exit 0).

- [ ] **Step 2: Build de producción**

Run: `npm run build`
Expected: compila sin errores (advertencias preexistentes de tamaño de chunk son normales).

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: sin errores nuevos en los archivos creados/modificados.

- [ ] **Step 4: Commit (si hubo ajustes de build/lint)**

```bash
git add -A
git commit -m "chore(color): ajustes de build/lint del buscador por foto"
```

---

### Task 6: Verificación manual en el kiosko (no automatizable)

- [ ] **Step 1: Levantar en modo kiosko**

Run: `npm run dev` y abrir `http://localhost:3001/?kiosko=1`.
Expected: aparece el botón flotante 📷 "Encuentra tu color" abajo a la derecha. En `http://localhost:3001/?kiosko=0` (o sin el parámetro y sin flag guardado) NO aparece.

- [ ] **Step 2: Flujo completo**

Verificar manualmente:
1. Abrir la ventana, subir una foto → se muestra.
2. Tocar/arrastrar → aparece la lupa; al soltar salen 4 resultados con % y (si aplica) "Coincidencia exacta".
3. Activar "Corregir luz", tocar un blanco de la foto → los resultados se recalculan.
4. Tocar un resultado → se cierra la ventana y se abre la ficha de ese color (precio/durabilidad/agregar al pedido).
5. "Cambiar foto" reinicia; "×" cierra.

- [ ] **Step 3: Confirmar que no afecta al público**

Abrir la app sin kiosko: el botón no debe aparecer y nada del catálogo cambia.

---

## Notas de decisión
- **CIE76 en lugar de CIEDE2000:** el spec mencionaba CIEDE2000; se implementa CIE76 (euclidiana en CIELAB) por simplicidad y robustez. Ya entrega la mejora perceptual clave sobre RGB. Upgrade a CIEDE2000 = cambiar solo `deltaE` en `colorMatch.ts`, sin tocar el resto.
- **Sin subir la foto:** todo el procesamiento es local (canvas). No hay server actions, storage, ni permisos nuevos.
- **v2 (futuro):** habilitar la entrada también para el público (fuera de `kioskMode`) y, si se quiere, CIEDE2000.