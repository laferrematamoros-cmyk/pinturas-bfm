# Rediseño "Aurora" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página pública (y kiosko) con aurora de color que sigue a la familia, círculos que entran como gotas de pintura, tarjetas con saltito y estilo premium, sin cambiar funciones.

**Architecture:** Lógica pura de tonos en `src/lib/tonos.ts`. `HeroAurora.tsx` dibuja la aurora (manchas con `@property --c` para que el color cambie suave) y recibe el buscador como hijo. Las animaciones (aurora, gotas, saltito) son CSS en `globals.css`, con clases semánticas fuera de capas para ganarle a Tailwind y a `.design-apple`. `Catalogo.tsx` solo cambia marcado y clases; la pista del dedito mide con offsets y aparece tras las gotas.

**Tech Stack:** Next 16, React 19, Tailwind v4 + CSS plano, `node tests/*.test.mjs`, verificación con Playwright y build de producción local (`next start -p 3002`).

Spec: `docs/superpowers/specs/2026-10-31-rediseno-aurora-design.md` · Rama: `rediseno-aurora` (NO subir a `main` hasta que José diga "súbelo").

Notas: `Catalogo.tsx` usa CRLF (editar con Edit). No tocar `Navbar.tsx`. Reglas que pelean: `.design-apple main h1` (0,1,2), `.design-apple input[type="text"]` (0,2,1), `.design-apple .group.bg-white` (0,3,0) → los selectores nuevos deben tener más especificidad.

---

### Task 1: Tonos de familia (`src/lib/tonos.ts`)

**Files:** Create `src/lib/tonos.ts`; Test `tests/tonos.test.mjs`

- [ ] **Step 1: Prueba que falla** — `tests/tonos.test.mjs`:

```js
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
```

- [ ] **Step 2:** `node tests/tonos.test.mjs` → FAIL (módulo no existe).
- [ ] **Step 3: Implementar** — `src/lib/tonos.ts`:

```ts
// Tonos de una familia para la aurora y la barra de color: base, claro, oscuro y un
// vecino de matiz. Lógica pura (sin DOM) para probarla en Node.

function hexARgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim().toLowerCase();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbAHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return [h, s, l];
}

function hslAHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return "#" + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
}

const limita = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Luminosidad HSL (0–1) de un color #rrggbb. */
export function luminosidad(hex: string): number {
  return rgbAHsl(...hexARgb(hex))[2];
}

/**
 * Cuatro tonos para la aurora: [base, claro, oscuro, vecino]. Con `extra` (p. ej. el rosa de
 * Rojos/Rosas) el vecino es ese color; en grises el vecino es un poco más claro.
 */
export function tonosDeFamilia(base: string, extra?: string): [string, string, string, string] {
  const [h, s, l] = rgbAHsl(...hexARgb(base));
  const b = hslAHex(h, s, l);
  const claro = hslAHex(h, s, limita(l + 0.2, 0, 0.94));
  const oscuro = hslAHex(h, s, limita(l - 0.2, 0.06, 1));
  const vecino = extra
    ? hslAHex(...rgbAHsl(...hexARgb(extra)))
    : s < 0.08 ? hslAHex(h, s, limita(l + 0.1, 0, 0.94)) : hslAHex((h + 25) % 360, s, l);
  return [b, claro, oscuro, vecino];
}
```

- [ ] **Step 4:** `node tests/tonos.test.mjs` → `Todo bien.`
- [ ] **Step 5:** `git add src/lib/tonos.ts tests/tonos.test.mjs && git commit -m "feat(aurora): tonos de familia para la aurora"`

---

### Task 2: Estilos y animaciones (`src/app/globals.css`, al final)

- [ ] **Step 1: Agregar al final de `globals.css`:**

