"use server";

import { createClient } from "@supabase/supabase-js";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { sanitizeText, isValidHex, isValidPrice, LIMITS } from "./validation";
import { requireAdmin, setAdminSession, clearAdminSession, isAdmin, verifyPassword } from "./auth";

// ── Rate limit anti-spam para createOrder (público) ─────────
// Best-effort en memoria por instancia: máx 5 pedidos por minuto por IP.
// No es un firewall, pero corta el caso típico de spam rápido desde un
// mismo origen sin depender de servicios externos.
const ORDER_RATE_LIMIT = 5;
const ORDER_RATE_WINDOW_MS = 60_000;
const orderHits = new Map<string, number[]>();

function withinOrderRateLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (orderHits.get(ip) ?? []).filter((t) => now - t < ORDER_RATE_WINDOW_MS);
  if (recent.length >= ORDER_RATE_LIMIT) return false;
  recent.push(now);
  orderHits.set(ip, recent);
  // Limpieza ocasional para que el Map no crezca sin límite.
  if (orderHits.size > 5000) {
    for (const [k, v] of orderHits) {
      if (v.every((t) => now - t > ORDER_RATE_WINDOW_MS)) orderHits.delete(k);
    }
  }
  return true;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CATALOG_TAG = "catalog";

// Cliente para ESCRITURAS y lecturas internas de read-modify-write: siempre fresco.
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    fetch: (url: RequestInfo | URL, options?: RequestInit) =>
      fetch(url, { ...options, cache: "no-store" }),
  },
});

// Cliente para LECTURAS públicas del catálogo: las consultas GET se cachean en el
// Data Cache de Next (TTL 1h) con la etiqueta "catalog", y se invalidan en cada
// escritura via revalidateTag(). Reduce drásticamente el egress de Supabase.
const supabaseRead = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    fetch: (url: RequestInfo | URL, options?: RequestInit) =>
      fetch(url, { ...options, next: { revalidate: 3600, tags: [CATALOG_TAG] } }),
  },
});

// ── Autenticación de administrador ──────────────────────────

/** Valida el password (server-only) y, si es correcto, abre sesión de admin (cookie firmada httpOnly). */
export async function login(password: string): Promise<boolean> {
  if (!verifyPassword(password)) return false;
  await setAdminSession();
  return true;
}

export async function logout(): Promise<void> {
  await clearAdminSession();
}

/** Permite a la interfaz saber si la cookie de sesión sigue siendo válida (p. ej. tras recargar). */
export async function checkAdminSession(): Promise<boolean> {
  return isAdmin();
}

// ── Color settings ──────────────────────────────────────────

export async function loadColorSettings(): Promise<
  Record<string, { hex: string; durability_years: number[]; prices?: Record<string, string> }>
> {
  const PAGE = 1000;
  let allRows: Record<string, unknown>[] = [];
  let page = 0;
  while (true) {
    const { data } = await supabaseRead
      .from("color_settings")
      .select("*")
      .range(page * PAGE, (page + 1) * PAGE - 1);
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < PAGE) break;
    page++;
  }
  const result: Record<string, { hex: string; durability_years: number[]; prices?: Record<string, string> }> = {};
  for (const row of allRows) {
    result[row.code as string] = {
      hex: row.hex as string,
      durability_years: (row.durability_years as number[]) ?? [],
      prices: (row.prices as Record<string, string>) ?? undefined,
    };
  }
  return result;
}

export async function loadDurabilityPrices(): Promise<Record<string, string>> {
  const { data } = await supabaseRead
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
  await requireAdmin();
  updateTag(CATALOG_TAG);
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
  const { data } = await supabaseRead
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
  await requireAdmin();
  updateTag(CATALOG_TAG);
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
  const { data } = await supabaseRead
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
  await requireAdmin();
  updateTag(CATALOG_TAG);
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "durability_on_sale", value: JSON.stringify(years) }, { onConflict: "key" });
}

