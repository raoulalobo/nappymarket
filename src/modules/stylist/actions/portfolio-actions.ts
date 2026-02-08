/**
 * portfolio-actions.ts — Server actions pour le portfolio coiffeuse
 *
 * Role : Gerer l'ajout et la suppression de photos du portfolio.
 *        Verifie le nombre max d'images (MAX_PORTFOLIO_IMAGES).
 *
 * Interactions :
 *   - Utilise getSession() pour verifier l'authentification
 *   - Utilise Prisma (db) pour les operations BDD
 *   - Les images sont stockees sur Supabase Storage (bucket "portfolio")
 *   - L'URL est sauvegardee dans la table PortfolioImage
 *
 * Exemple :
 *   const images = await getPortfolioImages()
 *   const added = await addPortfolioImage({ url: "https://...", caption: "Tresses" })
 *   const removed = await removePortfolioImage("image-id")
 */
"use server"

import { db } from "@/shared/lib/db"
import { getSession } from "@/shared/lib/auth/get-session"
import { MAX_PORTFOLIO_IMAGES } from "@/shared/lib/constants"
import type { ActionResult } from "@/shared/types"
import type { PortfolioImage } from "@prisma/client"

/**
 * getPortfolioImages — Recuperer les images du portfolio de la coiffeuse connectee
 *
 * Retourne les images triees par date de creation (plus recentes en premier).
 */
export async function getPortfolioImages(): Promise<ActionResult<PortfolioImage[]>> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }
  if (session.user.role !== "STYLIST") return { success: false, error: "Acces reserve aux coiffeuses" }

  // Recuperer le profil pour avoir l'ID stylist
  const profile = await db.stylistProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!profile) return { success: true, data: [] }

  const images = await db.portfolioImage.findMany({
    where: { stylistId: profile.id },
    orderBy: { createdAt: "desc" },
  })

  return { success: true, data: images }
}

/**
 * addPortfolioImage — Ajouter une image au portfolio
 *
 * Verifie que le nombre max d'images n'est pas atteint.
 *
 * @param input - { url: string, caption?: string }
 */
export async function addPortfolioImage(input: {
  url: string
  caption?: string
}): Promise<ActionResult<PortfolioImage>> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }
  if (session.user.role !== "STYLIST") return { success: false, error: "Acces reserve aux coiffeuses" }

  // Recuperer ou creer le profil
  let profile = await db.stylistProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!profile) {
    return { success: false, error: "Veuillez d'abord completer votre profil" }
  }

  // Verifier le nombre max d'images
  const count = await db.portfolioImage.count({
    where: { stylistId: profile.id },
  })

  if (count >= MAX_PORTFOLIO_IMAGES) {
    return {
      success: false,
      error: `Vous avez atteint la limite de ${MAX_PORTFOLIO_IMAGES} photos`,
    }
  }

  // Ajouter l'image
  const image = await db.portfolioImage.create({
    data: {
      stylistId: profile.id,
      url: input.url,
      caption: input.caption || null,
    },
  })

  return { success: true, data: image }
}

/**
 * removePortfolioImage — Supprimer une image du portfolio
 *
 * Verifie que l'image appartient bien a la coiffeuse connectee.
 *
 * @param imageId - ID de l'image a supprimer
 */
export async function removePortfolioImage(
  imageId: string
): Promise<ActionResult<{ id: string }>> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }
  if (session.user.role !== "STYLIST") return { success: false, error: "Acces reserve aux coiffeuses" }

  const profile = await db.stylistProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!profile) return { success: false, error: "Profil non trouve" }

  // Verifier que l'image appartient a cette coiffeuse
  const image = await db.portfolioImage.findFirst({
    where: { id: imageId, stylistId: profile.id },
  })

  if (!image) return { success: false, error: "Image non trouvee" }

  // Supprimer le fichier de Supabase Storage via l'API REST directement
  // URL format : https://xxx.supabase.co/storage/v1/object/public/portfolio/userId/file.jpg
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const imageUrl = new URL(image.url)
    const pathParts = imageUrl.pathname.split("/storage/v1/object/public/portfolio/")

    if (supabaseUrl && serviceRoleKey && pathParts.length === 2 && pathParts[1]) {
      const deleteUrl = `${supabaseUrl}/storage/v1/object/portfolio/${pathParts[1]}`
      await fetch(deleteUrl, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${serviceRoleKey}` },
      })
    }
  } catch {
    // Ignorer l'erreur de suppression du fichier storage (non bloquant)
    console.error(`Erreur suppression Storage pour image ${imageId}`)
  }

  // Supprimer l'enregistrement de la BDD
  await db.portfolioImage.delete({ where: { id: imageId } })

  return { success: true, data: { id: imageId } }
}
