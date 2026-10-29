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
