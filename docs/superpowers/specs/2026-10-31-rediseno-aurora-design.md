# Diseño — Rediseño "Aurora" de la página pública (y kiosko)

Fecha: 2026-10-31 · Aprobado por José en la conversación (muestras: estilo B "Aurora",
aurora que cambia con la familia, entrada B "Gotas de pintura", toda la página).
Se construye en la rama `rediseno-aurora` y **se ve en local antes de subir**; se sube
solo cuando José diga "súbelo".

## 1. Propósito

Que la página se vea más moderna, innovadora y premium, con animaciones de color que
se sientan profesionales, sin cambiar información ni funciones.

## 2. Qué cambia

### 2.1 Aurora (arriba)
- Tarjeta redondeada (radio ~26 px), fondo oscuro `#15152b`, con **4 manchas de color**
  (degradados radiales suaves, sin `filter: blur`) que se mueven despacio (14–20 s).
- Las manchas toman **4 tonos de la familia elegida** y cambian con transición de 1.2 s al
  tocar otra familia.
- Dentro: título grande blanco **"Elige tu color favorito"**, línea
  **"Más de 1,000 tonos Sayer · <familia>"** y el **buscador** (el mismo de hoy, movido
  adentro) sobre vidrio esmerilado.
- Sustituye al título actual, al letrero "Más de 1,000 colores…" y al buscador de abajo.

### 2.2 Círculos de familias
- Brillo de gota (reflejo blanco arriba a la izquierda) y sombra suave; el elegido un poco
  más grande con anillo oscuro y su nombre (como hoy).
- **Entrada "Gotas de pintura":** al abrir la página cada círculo cae como gota, se aplasta
  y salpica un anillo de su color; uno tras otro (≈90 ms entre cada uno; total ≈1.6 s).
- La pista del dedito aparece **después** de las gotas.

### 2.3 Precio, favoritos y aviso
- Tarjeta de calidad blanca, radio grande, sombra suave; precios grandes; "Oferta" con
  degradado naranja→rojo. Mismo comportamiento (tocar = filtrar por esa calidad).
- "Mis favoritos" como pastilla blanca. Aviso de colores aproximados igual (solo público).

### 2.4 Colores
- Encabezado de familia (como hoy) + **barra de 5 px con los tonos de la familia**.
- Tarjetas de color: siguen en **3 columnas** (la ficha se abre bajo su fila), pero más
  grandes por dentro: radio 16 px, sombra suave, nombre ~11 px en negritas, código ~9 px,
  número de página como etiqueta sobre el color.
- **Entran con un saltito** (de abajo hacia arriba con leve rebote) al cambiar de familia;
  escalonadas, con el retraso tope en la tarjeta 12 para no hacer esperar.

### 2.5 Lo demás
Ficha del color, calculadoras, carrito y ventanas conservan su estructura; el estilo
redondeado ya lo da `.design-apple`. La barra de arriba (`Navbar.tsx`) **no se toca**
(tiene un cambio a medias de José y ya trae los botones de WhatsApp y Cómo llegar).

### 2.6 Kiosko
Mismo diseño. A los 60 s sin uso, además de volver el dedito, **las gotas vuelven a caer**.

## 3. Reglas

- **Sin funciones nuevas ni datos nuevos**: solo presentación.
- **Reducir movimiento** (`prefers-reduced-motion: reduce`): aurora quieta, círculos sin
  caer (aparecen directo), tarjetas sin saltito, dedito quieto (ya existe).
- **La aurora se pausa** cuando no está en pantalla (IntersectionObserver → animaciones
  en pausa).
- **Sin dependencias nuevas.** CSS + componentes de React.
- **Sin brincos al cargar** (CLS ≈ 0): la aurora y los círculos ocupan su lugar desde el
  HTML del servidor; las animaciones usan solo `transform`/`opacity`.
- **El dedito mide sin transformaciones**: como los círculos caen al entrar, la pista mide
  con `offsetLeft/offsetTop` (posición real) y no con `getBoundingClientRect`.

## 4. Piezas

- `src/lib/tonos.ts` (puro, con pruebas): de un color de familia saca 4 tonos para la
  aurora y la barra (claro, base, oscuro, vecino de matiz). Rojos/Rosas incluye su rosa.
- `src/components/HeroAurora.tsx`: la tarjeta de la aurora (manchas, título, subtítulo,
  y el buscador como `children`); pausa fuera de pantalla.
- `src/components/PistaCirculos.tsx`: medir con offsets; aparecer tras las gotas.
- `src/app/globals.css`: aurora, gotas, saltito de tarjetas, reducir movimiento.
- `src/app/Catalogo.tsx`: usar HeroAurora, clases de entrada, `key` para repetir las gotas
  en kiosko, barra de tonos, tarjeta de precio y `ColorSwatch` restilizados.

## 5. Pruebas

- `tests/tonos.test.mjs`: tonos válidos (#rrggbb), claro más claro, oscuro más oscuro,
  Rojos/Rosas con su rosa.
- Navegador (build de producción en local), **con fotos**: teléfono, PC y kiosko; cambiar de
  familia cambia la aurora y las tarjetas saltan; gotas al entrar y al volver en kiosko;
  reducir movimiento; CLS ≈ 0; sin errores en consola; buscador, favoritos, filtro de
  calidad, ficha y carrito funcionan igual.
- Al terminar, **dejar corriendo** `http://localhost:3002` para que José lo vea.
