import { luminanciaRelativa, contraste, letraSobre, indiceEnTira, finDeFila, cargaParaVer, degradadoTira } from "../src/lib/tira.ts";

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log("  ✗", m); } else console.log("  ✓", m); };
const cerca = (a, b, t = 0.01) => Math.abs(a - b) <= t;

console.log("contraste:");
ok(cerca(luminanciaRelativa("#ffffff"), 1) && cerca(luminanciaRelativa("#000000"), 0), "blanco 1, negro 0");
ok(cerca(contraste("#ffffff", "#000000"), 21, 0.05), "blanco contra negro = 21");
ok(cerca(contraste("#000000", "#ffffff"), contraste("#ffffff", "#000000")), "no importa el orden");
ok(cerca(luminanciaRelativa("#fff"), 1), "acepta #rgb corto");

console.log("letraSobre:");
ok(letraSobre("#f2e7e3") === "negra", "ROSA TÍMIDO (muy claro) → negra");
ok(letraSobre("#db7680") === "negra", "FLAMENCO REAL → negra (con blanca quedaba justo)");
ok(letraSobre("#6b2c31") === "blanca", "ROJO TIERRA (oscuro) → blanca");
ok(letraSobre("#1878d8") === "blanca", "azul fuerte → blanca");
ok(letraSobre("#daa520") === "negra", "amarillo → negra");

console.log("indiceEnTira:");
ok(indiceEnTira(0, 300, 200) === 0, "orilla izquierda → primero");
ok(indiceEnTira(300, 300, 200) === 199, "orilla derecha → último");
ok(indiceEnTira(-20, 300, 200) === 0 && indiceEnTira(999, 300, 200) === 199, "fuera de la tira se queda en los bordes");
ok(indiceEnTira(150, 300, 200) === 100, "a la mitad → el de en medio");
ok(indiceEnTira(50, 300, 3) === 0 && indiceEnTira(150, 300, 3) === 1 && indiceEnTira(250, 300, 3) === 2, "con 3 colores, tercios");
ok(indiceEnTira(10, 0, 5) === 0, "ancho 0 no truena");

console.log("finDeFila:");
ok(finDeFila(0, 3, 10) === 2 && finDeFila(4, 3, 10) === 5, "con 3 columnas");
ok(finDeFila(7, 6, 200) === 11, "con 6 columnas, el 7 está en la fila que acaba en 11");
ok(finDeFila(9, 3, 10) === 9 && finDeFila(8, 6, 10) === 9, "la última fila incompleta acaba en el último color");
ok(finDeFila(5, 0, 10) === 5, "0 columnas no truena (una por fila)");

console.log("cargaParaVer:");
ok(cargaParaVer(10, 60, 200) === 60, "dentro del primer lote → 60");
ok(cargaParaVer(60, 60, 200) === 120, "el 61º pide el segundo lote");
ok(cargaParaVer(130, 60, 200) === 180, "el 131º pide el tercer lote");
ok(cargaParaVer(199, 60, 200) === 200, "nunca más que el total");

console.log("degradadoTira:");
const d = degradadoTira(["#aaaaaa", "#bbbbbb"]);
ok(d === "linear-gradient(90deg, #aaaaaa 0% 50%, #bbbbbb 50% 100%)", `dos colores, mitad y mitad (${d})`);
ok(degradadoTira(["#123456"]) === "linear-gradient(90deg, #123456 0% 100%)", "un color ocupa toda la tira");
ok(degradadoTira([]) === "none", "sin colores → none");
const tres = degradadoTira(["#111111", "#222222", "#333333"]);
ok(tres.includes("#222222 33.333% 66.667%"), `tercios con 3 decimales (${tres})`);

if (fail) { console.log(`\n${fail} FALLARON`); process.exit(1); }
console.log("\nTodo bien.");