export async function loadGalonOnSale(): Promise<number[]> {
  const { data } = await supabaseRead
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
  await requireAdmin();
  updateTag(CATALOG_TAG);
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "galon_on_sale", value: JSON.stringify(years) }, { onConflict: "key" });
}

export async function saveColorHex(code: string, hex: string): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  if (!isValidHex(hex)) throw new Error("Formato de color inválido");
  await supabaseAdmin
    .from("color_settings")
    .upsert({ code, hex, updated_at: new Date().toISOString() }, { onConflict: "code" });
}

export async function deleteColorHex(code: string): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  await supabaseAdmin
    .from("color_settings")
    .update({ hex: null })
    .eq("code", code);
}

export async function saveColorDurability(code: string, years: number[]): Promise<number[] | null> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("color_settings")
    .update({ durability_years: years, updated_at: new Date().toISOString() })
    .eq("code", code)
    .select("code");
  if (updateError) throw new Error("UPDATE error: " + updateError.message);

  if (!updated || updated.length === 0) {
    const { error: insertError } = await supabaseAdmin
      .from("color_settings")
      .insert({ code, durability_years: years });
    if (insertError) throw new Error("INSERT error: " + insertError.message);
  }

  const { data: verify, error: verifyError } = await supabaseAdmin
    .from("color_settings")
    .select("durability_years")
    .eq("code", code)
    .single();
  if (verifyError) throw new Error("VERIFY error: " + verifyError.message);
  return (verify as { durability_years: number[] } | null)?.durability_years ?? null;
}

// ── Site settings ───────────────────────────────────────────

export async function loadSiteSettings(): Promise<{ name: string; logoUrl: string | null; logo2Url: string | null; roomPreviewEnabled: boolean; rendimientoLabel: string; roomButtonLabel: string; cardHeight: number; calcButtonEnabled: boolean; pwaIconUrl: string | null; announcementText: string }> {
  const { data } = await supabaseRead.from("site_settings").select("*");
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

export async function loadFamilySettings(): Promise<{ colors: string[]; names: string[] }> {
  const { data } = await supabaseRead.from("site_settings").select("*");
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return {
    colors: map["family_colors"] ? JSON.parse(map["family_colors"]) : [],
    names: map["family_names"] ? JSON.parse(map["family_names"]) : [],
  };
}

export async function saveFamilyColors(colors: string[]): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "family_colors", value: JSON.stringify(colors) }, { onConflict: "key" });
}

export async function saveFamilyNames(names: string[]): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "family_names", value: JSON.stringify(names) }, { onConflict: "key" });
}

export async function saveAnnouncementText(text: string): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  if (text.trim()) {
    await supabaseAdmin
      .from("site_settings")
      .upsert({ key: "announcement_text", value: text.trim() }, { onConflict: "key" });
  } else {
    await supabaseAdmin.from("site_settings").delete().eq("key", "announcement_text");
  }
}

export async function savePwaIconUrl(url: string | null): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  if (url) {
    await supabaseAdmin
      .from("site_settings")
      .upsert({ key: "pwa_icon_url", value: url }, { onConflict: "key" });
  } else {
    await supabaseAdmin.from("site_settings").delete().eq("key", "pwa_icon_url");
  }
}

export async function saveCalcButtonEnabled(enabled: boolean): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "calc_button_enabled", value: String(enabled) }, { onConflict: "key" });
}

export async function saveCardHeight(height: number): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "card_height", value: String(height) }, { onConflict: "key" });
}

export async function saveRendimientoLabel(label: string): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  const clean = sanitizeText(label, 60);
  if (!clean) throw new Error("El texto no puede estar vacío");
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "rendimiento_label", value: clean }, { onConflict: "key" });
}

export async function saveRoomButtonLabel(label: string): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  const clean = sanitizeText(label, 40);
  if (!clean) throw new Error("El texto no puede estar vacío");
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "room_button_label", value: clean }, { onConflict: "key" });
}

export async function saveRoomPreviewEnabled(enabled: boolean): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "room_preview_enabled", value: String(enabled) }, { onConflict: "key" });
}

