"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { degradadoTira, indiceEnTira } from "@/lib/tira";

type Tono = { hex: string; name: string; code: string };

// Tira con todos los colores de la familia, en el orden de la cuadrícula. Se pega bajo la
// isla; al tocar o arrastrar enseña una burbuja con el color, y al soltar avisa cuál se
// eligió (Catalogo salta a él). La ventanita marca los colores que están en pantalla.
export default function TiraTonos({ tonos, cargados, contenedor, onElegir }: {
  tonos: Tono[];
  /** Colores ya dibujados en la cuadrícula (cambia al cargar otro lote). */
  cargados: number;
  /** La cuadrícula: sus tarjetas traen `data-indice`. */
  contenedor: React.RefObject<HTMLElement | null>;
  onElegir: (indice: number) => void;
}) {
  const envolturaRef = useRef<HTMLDivElement>(null);
  const tiraRef = useRef<HTMLDivElement>(null);
  const ventanaRef = useRef<HTMLDivElement>(null);
  const presionado = useRef(false);
  const [foco, setFoco] = useState<number | null>(null);
  const [x, setX] = useState(0);
  const total = tonos.length;
  const fondo = useMemo(() => degradadoTira(tonos.map((t) => t.hex)), [tonos]);

  // Se pega justo debajo de la isla, que cambia de alto entre teléfono y computadora.
  useEffect(() => {
    const isla = document.querySelector<HTMLElement>(".isla-envoltura");
    const env = envolturaRef.current;
    if (!isla || !env) return;
    const medir = () => env.style.setProperty("--alto-isla", `${isla.offsetHeight - 4}px`);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(isla);
    return () => ro.disconnect();
  }, []);

  // Ventanita: se mueve sola (sin volver a dibujar React) según las tarjetas visibles.
  useEffect(() => {
    const cont = contenedor.current, ventana = ventanaRef.current;
    if (!cont || !ventana || total === 0) return;
    const visibles = new Set<number>();
    const io = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        const i = Number((e.target as HTMLElement).dataset.indice);
        if (e.isIntersecting) visibles.add(i); else visibles.delete(i);
      }
      if (visibles.size === 0) { ventana.style.opacity = "0"; return; }
      let min = Infinity, max = -1;
      visibles.forEach((i) => { if (i < min) min = i; if (i > max) max = i; });
      ventana.style.opacity = "1";
      ventana.style.left = `${(min / total) * 100}%`;
      ventana.style.width = `${((max - min + 1) / total) * 100}%`;
    }, { rootMargin: "-140px 0px 0px 0px" });
    cont.querySelectorAll<HTMLElement>("[data-indice]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [contenedor, cargados, tonos, total]);

  const ubicar = (clientX: number) => {
    const r = tiraRef.current!.getBoundingClientRect();
    const i = indiceEnTira(clientX - r.left, r.width, total);
    setX(clientX - r.left);
    setFoco(i);
    return i;
  };
  const enfocar = (i: number) => {
    setFoco(i);
    setX(((i + 0.5) / total) * (tiraRef.current?.offsetWidth ?? 0));
  };

  const t = foco !== null ? tonos[foco] : undefined;
  return (
    <div ref={envolturaRef} className="tira-envoltura">
      <div className="tira-vidrio">
        <div
          ref={tiraRef}
          className="tira"
          style={{ background: fondo }}
          role="slider"
          tabIndex={0}
          aria-label="Tira de tonos: elige un tono para ir a ese color"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, total - 1)}
          aria-valuenow={foco ?? 0}
          aria-valuetext={tonos[foco ?? 0]?.name}
          onPointerDown={(e) => { presionado.current = true; e.currentTarget.setPointerCapture(e.pointerId); ubicar(e.clientX); }}
          onPointerMove={(e) => { if (presionado.current || e.pointerType === "mouse") ubicar(e.clientX); }}
          onPointerUp={(e) => {
            if (!presionado.current) return;
            presionado.current = false;
            onElegir(ubicar(e.clientX));
            if (e.pointerType !== "mouse") setFoco(null);
          }}
          onPointerCancel={() => { presionado.current = false; setFoco(null); }}
          onPointerLeave={(e) => { if (e.pointerType === "mouse" && !presionado.current) setFoco(null); }}
          onKeyDown={(e) => {
            const actual = foco ?? 0;
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onElegir(actual); return; }
            const n = e.key === "ArrowRight" ? Math.min(total - 1, actual + 1)
              : e.key === "ArrowLeft" ? Math.max(0, actual - 1)
              : e.key === "Home" ? 0 : e.key === "End" ? total - 1 : null;
            if (n === null) return;
            e.preventDefault();
            enfocar(n);
          }}
          onBlur={() => setFoco(null)}
        >
          <div ref={ventanaRef} aria-hidden className="tira-ventana" />
          {t && (
            <>
              <div aria-hidden className="tira-aguja" style={{ left: x }} />
              <div aria-hidden className="tira-burbuja" style={{ left: `clamp(100px, ${x}px, calc(100% - 100px))` }}>
                <i style={{ background: t.hex }} />
                {t.name} <small>{t.code}</small>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
