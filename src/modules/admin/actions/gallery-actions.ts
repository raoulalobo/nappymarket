/**
 * gallery-actions.ts — Server actions pour la gestion de la galerie Inspirations
 *
 * Role : Fournir les operations CRUD sur les images de la galerie publique.
 *        Les actions de modification sont reservees aux ADMIN.
 *        La lecture publique (getPublicGalleryImages) est accessible a tous.
 *
 * Interactions :
 *   - Utilise getSession() pour verifier l'authentification et le role ADMIN
 *   - Utilise Prisma (db) pour les operations BDD sur gallery_images
 *   - Retourne des ActionResult<T> standardises
 *   - Les images actives sont affichees sur la page publique /inspirations
 *   - Les images sont stockees sur Supabase Storage (bucket "gallery")
 *
 * Exemple :
 *   const result = await getGalleryImages()
 *   // result = { success: true, data: [{ id: "...", title: "Tresses", ... }] }
 *
 *   await createGalleryImage({ title: "Tresses elegantes", imageUrl: "https://..." })
 *   await updateGalleryImage("img-id", { title: "Nouveau titre" })
 *   await toggleGalleryImageActive("img-id")
 *   await deleteGalleryImage("img-id")
 */
"use server"

import { db } from "@/shared/lib/db"
import { getSession } from "@/shared/lib/auth/get-session"
import type { ActionResult } from "@/shared/types"
import type { GalleryImage } from "@prisma/client"

/* ------------------------------------------------------------------ */
/* Helpers internes                                                    */
/* ------------------------------------------------------------------ */

/**
 * verifyAdmin — Verifie que l'utilisateur est connecte et a le role ADMIN
 *
 * Retourne null si tout est OK, ou un ActionResult d'erreur sinon.
 * Permet de factoriser la verification dans chaque action.
 *
 * Exemple :
 *   const error = await verifyAdmin()
 *   if (error) return error // retourne l'erreur au client
 */
async function verifyAdmin(): Promise<ActionResult<never> | null> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }
  if (session.user.role !== "ADMIN") return { success: false, error: "Acces reserve aux administrateurs" }
  return null
}

/* ------------------------------------------------------------------ */
/* Actions admin (protegees par verifyAdmin)                           */
/* ------------------------------------------------------------------ */

/**
 * getGalleryImages — Recuperer toutes les images de la galerie (admin)
 *
 * L'admin voit toutes les images (actives et inactives),
 * triees par sortOrder croissant puis par date de creation.
 *
 * Exemple de retour :
 *   {
 *     success: true,
 *     data: [
 *       { id: "abc", title: "Tresses", imageUrl: "...", isActive: true, sortOrder: 0 },
 *       { id: "def", title: "Locks", imageUrl: "...", isActive: false, sortOrder: 1 },
 *     ]
 *   }
 */
export async function getGalleryImages(): Promise<ActionResult<GalleryImage[]>> {
  const error = await verifyAdmin()
  if (error) return error

  const images = await db.galleryImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  })

  return { success: true, data: images }
}

/**
 * createGalleryImage — Creer une nouvelle image dans la galerie
 *
 * @param input - Donnees de l'image a creer
 * @param input.title - Titre de l'image (obligatoire, min 2 caracteres)
 * @param input.description - Description optionnelle
 * @param input.imageUrl - URL Supabase Storage de l'image (obligatoire)
 * @param input.sortOrder - Ordre d'affichage (optionnel, defaut 0)
 *
 * Exemple :
 *   await createGalleryImage({
 *     title: "Tresses elegantes",
 *     description: "Box braids avec fils dores",
 *     imageUrl: "https://xxx.supabase.co/storage/v1/object/public/gallery/...",
 *     sortOrder: 1,
 *   })
 */
