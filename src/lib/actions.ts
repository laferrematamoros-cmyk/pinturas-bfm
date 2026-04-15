"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Color settings ──────────────────────────────────────────

export async function loadColorSettings(): Promise<
  Record<string, { hex: string; durability_years: number[]; prices?: Record<string, string> }>
> {
  const { data } = await supabaseAdmin.from("color_settings").select("*");
  const result: Record<string, { hex: string; durability_years: number[]; prices?: Record<string, string> }> = {};
  for (const row of data ?? []) {
    result[row.code] = {
      hex: row.hex,
      durability_years: row.durability_years ?? [],
      prices: row.prices ?? undefined,
    };
  }
  return result;
}

export async function loadDurabilityPrices(): Promise<Record<string, string>> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "durability_prices")
    .single();
  if (!data?.value) return {};
  try {
    return JSON.parse(data.value) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function saveDurabilityPrices(prices: Record<string, string>): Promise<void> {
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "durability_prices", value: JSON.stringify(prices) }, { onConflict: "key" });
}

export async function saveColorHex(code: string, hex: string): Promise<void> {
  await supabaseAdmin
    .from("color_settings")
    .upsert({ code, hex, updated_at: new Date().toISOString() }, { onConflict: "code" });
}

export async function deleteColorHex(code: string): Promise<void> {
  await supabaseAdmin
    .from("color_settings")
    .update({ hex: null })
    .eq("code", code);
}

export async function saveColorDurability(code: string, years: number[]): Promise<void> {
  await supabaseAdmin
    .from("color_settings")
    .upsert({ code, durability_years: years, updated_at: new Date().toISOString() }, { onConflict: "code" });
}

// ── Site settings ───────────────────────────────────────────

export async function loadSiteSettings(): Promise<{ name: string; logoUrl: string | null }> {
  const { data } = await supabaseAdmin.from("site_settings").select("*");
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return {
    name: map["site_name"] ?? "Pinturas BFM",
    logoUrl: map["logo_url"] ?? null,
  };
}

export async function saveSiteName(name: string): Promise<void> {
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "site_name", value: name }, { onConflict: "key" });
}

export async function saveSiteLogoUrl(url: string | null): Promise<void> {
  if (url) {
    await supabaseAdmin
      .from("site_settings")
      .upsert({ key: "logo_url", value: url }, { onConflict: "key" });
  } else {
    await supabaseAdmin.from("site_settings").delete().eq("key", "logo_url");
  }
}

// ── Logo upload to Storage ──────────────────────────────────

export async function uploadLogo(base64: string, mimeType: string): Promise<string> {
  // Convert base64 to buffer
  const base64Data = base64.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const ext = mimeType.split("/")[1] ?? "png";
  const fileName = `logo-${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from("pinturas-assets")
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw new Error(error.message);

  const { data } = supabaseAdmin.storage
    .from("pinturas-assets")
    .getPublicUrl(fileName);

  return data.publicUrl;
}
