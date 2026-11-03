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

### 2.4b Cuadrícula "color protagonista" + tira de tonos (agregado 2026-10-31, opción C)
Reemplaza las tarjetas de 2.4 (en pantalla ancha quedaban 3 tarjetas enormes por fila).
- **Tarjeta:** toda la tarjeta es el color (4:5); nombre y código encima, abajo a la
  izquierda. La letra es negra o blanca según el **contraste WCAG** más alto contra el color.
  Brillo fijo de pintura arriba a la izquierda. Con mouse: se inclina en 3D siguiendo el
  puntero y le cruza un destello; en teléfono se hunde un poco al tocar. Página arriba a la
  derecha (se recorre si hay botón de borrar o casilla); corazón arriba a la izquierda.
  Elegida: anillo azul + palomita. Aplica en familia, búsqueda/favoritos y "Mover colores".
- **Ajuste "Altura de las tarjetas de color"** deja de aplicar (la forma la da la tarjeta) y
  se esconde en Ajustes; el valor guardado no se borra.
- **Columnas:** una sola cuadrícula CSS: 3 (teléfono), 4 (≥640 px), 6 (≥1024 px), con ancho
  máximo de 1152 px centrado (como la isla). La ficha se inserta como renglón completo
  (`grid-column: 1 / -1`) después del último color de la fila elegida; las columnas se leen
  de la cuadrícula (`grid-template-columns`) con un ResizeObserver. El HTML del servidor no
  depende de eso: sin brincos al cargar.
- **Tira de tonos** (solo vista de familia, con 12 colores o más, no en "Mover colores"):
  reemplaza la barra de 5 px. Todos los colores de la familia en el orden de la cuadrícula,
  pintados con un solo degradado de cortes duros. Se queda pegada bajo la isla al bajar;
  una ventanita marca qué colores están en pantalla. Tocar/arrastrar (o mover el mouse)
  muestra una burbuja con el color y su nombre; al soltar/clic la página salta a ese color
  y lo hace brillar 1.6 s (no abre la ficha). Si el color no se ha cargado (lotes de 60),
  primero amplía la carga. Teclado: flechas, Inicio/Fin, Enter. Arrastrar vertical sigue
  desplazando la página (`touch-action: pan-y`).
- **Reducir movimiento:** sin inclinación, destello, saltito ni pulso; el salto es directo.

### 2.4c Ficha del color "en tu pared + más claro / más oscuro" (agregado 2026-10-31, opción C)
- **Contenedor:** tarjeta redonda (24 px) con sombra, que entra deslizándose. En teléfono va
  apilada (pared arriba 4:3); desde 640 px son dos columnas 2fr/3fr (mín. 360 px).
- **Pared (izquierda):** la foto de la escena con la pared transparente sobre el color
  (`editHex`, cambia en 0.5 s). Botones Sala · Recámara · Cocina · Fachada (la escena elegida
  se recuerda entre colores). Etiqueta de vidrio abajo con cuadrito de color, nombre, código y
  página. Botón para ampliar que abre la vista grande existente en la misma escena. Si
  `roomPreviewEnabled` está apagado, la pared es el color liso con brillo (sin foto).
- **¿Más claro o más oscuro? (solo vista de familia):** hasta 3 tonos más claros, el actual
  (anillo azul) y hasta 3 más oscuros, elegidos por cercanía de color en Lab (con menos peso a
  la claridad) entre los colores visibles de la familia. Tocar uno cambia el color elegido
  **sin mover la ficha** (se queda anclada a la fila donde se abrió; no hace scroll).
- **Precios:** título = `rendimientoLabel` (Ajustes); por calidad, una tarjeta de galón y
  otra de cubeta (con "Oferta" si aplica) y "Rinde …". Botón Favorito; en kiosko "Agregar
  al carrito" como principal. Se quita el circulito de color repetido.
- **Admin:** el editor de la derecha no cambia; a la izquierda también va la pared.
- **Reducir movimiento:** sin el deslizamiento de entrada.
- **Una sola fila de tonos:** con seis vecinos en teléfono los círculos se encogen (mín. 24 px)
  en vez de bajar "Oscuro" a otra línea (agregado 2026-11-03).

### 2.4d Ventana grande "Estudio" (agregado 2026-11-03, opción B)
Reemplaza la vista grande vieja (encabezado azul marino, pestañas turquesa con emojis y la foto
cortada, sin el aviso de abajo).
- **Forma:** en teléfono sube desde abajo (esquinas de arriba redondas, máx. 94dvh): foto
  arriba (52dvh) y panel abajo, que se desliza si no cabe. Desde 640 px es una tarjeta de
  máx. 1080 × 720 px con la foto a la izquierda (58%) y el panel a la derecha (42%, mín. 300 px).
  Fondo oscuro desenfocado; se cierra con la ✕, tocando fuera o con Esc.
- **Foto:** la escena con la pared transparente sobre el color (cambia en 0.5 s); pastillas de
  Sala · Recámara · Cocina · Fachada encima. Llena su espacio (`cover`): la fachada, que es
  horizontal, pierde un poco de los lados.
- **Panel (teñido del color):** "Así se ve en tu casa", nombre, código · Página; la misma
  fila "¿Más claro o más oscuro?" de la ficha (solo vista de familia); "Velo en otro cuarto"
  con los cuatro cuartos en miniatura ya pintados (2 × 2 en PC, 4 en fila en teléfono); al
  pie, "Los colores son aproximados…". Sin precios ni botones de compra.
- **Comparte estado con la ficha:** el tono y el cuarto que se eligen aquí son los de la ficha
  (`elegirVecino`, `escena`); al cerrar, la ficha queda en lo último elegido y no se mueve.
- **Reducir movimiento:** sin la subida/entrada ni el fundido de la foto; sin transición de
  color.

### 2.5 Lo demás
Ficha del color, calculadoras, carrito y ventanas conservan su estructura; el estilo
redondeado ya lo da `.design-apple`. La barra de arriba (`Navbar.tsx`) **no se toca**
(tiene un cambio a medias de José y ya trae los botones de WhatsApp y Cómo llegar).

### 2.5b Barra de arriba: "isla flotante" (agregado 2026-10-31, opción C)
- Barra redonda de vidrio blanco, separada de las orillas, con sombra; **se queda arriba**
  al bajar (sticky). Logos más chicos (se conservan los 6 toques de BFM y de Sayer);
  "BFM PINTURAS" solo en computadora.
- Derecha: público → botones redondos WhatsApp y Cómo llegar (40 px); admin → Pedidos;
  kiosko → Ver carrito (+ Pedidos si está activado). Absorbe el cambio a medias de la barra
  compacta del kiosko que había en `Navbar.tsx`.
- Debajo (solo público, no sticky): pastillas con el **estado en vivo** ("Abierta ahora ·
  cierra 6:00 pm", "Abierta · cierra en 25 min", "Cerrada · abre mañana 9:00 am / el
  lunes"), el horario y el texto de anuncio (dirección). En teléfono se deslizan de lado.
- El estado se calcula en el navegador con la hora de Matamoros (`America/Matamoros`) y
  se actualiza cada minuto; su pastilla tiene ancho fijo desde el HTML (sin brincos). El
  punto verde late (no con "reducir movimiento"). El horario vive en `src/lib/horario.ts`.

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
