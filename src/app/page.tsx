import Catalogo from "./Catalogo";
import { loadInitialData } from "@/lib/actions";
import { aligerar } from "@/lib/catalogData";

// La página sale del servidor YA armada con los datos reales (logo, familias,
// precios, colores). Antes se dibujaba con los valores de fábrica y los datos
// llegaban en una segunda llamada: el cliente veía "otra página" casi un segundo.
// Las lecturas van por el Data Cache (1 h, etiqueta "catalog") y se invalidan
// al guardar en Ajustes, así que la página se regenera con lo nuevo.
// Los datos viajan dentro del HTML, por eso se mandan ya recortados (aligerar).
export default async function Page() {
  const initialData = aligerar(await loadInitialData());
  return <Catalogo initialData={initialData} />;
}
