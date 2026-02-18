import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ ERROR: Faltan variables de entorno de Supabase en el servidor.");
}

// Creamos el cliente solo si tenemos la llave, evitando el crash
export const supabaseServer = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false, // Importante en el servidor
        },
    })
    : null;
