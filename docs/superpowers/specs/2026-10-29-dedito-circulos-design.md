# Diseño — Pista animada en los círculos de familias ("el dedito")

Fecha: 2026-10-29 · Aprobado por José en la conversación (opción B de las muestras).

## 1. Propósito

En "Elige tu color favorito" las familias son círculos de color sin nombre (solo el
elegido muestra el suyo). Hay clientes que no se dan cuenta de que deben tocarlos
para ver los tonos. Una animación corta les enseña qué hacer.

## 2. Qué se ve

- Un 👆 pasa por encima de los círculos y "toca" dos: **Naranjas** (2º) y **Verdes** (4º).
  Al tocar cada uno, ese círculo se agranda un poco y se ilumina con un anillo azul
  (`#0071e3`, el mismo del círculo elegido).
- Debajo de los círculos: **"Toca un color para ver sus tonos"** (texto azul, pequeño).
- El recorrido dura **6 s** y se repite mientras la pista esté activa.
- Es solo visual: el dedito no cambia la familia elegida.

## 3. Cuándo aparece

- **Teléfono y computadora:** cada vez que se abre la página; se quita al **primer toque
  de un círculo de familia**.
- **Kiosko:** igual, y además **vuelve** después de **60 s sin ninguna interacción**
  (ningún toque, clic ni tecla en la página), para el siguiente cliente.
- Al quitarse, el dedito y el texto se desvanecen (≈300 ms). El renglón del texto
  **conserva su lugar** (solo cambia la opacidad), así la página no brinca ni al
  quitarse ni cuando vuelve en el kiosko.
- Cuenta como "primer toque" tocar cualquier círculo de familia, incluido el que ya está
  elegido. Buscar o tocar un color de la cuadrícula no la quita.

## 4. Reglas

- **No estorba:** el dedito y los anillos tienen `pointer-events: none`; los círculos se
  tocan igual que hoy.
- **Mide los círculos reales:** las posiciones del recorrido se calculan con la posición
  de los círculos en pantalla (en teléfono van en dos filas; en tablet y PC en una) y se
  recalculan al cambiar el tamaño de la ventana.
- **Reducir movimiento:** con `prefers-reduced-motion: reduce` no hay animación; solo se
  ve el texto.
- **Sin dependencias nuevas:** CSS (keyframes con variables) + un componente de React.
- **Sin brinco al cargar:** el texto sale en el HTML del servidor (ocupa su lugar desde el
  primer cuadro); el dedito se agrega al montar, en posición absoluta.

## 5. Piezas

- `src/components/PistaCirculos.tsx` (cliente): recibe el contenedor de los círculos y si
  está activa; mide los círculos 2º y 4º, dibuja el 👆 y los anillos con las posiciones
  medidas y el texto. No sabe nada del catálogo.
- `src/lib/pista.ts` (lógica pura, con pruebas): decide si la pista se ve
  (`activa` = no se ha tocado una familia, o es kiosko y pasaron 60 s sin interacción)
  y calcula el recorrido a partir de las posiciones de los círculos.
- `Catalogo.tsx`: guarda `pistaActiva`; la apaga al tocar un círculo de familia; en
  kiosko escucha `pointerdown`/`keydown` para el temporizador de 60 s.
- `globals.css`: keyframes del dedito y del anillo, y la regla de reducir movimiento.

## 6. Pruebas

- `tests/pista.test.mjs`: cuándo se ve la pista (primer toque, kiosko a los 60 s, toques
  que reinician el tiempo) y el recorrido calculado.
- Navegador (build de producción en local), **con fotos**: teléfono (dos filas), PC y
  kiosko; el primer toque la apaga; en kiosko vuelve al minuto; con reducir movimiento
  no se mueve; la página no brinca (CLS 0).

## Fuera de alcance

- Mostrar siempre el nombre de cada familia (opción C de las muestras). Se puede hacer
  después si se quiere.
