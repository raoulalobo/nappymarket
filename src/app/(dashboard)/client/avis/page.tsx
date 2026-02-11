/**
 * Page "Mes avis" — /client/avis
 *
 * Role : Afficher la liste des avis laisses par la cliente connectee
 *        avec possibilite de supprimer ses propres avis.
 *
 * Interactions :
 *   - Protegee par le DAL (requireRole verifie session + role CLIENT)
 *   - Delege l'affichage au composant ClientReviewList (client component)
 *
 * Exemple d'URL : /client/avis
 */
import type { Metadata } from "next"
import { requireRole } from "@/shared/lib/auth/dal"
import { ClientReviewList } from "@/modules/review/components/ClientReviewList"

export const metadata: Metadata = {
  title: "Mes avis",
}

export default async function ClientReviewsPage() {
  // Verification session + role CLIENT (redirige automatiquement sinon)
  await requireRole("CLIENT")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mes avis</h1>
        <p className="mt-1 text-muted-foreground">
          Consultez et gerez les avis que vous avez laisses.
        </p>
      </div>

      <ClientReviewList />
    </div>
  )
}
