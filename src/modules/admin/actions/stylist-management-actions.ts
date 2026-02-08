/**
 * stylist-management-actions.ts — Server actions pour la gestion des coiffeuses
 *
 * Role : Fournir les operations de gestion des coiffeuses depuis le
 *        panneau d'administration. Permet de lister, verifier et
 *        activer/desactiver les comptes coiffeuses.
 *
 * Interactions :
 *   - Utilise getSession() pour verifier l'authentification et le role ADMIN
 *   - Utilise Prisma (db) pour les operations BDD sur User et StylistProfile
 *   - Retourne des ActionResult<T> standardises
 *   - Utilise par les hooks useAdminStylists dans le module admin
 *   - Le type StylistWithProfile est exporte pour typer les reponses
 *
 * Exemple :
 *   const result = await getStylists()
 *   // result.data = [{ id, name, email, stylistProfile: { isVerified, ... }, _count: { ... } }]
 *
 *   await verifyStylist("profile-id") // marquer la coiffeuse comme verifiee
 *   await toggleStylistActive("user-id") // basculer le statut actif/inactif
 */
"use server"

import { db } from "@/shared/lib/db"
import { getSession } from "@/shared/lib/auth/get-session"
import type { ActionResult } from "@/shared/types"
import type { User, StylistProfile } from "@prisma/client"

/* ------------------------------------------------------------------ */
/* Types exportes                                                      */
/* ------------------------------------------------------------------ */

/**
 * StylistWithProfile — Type representant un utilisateur coiffeuse
 * avec son profil et le nombre de services proposes.
 *
 * Utilise dans les composants admin pour afficher la liste des coiffeuses
 * avec leurs informations completes.
 *
 * Exemple :
 *   const stylists: StylistWithProfile[] = result.data
 *   stylists[0].stylistProfile?.isVerified // true | false
 *   stylists[0]._count.stylistProfile // 0 ou 1 (si le profil existe)
 */
export type StylistWithProfile = User & {
  stylistProfile: (StylistProfile & {
    _count: {
      services: number
    }
  }) | null
}

/* ------------------------------------------------------------------ */
/* Helpers internes                                                    */
/* ------------------------------------------------------------------ */

/**
 * verifyAdmin — Verifie que l'utilisateur est connecte et a le role ADMIN
 *
 * Retourne null si tout est OK, ou un ActionResult d'erreur sinon.
 *
 * Exemple :
 *   const error = await verifyAdmin()
 *   if (error) return error
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
 * getStylists — Recuperer la liste de toutes les coiffeuses
 *
 * Retourne tous les utilisateurs avec le role STYLIST, avec leur profil
 * coiffeuse (s'il existe) et le nombre de services proposes.
 * Trie par date de creation decroissante (les plus recentes en premier).
 *
 * Exemple de retour :
 *   {
 *     success: true,
 *     data: [
 *       {
 *         id: "user-1", name: "Marie", email: "marie@...",
 *         stylistProfile: {
 *           id: "prof-1", city: "Paris", isVerified: true,
 *           _count: { services: 3 }
 *         }
 *       },
 *       {
 *         id: "user-2", name: "Aisha", email: "aisha@...",
 *         stylistProfile: null // profil pas encore cree
 *       }
 *     ]
 *   }
 */
export async function getStylists(): Promise<ActionResult<StylistWithProfile[]>> {
  const error = await verifyAdmin()
  if (error) return error

  const stylists = await db.user.findMany({
    where: { role: "STYLIST" },
    include: {
      stylistProfile: {
        include: {
          _count: {
            select: { services: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return { success: true, data: stylists as StylistWithProfile[] }
}

/**
 * verifyStylist — Marquer une coiffeuse comme verifiee
 *
 * La verification est un processus admin qui confirme que la coiffeuse
 * est legitime (identite verifiee, competences confirmees, etc.).
 * Seul le StylistProfile est modifie (champ isVerified passe a true).
 *
 * @param stylistProfileId - Identifiant CUID du StylistProfile (pas du User)
 *
 * Exemple :
 *   await verifyStylist("profile-123")
 *   // Le profil est maintenant marque comme verifie
 */
export async function verifyStylist(
  stylistProfileId: string
): Promise<ActionResult<StylistProfile>> {
  const error = await verifyAdmin()
  if (error) return error

  // Verifier que le profil coiffeuse existe
  const profile = await db.stylistProfile.findUnique({
    where: { id: stylistProfileId },
  })

  if (!profile) {
    return { success: false, error: "Profil coiffeuse non trouve" }
  }

  // Mettre a jour le champ isVerified
  const updated = await db.stylistProfile.update({
    where: { id: stylistProfileId },
    data: { isVerified: true },
  })

  return { success: true, data: updated }
}

/**
 * toggleStylistActive — Basculer le statut actif/inactif d'une coiffeuse
 *
 * Inverse la valeur du champ isActive sur le User. Un utilisateur
 * desactive ne peut plus se connecter ni apparaitre dans les recherches.
 * Utile pour suspendre temporairement un compte sans le supprimer.
 *
 * @param userId - Identifiant CUID du User a modifier
 *
 * Exemple :
 *   // Si la coiffeuse est active (isActive: true), elle devient inactive
 *   await toggleStylistActive("user-456")
 *   // Si la coiffeuse est inactive (isActive: false), elle redevient active
 *   await toggleStylistActive("user-456")
 */
export async function toggleStylistActive(
  userId: string
): Promise<ActionResult<User>> {
  const error = await verifyAdmin()
  if (error) return error

  // Recuperer l'utilisateur pour connaitre son statut actuel
  const user = await db.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    return { success: false, error: "Utilisateur non trouve" }
  }

  // Verifier que c'est bien une coiffeuse
  if (user.role !== "STYLIST") {
    return { success: false, error: "Cet utilisateur n'est pas une coiffeuse" }
  }

  // Inverser le statut actif (toggle)
  const updated = await db.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  })

  return { success: true, data: updated }
}

/**
 * getStylistStats — Recuperer les statistiques globales des coiffeuses
 *
 * Retourne les compteurs pour le dashboard admin :
 * - total : nombre total de coiffeuses inscrites
 * - verified : nombre de coiffeuses avec un profil verifie
 * - active : nombre de coiffeuses avec un compte actif
 *
 * Exemple de retour :
 *   { success: true, data: { total: 42, verified: 28, active: 35 } }
 */
export async function getStylistStats(): Promise<
  ActionResult<{ total: number; verified: number; active: number }>
> {
  const error = await verifyAdmin()
  if (error) return error

  // Compter le total de coiffeuses (tous statuts confondus)
  const total = await db.user.count({
    where: { role: "STYLIST" },
  })

  // Compter les coiffeuses avec un profil verifie
  const verified = await db.stylistProfile.count({
    where: { isVerified: true },
  })

  // Compter les coiffeuses actives (champ isActive sur User)
  const active = await db.user.count({
    where: { role: "STYLIST", isActive: true },
  })

  return { success: true, data: { total, verified, active } }
}
