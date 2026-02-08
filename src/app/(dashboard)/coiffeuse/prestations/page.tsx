/**
 * Page Prestations Coiffeuse — /coiffeuse/prestations
 *
 * Role : Afficher l'interface de gestion des prestations (services)
 *        proposes par la coiffeuse. Page serveur qui verifie
 *        l'authentification et le role avant de rendre le composant
 *        client ServiceSelector.
 *
 * Interactions :
 *   - Protegee par le layout dashboard (verifie la session)
 *   - Verifie le role STYLIST : redirige CLIENT vers /client,
 *     ADMIN vers /admin/dashboard
 *   - Rend le composant client ServiceSelector qui gere la selection
 *     des categories, l'ajout de prix/duree et la suppression de services
 *
 * Exemple d'acces :
 *   URL : /coiffeuse/prestations
 *   Accessible uniquement par un utilisateur avec le role STYLIST
 */
import { redirect } from "next/navigation"
import { getSession } from "@/shared/lib/auth/get-session"
import ServiceSelector from "@/modules/stylist/components/ServiceSelector"

/** Metadata de la page pour le SEO et l'onglet navigateur */
export const metadata = {
  title: "Mes prestations",
}

export default async function StylistServicesPage() {
  /* ------------------------------------------------------------------ */
  /* Verification de la session et du role                              */
  /* ------------------------------------------------------------------ */

  const session = await getSession()

  /**
   * Si pas de session (cookie expire ou absent), rediriger vers connexion.
   * Note : le layout dashboard fait deja cette verification, mais on la
   * double ici par securite (defense en profondeur).
   */
  if (!session) {
    redirect("/connexion")
  }

  /**
   * Si l'utilisateur est un CLIENT, il n'a pas acces a l'espace coiffeuse.
   * On le redirige vers son propre dashboard.
   */
  if (session.user.role === "CLIENT") {
    redirect("/client")
  }

  /**
   * Si l'utilisateur est un ADMIN, le rediriger vers son dashboard.
   * Les admins gerent les categories, pas les prestations individuelles.
   */
  if (session.user.role === "ADMIN") {
    redirect("/admin/dashboard")
  }

  /* ------------------------------------------------------------------ */
  /* Rendu de la page                                                   */
  /* ------------------------------------------------------------------ */

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
