/**
 * Page Disponibilites Coiffeuse — /coiffeuse/disponibilites
 *
 * Role : Permettre a la coiffeuse de gerer ses creneaux de disponibilite
 *        hebdomadaires. Delege l'affichage au composant AvailabilityManager.
 *
 * Interactions :
 *   - Protegee par le proxy (cookie de session requis)
 *   - Protegee par le DAL (requireRole verifie session + role STYLIST)
 *   - AvailabilityManager gere les CRUD via hooks TanStack Query
 *
 * Exemple d'URL : /coiffeuse/disponibilites
 */
import type { Metadata } from "next"
import { requireRole } from "@/shared/lib/auth/dal"
import { AvailabilityManager } from "@/modules/booking/components/AvailabilityManager"

export const metadata: Metadata = {
  title: "Mes disponibilites",
}

export default async function StylistAvailabilitiesPage() {
  // Verification session + role STYLIST (redirige automatiquement sinon)
  await requireRole("STYLIST")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mes disponibilites</h1>
        <p className="mt-1 text-muted-foreground">
          Configurez vos creneaux de disponibilite pour chaque jour de la semaine.
          Les clientes ne pourront reserver que sur les creneaux actifs.
        </p>
      </div>

      {/* Composant client qui gere l'ensemble des CRUD sur les disponibilites */}
      <AvailabilityManager />
    </div>
  )
}
