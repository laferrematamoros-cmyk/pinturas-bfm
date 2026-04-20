"use server";

import { createClient } from "@supabase/supabase-js";
import { sanitizeText, isValidHex, isValidPrice, LIMITS } from "./validation";

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
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(prices)) {
    if (!isValidPrice(v)) throw new Error(`Precio inválido para ${k} años`);
    clean[k] = sanitizeText(v, LIMITS.PRICE);
  }
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "durability_prices", value: JSON.stringify(clean) }, { onConflict: "key" });
}

export async function loadGalonPrices(): Promise<Record<string, string>> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "galon_prices")
    .single();
  if (!data?.value) return {};
  try {
    return JSON.parse(data.value) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function saveGalonPrices(prices: Record<string, string>): Promise<void> {
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(prices)) {
    if (v && !isValidPrice(v)) throw new Error(`Precio inválido para ${k} años`);
    if (v) clean[k] = sanitizeText(v, LIMITS.PRICE);
  }
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "galon_prices", value: JSON.stringify(clean) }, { onConflict: "key" });
}

export async function loadDurabilityOnSale(): Promise<number[]> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "durability_on_sale")
    .single();
  if (!data?.value) return [];
  try {
    return JSON.parse(data.value) as number[];
  } catch {
    return [];
  }
}

export async function saveDurabilityOnSale(years: number[]): Promise<void> {
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "durability_on_sale", value: JSON.stringify(years) }, { onConflict: "key" });
}

export async function loadGalonOnSale(): Promise<number[]> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "galon_on_sale")
    .single();
  if (!data?.value) return [];
  try {
    return JSON.parse(data.value) as number[];
  } catch {
    return [];
  }
}

export async function saveGalonOnSale(years: number[]): Promise<void> {
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "galon_on_sale", value: JSON.stringify(years) }, { onConflict: "key" });
}

export async function saveColorHex(code: string, hex: string): Promise<void> {
  if (!isValidHex(hex)) throw new Error("Formato de color inválido");
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

export async function loadSiteSettings(): Promise<{ name: string; logoUrl: string | null; logo2Url: string | null; roomPreviewEnabled: boolean; rendimientoLabel: string; roomButtonLabel: string; cardHeight: number; calcButtonEnabled: boolean; pwaIconUrl: string | null; announcementText: string }> {
  const { data } = await supabaseAdmin.from("site_settings").select("*");
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return {
    name: map["site_name"] ?? "Pinturas BFM",
    logoUrl: map["logo_url"] ?? null,
    logo2Url: map["logo2_url"] ?? null,
    roomPreviewEnabled: (map["room_preview_enabled"] ?? "true") === "true",
    rendimientoLabel: map["rendimiento_label"] ?? "Rendimiento aproximado",
    roomButtonLabel: map["room_button_label"] ?? "Ver en habitación",
    cardHeight: parseInt(map["card_height"] ?? "52"),
    calcButtonEnabled: (map["calc_button_enabled"] ?? "true") === "true",
    pwaIconUrl: map["pwa_icon_url"] ?? null,
    announcementText: map["announcement_text"] ?? "",
  };
}

export async function saveAnnouncementText(text: string): Promise<void> {
  if (text.trim()) {
    await supabaseAdmin
      .from("site_settings")
      .upsert({ key: "announcement_text", value: text.trim() }, { onConflict: "key" });
  } else {
    await supabaseAdmin.from("site_settings").delete().eq("key", "announcement_text");
  }
}

export async function savePwaIconUrl(url: string | null): Promise<void> {
  if (url) {
    await supabaseAdmin
      .from("site_settings")
      .upsert({ key: "pwa_icon_url", value: url }, { onConflict: "key" });
  } else {
    await supabaseAdmin.from("site_settings").delete().eq("key", "pwa_icon_url");
  }
}

export async function saveCalcButtonEnabled(enabled: boolean): Promise<void> {
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "calc_button_enabled", value: String(enabled) }, { onConflict: "key" });
}

export async function saveCardHeight(height: number): Promise<void> {
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "card_height", value: String(height) }, { onConflict: "key" });
}

export async function saveRendimientoLabel(label: string): Promise<void> {
  const clean = sanitizeText(label, 60);
  if (!clean) throw new Error("El texto no puede estar vacío");
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "rendimiento_label", value: clean }, { onConflict: "key" });
}

