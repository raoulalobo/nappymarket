/**
 * Page Inscription — /inscription
 *
 * Role : Permettre aux visiteurs de creer un compte NappyMarket
 *        en choisissant leur role (Cliente ou Coiffeuse).
 *
 * Interactions :
 *   - Affiche le formulaire RegisterForm
 *   - Le choix du role (CLIENT/STYLIST) determine l'espace apres inscription
 *   - Apres inscription reussie, redirige selon le role (via useAuth)
 *   - Layout auth (centrage, logo)
 *
 * Metadata : titre "Inscription" affiche dans l'onglet du navigateur
 */
import type { Metadata } from "next"
import { RegisterForm } from "@/modules/auth/components/RegisterForm"

export const metadata: Metadata = {
  title: "Inscription",
  description:
    "Creez votre compte NappyMarket — trouvez une coiffeuse afro ou proposez vos services",
}

export default function InscriptionPage() {
  return <RegisterForm />
}