export async function createGalleryImage(
  input: { title: string; description?: string; imageUrl: string; sortOrder?: number }
): Promise<ActionResult<GalleryImage>> {
  const error = await verifyAdmin()
  if (error) return error

  const { title, description, imageUrl, sortOrder } = input

  // Validation basique des champs obligatoires
  if (!title || title.trim().length < 2) {
    return { success: false, error: "Le titre doit contenir au moins 2 caracteres" }
  }
  if (!imageUrl) {
    return { success: false, error: "L'image est obligatoire" }
  }

  const image = await db.galleryImage.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      imageUrl,
      sortOrder: sortOrder ?? 0,
    },
  })

  return { success: true, data: image }
}

/**
 * updateGalleryImage — Mettre a jour une image existante de la galerie
 *
 * Permet de modifier le titre, la description, l'URL image et/ou l'ordre.
 *
 * @param id - Identifiant CUID de l'image a modifier
 * @param input - Champs a mettre a jour (tous optionnels)
 *
 * Exemple :
 *   await updateGalleryImage("img-id", { title: "Nouveau titre", sortOrder: 5 })
 */
export async function updateGalleryImage(
  id: string,
  input: { title?: string; description?: string | null; imageUrl?: string; sortOrder?: number }
): Promise<ActionResult<GalleryImage>> {
  const error = await verifyAdmin()
  if (error) return error

  // Verifier que l'image existe
  const existing = await db.galleryImage.findUnique({ where: { id } })
  if (!existing) {
    return { success: false, error: "Image non trouvee" }
  }

  // Validation du titre si fourni
  if (input.title !== undefined && input.title.trim().length < 2) {
    return { success: false, error: "Le titre doit contenir au moins 2 caracteres" }
  }

  const image = await db.galleryImage.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.description !== undefined && { description: input.description?.trim() || null }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    },
  })

  return { success: true, data: image }
}

/**
 * toggleGalleryImageActive — Basculer la visibilite d'une image
 *
 * Si l'image est active, elle devient inactive (masquee de la page publique).
 * Si l'image est inactive, elle redevient visible.
 *
 * @param id - Identifiant CUID de l'image
 *
 * Exemple :
 *   await toggleGalleryImageActive("img-id")
 */
export async function toggleGalleryImageActive(
  id: string
): Promise<ActionResult<GalleryImage>> {
  const error = await verifyAdmin()
  if (error) return error

  const existing = await db.galleryImage.findUnique({ where: { id } })
  if (!existing) {
    return { success: false, error: "Image non trouvee" }
  }

  const image = await db.galleryImage.update({
    where: { id },
    data: { isActive: !existing.isActive },
  })

  return { success: true, data: image }
}

/**
 * deleteGalleryImage — Supprimer une image de la galerie
 *
 * Supprime l'enregistrement en BDD. L'image sur Supabase Storage
 * n'est pas supprimee automatiquement (peut etre nettoyee manuellement).
 *
 * @param id - Identifiant CUID de l'image a supprimer
 *
 * Exemple :
 *   await deleteGalleryImage("img-id")
 */
export async function deleteGalleryImage(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const error = await verifyAdmin()
  if (error) return error

  const existing = await db.galleryImage.findUnique({ where: { id } })
  if (!existing) {
    return { success: false, error: "Image non trouvee" }
  }

  await db.galleryImage.delete({ where: { id } })

  return { success: true, data: { id } }
}

/* ------------------------------------------------------------------ */
/* Action publique (pas de verifyAdmin)                                */
/* ------------------------------------------------------------------ */

/**
 * getPublicGalleryImages — Recuperer les images actives de la galerie (public)
 *
 * Accessible a tous (visiteurs, clientes, coiffeuses).
 * Retourne uniquement les images actives, triees par sortOrder puis createdAt.
 * Utilisee par la page publique /inspirations (Server Component).
 *
 * Exemple de retour :
 *   {
 *     success: true,
 *     data: [
 *       { id: "abc", title: "Tresses", imageUrl: "...", sortOrder: 0 },
 *       { id: "def", title: "Locks", imageUrl: "...", sortOrder: 1 },
 *     ]
 *   }
 */
export async function getPublicGalleryImages(): Promise<ActionResult<GalleryImage[]>> {
  const images = await db.galleryImage.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  })

  return { success: true, data: images }
}
