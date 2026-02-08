/**
 * Supabase Client (cote serveur)
 *
 * Role : Fournir un client Supabase avec les droits admin (service role)
 *        pour les operations sensibles cote serveur.
 *
 * Interactions :
 *   - Utilise SUPABASE_SERVICE_ROLE_KEY (jamais expose cote client)
 *   - Importe dans les server actions et API routes uniquement
 *   - Contourne les RLS policies (acces complet)
 *
 * Exemple :
 *   import { supabaseAdmin } from "@/shared/lib/supabase/server"
 *   const { data } = await supabaseAdmin.storage.from("portfolio").list()
 */
import { createClient } from "@supabase/supabase-js"

// Client admin avec service role key — NE JAMAIS exposer cote client
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
