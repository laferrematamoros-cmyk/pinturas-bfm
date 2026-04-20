import { ImageResponse } from "next/og";
import { loadSiteSettings } from "@/lib/actions";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Icon() {
  const { pwaIconUrl } = await loadSiteSettings();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ef4444 0%, #eab308 40%, #22c55e 70%, #0d9488 100%)",
          borderRadius: 42,
        }}
      >
        {pwaIconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pwaIconUrl}
            alt="icon"
            style={{ width: "80%", height: "80%", objectFit: "contain" }}
          />
        ) : (
          <span
            style={{
              color: "white",
              fontWeight: 900,
              fontSize: 72,
              letterSpacing: "-2px",
              fontFamily: "sans-serif",
            }}
          >
            BFM
          </span>
        )}
      </div>
    ),
    { ...size }
  );
}
