/**
 * StylistList — Liste et gestion des coiffeuses (admin)
 *
 * Role : Permettre a l'administrateur de visualiser toutes les coiffeuses
 *        inscrites, de verifier leur profil et d'activer/desactiver leur compte.
 *        Affiche un tableau avec les informations cles de chaque coiffeuse.
 *
 * Interactions :
 *   - useAdminStylists()       : recupere la liste des coiffeuses avec leur profil
 *                                 et le nombre de services (TanStack Query)
 *   - useVerifyStylist()       : marque un profil coiffeuse comme verifie
 *   - useToggleStylistActive() : active/desactive le compte d'une coiffeuse
 *   - Badge shadcn/ui          : indicateur visuel du statut de verification
 *   - Switch shadcn/ui         : bascule activation/desactivation en ligne
 *
 * Donnees attendues (StylistWithProfile) :
 *   {
 *     id, email, name, firstName, lastName, role, isActive, createdAt,
 *     stylistProfile: { id, userId, bio, city, isVerified, isActive, radiusKm } | null,
 *     _count: { stylistProfile: { services: number } }
 *   }
 *
 * Exemple :
 *   import { StylistList } from "@/modules/admin/components/StylistList"
 *   <StylistList />
 */
"use client"

import { useCallback } from "react"
import { Loader2, ShieldCheck } from "lucide-react"

// --- Hooks admin pour les operations sur les coiffeuses ---
import {
  useAdminStylists,
  useVerifyStylist,
  useToggleStylistActive,
} from "@/modules/admin/hooks/useAdminStylists"

// --- Composants shadcn/ui ---
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export function StylistList() {
  // --- Donnees et mutations ---
  const { stylists, isLoading } = useAdminStylists()
  const { verifyStylist, isVerifying } = useVerifyStylist()
  const { toggleActive, isToggling } = useToggleStylistActive()

  // --- Basculer le statut actif/inactif du compte d'une coiffeuse ---
  const handleToggleActive = useCallback(
    async (userId: string) => {
      await toggleActive(userId)
    },
    [toggleActive]
  )

  // --- Verifier le profil d'une coiffeuse (stylistProfile.id) ---
  const handleVerify = useCallback(
    async (profileId: string) => {
      await verifyStylist(profileId)
    },
    [verifyStylist]
  )

  /**
   * Construit le nom complet affiche dans la colonne "Nom".
   * Priorite : prenom + nom > name > email (fallback)
   *
   * Exemple :
   *   getDisplayName({ firstName: "Awa", lastName: "Diallo", name: "awa_d", email: "awa@mail.com" })
   *   // => "Awa Diallo"
   */
  const getDisplayName = useCallback(
    (stylist: {
      firstName?: string | null
      lastName?: string | null
      name: string
      email: string
    }): string => {
      if (stylist.firstName && stylist.lastName) {
        return `${stylist.firstName} ${stylist.lastName}`
      }
      return stylist.name || stylist.email
    },
    []
  )

  // -------------------------------------------------------------------------
  // Rendu : Skeleton de chargement
  // -------------------------------------------------------------------------
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          {/* Skeleton du titre, description et compteur */}
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent>
          {/* Skeleton du tableau (5 lignes simulees) */}
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // -------------------------------------------------------------------------
  // Rendu principal
  // -------------------------------------------------------------------------
  return (
    <TooltipProvider>
      <Card>
        {/* --- En-tete de la carte --- */}
        <CardHeader>
          <CardTitle className="text-xl">Gestion des coiffeuses</CardTitle>
          <CardDescription>
            Consultez, verifiez et gerez les comptes des coiffeuses inscrites
            sur la marketplace.
            {/* Compteur du nombre total de coiffeuses */}
            {stylists.length > 0 && (
              <span className="ml-1 font-medium text-foreground">
                ({stylists.length}{" "}
                {stylists.length === 1 ? "coiffeuse" : "coiffeuses"})
              </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* --- Etat vide : aucune coiffeuse inscrite --- */}
          {stylists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground text-sm">
                Aucune coiffeuse inscrite pour le moment.
              </p>
            </div>
          ) : (
            /* --- Tableau des coiffeuses --- */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead className="text-center">Services</TableHead>
                  <TableHead className="text-center">Verifie</TableHead>
                  <TableHead className="text-center">Actif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stylists.map((stylist) => {
                  // Profil coiffeuse (peut etre null si pas encore cree)
                  const profile = stylist.stylistProfile

                  // Nombre de services proposes par cette coiffeuse
                  const serviceCount =
                    profile?._count?.services ?? 0

                  // La coiffeuse est-elle verifiee ?
                  const isVerified = profile?.isVerified ?? false

                  return (
                    <TableRow key={stylist.id}>
                      {/* Colonne : Nom complet de la coiffeuse */}
                      <TableCell className="font-medium">
                        {getDisplayName(stylist)}
                      </TableCell>

                      {/* Colonne : Adresse email */}
                      <TableCell className="text-muted-foreground">
                        {stylist.email}
                      </TableCell>

                      {/* Colonne : Ville (depuis le profil coiffeuse) */}
                      <TableCell>
                        {profile?.city || (
                          <span className="text-muted-foreground">&mdash;</span>
                        )}
                      </TableCell>

                      {/* Colonne : Nombre de services proposes */}
                      <TableCell className="text-center">
                        {serviceCount}
                      </TableCell>

                      {/* Colonne : Badge de verification */}
                      <TableCell className="text-center">
                        <Badge
                          variant={isVerified ? "default" : "secondary"}
                          className={
                            isVerified
                              ? "bg-green-600 hover:bg-green-600/90"
                              : ""
                          }
                        >
                          {isVerified ? "Verifie" : "En attente"}
                        </Badge>
                      </TableCell>

                      {/* Colonne : Switch activer/desactiver le compte */}
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex">
                              <Switch
                                checked={stylist.isActive}
                                onCheckedChange={() =>
                                  handleToggleActive(stylist.id)
                                }
                                disabled={isToggling}
                                aria-label={`${stylist.isActive ? "Desactiver" : "Activer"} le compte de ${getDisplayName(stylist)}`}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {stylist.isActive
                              ? "Desactiver le compte"
                              : "Activer le compte"}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      {/* Colonne : Actions (bouton Verifier si non verifie) */}
                      <TableCell className="text-right">
                        {!isVerified && profile?.id ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleVerify(profile.id)}
                                disabled={isVerifying}
                                aria-label={`Verifier le profil de ${getDisplayName(stylist)}`}
                              >
                                {isVerifying ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <ShieldCheck className="size-3" />
                                )}
                                Verifier
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Valider le profil de cette coiffeuse
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          /* Aucune action disponible si deja verifiee */
                          <span className="text-muted-foreground text-xs">
                            &mdash;
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
