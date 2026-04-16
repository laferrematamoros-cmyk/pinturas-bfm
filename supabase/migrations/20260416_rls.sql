-- ============================================================
-- Row Level Security — pinturas-bfm
-- ============================================================
-- Modelo de acceso:
--   anon  → solo SELECT (lectura pública del catálogo)
--   service_role → todo (bypasea RLS; usado en server actions)
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================


-- ── 1. color_settings ───────────────────────────────────────
--    Guarda overrides de hex y durabilidad por código de color.

ALTER TABLE color_settings ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores si existen
DROP POLICY IF EXISTS "anon_read_color_settings"  ON color_settings;
DROP POLICY IF EXISTS "anon_write_color_settings" ON color_settings;

-- Solo lectura pública
CREATE POLICY "anon_read_color_settings"
  ON color_settings
  FOR SELECT
  TO anon
  USING (true);


-- ── 2. site_settings ────────────────────────────────────────
--    Guarda nombre del sitio, logos, precios, overrides de nombre,
--    colores eliminados y flags de oferta.

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_site_settings"  ON site_settings;
DROP POLICY IF EXISTS "anon_write_site_settings" ON site_settings;

CREATE POLICY "anon_read_site_settings"
  ON site_settings
  FOR SELECT
  TO anon
  USING (true);


-- ── 3. custom_colors ────────────────────────────────────────
--    Colores agregados por el admin.

ALTER TABLE custom_colors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_custom_colors"  ON custom_colors;
DROP POLICY IF EXISTS "anon_write_custom_colors" ON custom_colors;

CREATE POLICY "anon_read_custom_colors"
  ON custom_colors
  FOR SELECT
  TO anon
  USING (true);


-- ── 4. Storage: pinturas-assets ─────────────────────────────
--    Logos subidos por el admin.

-- Lectura pública de objetos del bucket
DROP POLICY IF EXISTS "anon_read_pinturas_assets" ON storage.objects;

CREATE POLICY "anon_read_pinturas_assets"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'pinturas-assets');

-- Bloquear uploads directos desde anon
DROP POLICY IF EXISTS "anon_insert_pinturas_assets" ON storage.objects;
-- (sin crear política INSERT para anon → queda bloqueado por defecto)


-- ── Verificación ─────────────────────────────────────────────
-- Ejecuta esto para confirmar que RLS está habilitado:
--
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('color_settings', 'site_settings', 'custom_colors');
