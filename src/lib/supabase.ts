import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente público — para lecturas (visitantes)
export const supabase = createClient(url, anon);

// Cliente admin — para escrituras (solo se usa en server actions)
export const supabaseAdmin = service
  ? createClient(url, service)
  : supabase;
