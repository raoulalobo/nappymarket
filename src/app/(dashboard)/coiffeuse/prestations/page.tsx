/**
 * Page Prestations Coiffeuse — /coiffeuse/prestations
 *
 * Role : Afficher l'interface de gestion des prestations (services)
 *        proposes par la coiffeuse.
 *
 * Interactions :
 *   - Protegee par le proxy (cookie de session requis)
 *   - Protegee par le DAL (requireRole verifie session + role STYLIST)
 *   - Rend le composant client ServiceSelector qui gere la selection
 *     des categories, l'ajout de prix/duree et la suppression de services
 *
 * Exemple d'acces :
 *   URL : /coiffeuse/prestations
 *   Accessible uniquement par un utilisateur avec le role STYLIST
 */
import { requireRole } from "@/shared/lib/auth/dal"
import ServiceSelector from "@/modules/stylist/components/ServiceSelector"

/** Metadata de la page pour le SEO et l'onglet navigateur */
export const metadata = {
  title: "Mes prestations",
}

export default async function StylistServicesPage() {
  // Verification session + role STYLIST (redirige automatiquement sinon)
  await requireRole("STYLIST")

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Titre principal de la page */}
      <h1 className="mb-6 text-2xl font-bold">Mes prestations</h1>

      {/*
       * ServiceSelector — Composant client interactif
       * Gere la liste des services de la coiffeuse, l'ajout de nouveaux
       * services via un formulaire (categorie, prix, duree) et la
       * suppression de services existants.
       * Utilise les hooks useStylistServices, useAddStylistService,
       * useRemoveStylistService et useAvailableCategories en interne.
       */}
      <ServiceSelector />
    </div>
  )
}
