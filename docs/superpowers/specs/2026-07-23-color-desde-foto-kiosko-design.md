# Diseño — "Encuentra tu color con una foto" (kiosko)

Fecha: 2026-07-23
Proyecto: pinturas-bfm (Next.js 16, App Router, TypeScript, Tailwind v4, Supabase)

## 1. Propósito

Permitir que, en la **tablet de la tienda (modo kiosko)**, un cliente suba una foto
de algo cuyo color le gustó, toque un punto de la imagen, y la app le muestre los
**tonos más cercanos de nuestro catálogo** para que elija y continúe al pedido.

Es una herramienta de **orientación / descubrimiento**, no un medidor exacto de color.
Una foto no es colorimétricamente precisa (balance de blancos de la cámara,
iluminación de la escena, pantalla, compresión JPEG). El diseño asume y comunica
esa limitación en lugar de ocultarla.

## 2. Alcance

### Dentro (v1)
- Disponible **solo cuando `kioskMode === true`** (tablet configurada con `?kiosko=1`).
- Subir imagen desde galería o cámara del dispositivo.
- Selección de punto con lupa de precisión.
- Match contra los colores **visibles** del catálogo (base + custom − ocultos, con
  overrides de HEX aplicados).
- Mostrar **4** tonos más cercanos con % de coincidencia y badge de "coincidencia
  exacta" cuando aplique.
- **Corrección de luz opcional**: tocar un blanco/gris de la foto para neutralizar
  el balance de blancos.
- Al elegir un resultado, abrir la **ficha de color existente** (precio, durabilidad,
  agregar al pedido) reutilizando el flujo actual.
- Textos honestos: "tonos aproximados — confirma con una muestra física".

### Fuera (v1) — posible v2
- Entrada pública (web, fuera del kiosko).
- Guardar/analizar las fotos o los matches.
- Cualquier subida a servidor o almacenamiento. **Todo ocurre en el navegador.**

## 3. Flujo de usuario

1. En el kiosko, botón flotante **📷 "Encuentra tu color"** (esquina inferior,
   separado del carrito). Solo visible en `kioskMode`.
2. Se abre una ventana (overlay) con un botón para **subir foto** (galería o cámara).
3. La foto se muestra ajustada a la pantalla en un `<canvas>`.
4. El cliente **toca un punto**. Mientras mantiene el dedo, aparece una **lupa**
   (círculo con zoom + cruz) desplazada del dedo para poder apuntar fino. Al soltar,
   se muestrea una **zona** alrededor del punto (promedio, no un pixel).
5. Debajo aparecen los **4 tonos más cercanos** del catálogo: muestra de color,
   nombre, código y **% de coincidencia**. Si el más cercano está por debajo del
   umbral de diferencia, se marca **"Coincidencia exacta"**.
6. Opcional: banner *"¿La foto se ve con luz rara? Toca algo blanco para corregir"*.
   Al activarlo, el siguiente toque define el **neutral** y se re-corrige el color
   muestreado antes de volver a hacer match.
7. El cliente puede **volver a tocar** otro punto cuando quiera (resultados en vivo).
8. Al **tocar un resultado**, se cierra la ventana y se abre la **ficha del color**
   por su código (mismo mecanismo que el deep-link `?color=CÓDIGO`).
9. Texto fijo y visible: *"Tonos aproximados. Para el color final, confirma con una
   muestra física bajo la luz del lugar."* + tips de foto (luz de día, sin flash).

## 4. Arquitectura y unidades

`page.tsx` ya es un archivo muy grande (~291 KB). **No** se agrega la lógica ahí.
Se crean unidades aisladas y testeables; `page.tsx` solo monta el botón y la ventana.

### 4.1 `src/lib/colorMatch.ts` — matemática pura (con pruebas)
Sin dependencias de navegador. Responsable de convertir colores y encontrar cercanos.

```ts
export type Rgb = { r: number; g: number; b: number };
export type Lab = { L: number; a: number; b: number };
export type CatalogColor = { name: string; hex: string; code: string };
export type Candidate = { color: CatalogColor; deltaE: number; match: number; exact: boolean };

export function hexToRgb(hex: string): Rgb;
export function rgbToLab(rgb: Rgb): Lab;               // sRGB → XYZ → CIELAB (D65)
export function deltaE(a: Lab, b: Lab): number;        // CIEDE2000
export function matchPercent(deltaE: number): number;  // mapea ΔE → 0-100 amigable
export function nearestColors(sample: Rgb, catalog: CatalogColor[], n: number): Candidate[];
// Corrección de balance de blancos estilo von Kries: escala cada canal para que
// `neutral` (lo que debería ser gris/blanco) mapee al blanco de referencia.
export function applyWhiteBalance(sample: Rgb, neutral: Rgb): Rgb;
```

