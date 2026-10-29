# Pista animada "el dedito" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un 👆 animado sobre los círculos de familias que enseña a tocarlos; se va al primer toque y en kiosko vuelve tras 60 s sin interacción.

**Architecture:** La matemática del recorrido vive en `src/lib/pista.ts` (pura, probada en Node). `src/components/PistaCirculos.tsx` mide los círculos reales (`[data-circulo]`) y dibuja el dedo y dos anillos en posición absoluta usando variables CSS; las animaciones son keyframes en `globals.css`. `Catalogo.tsx` guarda `pistaActiva`, la apaga al tocar una familia y, en kiosko, la reactiva con un temporizador de inactividad.

**Tech Stack:** Next 16 (App Router), React 19, Tailwind v4 + CSS plano, pruebas con `node tests/*.test.mjs`, verificación con Playwright (MCP).

Spec: `docs/superpowers/specs/2026-10-29-dedito-circulos-design.md`

---

## Archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/lib/pista.ts` | Crear | Constantes y cálculo del recorrido (sin DOM) |
| `tests/pista.test.mjs` | Crear | Pruebas del cálculo |
| `src/app/globals.css` | Modificar (al final) | Keyframes del dedo y los anillos; reducir movimiento |
| `src/components/PistaCirculos.tsx` | Crear | Mide los círculos y dibuja dedo + anillos |
| `src/app/Catalogo.tsx` | Modificar | Estado `pistaActiva`, `data-circulo`, texto, temporizador del kiosko |

Notas del proyecto:
- `AGENTS.md`: esta versión de Next tiene cambios; ante dudas leer `node_modules/next/dist/docs/`.
- Los valores arbitrarios de z-index de Tailwind (`z-[NN]`) no compilan aquí; no se usan.
- El dev con Turbopack se corrompe: para probar se usa `npx next build` + `npx next start -p 3002`.
- `Catalogo.tsx` usa saltos de línea CRLF: editar con la herramienta Edit (no con sed).
- No incluir `src/components/Navbar.tsx` en los commits (tiene un cambio ajeno a medias).

---

### Task 1: Cálculo del recorrido (`src/lib/pista.ts`)

**Files:**
- Create: `src/lib/pista.ts`
- Test: `tests/pista.test.mjs`

- [ ] **Step 1: Escribir la prueba que falla**

`tests/pista.test.mjs`:

```js
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
```

- [ ] **Step 2: Correrla y ver que falla**

Run: `node tests/pista.test.mjs`
Expected: FAIL — `Cannot find module '.../src/lib/pista.ts'`.

- [ ] **Step 3: Implementar lo mínimo**

`src/lib/pista.ts`:

```ts
// Pista animada de los círculos de familias ("el dedito"): por dónde pasa el dedo y
// dónde van los anillos. Lógica pura (sin DOM) para poder probarla en Node.

/** En el kiosko, la pista vuelve tras este tiempo sin ninguna interacción. */
export const KIOSKO_INACTIVO_MS = 60_000;

/** Tamaño del 👆 (px) y cuánto baja su punta desde el borde superior del emoji. */
export const DEDO = { ancho: 28, punta: 4 };

export interface Caja { left: number; top: number; width: number; height: number }

/** Caja de un círculo relativa al contenedor, en píxeles enteros. */
export function relativa(cont: Caja, c: Caja): Caja {
  return {
    left: Math.round(c.left - cont.left),
    top: Math.round(c.top - cont.top),
    width: Math.round(c.width),
    height: Math.round(c.height),
  };
}

/**
 * Variables CSS del recorrido del dedo: sale abajo a la izquierda del primer círculo
 * y toca el centro del primero y del segundo. Con menos de dos círculos: null.
 */
export function variablesDelRecorrido(cont: Caja, objetivos: Caja[]): Record<string, string> | null {
  if (objetivos.length < 2) return null;
  const [a, b] = objetivos.map((c) => relativa(cont, c));
  const punta = (c: Caja) => ({ x: c.left + c.width / 2 - DEDO.ancho / 2, y: c.top + c.height / 2 - DEDO.punta });
  const p1 = punta(a);
  const p2 = punta(b);
  const p0 = { x: p1.x - 60, y: p1.y + 40 };
  const px = (n: number) => `${Math.round(n)}px`;
  return { "--x0": px(p0.x), "--y0": px(p0.y), "--x1": px(p1.x), "--y1": px(p1.y), "--x2": px(p2.x), "--y2": px(p2.y) };
}
```

