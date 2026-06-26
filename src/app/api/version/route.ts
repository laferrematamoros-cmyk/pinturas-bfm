import { NextResponse } from "next/server";

// Devuelve un identificador que cambia en cada despliegue (commit de Vercel).
// El cliente lo consulta cada cierto tiempo; si cambió, sabe que hay una
// versión nueva y se recarga (cuando está libre) para no quedar con código
// viejo que provoque "Server Action not found".
export const dynamic = "force-dynamic";

export function GET() {
  const v =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    "dev";
  return NextResponse.json(
    { v },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
