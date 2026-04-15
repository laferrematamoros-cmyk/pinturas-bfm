"use client";

import Link from "next/link";

interface NavbarProps {
  isAdmin: boolean;
  onUserClick: () => void;
  siteName: string;
  logoUrl: string | null;
}

export default function Navbar({ isAdmin, onUserClick, siteName, logoUrl }: NavbarProps) {

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-32">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="logo"
              className="h-28 w-auto max-w-[360px] object-contain"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 via-yellow-400 to-green-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">BFM</span>
            </div>
          )}
          <span className="font-bold text-lg text-gray-900 hidden sm:block">
            {siteName}
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-700">
          <Link href="/calculadora" className="hover:text-gray-900 transition-colors">
            Calculadora
          </Link>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-3 text-gray-600">
          {/* User / Admin button */}
          <button
            onClick={onUserClick}
            title={isAdmin ? "Administrador — cerrar sesión" : "Ingresar como administrador"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-sm font-medium ${
              isAdmin
                ? "bg-teal-500 text-white hover:bg-teal-600"
                : "hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
            </svg>
            {isAdmin && <span className="text-xs">Admin</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}
