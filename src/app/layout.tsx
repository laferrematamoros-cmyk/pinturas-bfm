import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { loadSiteSettings } from "@/lib/actions";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await loadSiteSettings();
  return {
    title: name,
    description: "Catálogo de pinturas, paleta de colores y calculadora",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
if('serviceWorker' in navigator){
  var safeUpdate = function(reg){ try { reg.update().catch(function(){}); } catch(e){} };
  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(function(reg){
    // Buscar una versión nueva del SW al cargar y al volver a la pestaña.
    safeUpdate(reg);
    document.addEventListener('visibilitychange', function(){
      if(document.visibilityState === 'visible') safeUpdate(reg);
    });
  }).catch(function(){});
  navigator.serviceWorker.addEventListener('message', function(e){
    if(e.data && e.data.type === 'SW_UPDATED') window.location.reload();
  });
}`,
          }}
        />
      </body>
    </html>
  );
}
