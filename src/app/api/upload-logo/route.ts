import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ALLOWED_IMAGE_TYPES, MAX_LOGO_SIZE_BYTES } from "@/lib/validation";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });

  // Validate MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Solo se aceptan imágenes (JPEG, PNG, WebP, GIF, SVG)." },
      { status: 415 }
    );
  }

  // Validate file size
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return NextResponse.json(
      { error: "El archivo es demasiado grande. El tamaño máximo es 5 MB." },
      { status: 413 }
    );
  }

  const ext = file.type.split("/")[1]?.replace("svg+xml", "svg") ?? "png";
  const fileName = `logo-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from("pinturas-assets")
    .upload(fileName, buffer, { contentType: file.type, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabaseAdmin.storage.from("pinturas-assets").getPublicUrl(fileName);
  return NextResponse.json({ url: data.publicUrl });
}
