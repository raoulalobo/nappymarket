/**
 * category-actions.ts — Server actions pour la gestion des categories de services
 *
 * Role : Fournir les operations CRUD sur les categories de services
 *        (ServiceCategory). Reserve exclusivement aux utilisateurs avec
 *        le role ADMIN. Les categories definissent les types de prestations
 *        disponibles sur la marketplace (tresses, locks, coloration, etc.).
 *
 * Interactions :
 *   - Utilise getSession() pour verifier l'authentification et le role ADMIN
 *   - Utilise Prisma (db) pour les operations BDD sur service_categories
 *   - Retourne des ActionResult<T> standardises
 *   - Les categories sont ensuite utilisees par les coiffeuses via le
 *     module stylist (service-actions.ts > getAvailableCategories)
 *
 * Exemple :
 *   const result = await getCategories()
 *   // result = { success: true, data: [{ id: "...", name: "Tresses", ... }] }
 *
 *   await createCategory({ name: "Locks", description: "Installation et entretien" })
 *   await updateCategory("cat-id", { isActive: false })
 *   await deleteCategory("cat-id") // echoue si des services sont lies
 */
"use server"

import { db } from "@/shared/lib/db"
import { getSession } from "@/shared/lib/auth/get-session"
import type { ActionResult } from "@/shared/types"
import type { ServiceCategory } from "@prisma/client"

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
/* Actions                                                             */
/* ------------------------------------------------------------------ */

/**
 * getCategories — Recuperer toutes les categories (actives et inactives)
 *
 * L'admin voit toutes les categories, y compris les inactives,
 * pour pouvoir les reactiver si besoin. Triees par nom alphabetique.
 *
 * Exemple de retour :
 *   {
 *     success: true,
 *     data: [
 *       { id: "abc", name: "Coloration", description: "...", isActive: true },
 *       { id: "def", name: "Tresses", description: null, isActive: false },
 *     ]
 *   }
 */
export async function getCategories(): Promise<ActionResult<ServiceCategory[]>> {
  const error = await verifyAdmin()
  if (error) return error

  const categories = await db.serviceCategory.findMany({
    orderBy: { name: "asc" },
  })

  return { success: true, data: categories }
}

/**
 * createCategory — Creer une nouvelle categorie de service
 *
 * Verifie l'unicite du nom avant creation. Le nom est le seul champ
 * obligatoire ; la description est optionnelle.
 *
 * @param input - Objet contenant le nom et la description optionnelle
 * @param input.name - Nom unique de la categorie (ex: "Tresses africaines")
 * @param input.description - Description optionnelle (ex: "Box braids, cornrows, etc.")
 * @param input.imageUrl - URL de l'image de la categorie (optionnelle, via Supabase Storage)
 *
 * Exemple :
 *   const result = await createCategory({
 *     name: "Tresses africaines",
 *     description: "Box braids, cornrows, twists et vanilles"
 *   })
 *   // result.success === true => result.data contient la categorie creee
 *   // result.success === false => result.error contient le message
 */
export async function createCategory(
  input: { name: string; description?: string; imageUrl?: string }
): Promise<ActionResult<ServiceCategory>> {
  const error = await verifyAdmin()
  if (error) return error

  const { name, description, imageUrl } = input

  // Verifier l'unicite du nom (la contrainte @unique existe en BDD,
  // mais on prefere retourner un message clair plutot qu'une erreur Prisma)
  const existing = await db.serviceCategory.findUnique({
    where: { name },
  })

  if (existing) {
    return { success: false, error: `La categorie "${name}" existe deja` }
  }

  // Creer la categorie (isActive est true par defaut via le schema Prisma)
  const category = await db.serviceCategory.create({
    data: {
      name,
      description: description || null,
      imageUrl: imageUrl || null,
    },
  })

  return { success: true, data: category }
}

/**
 * updateCategory — Mettre a jour une categorie existante
 *
 * Permet de modifier le nom, la description et/ou le statut actif.
 * Si le nom est modifie, on verifie qu'il n'entre pas en conflit
 * avec une autre categorie existante.
 *
 * @param id - Identifiant CUID de la categorie a modifier
 * @param input - Champs a mettre a jour (tous optionnels)
 * @param input.name - Nouveau nom (optionnel)
 * @param input.description - Nouvelle description (optionnel)
 * @param input.isActive - Nouveau statut actif/inactif (optionnel)
 * @param input.imageUrl - Nouvelle URL image (optionnel, null pour supprimer)
 *
 * Exemple (desactiver une categorie) :
 *   await updateCategory("cat-id", { isActive: false })
 *
 * Exemple (renommer) :
 *   await updateCategory("cat-id", { name: "Nouveau nom" })
 */
export async function updateCategory(
  id: string,
  input: { name?: string; description?: string; isActive?: boolean; imageUrl?: string | null }
): Promise<ActionResult<ServiceCategory>> {
  const error = await verifyAdmin()
  if (error) return error

  // Verifier que la categorie existe
  const existing = await db.serviceCategory.findUnique({
    where: { id },
  })

  if (!existing) {
    return { success: false, error: "Categorie non trouvee" }
  }

  // Si le nom est modifie, verifier l'unicite
  if (input.name && input.name !== existing.name) {
    const duplicate = await db.serviceCategory.findUnique({
      where: { name: input.name },
    })

    if (duplicate) {
      return { success: false, error: `La categorie "${input.name}" existe deja` }
    }
  }

  // Mettre a jour uniquement les champs fournis
  const category = await db.serviceCategory.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
    },
  })

  return { success: true, data: category }
}

/**
 * deleteCategory — Supprimer une categorie
 *
 * La suppression est bloquee si des services de coiffeuses sont lies
 * a cette categorie. L'admin doit d'abord desactiver la categorie
 * et s'assurer qu'aucun service ne l'utilise.
 *
 * @param id - Identifiant CUID de la categorie a supprimer
 *
 * Exemple :
 *   const result = await deleteCategory("cat-id")
 *   if (!result.success) {
 *     // result.error === "Impossible de supprimer : 5 service(s) utilisent cette categorie..."
 *   }
 */
export async function deleteCategory(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const error = await verifyAdmin()
  if (error) return error

  // Verifier que la categorie existe
  const existing = await db.serviceCategory.findUnique({
    where: { id },
    // Compter le nombre de services lies a cette categorie
    include: {
      _count: {
        select: { services: true },
      },
    },
  })

  if (!existing) {
    return { success: false, error: "Categorie non trouvee" }
  }

  // Bloquer la suppression si des services utilisent cette categorie
  if (existing._count.services > 0) {
    return {
      success: false,
      error: `Impossible de supprimer : ${existing._count.services} service(s) utilisent cette categorie. Desactivez-la plutot.`,
    }
  }

  // Supprimer la categorie (aucun service lie)
  await db.serviceCategory.delete({ where: { id } })

  return { success: true, data: { id } }
}
