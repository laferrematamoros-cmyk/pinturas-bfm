// Utilidades de imagen. `averageRegion` es pura (recibe ImageData-like) → testeable.
// `loadImageToCanvas` sí usa APIs de navegador.
import type { Rgb } from "@/lib/colorMatch";

type ImageDataLike = { width: number; height: number; data: Uint8ClampedArray | number[] };

// Promedia los pixeles OPACOS dentro de un cuadrado de lado (2*radius+1) centrado en (x,y).
export function averageRegion(img: ImageDataLike, x: number, y: number, radius: number): Rgb {
  let r = 0, g = 0, b = 0, count = 0;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const px = x + dx, py = y + dy;
      if (px < 0 || py < 0 || px >= img.width || py >= img.height) continue;
      const i = (py * img.width + px) * 4;
      if (img.data[i + 3] === 0) continue; // transparente
      r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; count++;
    }
  }
  if (count === 0) return { r: 0, g: 0, b: 0 };
  return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
}

// Carga un File a un canvas offscreen, respetando orientación EXIF y reduciendo si
// excede maxDim (por rendimiento en tablet).
export async function loadImageToCanvas(file: File, maxDim: number): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas;
}
