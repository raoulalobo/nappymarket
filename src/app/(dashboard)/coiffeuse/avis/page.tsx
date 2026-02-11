/**
 * Page "Avis recus" — /coiffeuse/avis
 *
 * Role : Afficher la note moyenne et la liste des avis recus
 *        par la coiffeuse connectee.
 *
 * Interactions :
 *   - Protegee par le DAL (requireRole verifie session + role STYLIST)
 *   - Charge le stylistId depuis le StylistProfile de la coiffeuse
 *   - Delege l'affichage au composant StylistReviewList (client component)
 *
 * Exemple d'URL : /coiffeuse/avis
 */
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { requireRole } from "@/shared/lib/auth/dal"
import { db } from "@/shared/lib/db"
import { StylistReviewList } from "@/modules/review/components/StylistReviewList"

export const metadata: Metadata = {
  title: "Avis recus",
}

export default async function StylistReviewsPage() {
  // Verification session + role STYLIST (redirige automatiquement sinon)
  const session = await requireRole("STYLIST")

  // Charger le profil coiffeuse pour obtenir l'ID
  const profile = await db.stylistProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  // Si pas de profil coiffeuse, rediriger vers la creation de profil
  if (!profile) {
    redirect("/coiffeuse/profil")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Avis recus</h1>
        <p className="mt-1 text-muted-foreground">
          Consultez les avis laisses par vos clientes.
        </p>
      </div>

      <StylistReviewList stylistId={profile.id} />
    </div>
  )
}
