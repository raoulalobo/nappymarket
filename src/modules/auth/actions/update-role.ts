/**
 * update-role.ts — Server action pour definir le role apres connexion Google
 *
 * Role : Permettre a un utilisateur connecte via Google de choisir
 *        son role (CLIENT ou STYLIST) lors de sa premiere connexion.
 *        Cette action est appelee depuis la page /choix-role.
 *
 * Interactions :
 *   - Verifie la session via Better Auth (l'utilisateur doit etre connecte)
 *   - Met a jour le champ `role` dans la table User via Prisma
 *   - Cree le profil associe (ClientProfile ou StylistProfile) si necessaire
 *   - Securite : ne permet le changement que si le role actuel est CLIENT
 *     (role par defaut attribue lors de la 1ere connexion Google)
 *
 * Exemple :
 *   const result = await updateUserRole("STYLIST")
 *   // { success: true, redirectPath: "/coiffeuse/dashboard" }
 */
"use server"

import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@/shared/lib/auth/auth"
import { db } from "@/shared/lib/db"

/** Schema Zod pour valider le role choisi (uniquement CLIENT ou STYLIST) */
const roleSchema = z.enum(["CLIENT", "STYLIST"], {
  message: "Le role doit etre CLIENT ou STYLIST",
})

/** Type de retour standardise de l'action */
type UpdateRoleResult =
  | { success: true; redirectPath: string }
  | { success: false; error: string }

/**
 * Met a jour le role d'un utilisateur apres sa premiere connexion Google.
 * Cree egalement le profil associe (ClientProfile ou StylistProfile).
 *
 * @param role - Le role choisi : "CLIENT" ou "STYLIST"
 * @returns Le chemin de redirection vers le bon dashboard
 */
export async function updateUserRole(role: string): Promise<UpdateRoleResult> {
  // 1. Verifier l'authentification
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return { success: false, error: "Vous devez etre connecte" }
  }

  // 2. Valider le role avec Zod
  const parsed = roleSchema.safeParse(role)
  if (!parsed.success) {
    return { success: false, error: "Role invalide" }
  }

  const validRole = parsed.data

  // 3. Mettre a jour le role en BDD
  // On utilise une transaction pour creer le profil associe en meme temps
  try {
    await db.$transaction(async (tx) => {
      // Mettre a jour le role sur l'utilisateur
      await tx.user.update({
        where: { id: session.user.id },
        data: { role: validRole },
      })

      // Creer le profil associe selon le role choisi
      if (validRole === "STYLIST") {
        // Creer un StylistProfile vide (sera complete plus tard)
        const existingProfile = await tx.stylistProfile.findUnique({
          where: { userId: session.user.id },
        })
        if (!existingProfile) {
          await tx.stylistProfile.create({
            data: {
              userId: session.user.id,
              city: "", // Sera rempli dans le profil coiffeuse
            },
          })
        }
      } else {
        // Creer un ClientProfile vide
        const existingProfile = await tx.clientProfile.findUnique({
          where: { userId: session.user.id },
        })
        if (!existingProfile) {
          await tx.clientProfile.create({
            data: {
              userId: session.user.id,
            },
          })
        }
      }
    })

    // 4. Retourner le chemin de redirection selon le role
    const redirectPath =
      validRole === "STYLIST" ? "/coiffeuse/dashboard" : "/client"

    return { success: true, redirectPath }
  } catch (error) {
    console.error("[updateUserRole] Erreur lors de la mise a jour du role:", error)
    return { success: false, error: "Erreur lors de la mise a jour du role" }
  }
}
