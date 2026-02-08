/**
 * API Route — Suppression d'images de Supabase Storage
 *
 * Role : Supprimer un fichier image de Supabase Storage.
 *        Utilise supabaseAdmin (service_role) pour bypasser les RLS,
 *        puisque Better Auth n'est pas compatible avec Supabase Auth.
 *
 * Interactions :
 *   - Verifie la session utilisateur via Better Auth (getSession)
 *   - Supprime le fichier via supabaseAdmin (service_role, bypass RLS)
 *   - Verifie que le chemin appartient a l'utilisateur connecte
 *
 * Endpoint : DELETE /api/upload/delete
 * Body JSON : { bucket: "avatars" | "portfolio", path: "userId/filename.jpg" }
 *
 * Reponse succes : { success: true }
 * Reponse erreur : { error: string }
 *
 * Exemple d'appel depuis le client :
 *   const res = await fetch("/api/upload/delete", {
 *     method: "DELETE",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ bucket: "portfolio", path: "user-123/photo.jpg" }),
 *   })
 */
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/shared/lib/auth/get-session"
import { STORAGE_BUCKETS } from "@/shared/lib/supabase/storage"

/** Liste des buckets autorises */
const ALLOWED_BUCKETS = Object.values(STORAGE_BUCKETS) as string[]

export async function DELETE(request: NextRequest) {
  // 1. Verifier la session Better Auth
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: "Non authentifie. Veuillez vous connecter." },
      { status: 401 }
    )
  }

  try {
    // 2. Extraire les donnees du body JSON
    const { bucket, path } = await request.json()

    // 3. Valider les champs requis
    if (!bucket || !path) {
      return NextResponse.json(
        { error: "Champs requis manquants : bucket, path" },
        { status: 400 }
      )
    }

    // 4. Valider le bucket
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json(
        { error: `Bucket invalide. Buckets autorises : ${ALLOWED_BUCKETS.join(", ")}` },
        { status: 400 }
      )
    }

    // 5. Verifier que le chemin appartient a l'utilisateur connecte
    if (!path.startsWith(session.user.id + "/")) {
      return NextResponse.json(
        { error: "Vous ne pouvez supprimer que vos propres images." },
        { status: 403 }
      )
    }

    // 6. Lire les variables d'environnement pour l'API REST Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[API Delete] Variables d'environnement Supabase manquantes")
      return NextResponse.json(
        { error: "Configuration serveur incomplete (Supabase)" },
        { status: 500 }
      )
    }

    // 7. Supprimer le fichier via l'API REST Supabase (bypass RLS avec service_role)
    //    Endpoint : DELETE /storage/v1/object/{bucket}/{path}
    const deleteUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`
    const deleteResponse = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
    })

    if (!deleteResponse.ok) {
      const errorBody = await deleteResponse.text()
      console.error(`[API Delete] Erreur Supabase Storage (${deleteResponse.status}):`, errorBody)
      return NextResponse.json(
        { error: "Erreur lors de la suppression du fichier" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API Delete] Erreur inattendue:", error)
    return NextResponse.json(
      { error: "Erreur serveur inattendue lors de la suppression" },
      { status: 500 }
    )
  }
}