export async function saveRoomButtonLabel(label: string): Promise<void> {
  const clean = sanitizeText(label, 40);
  if (!clean) throw new Error("El texto no puede estar vacío");
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "room_button_label", value: clean }, { onConflict: "key" });
}

export async function saveRoomPreviewEnabled(enabled: boolean): Promise<void> {
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "room_preview_enabled", value: String(enabled) }, { onConflict: "key" });
}

export async function saveSiteLogo2Url(url: string | null): Promise<void> {
  if (url) {
    await supabaseAdmin
      .from("site_settings")
      .upsert({ key: "logo2_url", value: url }, { onConflict: "key" });
  } else {
    await supabaseAdmin.from("site_settings").delete().eq("key", "logo2_url");
  }
}

export async function saveSiteName(name: string): Promise<void> {
  const clean = sanitizeText(name, LIMITS.SITE_NAME);
  if (!clean) throw new Error("El nombre del sitio no puede estar vacío");
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "site_name", value: clean }, { onConflict: "key" });
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
  page_number?: number | null;
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
  code: string,
  pageNumber?: string | null
): Promise<CustomColor> {
  const cleanName = sanitizeText(name, LIMITS.COLOR_NAME);
  const cleanCode = sanitizeText(code, LIMITS.COLOR_CODE);
  if (!cleanName) throw new Error("El nombre del color no puede estar vacío");
  if (!isValidHex(hex)) throw new Error("Formato de color inválido");
  const { data, error } = await supabaseAdmin
    .from("custom_colors")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ family_name: familyName, name: cleanName, hex, code: cleanCode, page_number: (pageNumber ?? null) as any })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateCustomColor(id: string, name: string, hex: string, code: string, pageNumber?: string | null): Promise<void> {
  const cleanName = sanitizeText(name, LIMITS.COLOR_NAME);
  const cleanCode = sanitizeText(code, LIMITS.COLOR_CODE);
  if (!cleanName) throw new Error("El nombre del color no puede estar vacío");
  if (!isValidHex(hex)) throw new Error("Formato de color inválido");
  const { error } = await supabaseAdmin
    .from("custom_colors")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ name: cleanName, hex, code: cleanCode, page_number: (pageNumber ?? null) as any })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function loadColorPageNumbers(): Promise<Record<string, string>> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "color_page_numbers")
    .single();
  if (!data?.value) return {};
  try { return JSON.parse(data.value); } catch { return {}; }
}

export async function saveColorPageNumber(originalCode: string, pageNumber: string | null): Promise<void> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "color_page_numbers")
    .single();
  const current = data?.value ? (JSON.parse(data.value) as Record<string, string>) : {};
  if (pageNumber === null) {
    delete current[originalCode];
  } else {
    current[originalCode] = pageNumber;
  }
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "color_page_numbers", value: JSON.stringify(current) }, { onConflict: "key" });
}

export async function deleteCustomColor(id: string): Promise<void> {
  await supabaseAdmin.from("custom_colors").delete().eq("id", id);
}

// ── Built-in color overrides (name/code) ────────────────────

export async function loadColorNameOverrides(): Promise<Record<string, { name: string; code: string }>> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "color_name_overrides")
    .single();
  if (!data?.value) return {};
  try { return JSON.parse(data.value); } catch { return {}; }
}

export async function saveColorNameOverride(originalCode: string, name: string, newCode: string): Promise<void> {
  const cleanName = sanitizeText(name, LIMITS.COLOR_NAME);
  const cleanCode = sanitizeText(newCode, LIMITS.COLOR_CODE);
  if (!cleanName) throw new Error("El nombre del color no puede estar vacío");
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "color_name_overrides")
    .single();
  const current = data?.value ? (JSON.parse(data.value) as Record<string, { name: string; code: string }>) : {};
  current[originalCode] = { name: cleanName, code: cleanCode };
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "color_name_overrides", value: JSON.stringify(current) }, { onConflict: "key" });
}

export async function loadDeletedColors(): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "deleted_colors")
    .single();
  if (!data?.value) return [];
  try { return JSON.parse(data.value) as string[]; } catch { return []; }
}

export async function saveDeletedColors(codes: string[]): Promise<void> {
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "deleted_colors", value: JSON.stringify(codes) }, { onConflict: "key" });
}
