"use client";

import Link from "next/link";
import { useRef } from "react";

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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-8 flex items-center justify-between h-24 sm:h-32">
        {/* Logo(s) — 6 toques = acceso oculto de admin (no navega) */}
        <Link href="/" className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0 select-none"
          onClick={handleLogoTap}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="logo"
              className="h-20 sm:h-28 w-auto max-w-[200px] sm:max-w-[400px] object-contain"
            />
          ) : (
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-red-500 via-yellow-400 to-green-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-base sm:text-3xl">BFM</span>
            </div>
          )}
          {logo2Url && (
            <img
              src={logo2Url}
              alt="logo2"
              onClick={handleSayerTap}
              className="h-20 sm:h-28 w-auto max-w-[180px] sm:max-w-[380px] object-contain"
            />
          )}
          <span className="font-bold text-sm sm:text-xl text-gray-900 hidden sm:block truncate max-w-[200px] lg:max-w-none">
            {siteName}
          </span>
          {editMode && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSayerSecret?.(); }}
              title="Salir del modo edición"
              className="ml-2 flex items-center gap-1.5 text-sm sm:text-base font-bold bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-1.5 rounded-full whitespace-nowrap shadow active:scale-95 transition-colors animate-pulse"
            >
              Modo edición
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </Link>

        {/* Icons */}
        <div className="flex items-center gap-2 text-gray-600 flex-shrink-0">
          {/* El acceso de administrador está OCULTO: se entra con 6 toques al logo. */}

          {/* Pedidos — solo admin logueado (modo normal). Donde estaba el ícono de admin. */}
          {!kioskMode && isAdmin && (
            <button
              onClick={onOrdersClick}
              title="Ver pedidos"
              className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold px-4 py-2 rounded-full transition-colors shadow active:scale-95 text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              Pedidos
            </button>
          )}

          {/* Pedidos en kiosko — solo si el admin activó el acceso en esta tablet */}
          {kioskMode && kioskOrdersAvailable && (
            <button
              onClick={onOrdersClick}
              title="Ver pedidos"
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 py-2.5 sm:py-3 rounded-full transition-colors shadow active:scale-95 text-sm"
            >
              <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              Pedidos
            </button>
          )}

          {/* Carrito (solo modo kiosko — tablet en tienda) */}
          {kioskMode && (
            <button
              onClick={onCartClick}
              title="Ver carrito"
              className="relative flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 sm:px-5 py-2.5 sm:py-3 rounded-full transition-colors shadow active:scale-95"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span className="text-sm sm:text-base">Ver carrito</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-white text-teal-600 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">{cartCount}</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Info bar: botones + horario — oculta en modo kiosko (tablet en tienda) */}
      {!kioskMode && (
      <div className="bg-gray-50 border-b border-gray-100 px-4 sm:px-8 py-1.5">
        <div className="w-full flex flex-wrap items-center gap-x-3 gap-y-1.5">

          {/* WhatsApp */}
          <a
            href="https://wa.me/528682340531"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full transition-colors font-medium text-xs flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            868 234 0531
          </a>

          {/* Ubicación */}
          <a
            href="https://maps.app.goo.gl/dWk2h9RFzFvwGF499"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full transition-colors font-medium text-xs flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            Cómo llegar
          </a>

          {/* Separador — solo desktop */}
          <span className="hidden sm:block text-gray-300 text-xs">|</span>

          {/* Horario */}
          <div className="flex items-center gap-1 text-gray-500 text-xs flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/>
            </svg>
            <span className="hidden sm:inline">Lun – Vie: 9:00 – 6:00 &nbsp;·&nbsp; Sáb: 8:00 – 5:00</span>
            <span className="sm:hidden">Lun–Vie 9–6 · Sáb 8–5</span>
          </div>

          {/* Anuncio */}
          {announcementText && (
            <span className="hidden sm:block text-gray-300 text-xs">|</span>
          )}
          {announcementText && (
            <span className="text-xs text-gray-600 w-full sm:w-auto sm:truncate sm:min-w-0">{announcementText}</span>
          )}

        </div>
      </div>
      )}
    </nav>
  );
}
