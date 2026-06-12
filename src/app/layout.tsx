import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { loadSiteSettings } from "@/lib/actions";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await loadSiteSettings();
  return {
    title: name,
    description: "Catálogo de pinturas, paleta de colores y calculadora",
    viewport: "width=device-width, initial-scale=1, maximum-scale=1",
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
  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(function(reg){
    // Buscar una versión nueva del SW al cargar y al volver a la pestaña.
    reg.update();
    document.addEventListener('visibilitychange', function(){
      if(document.visibilityState === 'visible') reg.update();
    });
  });
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
