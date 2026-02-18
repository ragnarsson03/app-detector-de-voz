/**
 * Cliente de Supabase (Singleton)
 * Se usa tanto en el cliente (React) como en las API Routes del servidor.
 * Las credenciales se leen de las variables de entorno.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
