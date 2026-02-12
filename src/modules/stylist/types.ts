/**
 * Module Stylist — Types TypeScript
 *
 * Role : Definir les types pour les profils coiffeuses,
 *        y compris l'onboarding (checklist de completion du profil).
 *
 * Interactions :
 *   - OnboardingStep / OnboardingStatus : utilises par getOnboardingStatus (action)
 *     et OnboardingChecklist (composant dashboard)
 *   - Utilise aussi par StylistProfile, PortfolioGrid, AvailabilityCalendar
 */

/** Etape individuelle de l'onboarding coiffeuse */
export interface OnboardingStep {
  /** Cle unique de l'etape (profile, services, availabilities, portfolio) */
  key: "profile" | "services" | "availabilities" | "portfolio"
  /** Libelle affiche dans la checklist (ex: "Completer votre profil") */
  label: string
  /** Description courte (ex: "Bio, ville et photo de profil") */
  description: string
  /** Lien vers la page de l'etape (ex: "/coiffeuse/profil") */
  href: string
  /** true si l'etape est completee */
  completed: boolean
}

/** Statut global de l'onboarding coiffeuse */
export interface OnboardingStatus {
  /** true si les 4 etapes sont toutes completees */
  isComplete: boolean
  /** Nombre d'etapes completees (0 a 4) */
  completedCount: number
  /** Nombre total d'etapes (toujours 4) */
  totalSteps: number
  /** Detail de chaque etape */
  steps: OnboardingStep[]
}