export async function saveSiteLogo2Url(url: string | null): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  if (url) {
    await supabaseAdmin
      .from("site_settings")
      .upsert({ key: "logo2_url", value: url }, { onConflict: "key" });
  } else {
    await supabaseAdmin.from("site_settings").delete().eq("key", "logo2_url");
  }
}

export async function saveSiteName(name: string): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  const clean = sanitizeText(name, LIMITS.SITE_NAME);
  if (!clean) throw new Error("El nombre del sitio no puede estar vacío");
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "site_name", value: clean }, { onConflict: "key" });
}

export async function saveSiteLogoUrl(url: string | null): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
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
  await requireAdmin();
  updateTag(CATALOG_TAG);
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

// ── Family banners (gradient per family) ───────────────────

export async function loadFamilyBanners(): Promise<Array<[string, string] | null>> {
  const { data } = await supabaseRead
    .from("site_settings")
    .select("value")
    .eq("key", "family_banners")
    .single();
  if (!data?.value) return [];
  try { return JSON.parse(data.value); } catch { return []; }
}

export async function saveFamilyBanners(banners: Array<[string, string] | null>): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "family_banners", value: JSON.stringify(banners) }, { onConflict: "key" });
}

// ── Color order (drag-and-drop reordering) ──────────────────

export async function loadColorOrders(): Promise<Record<string, string[]>> {
  const { data } = await supabaseRead
    .from("site_settings")
    .select("value")
    .eq("key", "color_orders")
    .single();
  if (!data?.value) return {};
  try { return JSON.parse(data.value); } catch { return {}; }
}

export async function saveColorOrder(familyName: string, codes: string[]): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  // Lectura fresca (sin caché) para no perder cambios en el read-modify-write.
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "color_orders")
    .single();
  const current: Record<string, string[]> = data?.value ? JSON.parse(data.value) : {};
  current[familyName] = codes;
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "color_orders", value: JSON.stringify(current) }, { onConflict: "key" });
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
  const PAGE = 1000;
  let all: CustomColor[] = [];
  let page = 0;
  while (true) {
    const { data } = await supabaseRead
      .from("custom_colors")
      .select("*")
      .order("created_at", { ascending: true })
      .range(page * PAGE, (page + 1) * PAGE - 1);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    page++;
  }
  const result: Record<string, CustomColor[]> = {};
  for (const row of all) {
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
  await requireAdmin();
  updateTag(CATALOG_TAG);
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
  await requireAdmin();
  updateTag(CATALOG_TAG);
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
  const { data } = await supabaseRead
    .from("site_settings")
    .select("value")
    .eq("key", "color_page_numbers")
    .single();
  if (!data?.value) return {};
  try { return JSON.parse(data.value); } catch { return {}; }
}

export async function saveColorPageNumber(originalCode: string, pageNumber: string | null): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
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
  await requireAdmin();
  updateTag(CATALOG_TAG);
  await supabaseAdmin.from("custom_colors").delete().eq("id", id);
}

// ── Built-in color overrides (name/code) ────────────────────

export async function loadColorNameOverrides(): Promise<Record<string, { name: string; code: string }>> {
  const { data } = await supabaseRead
    .from("site_settings")
    .select("value")
    .eq("key", "color_name_overrides")
    .single();
  if (!data?.value) return {};
  try { return JSON.parse(data.value); } catch { return {}; }
}

export async function saveColorNameOverride(originalCode: string, name: string, newCode: string): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
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
  const { data } = await supabaseRead
    .from("site_settings")
    .select("value")
    .eq("key", "deleted_colors")
    .single();
  if (!data?.value) return [];
  try { return JSON.parse(data.value) as string[]; } catch { return []; }
}

export async function saveDeletedColors(codes: string[]): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "deleted_colors", value: JSON.stringify(codes) }, { onConflict: "key" });
}

// ── Pedidos digitales (modo kiosko) ─────────────────────────

export interface OrderItemInput {
  name: string;
  code: string;
  hex: string;
  years: number;     // 2 | 3 | 4 | 7
  cubetas: number;
  galones: number;
}

