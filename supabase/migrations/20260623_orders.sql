-- ============================================================
-- Pedidos digitales (modo kiosko) — pinturas-bfm
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
--
-- Modelo de acceso:
--   anon         → SIN acceso directo (ni lectura ni escritura)
--   service_role → todo (server actions: createOrder / loadOrders)
--
-- El pedido se crea desde la tablet (kiosko, sin sesión admin) a
-- través de la server action createOrder(), que valida e inserta
-- con la service_role. La lectura de pedidos exige sesión admin.
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- folio del pedido
  created_at     timestamptz NOT NULL DEFAULT now(),
  customer_name  text        NOT NULL,
  customer_phone text        NOT NULL,          -- 10 dígitos (México)
  items          jsonb       NOT NULL,          -- [{ name, code, hex, years, cubetas, galones, subtotal }]
  subtotal       numeric(10,2) NOT NULL DEFAULT 0,
  deposit        numeric(10,2) NOT NULL DEFAULT 0,
  balance        numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text        NOT NULL,          -- 'efectivo' | 'debito' | 'credito' | 'transferencia'
  paid_full      boolean     NOT NULL DEFAULT false,
  status         text        NOT NULL DEFAULT 'nuevo' -- 'nuevo' | 'procesado' | 'entregado' | 'cancelado'
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Sin políticas para anon → todo acceso directo queda bloqueado.
-- Las server actions usan service_role, que bypasea RLS.
DROP POLICY IF EXISTS "anon_read_orders"  ON orders;
DROP POLICY IF EXISTS "anon_write_orders" ON orders;
