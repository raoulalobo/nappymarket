/**
 * OnboardingChecklist — Carte de progression onboarding coiffeuse
 *
 * Role : Affiche une checklist visuelle des 4 etapes obligatoires
 *        pour que la coiffeuse complete son profil et devienne visible
 *        dans la recherche publique. Disparait quand tout est complete.
 *
 * Interactions :
 *   - Recoit OnboardingStatus depuis le dashboard coiffeuse
 *   - Chaque etape est un lien cliquable vers la page correspondante
 *   - Utilise le theme bleu (distinct du jaune reservations et violet avis)
 *
 * Exemple :
 *   <OnboardingChecklist status={onboardingStatus} />
 */
import Link from "next/link"
import { ListChecks, CheckCircle2, Circle, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { OnboardingStatus } from "../types"

interface OnboardingChecklistProps {
  /** Statut d'onboarding calcule par getOnboardingStatus */
  status: OnboardingStatus
}

export function OnboardingChecklist({ status }: OnboardingChecklistProps) {
  // Pourcentage de progression (0 a 100)
  const progressPercent = (status.completedCount / status.totalSteps) * 100

  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
            Completez votre profil
          </CardTitle>
        </div>
        <CardDescription className="text-blue-700 dark:text-blue-300">
          Votre profil doit etre complet pour apparaitre dans les recherches.
          {" "}{status.completedCount}/{status.totalSteps} etapes completees.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barre de progression */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500 dark:bg-blue-400"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Liste des etapes */}
        <ul className="space-y-2">
          {status.steps.map((step) => (
            <li key={step.key}>
              <Link
                href={step.href}
                className={`flex items-center gap-3 rounded-md p-2 transition-colors ${
                  step.completed
                    ? "opacity-70"
                    : "hover:bg-blue-100 dark:hover:bg-blue-900/40"
                }`}
              >
                {/* Icone : check vert si complete, cercle gris sinon */}
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-blue-400 dark:text-blue-500" />
                )}

                {/* Label + description */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      step.completed
                        ? "text-blue-700 line-through dark:text-blue-400"
                        : "text-blue-900 dark:text-blue-100"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {step.description}
                  </p>
                </div>

                {/* Fleche pour les etapes non completees */}
                {!step.completed && (
                  <ArrowRight className="h-4 w-4 shrink-0 text-blue-400 dark:text-blue-500" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