export interface OrderInput {
  customerName: string;
  customerPhone: string;      // 10 dígitos
  items: OrderItemInput[];
  deposit: number;            // abono; se ignora si el método obliga pago completo
  paymentMethod: string;      // 'efectivo' | 'debito' | 'credito' | 'transferencia'
}

export interface OrderRow {
  id: number;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  items: Array<OrderItemInput & { subtotal: number }>;
  subtotal: number;
  deposit: number;
  balance: number;
  payment_method: string;
  paid_full: boolean;
  status: string;
}

const PAYMENT_METHODS = ["efectivo", "debito", "credito", "transferencia"];
const VALID_YEARS = [2, 3, 4, 7];

function priceToNumber(s: string | undefined): number {
  if (!s) return 0;
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

/**
 * Crea un pedido desde la tablet (kiosko, SIN sesión admin).
 * El total se recalcula en el servidor con los precios vigentes para
 * evitar manipulación desde el cliente. Aplica la regla de pago:
 * tarjeta/transferencia exigen pago completo; efectivo admite abono.
 */
export async function createOrder(
  input: OrderInput
): Promise<{ id: number; subtotal: number; deposit: number; balance: number; paidFull: boolean }> {
  // Anti-spam: límite por IP antes de hacer cualquier trabajo.
  const hdrs = await headers();
  const ip = (hdrs.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconocido";
  if (!withinOrderRateLimit(ip)) {
    throw new Error("Estás haciendo pedidos muy rápido. Espera un minuto e intenta de nuevo.");
  }
  const name = sanitizeText(input.customerName ?? "", 80);
  const phone = (input.customerPhone ?? "").replace(/\D/g, "");
  if (!name) throw new Error("El nombre del cliente es obligatorio");
  if (phone.length !== 10) throw new Error("El WhatsApp debe tener 10 dígitos");
  if (!Array.isArray(input.items) || input.items.length === 0) throw new Error("El carrito está vacío");
  if (input.items.length > 50) throw new Error("Demasiados productos en el pedido");
  const method = String(input.paymentMethod);
  if (!PAYMENT_METHODS.includes(method)) throw new Error("Método de pago inválido");

  // Precios vigentes para recomputar el total en el servidor.
  const [durPrices, galPrices] = await Promise.all([loadDurabilityPrices(), loadGalonPrices()]);

  const items = input.items.map((it) => {
    const years = Number(it.years);
    if (!VALID_YEARS.includes(years)) throw new Error("Calidad inválida en uno de los colores");
    const cubetas = Math.max(0, Math.floor(Number(it.cubetas) || 0));
    const galones = Math.max(0, Math.floor(Number(it.galones) || 0));
    if (cubetas + galones === 0) throw new Error("Cada color debe llevar al menos una cubeta o galón");
    const cubP = priceToNumber(durPrices[String(years)]);
    const galP = priceToNumber(galPrices[String(years)]);
    const subtotal = cubetas * cubP + galones * galP;
    return {
      name: sanitizeText(it.name ?? "", 80),
      code: sanitizeText(it.code ?? "", 40),
      hex: isValidHex(it.hex) ? it.hex : "#000000",
      years,
      cubetas,
      galones,
      subtotal,
    };
  });

  const subtotal = Math.round(items.reduce((a, b) => a + b.subtotal, 0) * 100) / 100;
  const cardOrTransfer = method === "debito" || method === "credito" || method === "transferencia";
  let deposit = Math.max(0, Number(input.deposit) || 0);
  if (cardOrTransfer) deposit = subtotal; // tarjeta/transferencia → pago completo obligatorio
  if (deposit > subtotal) deposit = subtotal;
  if (deposit <= 0) throw new Error("Debes registrar un abono o el pago completo");
  deposit = Math.round(deposit * 100) / 100;
  const balance = Math.round(Math.max(0, subtotal - deposit) * 100) / 100;
  const paidFull = balance <= 0;

  const { data, error } = await supabaseAdmin
    .from("orders")
    .insert({
      customer_name: name,
      customer_phone: phone,
      items,
      subtotal,
      deposit,
      balance,
      payment_method: method,
      paid_full: paidFull,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id as number, subtotal, deposit, balance, paidFull };
}

/** Lista los pedidos guardados (solo admin). */
export async function loadOrders(): Promise<OrderRow[]> {
  await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderRow[];
}

/** Cambia el estado de un pedido (solo admin). */
export async function updateOrderStatus(id: number, status: string): Promise<void> {
  await requireAdmin();
  const allowed = ["nuevo", "procesado", "entregado", "cancelado"];
  if (!allowed.includes(status)) throw new Error("Estado inválido");
  const { error } = await supabaseAdmin.from("orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Impermeabilizante (calculadora especial, modo kiosko) ────

export interface ImperConfig {
  enabled: boolean;
  name: string;
  price: string;        // precio por unidad, ej. "$1,200.00"
  coverageM2: number;   // m² que cubre 1 unidad a `coats` pasadas
  coats: number;        // pasadas base (def 2)
  unitLabel: string;    // presentación, ej. "Cubeta 19L"
  litersPerUnit: number; // litros por unidad (def 19) — para calcular el sobrante
}

const IMPER_DEFAULT: ImperConfig = {
  enabled: false,
  name: "Impermeabilizante",
  price: "",
  coverageM2: 19,
  coats: 2,
  unitLabel: "Cubeta 19L",
  litersPerUnit: 19,
};

export async function loadImpermeabilizante(): Promise<ImperConfig> {
  const { data } = await supabaseRead
    .from("site_settings")
    .select("value")
    .eq("key", "impermeabilizante")
    .single();
  if (!data?.value) return IMPER_DEFAULT;
  try {
    return { ...IMPER_DEFAULT, ...JSON.parse(data.value) };
  } catch {
    return IMPER_DEFAULT;
  }
}

export async function saveImpermeabilizante(cfg: ImperConfig): Promise<void> {
  await requireAdmin();
  updateTag(CATALOG_TAG);
  const clean: ImperConfig = {
    enabled: !!cfg.enabled,
    name: sanitizeText(cfg.name || "Impermeabilizante", 60),
    price: sanitizeText(cfg.price || "", 20),
    coverageM2: Math.max(1, Number(cfg.coverageM2) || 19),
    coats: Math.max(1, Math.min(5, Math.floor(Number(cfg.coats) || 2))),
    unitLabel: sanitizeText(cfg.unitLabel || "Cubeta 19L", 40),
    litersPerUnit: Math.max(1, Number(cfg.litersPerUnit) || 19),
  };
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: "impermeabilizante", value: JSON.stringify(clean) }, { onConflict: "key" });
}

// ── Carga inicial combinada ─────────────────────────────────
// Reúne en UNA sola server action todas las lecturas públicas que la
// página necesita al montar. Antes eran ~14 llamadas separadas (14
// invocaciones de función por cada cliente); ahora es 1, lo que reduce
// muchísimo la carga ante picos de tráfico. Las lecturas internas siguen
// cacheadas (Data Cache de Next), así que el egress de Supabase no cambia.
export async function loadInitialData() {
  const [
    colorSettings, site, durabilityPrices, galonPrices, durabilityOnSale,
    galonOnSale, customColors, nameOverrides, pageNumbers, deletedColors,
    familySettings, familyBanners, colorOrders, impermeabilizante,
  ] = await Promise.all([
    loadColorSettings(),
    loadSiteSettings(),
    loadDurabilityPrices(),
    loadGalonPrices(),
    loadDurabilityOnSale(),
    loadGalonOnSale(),
    loadCustomColors(),
    loadColorNameOverrides(),
    loadColorPageNumbers(),
    loadDeletedColors(),
    loadFamilySettings(),
    loadFamilyBanners(),
    loadColorOrders(),
    loadImpermeabilizante(),
  ]);
  return {
    colorSettings, site, durabilityPrices, galonPrices, durabilityOnSale,
    galonOnSale, customColors, nameOverrides, pageNumbers, deletedColors,
    familySettings, familyBanners, colorOrders, impermeabilizante,
  };
}
