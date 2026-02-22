/**
 * category-actions.ts — Server actions pour la gestion des categories de services
 *
 * Role : Fournir les operations CRUD sur les categories de services
 *        (ServiceCategory). Reserve exclusivement aux utilisateurs avec
 *        le role ADMIN. Les categories definissent les types de prestations
 *        disponibles sur la marketplace (tresses, locks, coloration, etc.).
 *        Supporte une hierarchie a 2 niveaux (categorie racine + sous-categories).
 *
 * Interactions :
 *   - Utilise getSession() pour verifier l'authentification et le role ADMIN
 *   - Utilise Prisma (db) pour les operations BDD sur service_categories
 *   - Retourne des ActionResult<T> standardises
 *   - Les categories racines sont incluses avec leurs enfants (CategoryWithChildren)
 *   - Les categories sont ensuite utilisees par les coiffeuses via le
 *     module stylist (service-actions.ts > getAvailableCategories)
 *
 * Exemple :
 *   const result = await getCategories()
 *   // result.data = [{ id: "...", name: "Tresses", children: [{ name: "Box Braids" }] }]
 *
 *   await createCategory({ name: "Box Braids", parentId: "cat-id" })
 *   await updateCategory("cat-id", { isActive: false })
 *   await deleteCategory("cat-id") // echoue si des services ou sous-categories sont lies
 */
"use server"

import { db } from "@/shared/lib/db"
import { getSession } from "@/shared/lib/auth/get-session"
import type { ActionResult } from "@/shared/types"
import type { ServiceCategory } from "@prisma/client"

/* ------------------------------------------------------------------ */
/* Types exportes                                                      */
/* ------------------------------------------------------------------ */

/**
 * CategoryWithChildren — Categorie racine enrichie de ses enfants directs
 *
 * Utilise dans le tableau admin pour afficher la hierarchie.
 * Seules les categories racines (parentId === null) ont ce type ;
 * les enfants sont des ServiceCategory simples.
 *
 * Exemple :
 *   {
 *     id: "abc", name: "Tresses", parentId: null,
 *     children: [
 *       { id: "def", name: "Box Braids", parentId: "abc" },
 *       { id: "ghi", name: "Cornrows",   parentId: "abc" },
 *     ]
 *   }
 */
export type CategoryWithChildren = ServiceCategory & {
  children: ServiceCategory[]
}

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
 * getCategories — Recuperer toutes les categories racines avec leurs enfants
 *
 * L'admin voit toutes les categories (actives et inactives).
 * Seules les categories racines (parentId IS NULL) sont retournees ;
 * chacune inclut ses sous-categories triees par ordre alphabetique.
 *
 * Exemple de retour :
 *   {
 *     success: true,
 *     data: [
 *       {
 *         id: "abc", name: "Tresses", parentId: null, isActive: true,
 *         children: [
 *           { id: "def", name: "Box Braids", parentId: "abc", isActive: true },
 *         ]
 *       },
 *       { id: "xyz", name: "Coloration", parentId: null, isActive: true, children: [] },
 *     ]
 *   }
 */
export async function getCategories(): Promise<ActionResult<CategoryWithChildren[]>> {
  const error = await verifyAdmin()
  if (error) return error

  // Fetcher uniquement les racines (parentId IS NULL)
  // et inclure leurs enfants tries alphabetiquement
  const categories = await db.serviceCategory.findMany({
    where: { parentId: null },
    include: {
      children: { orderBy: { name: "asc" } },
    },
    orderBy: { name: "asc" },
  })

  return { success: true, data: categories }
}