```css
/* ═══ Rediseño "Aurora" (ver docs/superpowers/specs/2026-10-31-rediseno-aurora-design.md) ═══
   Selectores con más especificidad que .design-apple a propósito. */
@property --c { syntax: "<color>"; inherits: false; initial-value: #888888; }

.aurora {
  position: relative; isolation: isolate; overflow: hidden;
  margin: 0 12px 6px; min-height: 250px; border-radius: 26px; background: #15152b;
  display: flex; flex-direction: column; justify-content: space-between; padding: 26px 20px 16px;
}
@media (min-width: 640px) {
  .aurora { margin: 0 max(24px, calc((100% - 1100px) / 2)) 10px; min-height: 300px; padding: 40px 40px 24px; border-radius: 32px; }
}
.aurora-mancha {
  position: absolute; z-index: -1; border-radius: 50%; aspect-ratio: 1; width: 70%;
  mix-blend-mode: screen; will-change: transform; transition: --c 1.2s ease;
  background: radial-gradient(circle, var(--c) 0%, color-mix(in srgb, var(--c) 80%, transparent) 30%, transparent 70%);
}
.aurora-m1 { top: -35%; left: -20%; animation: aurora-d1 16s ease-in-out infinite alternate; }
.aurora-m2 { bottom: -50%; right: -25%; animation: aurora-d2 18s ease-in-out infinite alternate; }
.aurora-m3 { top: -5%; right: -10%; width: 55%; animation: aurora-d3 14s ease-in-out infinite alternate; }
.aurora-m4 { bottom: -40%; left: -5%; width: 60%; animation: aurora-d1 20s ease-in-out infinite alternate-reverse; }
.aurora-pausa .aurora-mancha { animation-play-state: paused; }
@keyframes aurora-d1 { to { transform: translate(30%, 20%) scale(1.15); } }
@keyframes aurora-d2 { to { transform: translate(-25%, -15%) scale(0.9); } }
@keyframes aurora-d3 { to { transform: translate(-22%, 25%) scale(1.2); } }
.aurora .aurora-titulo {
  color: #fff; font-weight: 800; letter-spacing: -0.035em; line-height: 1.03; margin: 0 0 8px;
  font-size: clamp(30px, 6vw, 56px); text-shadow: 0 2px 14px rgba(0, 0, 0, 0.22); text-align: left;
}
.aurora .aurora-sub { color: rgba(255, 255, 255, 0.95); font-size: 13px; margin: 0; }
.aurora .aurora-sub b { font-weight: 800; }
.aurora .aurora-buscar { position: relative; margin-top: 22px; }
.aurora .aurora-buscar svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #fff; pointer-events: none; }
.aurora .aurora-buscar input.aurora-input {
  width: 100%; background: rgba(255, 255, 255, 0.2); color: #fff; font-size: 16px;
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.45); border-radius: 16px; padding: 12px 14px 12px 42px;
  box-shadow: none; outline: none;
}
.aurora .aurora-buscar input.aurora-input::placeholder { color: rgba(255, 255, 255, 0.85); }
.aurora .aurora-buscar input.aurora-input:focus { background: rgba(255, 255, 255, 0.28); border-color: rgba(255, 255, 255, 0.8); }

/* Círculos: brillo de gota + entrada "Gotas de pintura" */
.circulo-gota { position: relative; }
.circulo-gota::before {
  content: ""; position: absolute; left: 20%; top: 14%; width: 38%; height: 30%;
  border-radius: 50%; background: rgba(255, 255, 255, 0.5); filter: blur(1px); pointer-events: none;
}
.gota-entra { animation: gota-cae 0.9s cubic-bezier(0.5, 0, 0.5, 1) both; animation-delay: calc(0.25s + var(--i, 0) * 90ms); }
.gota-entra::after {
  content: ""; position: absolute; inset: -2px; border-radius: 50%; border: 2px solid var(--col, #888);
  opacity: 0; pointer-events: none; animation: gota-salpica 0.6s ease-out both;
  animation-delay: calc(0.8s + var(--i, 0) * 90ms);
}
@keyframes gota-cae {
  0% { opacity: 0; transform: translateY(-160px) scale(0.45, 0.8); border-radius: 50% 50% 50% 50% / 65% 65% 35% 35%; }
  55% { opacity: 1; transform: translateY(0) scale(0.7, 1.15); }
  68% { transform: translateY(3px) scale(1.35, 0.62); border-radius: 50%; }
  82% { transform: translateY(-3px) scale(0.92, 1.08); }
  100% { transform: none; }
}
@keyframes gota-salpica { 0% { opacity: 0.9; transform: scale(1); } 100% { opacity: 0; transform: scale(2.3); } }

/* Tarjeta de precio y "Oferta" */
.design-apple .tarjeta-precio.border {
  border-radius: 24px; border-color: rgba(0, 0, 0, 0.06); padding: 16px 18px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 10px 26px rgba(0, 0, 0, 0.07);
}
.design-apple .oferta-degradado.rounded-full { background: linear-gradient(90deg, #f97316, #ef4444); color: #fff; }

/* Barra de tonos de la familia */
.barra-tonos { height: 5px; border-radius: 99px; margin-top: 12px; max-width: 320px; }

/* Tarjetas de color más premium + saltito al cambiar de familia */
.design-apple .group.bg-white.tarjeta-color {
  border-radius: 16px; border-color: rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 20px rgba(0, 0, 0, 0.06);
}
@media (hover: hover) and (pointer: fine) {
  .design-apple .group.bg-white.tarjeta-color:hover { box-shadow: 0 14px 30px rgba(0, 0, 0, 0.12); }
}
.tarjeta-salta { animation: tarjeta-salta 0.55s cubic-bezier(0.3, 1.5, 0.5, 1) both; animation-delay: calc(var(--i, 0) * 45ms); }
@keyframes tarjeta-salta { 0% { opacity: 0; transform: translateY(26px) scale(0.94); } 70% { opacity: 1; transform: translateY(-5px) scale(1.02); } 100% { transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .aurora-mancha, .gota-entra, .gota-entra::after, .tarjeta-salta { animation: none; }
}
```

