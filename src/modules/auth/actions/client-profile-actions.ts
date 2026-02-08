/**
 * client-profile-actions.ts — Server actions pour le profil cliente
 *
 * Role : Gerer la lecture et la mise a jour du profil cliente (ClientProfile).
 *        Toutes les actions verifient l'authentification et le role CLIENT.
 *
 * Interactions :
 *   - Utilise getSession() pour verifier l'authentification et le role
 *   - Utilise Prisma (db) pour les operations BDD sur la table client_profiles
 *   - Retourne des ActionResult<T> standardises (succes ou erreur)
 *   - Consommee par le hook useClientProfile() cote client
 *
 * Exemple :
 *   // Depuis un hook TanStack Query
 *   const result = await getClientProfile()
 *   // result = { success: true, data: { id, userId, city, address, user: { name } } }
 *
 *   const updated = await updateClientProfile({ city: "Paris", address: "12 rue X" })
 *   // updated = { success: true, data: { id, userId, city: "Paris", ... } }
 */
"use server"

import { db } from "@/shared/lib/db"
import { getSession } from "@/shared/lib/auth/get-session"
import type { ActionResult } from "@/shared/types"
import type { ClientProfile } from "@prisma/client"

/**
 * Type du profil cliente enrichi avec les donnees utilisateur.
 * Inclut les champs User necessaires a l'affichage (nom, email, avatar).
 */
type ClientProfileWithUser = ClientProfile & {
  user: {
    name: string
    email: string
    image: string | null
    firstName: string | null
    lastName: string | null
  }
}

/**
 * getClientProfile — Recuperer le profil de la cliente connectee
 *
 * Verifie que l'utilisateur est authentifie et possede le role CLIENT.
 * Retourne le profil avec les donnees utilisateur associees.
 * Si le profil n'existe pas encore (premiere visite), retourne null.
 *
 * Exemple :
 *   const result = await getClientProfile()
 *   if (result.success && result.data) {
 *     console.log(result.data.city) // "Paris"
 *     console.log(result.data.user.name) // "Marie Dupont"
 *   }
 */
export async function getClientProfile(): Promise<
  ActionResult<ClientProfileWithUser | null>
> {
  // Verifier que l'utilisateur est connecte
  const session = await getSession()
  if (!session) {
    return { success: false, error: "Non authentifie" }
  }

  // Verifier que l'utilisateur a le role CLIENT
  if (session.user.role !== "CLIENT") {
    return { success: false, error: "Acces reserve aux clientes" }
  }

  // Recuperer le profil en base avec les donnees utilisateur
  const profile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  // Si le profil n'existe pas encore, retourner null (pas une erreur)
  return { success: true, data: profile }
}

/**
 * Input attendu pour la mise a jour du profil cliente.
 * Les deux champs sont optionnels car la cliente peut ne remplir que la ville
 * ou que l'adresse.
 */
interface UpdateClientProfileInput {
  city?: string
  address?: string
}

/**
 * updateClientProfile — Creer ou mettre a jour le profil cliente
 *
 * Utilise un upsert Prisma :
 *   - Si le profil n'existe pas encore -> le creer avec les donnees fournies
 *   - Si le profil existe deja -> le mettre a jour
 *
 * Verifie que l'utilisateur est authentifie et possede le role CLIENT.
 *
 * Exemple :
 *   const result = await updateClientProfile({ city: "Lyon", address: "5 rue de la Republique" })
 *   // result = { success: true, data: { id: "...", city: "Lyon", address: "5 rue de la Republique" } }
 *
 *   // Mise a jour partielle (uniquement la ville)
 *   const result2 = await updateClientProfile({ city: "Marseille" })
 */
export async function updateClientProfile(
  input: UpdateClientProfileInput
): Promise<ActionResult<ClientProfile>> {
  // Verifier que l'utilisateur est connecte
  const session = await getSession()
  if (!session) {
    return { success: false, error: "Non authentifie" }
  }

  // Verifier que l'utilisateur a le role CLIENT
  if (session.user.role !== "CLIENT") {
    return { success: false, error: "Acces reserve aux clientes" }
  }

  // Preparer les donnees pour l'upsert
  // Les valeurs vides sont converties en null pour nettoyer la base
  const data = {
    city: input.city?.trim() || null,
    address: input.address?.trim() || null,
  }

  // Upsert : creer le profil s'il n'existe pas, sinon le mettre a jour
  const profile = await db.clientProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...data,
    },
    update: data,
  })

  return { success: true, data: profile }
}