/**
 * createCategory — Creer une nouvelle categorie ou sous-categorie
 *
 * Verifie l'unicite du nom avant creation.
 * Si parentId est fourni :
 *   - le parent doit exister
 *   - le parent doit etre une categorie racine (2 niveaux max)
 *
 * @param input.name        - Nom unique de la categorie (ex: "Box Braids")
 * @param input.description - Description optionnelle
 * @param input.imageUrl    - URL image optionnelle (Supabase Storage)
 * @param input.parentId    - ID de la categorie parente (null/absent = racine)
 *
 * Exemple (racine) :
 *   await createCategory({ name: "Tresses", description: "Box braids, cornrows..." })
 *
 * Exemple (sous-categorie) :
 *   await createCategory({ name: "Box Braids", parentId: "cat-tresses-id" })
 */
export async function createCategory(
  input: { name: string; description?: string; imageUrl?: string; parentId?: string }
): Promise<ActionResult<ServiceCategory>> {
  const error = await verifyAdmin()
  if (error) return error

  const { name, description, imageUrl, parentId } = input

  // Verifier l'unicite du nom (message clair plutot qu'une erreur Prisma)
  const existing = await db.serviceCategory.findUnique({ where: { name } })
  if (existing) {
    return { success: false, error: `La categorie "${name}" existe deja` }
  }

  // Si parentId fourni : verifier que le parent existe ET est une racine
  // (on autorise seulement 2 niveaux de hierarchie)
  if (parentId) {
    const parent = await db.serviceCategory.findUnique({
      where: { id: parentId },
    })
    if (!parent) {
      return { success: false, error: "Categorie parente introuvable" }
    }
    if (parent.parentId !== null) {
      return { success: false, error: "Impossible de creer une sous-sous-categorie (2 niveaux max)" }
    }
  }

  // Creer la categorie (isActive est true par defaut via le schema Prisma)
  const category = await db.serviceCategory.create({
    data: {
      name,
      description: description || null,
      imageUrl: imageUrl || null,
      parentId: parentId || null,
    },
  })

  return { success: true, data: category }
}

/**
 * updateCategory — Mettre a jour une categorie existante
 *
 * Permet de modifier le nom, la description, le statut actif et l'image.
 * Si le nom est modifie, on verifie qu'il n'entre pas en conflit
 * avec une autre categorie existante (contrainte @unique globale).
 *
 * @param id - Identifiant CUID de la categorie a modifier
 * @param input - Champs a mettre a jour (tous optionnels)
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
  const existing = await db.serviceCategory.findUnique({ where: { id } })
  if (!existing) {
    return { success: false, error: "Categorie non trouvee" }
  }

  // Si le nom est modifie, verifier l'unicite (exclure la categorie en cours)
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
 * La suppression est bloquee si :
 *   1. La categorie possede des sous-categories (les supprimer d'abord)
 *   2. Des services de coiffeuses utilisent cette categorie
 *
 * @param id - Identifiant CUID de la categorie a supprimer
 *
 * Exemple :
 *   const result = await deleteCategory("cat-id")
 *   if (!result.success) {
 *     // result.error contient le message d'erreur explicite
 *   }
 */
export async function deleteCategory(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const error = await verifyAdmin()
  if (error) return error

  // Charger la categorie avec le compte de ses services ET sous-categories
  const existing = await db.serviceCategory.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          services: true,  // Nombre de services coiffeuse lies
          children: true,  // Nombre de sous-categories directes
        },
      },
    },
  })

  if (!existing) {
    return { success: false, error: "Categorie non trouvee" }
  }

  // Bloquer si des sous-categories existent (doivent etre supprimees en premier)
  if (existing._count.children > 0) {
    return {
      success: false,
      error: `Impossible de supprimer : cette categorie contient ${existing._count.children} sous-categorie(s). Supprimez-les d'abord.`,
    }
  }

  // Bloquer si des services de coiffeuses utilisent cette categorie
  if (existing._count.services > 0) {
    return {
      success: false,
      error: `Impossible de supprimer : ${existing._count.services} service(s) utilisent cette categorie. Desactivez-la plutot.`,
    }
  }

  // Aucune dependance : suppression autorisee
  await db.serviceCategory.delete({ where: { id } })

  return { success: true, data: { id } }
}
