/**
 * Supabase Client (cote navigateur)
 *
 * Role : Fournir un client Supabase pour les operations cote client.
 *        Utilise pour Storage (upload images) et Realtime (chat).
 *
 * Interactions :
 *   - Utilise NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   - Importe dans les composants "use client" uniquement
 *
 * Exemple :
 *   import { supabase } from "@/shared/lib/supabase/client"
 *   const { data } = await supabase.storage.from("portfolio").upload(...)
 */
import { createClient } from "@supabase/supabase-js"

// Creer le client Supabase avec les cles publiques
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
