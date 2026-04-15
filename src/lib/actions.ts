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

// ── Logo upload — signed URL (client uploads directly to Supabase) ──────────

export async function createLogoUploadUrl(ext: string): Promise<{ signedUrl: string; path: string; publicUrl: string }> {
  const path = `logo-${Date.now()}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from("pinturas-assets")
    .createSignedUploadUrl(path);

  if (error) throw new Error(error.message);

  const { data: pub } = supabaseAdmin.storage
    .from("pinturas-assets")
    .getPublicUrl(path);

  return { signedUrl: data.signedUrl, path, publicUrl: pub.publicUrl };
}

// ── Custom colors ───────────────────────────────────────────

export interface CustomColor {
  id: string;
  family_name: string;
  name: string;
  hex: string;
  code: string;
}

export async function loadCustomColors(): Promise<Record<string, CustomColor[]>> {
  const { data } = await supabaseAdmin
    .from("custom_colors")
    .select("*")
    .order("created_at", { ascending: true });
  const result: Record<string, CustomColor[]> = {};
  for (const row of data ?? []) {
    if (!result[row.family_name]) result[row.family_name] = [];
    result[row.family_name].push(row);
  }
  return result;
}

export async function addCustomColor(
  familyName: string,
  name: string,
  hex: string,
  code: string
): Promise<CustomColor> {
  const { data, error } = await supabaseAdmin
    .from("custom_colors")
    .insert({ family_name: familyName, name, hex, code })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCustomColor(id: string): Promise<void> {
  await supabaseAdmin.from("custom_colors").delete().eq("id", id);
}
