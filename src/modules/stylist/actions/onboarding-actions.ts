/**
 * onboarding-actions.ts — Calcul du statut d'onboarding coiffeuse
 *
 * Role : Determiner quelles etapes obligatoires (profil, prestations,
 *        disponibilites, portfolio) sont completees pour une coiffeuse.
 *        Le statut est calcule a la volee (pas de champ BDD) pour rester
 *        toujours coherent, meme si la coiffeuse supprime des elements.
 *
 * Interactions :
 *   - Lit le StylistProfile + _count des relations via Prisma
 *   - Utilise par le dashboard coiffeuse (OnboardingChecklist)
 *   - Les 4 etapes completees = profil visible en recherche publique
 *
 * Exemple :
 *   const status = await getOnboardingStatus("user-abc-123")
 *   // { isComplete: false, completedCount: 2, totalSteps: 4, steps: [...] }
 */
"use server"

import { db } from "@/shared/lib/db"
import type { OnboardingStatus, OnboardingStep } from "../types"

/**
 * getOnboardingStatus — Recupere le statut d'onboarding d'une coiffeuse
 *
 * Fait une seule requete Prisma (findUnique avec _count) pour evaluer
 * les 4 etapes obligatoires :
 *   1. Profil complet (bio + city + photo de profil)
 *   2. Au moins 1 prestation
 *   3. Au moins 1 disponibilite active
 *   4. Au moins 1 photo portfolio
 *
 * @param userId - ID de l'utilisateur (Better Auth)
 * @returns OnboardingStatus avec le detail de chaque etape
 */
export async function getOnboardingStatus(
  userId: string
): Promise<OnboardingStatus> {
  // Une seule requete Prisma : charge le profil + compteurs des relations
  const profile = await db.stylistProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { image: true } },
      _count: {
        select: {
          services: true,
          portfolio: true,
          availabilities: true,
        },
      },
    },
  })

  // Si le profil n'existe pas encore, toutes les etapes sont incompletes
  if (!profile) {
    return buildStatus({
      profileComplete: false,
      hasServices: false,
      hasAvailabilities: false,
      hasPortfolio: false,
    })
  }

  // Evaluer chaque etape
  const profileComplete =
    profile.bio !== null &&
    profile.bio.trim().length > 0 &&
    profile.city.trim().length > 0 &&
    profile.user.image !== null

  const hasServices = profile._count.services >= 1
  const hasAvailabilities = profile._count.availabilities >= 1
  const hasPortfolio = profile._count.portfolio >= 1

  return buildStatus({
    profileComplete,
    hasServices,
    hasAvailabilities,
    hasPortfolio,
  })
}

/**
 * buildStatus — Construit l'objet OnboardingStatus a partir des booleens
 *
 * Centralise la definition des labels, descriptions et liens
 * pour chaque etape de l'onboarding.
 */
function buildStatus(flags: {
  profileComplete: boolean
  hasServices: boolean
  hasAvailabilities: boolean
  hasPortfolio: boolean
}): OnboardingStatus {
  const steps: OnboardingStep[] = [
    {
      key: "profile",
      label: "Completer votre profil",
      description: "Bio, ville et photo de profil",
      href: "/coiffeuse/profil",
      completed: flags.profileComplete,
    },
    {
      key: "services",
      label: "Ajouter une prestation",
      description: "Au moins une prestation avec tarif",
      href: "/coiffeuse/prestations",
      completed: flags.hasServices,
    },
    {
      key: "availabilities",
      label: "Definir vos disponibilites",
      description: "Au moins un creneau horaire",
      href: "/coiffeuse/disponibilites",
      completed: flags.hasAvailabilities,
    },
    {
      key: "portfolio",
      label: "Ajouter une photo",
      description: "Au moins une photo de vos realisations",
      href: "/coiffeuse/portfolio",
      completed: flags.hasPortfolio,
    },
  ]

  const completedCount = steps.filter((s) => s.completed).length

  return {
    isComplete: completedCount === steps.length,
    completedCount,
    totalSteps: steps.length,
    steps,
  }
}
