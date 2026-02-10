/**
 * Page Disponibilites Coiffeuse — /coiffeuse/disponibilites
 *
 * Role : Permettre a la coiffeuse de gerer ses creneaux de disponibilite
 *        hebdomadaires. Delege l'affichage au composant AvailabilityManager.
 *
 * Interactions :
 *   - Protegee par le middleware (cookie de session requis)
 *   - Le layout dashboard verifie la session cote serveur
 *   - La verification du role STYLIST se fait ici
 *   - AvailabilityManager gere les CRUD via hooks TanStack Query
 *
 * Exemple d'URL : /coiffeuse/disponibilites
 */
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getSession } from "@/shared/lib/auth/get-session"
import { AvailabilityManager } from "@/modules/booking/components/AvailabilityManager"

export const metadata: Metadata = {
  title: "Mes disponibilites",
}

export default async function StylistAvailabilitiesPage() {
  const session = await getSession()

  // Verification du role : seules les coiffeuses peuvent acceder
  if (session?.user.role === "CLIENT") {
    redirect("/client")
  }
  if (session?.user.role === "ADMIN") {
    redirect("/admin/dashboard")
  }

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
