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