Umbrales (constantes exportadas, ajustables):
- `EXACT_DELTA_E = 2.3` (≈ diferencia apenas perceptible) → badge "coincidencia exacta".
- `matchPercent`: ΔE 0 → 100 %; decrece de forma suave (p. ej. `100 - min(100, ΔE * k)`),
  con `k` calibrado para que ~ΔE 10 ≈ 80 %.

### 4.2 `src/lib/imageColor.ts` — muestreo de imagen
Utilidades sobre pixeles. `averageRegion` es pura (recibe `ImageData`) y se testea
con un `ImageData` sintético; la carga de imagen sí toca APIs de navegador.

```ts
export function averageRegion(img: ImageData, x: number, y: number, radius: number): Rgb;
// Carga un File a un canvas respetando orientación EXIF y reduciendo si excede
// un máximo (p. ej. 2000 px por lado) para rendimiento.
export async function loadImageToCanvas(file: File, maxDim: number): Promise<HTMLCanvasElement>;
```

`averageRegion` promedia los pixeles dentro del radio; descarta transparentes.

### 4.3 `src/components/ColorFromPhoto.tsx` — la ventana (cliente)
Componente aislado. No conoce Supabase ni el estado global; recibe todo por props.

```ts
type Props = {
  open: boolean;
  colors: CatalogColor[];        // colores visibles ya resueltos por page.tsx
  onClose: () => void;
  onPickColor: (code: string) => void;
};
```

Maneja: input de archivo, canvas, toque + lupa, modo "corrección de luz", y la lista
de resultados. Al elegir un resultado llama `onPickColor(code)`.

### 4.4 Integración en `src/app/page.tsx`
- Renderizar el botón flotante y `<ColorFromPhoto/>` **solo si `kioskMode`**.
- Pasar como `colors` la **misma lista de colores visibles** que ya usa el catálogo
  para renderizar (base + custom − `deleted_colors`, con `color_settings.hex`
  aplicado). Reutilizar la lista ya computada; no recalcular.
- `onPickColor(code)` reutiliza el mecanismo existente que abre la ficha de un color
  por código (el mismo que atiende `?color=CÓDIGO` / `pendingColorCode`).

## 5. Manejo de errores y casos borde
- **Archivo no imagen / corrupto:** mensaje claro, no romper la ventana.
- **Orientación EXIF:** respetar al dibujar en canvas (`createImageBitmap` con
  `imageOrientation: "from-image"` o corrección manual).
- **Fotos grandes:** reducir a `maxDim` antes de muestrear.
- **Toque fuera de la imagen:** ignorar.
- **Catálogo vacío** (caso improbable): ocultar resultados con aviso.
- **Neutral inválido en corrección de luz** (muy oscuro): avisar "elige un punto más
  claro/blanco" y no aplicar corrección.
- **Rendimiento:** ~336 colores × ΔE por toque es trivial; sin problema en tablet.

## 6. Pruebas
Unitarias en Node para lo puro (patrón ya usado en el repo):
- `hexToRgb` / `rgbToLab` contra valores conocidos.
- `deltaE` de un color consigo mismo = 0.
- `nearestColors`: si el HEX muestreado ES un color del catálogo → ese color queda
  primero, `match` = 100, `exact` = true.
- `nearestColors` ordena por ΔE ascendente y respeta `n`.
- `applyWhiteBalance`: un `neutral` gris/blanco mapea al blanco de referencia; aplicar
  la misma corrección a un pixel desplaza su tono de forma consistente.
- `averageRegion`: sobre un `ImageData` sintético devuelve el promedio esperado e
  ignora los transparentes.

Verificación manual en la tablet/kiosko (no automatizable aquí): subir foto, tocar,
ver resultados, corrección de luz, y que al elegir se abra la ficha y se pueda agregar
al pedido.

## 7. Textos (copy) — honestidad ante todo
- Encabezado: "Encuentra tu color con una foto".
- Bajo resultados: "Tonos aproximados. Para el color final, confirma con una muestra
  física bajo la luz del lugar."
- Corrección de luz: "¿La foto se ve con luz rara? Toca algo blanco para corregir."
- Tips: "Toma la foto con luz de día, sin flash y evitando sombras."

## 8. Notas de seguridad/privacidad
- La imagen **nunca sale del dispositivo**: se procesa en el navegador (object URL +
  canvas). No hay upload, storage ni server actions nuevas.
- No se agregan permisos ni tablas. No toca RLS ni auth.