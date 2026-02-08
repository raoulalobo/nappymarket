/**
 * service-actions.ts — Server actions pour les services/prestations
 *
 * Role : Gerer les services proposes par une coiffeuse (ajout, suppression).
 *        Un service lie une coiffeuse a une categorie avec un prix et une duree.
 *
 * Interactions :
 *   - Utilise getSession() pour verifier l'authentification
 *   - Utilise Prisma (db) pour les operations BDD
 *   - Les categories sont gerees par l'admin (module admin)
 *   - Le prix est converti en centimes pour le stockage
 *
 * Exemple :
 *   const services = await getStylistServices()
 *   await addStylistService({ categoryId: "...", price: 45, durationMinutes: 150 })
 *   await removeStylistService("service-id")
 */
"use server"

import { db } from "@/shared/lib/db"
import { getSession } from "@/shared/lib/auth/get-session"
import { serviceSchema } from "../schemas/stylist-schemas"
import type { ActionResult } from "@/shared/types"
import type { StylistService, ServiceCategory } from "@prisma/client"

/** Type de service avec la categorie incluse */
export type ServiceWithCategory = StylistService & {
  category: ServiceCategory
}

/**
 * getStylistServices — Recuperer les services de la coiffeuse connectee
 *
 * Retourne les services avec le detail de la categorie.
 */
export async function getStylistServices(): Promise<
  ActionResult<ServiceWithCategory[]>
> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }
  if (session.user.role !== "STYLIST") return { success: false, error: "Acces reserve aux coiffeuses" }

  const profile = await db.stylistProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!profile) return { success: true, data: [] }

  const services = await db.stylistService.findMany({
    where: { stylistId: profile.id },
    include: { category: true },
    orderBy: { category: { name: "asc" } },
  })

  return { success: true, data: services }
}

/**
 * addStylistService — Ajouter un service a la coiffeuse
 *
 * Le prix est recu en euros et converti en centimes pour le stockage.
 * Verifie qu'un service pour cette categorie n'existe pas deja.
 */
export async function addStylistService(
  input: unknown
): Promise<ActionResult<ServiceWithCategory>> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }
  if (session.user.role !== "STYLIST") return { success: false, error: "Acces reserve aux coiffeuses" }

  // Valider les donnees
  const parsed = serviceSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Donnees invalides" }
  }

  const { categoryId, price, durationMinutes, description } = parsed.data

  // Recuperer le profil
  const profile = await db.stylistProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!profile) {
    return { success: false, error: "Veuillez d'abord completer votre profil" }
  }

  // Verifier que la categorie existe et est active
  const category = await db.serviceCategory.findUnique({
    where: { id: categoryId },
  })

  if (!category || !category.isActive) {
    return { success: false, error: "Categorie invalide ou inactive" }
  }

  // Verifier qu'un service pour cette categorie n'existe pas deja
  const existing = await db.stylistService.findUnique({
    where: {
      stylistId_categoryId: {
        stylistId: profile.id,
        categoryId,
      },
    },
  })

  if (existing) {
    return { success: false, error: "Vous proposez deja un service dans cette categorie" }
  }

  // Creer le service (prix converti en centimes)
  const service = await db.stylistService.create({
    data: {
      stylistId: profile.id,
      categoryId,
      price: Math.round(price * 100), // Conversion euros -> centimes
      durationMinutes,
      description: description || null,
    },
    include: { category: true },
  })

  return { success: true, data: service }
}

/**
 * removeStylistService — Supprimer un service de la coiffeuse
 *
 * Verifie que le service appartient bien a la coiffeuse connectee.
 */
export async function removeStylistService(
  serviceId: string
): Promise<ActionResult<{ id: string }>> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }
  if (session.user.role !== "STYLIST") return { success: false, error: "Acces reserve aux coiffeuses" }

  const profile = await db.stylistProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!profile) return { success: false, error: "Profil non trouve" }

  // Verifier que le service appartient a cette coiffeuse
  const service = await db.stylistService.findFirst({
    where: { id: serviceId, stylistId: profile.id },
  })

  if (!service) return { success: false, error: "Service non trouve" }

  await db.stylistService.delete({ where: { id: serviceId } })

  return { success: true, data: { id: serviceId } }
}

/**
 * getAvailableCategories — Recuperer les categories disponibles
 *
 * Retourne toutes les categories actives (pour le formulaire d'ajout de service).
 * Accessible a tous les utilisateurs connectes.
 */
export async function getAvailableCategories(): Promise<
  ActionResult<ServiceCategory[]>
> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }

  const categories = await db.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })

  return { success: true, data: categories }
}
