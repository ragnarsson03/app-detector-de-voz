// src/lib/supabase-server.ts

import { createClient } from "@supabase/supabase-js";

// Importa las variables de entorno para el backend (NO usa NEXT_PUBLIC_!)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

// Crear un cliente de Supabase usando la clave SECRETA (Service Role Key).
// Este cliente tiene privilegios de administrador para la subida segura.
export const supabaseServer = createClient(SUPABASE_URL, SERVICE_KEY);