- [ ] **Step 4: Correr la prueba y ver que pasa**

Run: `node tests/pista.test.mjs`
Expected: todas con ✓ y al final `Todo bien.`

- [ ] **Step 5: Commit**

```bash
git add src/lib/pista.ts tests/pista.test.mjs
git commit -m "feat(pista): cálculo del recorrido del dedito sobre los círculos"
```

---

### Task 2: Animaciones en CSS (`src/app/globals.css`)

**Files:**
- Modify: `src/app/globals.css` (agregar al final del archivo)

- [ ] **Step 1: Agregar los estilos al final de `globals.css`**

```css
/* ── Pista "el dedito" en los círculos de familias (ver PistaCirculos.tsx) ──
   El dedo y los anillos van encima de los círculos sin estorbar los toques.
   Las posiciones llegan como variables CSS (--x0…--y2) medidas en el navegador.
   Sin .pista-on: invisible y con la animación en pausa (no gasta). */
.pista { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity 300ms ease; }
.pista.pista-on { opacity: 1; }
.pista-dedo {
  position: absolute; left: 0; top: 0; font-size: 28px; line-height: 1;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.25));
  animation: pista-dedo 6s ease-in-out infinite; animation-play-state: paused;
}
.pista-anillo {
  position: absolute; border-radius: 9999px; box-shadow: 0 0 0 3px rgba(0, 113, 227, 0);
  animation-duration: 6s; animation-timing-function: ease-in-out; animation-iteration-count: infinite;
  animation-play-state: paused;
}
.pista-anillo-1 { animation-name: pista-anillo-1; }
.pista-anillo-2 { animation-name: pista-anillo-2; }
.pista-on .pista-dedo,
.pista-on .pista-anillo { animation-play-state: running; }

@keyframes pista-dedo {
  0%       { transform: translate(var(--x0), var(--y0)) scale(1); opacity: 0; }
  8%       { opacity: 1; }
  22%      { transform: translate(var(--x1), var(--y1)) scale(1); }
  27%      { transform: translate(var(--x1), var(--y1)) scale(0.85); }
  32%      { transform: translate(var(--x1), var(--y1)) scale(1); }
  52%      { transform: translate(var(--x2), var(--y2)) scale(1); }
  57%      { transform: translate(var(--x2), var(--y2)) scale(0.85); }
  62%      { transform: translate(var(--x2), var(--y2)) scale(1); opacity: 1; }
  80%, 100% { transform: translate(var(--x2), var(--y2)) scale(1); opacity: 0; }
}
@keyframes pista-anillo-1 {
  0%, 24%, 34%, 100% { box-shadow: 0 0 0 3px rgba(0, 113, 227, 0); transform: scale(1); }
  28% { box-shadow: 0 0 0 3px rgba(0, 113, 227, 1), 0 0 14px rgba(0, 113, 227, 0.55); transform: scale(1.12); }
}
@keyframes pista-anillo-2 {
  0%, 54%, 64%, 100% { box-shadow: 0 0 0 3px rgba(0, 113, 227, 0); transform: scale(1); }
  58% { box-shadow: 0 0 0 3px rgba(0, 113, 227, 1), 0 0 14px rgba(0, 113, 227, 0.55); transform: scale(1.12); }
}
@media (prefers-reduced-motion: reduce) {
  .pista { display: none; }
}
```

- [ ] **Step 2: Confirmar que compila**

Run: `npx next build 2>&1 | grep -E "Compiled|rror"`
Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(pista): animaciones del dedito y los anillos"
```

---

### Task 3: Componente `PistaCirculos`

**Files:**
- Create: `src/components/PistaCirculos.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
"use client";

import React, { useEffect, useState } from "react";
import { relativa, variablesDelRecorrido, type Caja } from "@/lib/pista";

