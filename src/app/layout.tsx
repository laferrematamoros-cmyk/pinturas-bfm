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
    // suppressHydrationWarning: el script de abajo agrega "kiosk-boot" a <html> antes de hidratar.
    <html lang="es" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Kiosko: la página sale del servidor con el diseño normal y el del kiosko se
            aplica al hidratar. Para que la tablet no vea ese cambio, se oculta hasta que
            Catalogo pone el diseño del kiosko (quita "kiosk-boot"). Si algo fallara, se
            muestra sola a los 1.5 s para no dejar la tablet en blanco. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `html.kiosk-boot body{visibility:hidden;animation:kiosk-mostrar 0s 1.5s forwards}@keyframes kiosk-mostrar{to{visibility:visible}}`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=new URLSearchParams(location.search).get('kiosko');var k=p==='1'||(p!=='0'&&localStorage.getItem('pinturas_kiosko')==='1');if(k)document.documentElement.classList.add('kiosk-boot');}catch(e){}})();`,
          }}
        />
        {/* Recuperación: si se cortó el internet a media carga, la página llega incompleta
            o sin estilos. Se revisa unos segundos después de cargar y, si algo falló,
            se recarga UNA vez (no más de una por minuto; sin internet, espera a que vuelva). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(location.pathname!=='/')return;var K='pinturas_autorecarga',hecho=false;
function estilosOk(){var ls=document.querySelectorAll('link[rel="stylesheet"]');if(!ls.length)return false;for(var i=0;i<ls.length;i++){try{if(!ls[i].sheet||!ls[i].sheet.cssRules.length)return false;}catch(e){return false;}}return true;}
function rota(){return !estilosOk()||document.documentElement.getAttribute('data-listo')!=='1';}
function recargar(){try{var t=+sessionStorage.getItem(K)||0;if(Date.now()-t<60000)return;sessionStorage.setItem(K,String(Date.now()));}catch(e){return;}
if(navigator.onLine===false){window.addEventListener('online',function(){location.reload();},{once:true});return;}location.reload();}
function revisar(){if(hecho)return;hecho=true;if(rota())recargar();}
window.addEventListener('load',function(){setTimeout(revisar,5000);});setTimeout(revisar,20000);})();`,
          }}
        />
      </head>
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
