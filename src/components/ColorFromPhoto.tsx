"use client";
import { useRef, useState, useEffect } from "react";
import {
  nearestColors, applyWhiteBalance,
  type CatalogColor, type Candidate, type Rgb,
} from "@/lib/colorMatch";
import { averageRegion, loadImageToCanvas } from "@/lib/imageColor";

type Props = {
  open: boolean;
  colors: CatalogColor[];
  onClose: () => void;
  onPickColor: (code: string) => void;
};

const MAX_DIM = 2000;
const SAMPLE_RADIUS = 6;
const RESULTS = 4;

export default function ColorFromPhoto({ open, colors, onClose, onPickColor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loupeRef = useRef<HTMLCanvasElement | null>(null);
  const imgDataRef = useRef<ImageData | null>(null);
  const draggingRef = useRef(false);

  const [hasImage, setHasImage] = useState(false);
  const [sample, setSample] = useState<Rgb | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  const [loupePos, setLoupePos] = useState<{ x: number; y: number } | null>(null);
  const [lastRaw, setLastRaw] = useState<Rgb | null>(null);
  const [neutral, setNeutral] = useState<Rgb | null>(null);
  const [wbMode, setWbMode] = useState(false);
  const [error, setError] = useState("");
  const [srcCanvas, setSrcCanvas] = useState<HTMLCanvasElement | null>(null);

  // Dibuja la imagen en el canvas visible una vez que está montado (hasImage=true).
  // No se puede dibujar dentro de handleFile porque ahí el canvas todavía no existe.
  useEffect(() => {
    if (!srcCanvas || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = srcCanvas.width;
    canvas.height = srcCanvas.height;
    canvas.getContext("2d")!.drawImage(srcCanvas, 0, 0);
  }, [srcCanvas]);

  if (!open) return null;

  function reset() {
    imgDataRef.current = null;
    setHasImage(false); setSample(null); setCandidates([]); setMarker(null);
    setLoupePos(null); setLastRaw(null); setNeutral(null); setWbMode(false); setError("");
    setSrcCanvas(null);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    reset();
    try {
      const off = await loadImageToCanvas(file, MAX_DIM);
      // Muestreamos desde el canvas offscreen (ya tiene la imagen dibujada); el canvas
      // visible se dibuja en el useEffect de arriba cuando se monta.
      imgDataRef.current = off.getContext("2d")!.getImageData(0, 0, off.width, off.height);
      setSrcCanvas(off);
      setHasImage(true);
    } catch {
      setError("No se pudo cargar la imagen. Intenta con otra.");
    }
    e.target.value = "";
  }

  function toImageCoords(clientX: number, clientY: number) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.round((clientY - rect.top) * (canvas.height / rect.height));
    return { x, y, rect };
  }

  function drawLoupe(ix: number, iy: number) {
    const canvas = canvasRef.current!, loupe = loupeRef.current;
    if (!loupe) return;
    const lctx = loupe.getContext("2d")!;
    const size = loupe.width, zoom = 6, src = size / zoom;
    lctx.imageSmoothingEnabled = false;
    lctx.clearRect(0, 0, size, size);
    lctx.drawImage(canvas, ix - src / 2, iy - src / 2, src, src, 0, 0, size, size);
    lctx.strokeStyle = "rgba(0,0,0,0.7)"; lctx.lineWidth = 1;
    lctx.beginPath();
    lctx.moveTo(size / 2, 0); lctx.lineTo(size / 2, size);
    lctx.moveTo(0, size / 2); lctx.lineTo(size, size / 2);
    lctx.stroke();
  }

  function applyAndShow(rawColor: Rgb, neutralColor: Rgb | null) {
    const corrected = neutralColor ? applyWhiteBalance(rawColor, neutralColor) : rawColor;
    setSample(corrected);
    setCandidates(nearestColors(corrected, colors, RESULTS));
  }

  function pick(clientX: number, clientY: number, commit: boolean) {
    const img = imgDataRef.current;
    if (!img) return;
    const { x, y, rect } = toImageCoords(clientX, clientY);
    if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
    const raw = averageRegion(img, x, y, SAMPLE_RADIUS);
    const canvas = canvasRef.current!;
    setMarker({ x: (x * rect.width) / canvas.width, y: (y * rect.height) / canvas.height });
    setLoupePos({ x: clientX - rect.left, y: clientY - rect.top });
    drawLoupe(x, y);
    if (!commit) return;
    setLoupePos(null);
    if (wbMode) {
      if (raw.r < 40 && raw.g < 40 && raw.b < 40) {
        setError("Elige un punto más claro (blanco o gris) para corregir la luz.");
        return;
      }
      setNeutral(raw); setWbMode(false); setError("");
      if (lastRaw) applyAndShow(lastRaw, raw);
      return;
    }
    setLastRaw(raw);
    applyAndShow(raw, neutral);
  }

  const onDown = (e: React.PointerEvent) => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    draggingRef.current = true;
    pick(e.clientX, e.clientY, false);
  };
  const onMove = (e: React.PointerEvent) => { if (draggingRef.current) pick(e.clientX, e.clientY, false); };
  const onUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    setLoupePos(null);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    pick(e.clientX, e.clientY, true);
  };

  const sampleHex = sample
    ? "#" + [sample.r, sample.g, sample.b].map((v) => v.toString(16).padStart(2, "0")).join("")
    : null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-3" style={{ zIndex: 60 }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Encuentra tu color con una foto</h2>
          <button onClick={() => { reset(); onClose(); }} aria-label="Cerrar" className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!hasImage && (
          <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400">
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <div className="text-4xl mb-2">📷</div>
            <div className="font-medium">Toca para subir una foto</div>
            <div className="text-sm text-gray-500 mt-1">Con luz de día, sin flash y evitando sombras.</div>
          </label>
        )}

        {hasImage && (
          <>
            <div className="relative select-none touch-none">
              <canvas
                ref={canvasRef}
                onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={() => { draggingRef.current = false; setLoupePos(null); }}
                className="w-full h-auto rounded-lg border border-gray-200"
                style={{ touchAction: "none" }}
              />
              {marker && (
                <div className="absolute w-4 h-4 rounded-full border-2 border-white shadow -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                     style={{ left: marker.x, top: marker.y, backgroundColor: sampleHex ?? "transparent" }} />
              )}
              <canvas ref={loupeRef} width={96} height={96}
                      className="absolute rounded-full border-2 border-white shadow-lg pointer-events-none bg-white"
                      style={{ left: (loupePos?.x ?? 0) - 48, top: (loupePos?.y ?? 0) - 110, display: loupePos ? "block" : "none" }} />
            </div>

            <p className="text-sm text-gray-600">Toca (o arrastra) sobre la foto para elegir el tono.</p>

            <button
              onClick={() => { setWbMode((v) => !v); setError(""); }}
              className={`text-sm rounded-lg px-3 py-2 border ${wbMode ? "bg-black text-white" : "bg-gray-50"}`}
            >
              {wbMode ? "Ahora toca algo blanco de la foto…" : (neutral ? "Luz corregida ✓ — corregir de nuevo" : "¿La foto se ve con luz rara? Corregir luz")}
            </button>

            {candidates.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Color detectado:</span>
                  <span className="inline-block w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: sampleHex ?? "transparent" }} />
                  <span>{sampleHex}</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {candidates.map((c) => (
                    <button key={c.color.code}
                            onClick={() => { onPickColor(c.color.code); reset(); onClose(); }}
                            className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:border-gray-400 text-left">
                      <span className="w-12 h-12 rounded-lg border border-gray-300 flex-shrink-0" style={{ backgroundColor: c.color.hex }} />
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium truncate">{c.color.name}</span>
                        <span className="block text-xs text-gray-500">{c.color.code}</span>
                      </span>
                      <span className="text-right flex-shrink-0">
                        <span className="block text-sm font-semibold">{c.match}%</span>
                        {c.exact && <span className="block text-xs text-green-600">Coincidencia exacta</span>}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">Tonos aproximados. Para el color final, confirma con una muestra física bajo la luz del lugar.</p>
              </div>
            )}

            <button onClick={reset} className="text-sm text-gray-500 underline self-start">Cambiar foto</button>
          </>
        )}
      </div>
    </div>
  );
}