// Pista animada sobre los círculos de familias: un 👆 que "toca" el 2º y el 4º círculo
// (Naranjas y Verdes) y un anillo azul en cada toque. Solo visual: no recibe toques.
// Mide los círculos reales ([data-circulo] dentro del contenedor) y vuelve a medir
// cuando cambia el tamaño, porque en teléfono van en dos filas y en tablet/PC en una.
const OBJETIVOS = [1, 3];

function caja(n: Element): Caja {
  const r = n.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

export default function PistaCirculos({ contenedor, activa }: {
  contenedor: React.RefObject<HTMLDivElement | null>;
  activa: boolean;
}) {
  const [medidas, setMedidas] = useState<{ vars: Record<string, string>; anillos: Caja[] } | null>(null);

  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const medir = () => {
      const cont = caja(el);
      const circulos = [...el.querySelectorAll("[data-circulo]")];
      const objetivos = OBJETIVOS.map((i) => circulos[i]).filter(Boolean).map(caja);
      const vars = variablesDelRecorrido(cont, objetivos);
      setMedidas(vars ? { vars, anillos: objetivos.map((c) => relativa(cont, c)) } : null);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    window.addEventListener("load", medir);
    return () => { ro.disconnect(); window.removeEventListener("load", medir); };
  }, [contenedor]);

  // Se dibuja solo después de medir (en el navegador): el HTML del servidor no la trae,
  // así no hay diferencias al hidratar.
  if (!medidas) return null;
  return (
    <div aria-hidden className={`pista${activa ? " pista-on" : ""}`} style={medidas.vars as React.CSSProperties}>
      {medidas.anillos.map((c, i) => (
        <span key={i} className={`pista-anillo pista-anillo-${i + 1}`} style={{ left: c.left, top: c.top, width: c.width, height: c.height }} />
      ))}
      <span className="pista-dedo">👆</span>
    </div>
  );
}
```

- [ ] **Step 2: Revisar tipos**

Run: `npx tsc --noEmit -p .`
Expected: sin salida (0 errores).

- [ ] **Step 3: Commit**

```bash
git add src/components/PistaCirculos.tsx
git commit -m "feat(pista): componente que mide los círculos y dibuja el dedito"
```

---

### Task 4: Conectar en `Catalogo.tsx`

**Files:**
- Modify: `src/app/Catalogo.tsx` (importaciones; estado junto a `designPreview` ~línea 2090; selector de familias ~líneas 3903–3926)

- [ ] **Step 1: Importaciones** — debajo de `import ColorFromPhoto from "@/components/ColorFromPhoto";` agregar:

```tsx
import PistaCirculos from "@/components/PistaCirculos";
import { KIOSKO_INACTIVO_MS } from "@/lib/pista";
```

- [ ] **Step 2: Estado y temporizador** — justo después de la línea `const designPreview = true;` agregar:

```tsx
  // Pista "el dedito" sobre los círculos de familias: se ve hasta el primer toque de una
  // familia; en el kiosko vuelve tras 60 s sin interacción, para el siguiente cliente.
  const circulosRef = useRef<HTMLDivElement | null>(null);
  const [pistaActiva, setPistaActiva] = useState(true);
  useEffect(() => {
    if (!kioskMode) return;
    let t: ReturnType<typeof setTimeout>;
    const reiniciar = () => { clearTimeout(t); t = setTimeout(() => setPistaActiva(true), KIOSKO_INACTIVO_MS); };
    reiniciar();
    window.addEventListener("pointerdown", reiniciar);
    window.addEventListener("keydown", reiniciar);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointerdown", reiniciar);
      window.removeEventListener("keydown", reiniciar);
    };
  }, [kioskMode]);
