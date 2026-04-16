// Strips null bytes and ASCII control characters (except tab/newline)
function stripControl(value: string): string {
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

export function sanitizeText(value: string, maxLength: number): string {
  return stripControl(value.trim()).slice(0, maxLength);
}

export function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

// Prices like "$870.00", "$ 870,00", "870" — digits, $, spaces, commas, dots
export function isValidPrice(value: string): boolean {
  return value.trim() === "" || /^[\$\s\d,\.]+$/.test(value.trim());
}

export const LIMITS = {
  COLOR_NAME: 80,
  COLOR_CODE: 40,
  SITE_NAME: 60,
  PRICE: 20,
};

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
