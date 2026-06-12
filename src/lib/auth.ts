import { cookies } from "next/headers";
import crypto from "crypto";

// Sesión de administrador basada en cookie httpOnly firmada (HMAC-SHA256).
// La protección REAL vive aquí: requireAdmin() se llama al inicio de cada
// acción de escritura en el servidor. El estado de admin en el cliente es
// solo para la interfaz; no concede ningún permiso.

const COOKIE_NAME = "bfm_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 horas

function getSecret(): string {
  // Idealmente ADMIN_SESSION_SECRET (dedicado); si no, cae al password.
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken(): string {
  const exp = String(Date.now() + MAX_AGE_SECONDS * 1000);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(exp);
  // Comparación de tiempo constante para no filtrar la firma.
  let match = false;
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    match = a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
  if (!match) return false;
  const expMs = Number(exp);
  return Number.isFinite(expMs) && Date.now() <= expMs;
}

/** Compara el password recibido contra ADMIN_PASSWORD (server-only), en tiempo constante. */
export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

/** Lanza si la petición no tiene una sesión de admin válida. Usar al inicio de cada acción de escritura. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("No autorizado");
  }
}

export async function setAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
