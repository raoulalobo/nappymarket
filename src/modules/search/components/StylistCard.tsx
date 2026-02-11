/**
 * StylistCard — Carte d'apercu d'une coiffeuse dans les resultats de recherche
 *
 * Role : Afficher un resume des informations d'une coiffeuse (nom, ville, distance,
 *        categories, fourchette de prix) dans une carte cliquable qui redirige
 *        vers le profil public.
 *
 * Interactions :
 *   - Recoit un SearchStylistResult depuis SearchResults (parent)
 *   - Redirige vers /coiffeuse/[id] au clic (profil public)
 *   - Utilise les composants shadcn : Card, Badge, Avatar
 *   - formatPrice() pour l'affichage des prix en euros
 *
 * Exemple :
 *   <StylistCard stylist={searchResult} />
 */
"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatPrice } from "@/shared/lib/utils"
import { AverageRating } from "@/modules/review/components/AverageRating"
import type { SearchStylistResult } from "../types"

interface StylistCardProps {
  /** Donnees de la coiffeuse issues de la recherche */
  stylist: SearchStylistResult
}

/**
 * Extraire les initiales d'un nom pour l'avatar fallback
 * Exemple : "Marie Dupont" -> "MD", "Alice" -> "AL"
 */
function getInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function StylistCard({ stylist }: StylistCardProps) {
  return (
    <Link href={`/coiffeuse/${stylist.id}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex gap-4 p-4">
          {/* Avatar de la coiffeuse */}
          <Avatar className="h-14 w-14 shrink-0">
            {stylist.userImage && (
              <AvatarImage src={stylist.userImage} alt={stylist.userName} />
            )}
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(stylist.userName)}
            </AvatarFallback>
          </Avatar>

          {/* Informations principales */}
          <div className="min-w-0 flex-1">
            {/* Nom + badge verifie */}
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold">{stylist.userName}</h3>
              {stylist.isVerified && (
                <Badge variant="secondary" className="shrink-0 text-xs">
                  Verifiee
                </Badge>
              )}
            </div>

            {/* Note moyenne compacte (si au moins 1 avis) */}
            {stylist.reviewCount > 0 && (
              <AverageRating
                averageRating={stylist.averageRating}
                reviewCount={stylist.reviewCount}
                compact
              />
            )}

            {/* Ville + distance */}
            <p className="text-sm text-muted-foreground">
              {stylist.city} &middot; a {stylist.distanceKm} km
            </p>

            {/* Categories en badges */}
            {stylist.categoryNames.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {stylist.categoryNames.slice(0, 3).map((name) => (
                  <Badge key={name} variant="outline" className="text-xs">
                    {name}
                  </Badge>
                ))}
                {stylist.categoryNames.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{stylist.categoryNames.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Prix + nombre de services */}
            <div className="mt-2 flex items-center gap-2 text-sm">
              {stylist.priceMin !== null && stylist.priceMax !== null && (
                <span className="font-medium text-primary">
                  {stylist.priceMin === stylist.priceMax
                    ? formatPrice(stylist.priceMin)
                    : `${formatPrice(stylist.priceMin)} - ${formatPrice(stylist.priceMax)}`}
                </span>
              )}
              {stylist.serviceCount > 0 && (
                <span className="text-muted-foreground">
                  &middot; {stylist.serviceCount} prestation{stylist.serviceCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
