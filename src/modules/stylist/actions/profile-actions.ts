/**
 * profile-actions.ts — Server actions pour le profil coiffeuse
 *
 * Role : Gerer le CRUD du profil coiffeuse (creation, lecture, mise a jour).
 *        Toutes les actions verifient l'authentification et le role STYLIST.
 *
 * Interactions :
 *   - Utilise getSession() pour verifier l'authentification
 *   - Utilise Prisma (db) pour les operations BDD
 *   - Valide les inputs avec les schemas Zod du module
 *   - Retourne des ActionResult<T> standardises
 *
 * Exemple :
 *   const result = await getStylistProfile()
 *   const updated = await updateStylistProfile({ bio: "...", city: "Paris" })
 */
"use server"

import { db } from "@/shared/lib/db"
import { getSession } from "@/shared/lib/auth/get-session"
import { stylistProfileSchema } from "../schemas/stylist-schemas"
import type { ActionResult } from "@/shared/types"
import type { StylistProfile } from "@prisma/client"

/**
 * getStylistProfile — Recuperer le profil de la coiffeuse connectee
 *
 * Retourne le profil complet avec les services et le portfolio.
 * Retourne null si le profil n'existe pas encore (premiere visite).
 */
export async function getStylistProfile(): Promise<
  ActionResult<(StylistProfile & { user: { name: string; email: string; image: string | null } }) | null>
> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }
  if (session.user.role !== "STYLIST") return { success: false, error: "Acces reserve aux coiffeuses" }

  const profile = await db.stylistProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { name: true, email: true, image: true } },
    },
  })

  return { success: true, data: profile }
}

/**
 * updateStylistProfile — Creer ou mettre a jour le profil coiffeuse
 *
 * Si le profil n'existe pas, le cree (upsert).
 * Valide les donnees avec stylistProfileSchema.
 */
export async function updateStylistProfile(
  input: unknown
): Promise<ActionResult<StylistProfile>> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }
  if (session.user.role !== "STYLIST") return { success: false, error: "Acces reserve aux coiffeuses" }

  // Valider les donnees
  const parsed = stylistProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Donnees invalides" }
  }

  const { bio, city, address, radiusKm } = parsed.data

  // Geocoder la ville via Mapbox Geocoding API
  // Retourne les coordonnees GPS (latitude, longitude) pour la recherche geographique
  // Si l'API echoue ou si le token est absent, on continue sans coordonnees (null)
  let latitude: number | null = null
  let longitude: number | null = null

  try {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!mapboxToken) {
      console.warn("[geocode] NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN non defini")
    } else {
      // Mapbox Geocoding v5 :
      // - types=place : retourne uniquement des villes
      // - language=fr : labels en francais
      // - country=fr : restreint a la France
      // - limit=1 : un seul resultat suffit pour le geocoding
      const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?access_token=${mapboxToken}&types=place&limit=1&language=fr&country=fr`
      const geocodeResponse = await fetch(geocodeUrl, {
        signal: AbortSignal.timeout(5000), // Timeout 5s pour ne pas bloquer
      })

      if (geocodeResponse.ok) {
        const geoData = await geocodeResponse.json()
        // Mapbox retourne features[].center = [longitude, latitude]
        // Meme ordre que GeoJSON : [lng, lat], pas [lat, lng]
        if (geoData.features && geoData.features.length > 0) {
          const [lng, lat] = geoData.features[0].center
          latitude = lat
          longitude = lng
        }
      }
    }
  } catch {
    // Erreur reseau ou timeout — on continue sans coordonnees
    console.warn(`[geocode] Impossible de geocoder la ville "${city}"`)
  }

  // Upsert : creer le profil s'il n'existe pas, sinon le mettre a jour
  const profile = await db.stylistProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      bio: bio || null,
      city,
      address: address || null,
      radiusKm,
      latitude,
      longitude,
    },
    update: {
      bio: bio || null,
      city,
      address: address || null,
      radiusKm,
      latitude,
      longitude,
    },
  })

  return { success: true, data: profile }
}

/**
 * updateStylistAvatar — Mettre a jour la photo de profil
 *
 * L'URL de l'avatar est stockee dans User.image (champ Better Auth).
 */
export async function updateStylistAvatar(
  imageUrl: string
): Promise<ActionResult<{ imageUrl: string }>> {
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }
  if (session.user.role !== "STYLIST") return { success: false, error: "Acces reserve aux coiffeuses" }

  await db.user.update({
    where: { id: session.user.id },
    data: { image: imageUrl },
  })

  return { success: true, data: { imageUrl } }
}
