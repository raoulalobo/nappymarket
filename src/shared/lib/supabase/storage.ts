/**
 * storage.ts — Utilitaires Supabase Storage pour l'upload d'images
 *
 * Role : Fournir des fonctions d'upload et de suppression d'images
 *        vers Supabase Storage. L'upload passe par l'API route serveur
 *        (/api/upload/image) qui utilise supabaseAdmin (service_role)
 *        pour bypasser les policies RLS.
 *
 * Interactions :
 *   - uploadImage() envoie le fichier a /api/upload/image (POST FormData)
 *   - deleteImage() utilise le client Supabase navigateur (suppression cote client)
 *   - getPublicUrl() genere l'URL publique d'un fichier
 *   - generateStoragePath() cree un chemin unique {userId}/{timestamp}-{random}.{ext}
 *
 * Pourquoi passer par l'API route ?
 *   NappyMarket utilise Better Auth (pas Supabase Auth). Les RLS policies
 *   de Supabase Storage basees sur auth.role() ne fonctionnent pas avec
 *   les utilisateurs Better Auth. L'API route verifie la session Better Auth
 *   puis upload via supabaseAdmin qui bypass les RLS.
 *
 * Buckets :
 *   - "avatars" : photos de profil (1 par utilisateur)
 *   - "portfolio" : photos de realisations des coiffeuses (max 20)
 *   - "categories" : images des categories de services (gere par admin)
 *   - "gallery" : images de la galerie publique Inspirations (gere par admin)
 *
 * Exemple :
 *   import { uploadImage, deleteImage, getPublicUrl } from "@/shared/lib/supabase/storage"
 *   const result = await uploadImage("portfolio", file, "user-123/photo-1.jpg")
 *   const publicUrl = getPublicUrl("portfolio", "user-123/photo-1.jpg")
 *   await deleteImage("portfolio", "user-123/photo-1.jpg")
 */
import { supabase } from "./client"

/** Noms des buckets Supabase Storage */
export const STORAGE_BUCKETS = {
  AVATARS: "avatars",
  PORTFOLIO: "portfolio",
  CATEGORIES: "categories",
  GALLERY: "gallery",
} as const

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS]

/**
 * uploadImage — Uploader un fichier vers Supabase Storage via l'API serveur
 *
 * Envoie le fichier au endpoint /api/upload/image qui verifie la session
 * Better Auth et upload via supabaseAdmin (service_role, bypass RLS).
 *
 * @param bucket - Nom du bucket ("avatars" | "portfolio")
 * @param file - Fichier a uploader (File ou Blob)
 * @param path - Chemin de stockage (ex: "user-123/photo.jpg")
 * @returns L'URL publique de l'image uploadee, ou une erreur
 *
 * Exemple :
 *   const result = await uploadImage("portfolio", file, "user-123/photo-1.jpg")
 *   if ("error" in result) console.error(result.error)
 *   else console.log("URL:", result.url)
 */
export async function uploadImage(
  bucket: StorageBucket,
  file: File,
  path: string
): Promise<{ url: string } | { error: string }> {
  try {
    // Construire le FormData a envoyer a l'API route
    const formData = new FormData()
    formData.append("file", file)
    formData.append("bucket", bucket)
    formData.append("path", path)

    // Appeler l'API route serveur (POST /api/upload/image)
    const response = await fetch("/api/upload/image", {
      method: "POST",
      body: formData,
      // Les cookies de session Better Auth sont envoyes automatiquement
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`Erreur upload ${bucket}/${path}:`, data.error)
      return { error: data.error || "Erreur lors de l'upload" }
    }

    return { url: data.url }
  } catch (error) {
    console.error(`Erreur inattendue upload ${bucket}/${path}:`, error)
    return { error: "Erreur de connexion lors de l'upload" }
  }
}

/**
 * deleteImage — Supprimer un fichier de Supabase Storage via l'API serveur
 *
 * Appelle DELETE /api/upload/delete qui utilise supabaseAdmin (service_role)
 * pour bypasser les RLS. La session Better Auth est verifiee cote serveur.
 *
 * @param bucket - Nom du bucket
 * @param path - Chemin du fichier a supprimer
 * @returns true si supprime, false en cas d'erreur
 *
 * Exemple :
 *   await deleteImage("portfolio", "user-123/photo-1.jpg")
 */
export async function deleteImage(
  bucket: StorageBucket,
  path: string
): Promise<boolean> {
  try {
    const response = await fetch("/api/upload/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucket, path }),
    })

    if (!response.ok) {
      const data = await response.json()
      console.error(`Erreur suppression ${bucket}/${path}:`, data.error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Erreur inattendue suppression ${bucket}/${path}:`, error)
    return false
  }
}

/**
 * getPublicUrl — Obtenir l'URL publique d'un fichier Supabase Storage
 *
 * @param bucket - Nom du bucket
 * @param path - Chemin du fichier
 * @returns L'URL publique
 *
 * Exemple :
 *   getPublicUrl("avatars", "user-123/avatar.jpg")
 *   // "https://xxx.supabase.co/storage/v1/object/public/avatars/user-123/avatar.jpg"
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * generateStoragePath — Generer un chemin de stockage unique
 *
 * Cree un chemin structure : {userId}/{timestamp}-{random}.{ext}
 * Evite les collisions de noms de fichiers.
 *
 * @param userId - ID de l'utilisateur proprietaire
 * @param fileName - Nom du fichier original (pour extraire l'extension)
 * @returns Le chemin unique genere
 *
 * Exemple :
 *   generateStoragePath("user-123", "photo.jpg")
 *   // "user-123/1707321600000-a1b2c3.jpg"
 */
export function generateStoragePath(userId: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "jpg"
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${userId}/${timestamp}-${random}.${ext}`
}