- [ ] **Step 2:** `npx next build 2>&1 | grep -E "Compiled|rror"` → `✓ Compiled successfully`; y `grep -c "aurora-mancha" .next/static/chunks/*.css` ≥ 1.
- [ ] **Step 3:** `git add src/app/globals.css && git commit -m "feat(aurora): estilos y animaciones (aurora, gotas, saltito)"`

---

### Task 3: `HeroAurora` y ajuste de `PistaCirculos`

**Files:** Create `src/components/HeroAurora.tsx`; Modify `src/components/PistaCirculos.tsx`, `src/lib/pista.ts`, `tests/pista.test.mjs`

- [ ] **Step 1:** `src/components/HeroAurora.tsx`:

```tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

// Aurora de arriba: 4 manchas que se mueven despacio y toman los tonos de la familia
// elegida (cambian suave gracias a @property --c). Se pausa cuando no está en pantalla.
export default function HeroAurora({ tonos, titulo, subtitulo, children }: {
  tonos: [string, string, string, string];
  titulo: React.ReactNode;
  subtitulo: React.ReactNode;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className={`aurora${visible ? "" : " aurora-pausa"}`}>
      {tonos.map((c, i) => (
        <span key={i} aria-hidden className={`aurora-mancha aurora-m${i + 1}`} style={{ "--c": c } as React.CSSProperties} />
      ))}
      <div>
        <h1 className="aurora-titulo">{titulo}</h1>
        <p className="aurora-sub">{subtitulo}</p>
      </div>
      {children && <div className="aurora-buscar">{children}</div>}
    </section>
  );
}
```

- [ ] **Step 2:** En `src/lib/pista.ts`, debajo de `KIOSKO_INACTIVO_MS`:

```ts
/** Lo que tardan las gotas de pintura en caer al entrar; la pista aparece después. */
export const ENTRADA_GOTAS_MS = 1700;
```

y en `tests/pista.test.mjs` importar `ENTRADA_GOTAS_MS` y agregar
`ok(ENTRADA_GOTAS_MS === 1700, "la pista espera a que caigan las gotas");` bajo "constantes:".

- [ ] **Step 3:** En `src/components/PistaCirculos.tsx` medir sin transformaciones (los círculos caen al entrar). Reemplazar la función `caja` y el cálculo dentro de `medir`:

```tsx
// Posición real (sin transformaciones): offsetLeft/Top relativos al contenedor
// (position: relative). Con getBoundingClientRect, las gotas que caen darían otra posición.
function caja(n: HTMLElement): Caja {
  return { left: n.offsetLeft, top: n.offsetTop, width: n.offsetWidth, height: n.offsetHeight };
}
```

