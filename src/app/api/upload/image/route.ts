/**
 * API Route — Upload d'images vers Supabase Storage
 *
 * Role : Recevoir un fichier image depuis le client, valider la session
 *        Better Auth, puis uploader le fichier via supabaseAdmin (service_role).
 *        Utiliser le client admin permet de bypasser les policies RLS de
 *        Supabase Storage, puisque l'authentification est geree par Better Auth.
 *
 * Interactions :
 *   - Verifie la session utilisateur via Better Auth (getSession)
 *   - Upload vers Supabase Storage via supabaseAdmin (server.ts)
 *   - Retourne l'URL publique de l'image uploadee
 *
 * Endpoint : POST /api/upload/image
 * Body : FormData avec les champs :
 *   - file : File (image JPG, PNG ou WebP, max 5 Mo)
 *   - bucket : "avatars" | "portfolio"
 *   - path : chemin de stockage (ex: "user-123/1707321600000-a1b2c3.jpg")
 *
 * Reponse succes : { url: string }
 * Reponse erreur : { error: string }
 *
 * Exemple d'appel depuis le client :
 *   const formData = new FormData()
 *   formData.append("file", file)
 *   formData.append("bucket", "portfolio")
 *   formData.append("path", "user-123/photo.jpg")
 *   const res = await fetch("/api/upload/image", { method: "POST", body: formData })
 *   const { url } = await res.json()
 */
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/shared/lib/auth/get-session"
import {
  MAX_IMAGE_SIZE_BYTES,
  ACCEPTED_IMAGE_TYPES,
} from "@/shared/lib/constants"
import { STORAGE_BUCKETS } from "@/shared/lib/supabase/storage"

/** Liste des buckets autorises pour l'upload */
const ALLOWED_BUCKETS = Object.values(STORAGE_BUCKETS) as string[]

export async function POST(request: NextRequest) {
  // 1. Verifier la session Better Auth
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: "Non authentifie. Veuillez vous connecter." },
      { status: 401 }
    )
  }

  try {
    // 2. Extraire les donnees du FormData
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const bucket = formData.get("bucket") as string | null
    const path = formData.get("path") as string | null

    // 3. Valider les champs requis
    if (!file || !bucket || !path) {
      return NextResponse.json(
        { error: "Champs requis manquants : file, bucket, path" },
        { status: 400 }
      )
    }

    // 4. Valider le bucket (eviter l'acces a des buckets non autorises)
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json(
        { error: `Bucket invalide. Buckets autorises : ${ALLOWED_BUCKETS.join(", ")}` },
        { status: 400 }
      )
    }

    // 5. Valider le type MIME du fichier
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non supporte. Utilisez JPG, PNG ou WebP." },
        { status: 400 }
      )
    }

    // 6. Valider la taille du fichier
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const maxMB = MAX_IMAGE_SIZE_BYTES / (1024 * 1024)
      return NextResponse.json(
        { error: `L'image ne doit pas depasser ${maxMB} Mo` },
        { status: 400 }
      )
    }

    // 7. Verifier que le chemin commence par l'ID utilisateur (securite)
    //    Empeche un utilisateur d'ecrire dans le dossier d'un autre
    if (!path.startsWith(session.user.id + "/")) {
      return NextResponse.json(
        { error: "Chemin de stockage invalide. Doit commencer par votre ID utilisateur." },
        { status: 403 }
      )
    }

    // 8. Lire les variables d'environnement pour l'API REST Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[API Upload] Variables d'environnement Supabase manquantes")
      return NextResponse.json(
        { error: "Configuration serveur incomplete (Supabase)" },
        { status: 500 }
      )
    }

    // 9. Convertir le File en ArrayBuffer pour l'upload
    const arrayBuffer = await file.arrayBuffer()

    // 10. Uploader vers Supabase Storage via l'API REST directement
    //     On utilise l'API REST au lieu du SDK JS pour eviter les problemes
    //     de compatibilite fetch/Buffer dans l'environnement Node.js de Next.js.
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Content-Type": file.type,
        // Ecraser le fichier existant (pour mise a jour d'avatar)
        "x-upsert": "true",
      },
      body: arrayBuffer,
    })

    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.text()
      console.error(`[API Upload] Erreur Supabase Storage (${uploadResponse.status}):`, errorBody)
      return NextResponse.json(
        { error: "Erreur lors de l'upload vers le stockage" },
        { status: 500 }
      )
    }

    // 11. Construire et retourner l'URL publique
    //     Format : {supabaseUrl}/storage/v1/object/public/{bucket}/{path}
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error("[API Upload] Erreur inattendue:", error)
    return NextResponse.json(
      { error: "Erreur serveur inattendue lors de l'upload" },
      { status: 500 }
    )
  }
}
