/**
 * RoleSelector — Composant de selection du role (CLIENT ou STYLIST)
 *
 * Role : Afficher deux cartes cliquables permettant a l'utilisateur
 *        de choisir son role apres une premiere connexion Google.
 *        Appelle la server action updateUserRole() puis redirige.
 *
 * Interactions :
 *   - Utilise par la page /choix-role
 *   - Appelle la server action updateUserRole (module auth)
 *   - Redirige vers le dashboard correspondant apres le choix
 *   - Affiche un toast en cas d'erreur
 *
 * Exemple :
 *   <RoleSelector />
 */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Scissors, User } from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { updateUserRole } from "@/modules/auth/actions/update-role"

export function RoleSelector() {
  const router = useRouter()
  // Stocker quel role est en cours de selection (pour le loader)
  const [loadingRole, setLoadingRole] = useState<string | null>(null)

  /**
   * Gere le clic sur une carte de role.
   * Appelle la server action et redirige si succes.
   */
  async function handleSelectRole(role: "CLIENT" | "STYLIST") {
    setLoadingRole(role)
    try {
      const result = await updateUserRole(role)

      if (result.success) {
        toast.success(
          role === "STYLIST"
            ? "Bienvenue parmi nos coiffeuses !"
            : "Bienvenue sur NappyMarket !"
        )
        router.push(result.redirectPath)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Une erreur est survenue")
    } finally {
      setLoadingRole(null)
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Titre et description */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenue sur NappyMarket !
        </h1>
        <p className="text-muted-foreground">
          Comment souhaitez-vous utiliser la plateforme ?
        </p>
      </div>

      {/* Cartes de choix de role */}
      <div className="grid gap-4">
        {/* Carte Cliente */}
        <Card
          className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
            loadingRole === "CLIENT" ? "border-primary" : ""
          }`}
          onClick={() => !loadingRole && handleSelectRole("CLIENT")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            {loadingRole === "CLIENT" ? (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">Je suis cliente</CardTitle>
              <CardDescription>
                Je cherche une coiffeuse a domicile
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        {/* Carte Coiffeuse */}
        <Card
          className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
            loadingRole === "STYLIST" ? "border-primary" : ""
          }`}
          onClick={() => !loadingRole && handleSelectRole("STYLIST")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            {loadingRole === "STYLIST" ? (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Scissors className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">Je suis coiffeuse</CardTitle>
              <CardDescription>
                Je propose mes services de coiffure afro
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
