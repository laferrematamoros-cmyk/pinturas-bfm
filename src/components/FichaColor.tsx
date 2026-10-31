"use client";

import React from "react";

// Ficha del color: la pared pintada (izquierda / arriba) y la parte pública (más claro o más
// oscuro, precios y botones). El editor de admin sigue en Catalogo. Estilos .ficha-* en
// globals.css.

export const ESCENAS = [
  { id: "sala", label: "Sala", img: "/sala-sofa.webp", pos: "center 62%" },
  { id: "recamara", label: "Recámara", img: "/recamara.webp", pos: "center" },
  { id: "cocina", label: "Cocina", img: "/cocina.webp", pos: "center" },
  { id: "fachada", label: "Fachada", img: "/fachada.webp", pos: "center" },
] as const;
export type Escena = typeof ESCENAS[number]["id"];

/** La pared pintada del color, con escenas; liso si la vista en casa está apagada. */
export function ParedColor({ hex, nombre, codigo, pagina, conEscenas, escena, onEscena, etiquetaAmpliar, onAmpliar }: {
  hex: string;
  nombre: string;
  codigo: string;
  pagina?: string | number | null;
  conEscenas: boolean;
  escena: Escena;
  onEscena: (e: Escena) => void;
  etiquetaAmpliar: string;
  onAmpliar: () => void;
}) {
  const e = ESCENAS.find((x) => x.id === escena) ?? ESCENAS[0];
  return (
    <div className={`ficha-pared${conEscenas ? "" : " ficha-liso"}`}>
      {conEscenas && (
        <>
          <img key={e.id} src={e.img} alt={`${e.label} con la pared pintada de ${nombre}`} decoding="async" style={{ objectPosition: e.pos }} />
          <div className="ficha-escenas" role="group" aria-label="Escena">
            {ESCENAS.map((x) => (
              <button key={x.id} type="button" className="ficha-escena" aria-pressed={x.id === escena} onClick={() => onEscena(x.id)}>
                {x.label}
              </button>
            ))}
          </div>
          <button type="button" className="ficha-ampliar" onClick={onAmpliar} aria-label={etiquetaAmpliar} title={etiquetaAmpliar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
        </>
      )}
      <div className="ficha-etiqueta">
        <i aria-hidden style={{ backgroundColor: hex }} />
        <div>
          <b>{nombre}</b>
          <small>{codigo}{pagina != null ? ` · ${pagina}` : ""}</small>
        </div>
      </div>
    </div>
  );
}

type Tono = { hex: string; name: string; code: string };
export type Calidad = { years: number; galon?: string; cubeta?: string; galonOferta: boolean; cubetaOferta: boolean; rinde: string };

/** Parte pública de la ficha: más claro / más oscuro, precios y botones. */
export function FichaPublica({ hex, nombre, vecinos, onVecino, tituloPrecios, calidades, esFavorito, onFavorito, onCarrito }: {
  hex: string;
  nombre: string;
  /** Sin vecinos (búsqueda, favoritos) no sale la sección. */
  vecinos?: { claros: Tono[]; oscuros: Tono[] };
  onVecino: (code: string) => void;
  tituloPrecios: string;
  calidades: Calidad[];
  esFavorito: boolean;
  onFavorito: () => void;
  /** Solo en kiosko. */
  onCarrito?: () => void;
}) {
  const hayVecinos = !!vecinos && vecinos.claros.length + vecinos.oscuros.length > 0;
  const circulo = (t: Tono, lado: "claro" | "oscuro") => (
    <button key={t.code} type="button" className="ficha-vecino" style={{ backgroundColor: t.hex }} onClick={() => onVecino(t.code)}
      aria-label={`Más ${lado}: ${t.name}`} title={t.name} />
  );
  return (
    <>
      {hayVecinos && (
        <div>
          <p className="ficha-eti">¿Más claro o más oscuro?</p>
          <div className="ficha-vecinos">
            <small>Claro</small>
            {vecinos!.claros.map((t) => circulo(t, "claro"))}
            <span className="ficha-vecino ficha-vecino-actual" style={{ backgroundColor: hex }} role="img" aria-label={`Color actual: ${nombre}`} />
            {vecinos!.oscuros.map((t) => circulo(t, "oscuro"))}
            <small>Oscuro</small>
          </div>
        </div>
      )}

      {calidades.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="ficha-titulo">{tituloPrecios}</p>
          {calidades.map((q) => (
            <div key={q.years}>
              <p className="ficha-eti">Calidad {q.years} años</p>
              <div className="ficha-precios">
                {q.galon && (
                  <div className="ficha-precio">
                    {q.galonOferta && <em>Oferta</em>}
                    <img src="/galon.webp" alt="" />
                    <div><span>Galón 4 L</span><b className={q.galonOferta ? "oferta" : ""}>{q.galon}</b></div>
                  </div>
                )}
                {q.cubeta && (
                  <div className="ficha-precio">
                    {q.cubetaOferta && <em>Oferta</em>}
                    <img src="/cubeta.webp" alt="" />
                    <div><span>Cubeta 19 L</span><b className={q.cubetaOferta ? "oferta" : ""}>{q.cubeta}</b></div>
                  </div>
                )}
              </div>
              <p className="ficha-rinde">Rinde <b>{q.rinde}</b></p>
            </div>
          ))}
        </div>
      )}

      <div className="ficha-acciones">
        {onCarrito && (
          <button type="button" className="ficha-boton ficha-boton-principal" onClick={onCarrito}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Agregar al carrito
          </button>
        )}
        <button type="button" className={`ficha-boton${esFavorito ? " ficha-boton-favorito" : ""}`} onClick={onFavorito} aria-pressed={esFavorito}>
          <svg viewBox="0 0 24 24" fill={esFavorito ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          {esFavorito ? "En favoritos" : "Favorito"}
        </button>
      </div>
    </>
  );
}
