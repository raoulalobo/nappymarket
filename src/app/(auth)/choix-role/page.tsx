/**
 * Page Choix de Role — /choix-role
 *
 * Role : Affichee apres la premiere connexion via Google OAuth.
 *        Permet a l'utilisateur de choisir s'il est cliente ou coiffeuse.
 *        Le role par defaut (CLIENT) est attribue automatiquement par Better Auth,
 *        cette page permet de le confirmer ou de le changer en STYLIST.
 *
 * Interactions :
 *   - Verifie la session cote serveur (redirige vers /connexion si non connecte)
 *   - Si l'utilisateur a deja un role defini (et un profil cree), redirige vers le dashboard
 *   - Appelle la server action updateUserRole() au clic sur une carte
 *   - Apres choix, redirige vers le dashboard correspondant
 *
 * Metadata : titre "Choisissez votre profil" dans l'onglet navigateur
 */
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/shared/lib/auth/auth"
import { db } from "@/shared/lib/db"
import { AuthPageShell } from "@/shared/components/layout/AuthPageShell"
import { RoleSelector } from "@/modules/auth/components/RoleSelector"

export const metadata: Metadata = {
  title: "Choisissez votre profil",
  description: "Selectionnez votre role sur NappyMarket : cliente ou coiffeuse",
}

export default async function ChoixRolePage() {
  // Verifier que l'utilisateur est connecte
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/connexion")
  }

  // Verifier si l'utilisateur a deja un profil cree (= role deja choisi)
  // Si oui, rediriger directement vers le bon dashboard
  const user = session.user as { id: string; role: string }

  // Chercher si un profil associe existe deja (signe que le role a ete choisi)
  const hasProfile = await db.stylistProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  }) ?? await db.clientProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })

  if (hasProfile) {
    // Le role a deja ete choisi, rediriger vers le dashboard
    if (user.role === "STYLIST") {
      redirect("/coiffeuse/dashboard")
    } else {
      redirect("/client")
    }
  }

  return (
    <AuthPageShell
      imageSrc="/images/good-faces-3yvAe5gJ-SI-unsplash.jpg"
      imageAlt="Femme avec de belles tresses africaines"
      quote="Bienvenue dans la communaute NappyMarket"
    >
      <RoleSelector />
    </AuthPageShell>
  )
}
