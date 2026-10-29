-- ============================================================
-- Cerrar la base a la llave pública (anon) — pinturas-bfm
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
--
-- Por qué: el 2026-10-29 se comprobó que con la llave pública se podían
-- MODIFICAR color_settings y site_settings, y LEER el token del kiosko
-- (site_settings.kiosk_orders_token), que da acceso a los pedidos. La
-- migración 20260416_rls.sql no estaba aplicada.
--
-- La app lee y escribe SOLO desde el servidor con service_role (que se salta
-- RLS), así que quitarle todo a anon no cambia nada en la página ni en el
-- kiosko. Se comprobó antes: los pedidos de julio se crearon con RLS ya
-- prendido en "orders".
-- ============================================================

-- 1. Quitar cualquier política que haya (nombres desconocidos incluidos).
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('color_settings', 'site_settings', 'custom_colors', 'orders')
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- 2. Prender RLS sin políticas: anon y authenticated no ven ni escriben nada.
alter table public.color_settings enable row level security;
alter table public.site_settings  enable row level security;
alter table public.custom_colors  enable row level security;
alter table public.orders         enable row level security;

-- 3. Comprobación: las 4 deben decir "true" y la segunda consulta no debe traer filas.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('color_settings', 'site_settings', 'custom_colors', 'orders');

select tablename, policyname
from pg_policies
where schemaname = 'public'
  and tablename in ('color_settings', 'site_settings', 'custom_colors', 'orders');