```tsx
    const medir = () => {
      const cont: Caja = { left: 0, top: 0, width: el.offsetWidth, height: el.offsetHeight };
      const circulos = [...el.querySelectorAll<HTMLElement>("[data-circulo]")];
      const objetivos = OBJETIVOS.map((i) => circulos[i]).filter(Boolean).map(caja);
      const vars = variablesDelRecorrido(cont, objetivos);
      setMedidas(vars ? { vars, anillos: objetivos.map((c) => relativa(cont, c)) } : null);
    };
```

- [ ] **Step 4:** `node tests/pista.test.mjs && npx tsc --noEmit -p .` → todo bien.
- [ ] **Step 5:** `git add src/components/HeroAurora.tsx src/components/PistaCirculos.tsx src/lib/pista.ts tests/pista.test.mjs && git commit -m "feat(aurora): componente de la aurora; la pista mide sin transformaciones"`

---

### Task 4: Conectar en `Catalogo.tsx`

- [ ] **Step 1: Importaciones** (junto a `PistaCirculos`):

```tsx
import HeroAurora from "@/components/HeroAurora";
import { tonosDeFamilia } from "@/lib/tonos";
```
y cambiar `import { KIOSKO_INACTIVO_MS } from "@/lib/pista";` por
`import { KIOSKO_INACTIVO_MS, ENTRADA_GOTAS_MS } from "@/lib/pista";`.

- [ ] **Step 2: Estado de la entrada** — reemplazar el bloque del temporizador de la pista por:

```tsx
  // Entrada "Gotas de pintura": se repite cambiando la key de los círculos (kiosko).
  // La pista aparece cuando terminan de caer.
  const [entradaKey, setEntradaKey] = useState(0);
  const [entradaLista, setEntradaLista] = useState(false);
  useEffect(() => {
    setEntradaLista(false);
    const t = setTimeout(() => setEntradaLista(true), ENTRADA_GOTAS_MS);
    return () => clearTimeout(t);
  }, [entradaKey]);
  useEffect(() => {
    if (!kioskMode) return;
    let t: ReturnType<typeof setTimeout>;
    const reiniciar = () => {
      clearTimeout(t);
      t = setTimeout(() => { setPistaActiva(true); setEntradaKey((k) => k + 1); }, KIOSKO_INACTIVO_MS);
    };
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

- [ ] **Step 3: Tonos de la familia** — debajo de `const qualityCards = …`:

```tsx
  // Tonos de la familia elegida para la aurora y la barra de color.
  const tonosFamilia = useMemo(() => tonosDeFamilia(
    familyColors[selectedFamily] ?? DEFAULT_FAMILY_COLORS[selectedFamily] ?? "#888888",
    familyDisplayNames[selectedFamily] === "Rojos/Rosas" ? "#e87ca0" : undefined,
  ), [familyColors, familyDisplayNames, selectedFamily]);
```

- [ ] **Step 4: Aurora en lugar del título** — reemplazar:

```tsx
            {/* Title */}
            <h1 className="text-center text-2xl sm:text-3xl font-light text-gray-800 mb-4 px-4">
              Elige tu color favorito
            </h1>
```
por:
```tsx
            {/* Aurora: título, familia y buscador sobre manchas de color de la familia elegida */}
            <HeroAurora
              tonos={tonosFamilia}
              titulo={<>Elige tu <span className="whitespace-nowrap">color favorito</span></>}
              subtitulo={<>{colorCountLabel(allVisibleColors.length)} tonos Sayer · <b>{familyDisplayNames[selectedFamily] ?? currentFamily.name}</b></>}
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar color por nombre o código"
                aria-label="Buscar color"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="aurora-input"
              />
            </HeroAurora>