```

- [ ] **Step 3: Selector de familias** — reemplazar el bloque de círculos (dentro de `{designPreview ? (`):

Antes:

```tsx
              <div className="flex flex-wrap justify-center gap-3 sm:gap-5 mb-6 px-4 py-2">
                {familyDisplayNames.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedFamily(i); setSelectedColor(null); setSearch(""); }}
                    title={name}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer shrink-0"
                  >
                    <span
                      className={`w-12 h-12 sm:w-20 sm:h-20 rounded-full transition-all duration-200 ${
```

Después:

```tsx
              <>
              <div ref={circulosRef} className="relative flex flex-wrap justify-center gap-3 sm:gap-5 mb-6 px-4 py-2">
                {familyDisplayNames.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedFamily(i); setSelectedColor(null); setSearch(""); setPistaActiva(false); }}
                    title={name}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer shrink-0"
                  >
                    <span
                      data-circulo
                      className={`w-12 h-12 sm:w-20 sm:h-20 rounded-full transition-all duration-200 ${
```

y el cierre del bloque, antes:

```tsx
                    <span className={`text-xs leading-none ${selectedFamily === i ? "font-semibold text-gray-900" : "font-medium text-transparent select-none"}`}>{name}</span>
                  </button>
                ))}
              </div>
            ) : (
```

después:

```tsx
                    <span className={`text-xs leading-none ${selectedFamily === i ? "font-semibold text-gray-900" : "font-medium text-transparent select-none"}`}>{name}</span>
                  </button>
                ))}
                <PistaCirculos contenedor={circulosRef} activa={pistaActiva} />
              </div>
              {/* Texto de la pista: conserva su lugar y solo se desvanece (la página no brinca) */}
              <p
                aria-hidden={!pistaActiva}
                className={`-mt-4 mb-4 text-center text-xs font-semibold text-[#0071e3] transition-opacity duration-300 ${pistaActiva ? "opacity-100" : "opacity-0"}`}
              >
                Toca un color para ver sus tonos
              </p>
              </>
            ) : (
```

- [ ] **Step 4: Tipos, lint y build**

Run: `npx tsc --noEmit -p . && npx eslint src/app/Catalogo.tsx src/components/PistaCirculos.tsx src/lib/pista.ts 2>&1 | grep -E " error |✖"; npx next build 2>&1 | grep -E "Compiled|rror"`
Expected: tsc sin salida; eslint `0 errors`; `✓ Compiled successfully`.

- [ ] **Step 5: Commit**

```bash
git add src/app/Catalogo.tsx
git commit -m "feat(pista): el dedito en los círculos; se va al primer toque y vuelve en kiosko"
```

---

### Task 5: Verificación en el navegador (con fotos)

**Files:** ninguno (solo verificación). Servir el build: `npx next start -p 3002` en segundo plano.

- [ ] **Step 1: Teléfono (390×844) en `http://localhost:3002/?kiosko=0`**
  - Foto: el 👆 pasa por Naranjas y Verdes (Verdes en la 1ª fila o la 2ª, según acomode) y el texto azul se ve debajo.
  - `getComputedStyle(document.querySelector('.pista')).opacity` → `"1"`.
  - Tocar el círculo "Azules" → a los 400 ms `.pista` tiene opacity `"0"`, el texto `opacity-0`, y la familia cambió a Azules.
- [ ] **Step 2: PC (1366×860)** — foto: el dedo toca el centro de Naranjas y de Verdes en la misma fila.
- [ ] **Step 3: Kiosko (1180×820) en `?kiosko=1`** con reloj simulado: `await page.clock.install()` antes de cargar; tocar una familia (se va); `await page.clock.fastForward(61000)` → `.pista` vuelve a opacity `"1"`. Si `page.clock` no está disponible, esperar 61 s reales.
- [ ] **Step 4: Reducir movimiento** — `await page.emulateMedia({ reducedMotion: 'reduce' })` → `getComputedStyle(.pista).display === "none"` y el texto sigue visible.
- [ ] **Step 5: Sin brinco** — medir CLS en carga (PerformanceObserver `layout-shift`) → `< 0.01`; y que los círculos se pueden tocar a través del dedo (`elementFromPoint` sobre el centro de Naranjas devuelve el círculo, no el dedo).
- [ ] **Step 6: Cerrar el servidor local** y cualquier `node … next` que quede vivo en el puerto 3002.

---

### Task 6: Subir y comprobar en producción

- [ ] **Step 1: Push** — `git push origin main` (sin `Navbar.tsx`).
- [ ] **Step 2: Esperar el despliegue** — consultar `https://pinturas-bfm.vercel.app/api/version` hasta que traiga el commit nuevo.
- [ ] **Step 3: Foto en producción** (teléfono) con el dedo visible, y que la página sigue con estilos (`nav` con `position: sticky`) y `data-listo="1"`.
