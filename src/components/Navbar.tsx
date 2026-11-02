"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { estadoTienda, HORARIO_CORTO, HORARIO_LARGO } from "@/lib/horario";

interface NavbarProps {
  isAdmin: boolean;
  onUserClick: () => void;
  siteName: string;
  logoUrl: string | null;
  logo2Url?: string | null;
  announcementText?: string;
  kioskMode?: boolean;
  cartCount?: number;
  onCartClick?: () => void;
  onSecretAccess?: () => void;
  onOrdersClick?: () => void;
  onSayerSecret?: () => void;
  editMode?: boolean;
  kioskOrdersAvailable?: boolean;
}

const ICONO_PEDIDOS = "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01";

// Letrero en vivo "Abierta ahora · cierra 6:00 pm". Se calcula en el navegador (la página
// es estática) y se actualiza cada minuto; antes de calcularse ya ocupa su lugar
// (ancho fijo en CSS), así la fila no brinca.
function EstadoEnVivo() {
  const [estado, setEstado] = useState<{ abierta: boolean; texto: string } | null>(null);
  useEffect(() => {
    const actualizar = () => setEstado(estadoTienda(new Date()));
    actualizar();
    const id = setInterval(actualizar, 60_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className={`isla-chip estado ${estado ? (estado.abierta ? "estado-abierta" : "estado-cerrada") : ""}`} aria-live="polite">
      <span className="estado-punto" aria-hidden />
      {estado ? estado.texto : "Horario de hoy"}
    </span>
  );
}

export default function Navbar({ isAdmin, siteName, logoUrl, logo2Url, announcementText, kioskMode, cartCount = 0, onCartClick, onSecretAccess, onOrdersClick, onSayerSecret, editMode, kioskOrdersAvailable }: NavbarProps) {
  // Acceso oculto de administrador: 6 toques seguidos sobre el logo (BFM) abren el login.
  // El logo deja de navegar; el contador se reinicia si pasan >2s entre toques.
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleLogoTap = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!onSecretAccess) return;
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 6) {
      tapCount.current = 0;
      onSecretAccess();
    } else {
      tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
    }
  };

  // 6 toques al logo de Sayer → prende/apaga el modo edición de colores (solo admin).
  const sayerTapCount = useRef(0);
  const sayerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSayerTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // no cuenta para el gesto del logo BFM
    if (!onSayerSecret) return;
    sayerTapCount.current += 1;
    if (sayerTimer.current) clearTimeout(sayerTimer.current);
    if (sayerTapCount.current >= 6) {
      sayerTapCount.current = 0;
      onSayerSecret();
    } else {
      sayerTimer.current = setTimeout(() => { sayerTapCount.current = 0; }, 2000);
    }
  };

  return (
    <>
      {/* Isla flotante: barra redonda de vidrio que se queda arriba al bajar */}
      <nav className="isla-envoltura">
        <div className="isla">
          {/* Logo(s) — 6 toques = acceso oculto de admin (no navega) */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-4 shrink min-w-0 select-none" onClick={handleLogoTap}>
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="w-auto object-contain h-8 sm:h-11 max-w-[104px] sm:max-w-[170px]" />
            ) : (
              <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-red-500 via-yellow-400 to-green-500 flex items-center justify-center shrink-0 text-white font-bold text-xs">BFM</span>
            )}
            {logo2Url && (
              <img src={logo2Url} alt="logo2" onClick={handleSayerTap} className="w-auto object-contain h-8 sm:h-11 max-w-[96px] sm:max-w-[160px]" />
            )}
            <span className="hidden md:block font-extrabold text-base lg:text-lg text-gray-900 tracking-tight truncate">{siteName}</span>
            {editMode && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSayerSecret?.(); }}
                title="Salir del modo edición"
                className="flex items-center gap-1 text-xs sm:text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white px-2.5 sm:px-3 py-1.5 rounded-full whitespace-nowrap shadow active:scale-95 transition-colors animate-pulse"
              >
                Modo edición
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </Link>

          {/* Acciones (el acceso de administrador está OCULTO: 6 toques al logo) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Pedidos — solo admin logueado (modo normal) */}
            {!kioskMode && isAdmin && (
              <button onClick={onOrdersClick} title="Ver pedidos" className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold px-3.5 py-2 rounded-full shadow active:scale-95 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONO_PEDIDOS} /></svg>
                Pedidos
              </button>
            )}

            {/* Público: WhatsApp y Cómo llegar */}
            {!kioskMode && (
              <>
                <a href="https://wa.me/528682340531" target="_blank" rel="noopener noreferrer" aria-label="Escríbenos por WhatsApp" title="WhatsApp 868 234 0531" className="isla-boton bg-green-600 hover:bg-green-700">
                  <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <a href="https://maps.app.goo.gl/dWk2h9RFzFvwGF499" target="_blank" rel="noopener noreferrer" aria-label="Cómo llegar a la tienda" title="Cómo llegar" className="isla-boton bg-blue-600 hover:bg-blue-700">
                  <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                </a>
              </>
            )}

            {/* Kiosko: Pedidos (si el admin activó el acceso en esta tablet) y carrito */}
            {kioskMode && kioskOrdersAvailable && (
              <button onClick={onOrdersClick} title="Ver pedidos" className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-3 py-2 rounded-full shadow active:scale-95 text-xs sm:text-sm">
                <svg className="w-4 h-4 text-teal-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONO_PEDIDOS} /></svg>
                Pedidos
              </button>
            )}
            {kioskMode && (
              <button onClick={onCartClick} title="Ver carrito" className="relative flex items-center gap-1.5 sm:gap-2 bg-teal-500 hover:bg-teal-600 text-white font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full shadow active:scale-95">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <span className="text-xs sm:text-sm whitespace-nowrap">Ver carrito</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-teal-600 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">{cartCount}</span>
                )}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Pastillas: estado en vivo, horario y anuncio (dirección) — solo en la página pública.
          En celular giran solas como letrero de noticias (la copia hace que la vuelta no
          tenga corte) y se detienen al tocarlas; en PC caben todas y se quedan quietas. */}
      {!kioskMode && (
        <div className="isla-chips no-scrollbar">
          <div className="isla-cinta">
            {[false, true].map((copia) => (
              <div key={String(copia)} className={`isla-grupo${copia ? " isla-copia" : ""}`} aria-hidden={copia || undefined}>
                <EstadoEnVivo />
                <span className="isla-chip">
                  <svg className="w-3.5 h-3.5 text-[#0071e3] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" /></svg>
                  <span className="sm:hidden">{HORARIO_CORTO}</span>
                  <span className="hidden sm:inline">{HORARIO_LARGO}</span>
                </span>
                {announcementText && <span className="isla-chip">{announcementText}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