```

- [ ] **Step 5: Círculos** — en el contenedor de los círculos:
`<div ref={circulosRef} className="relative flex …">` → `<div key={entradaKey} ref={circulosRef} className="relative flex flex-wrap justify-center gap-3 sm:gap-5 mb-6 px-4 pt-5 pb-2">`;
en el `<span data-circulo …>` agregar a `className` las clases `circulo-gota gota-entra` y al `style` las variables:
`style={{ ["--i" as string]: i, ["--col" as string]: familyColors[i] ?? DEFAULT_FAMILY_COLORS[i] ?? "#888888", background: … }}` (conservando el `background` actual);
`<PistaCirculos contenedor={circulosRef} activa={pistaActiva} />` → `activa={pistaActiva && entradaLista}`;
en el `<p>` del texto de la pista usar `pistaActiva && entradaLista` en `aria-hidden` y en la clase de opacidad.

- [ ] **Step 6: Quitar** el bloque `{/* Badge "Más de X colores" … */}` completo y el bloque `{/* Search */}` completo (ahora viven en la aurora).

- [ ] **Step 7: Tarjeta de precio** — en el `<button key={opt.years} …>` de `qualityCards.map`, agregar `tarjeta-precio` a su `className`; en los dos `<span … 🔥 Oferta</span>` agregar `oferta-degradado` a su `className`.

- [ ] **Step 8: Barra de tonos** — en el encabezado de familia (`designPreview ?`), después del `<p>` con `colores disponibles`:

```tsx
                    <div aria-hidden className="barra-tonos" style={{ background: `linear-gradient(90deg, ${tonosFamilia.join(", ")})` }} />
```

- [ ] **Step 9: `ColorSwatch`** — firma: agregar `indice?: number` a las props. Raíz `<div onClick=…>`: agregar `tarjeta-color tarjeta-salta` a la clase y `style={{ ["--i" as string]: Math.min(indice ?? 0, 12) }}`. Texto:

```tsx
      <div className="bg-white px-2.5 py-2 group-hover:bg-gray-50 transition-colors duration-150" style={{ minHeight: "44px" }}>
        <p className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight line-clamp-2">
          {color.name}
        </p>
        <p className="text-[9px] sm:text-[10px] text-gray-400 leading-tight mt-0.5">{color.code}</p>
      </div>
```
y el número de página como etiqueta sobre el color (dentro del `<div style={{ backgroundColor: color.hex … }}>`, antes de `{reorderMode && (`):

```tsx
        {color.pageNumber != null && (
          <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold text-gray-800 bg-white/85 rounded-full px-1.5 py-0.5 leading-none">{color.pageNumber}</span>
        )}
```
En la cuadrícula de familias, `rowColors.map((color) => {` → `rowColors.map((color, ci) => {` y pasar `indice={rowIndex * 3 + ci}` a `<ColorSwatch`.

- [ ] **Step 10:** `npx tsc --noEmit -p . && npx eslint src/app/Catalogo.tsx src/components/*.tsx src/lib/*.ts 2>&1 | grep -E " error |✖"; npx next build 2>&1 | grep -E "Compiled|rror"` → 0 errores, compila.
- [ ] **Step 11:** `git add src/app/Catalogo.tsx && git commit -m "feat(aurora): la página usa la aurora, las gotas y las tarjetas nuevas"`

---

### Task 5: Verificación en local (con fotos) y dejarlo corriendo

- [ ] `npx next start -p 3002` en segundo plano (se queda corriendo para José).
- [ ] Teléfono 390×844 `?kiosko=0`: foto arriba (aurora + círculos) a los ~0.6 s (gotas cayendo) y a los ~2.5 s (dedito); tocar Azules → aurora azul (leer `--c` de una mancha) y tarjetas animando; buscar "azul" funciona; ficha de un color abre; sin errores de consola; CLS < 0.02.
- [ ] PC 1366×860: foto de la parte de arriba y de la cuadrícula.
- [ ] Kiosko 1180×820 `?kiosko=1`: carrito y calculadoras visibles; con `page.clock`, a los 61 s sin tocar las gotas se repiten (cambia la key: los círculos vuelven a tener la animación) y vuelve el dedito.
- [ ] Reducir movimiento: `getAnimations()` vacío en manchas y círculos; la página se ve completa.
- [ ] El dedito toca el centro de Naranjas/Verdes (posición del dedo vs círculo) tras la entrada.
- [ ] Si el navegador de Playwright del MCP está ocupado por otra sesión, decirlo y pedir a José que revise él en `http://localhost:3002`.
