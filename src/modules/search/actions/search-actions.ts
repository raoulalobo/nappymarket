/**
 * search-actions.ts — Server actions pour la recherche de coiffeuses
 *
 * Role : Rechercher des coiffeuses par localisation geographique (formule Haversine)
 *        et retourner les resultats pagines avec filtres et tri.
 *        Fournir aussi la liste des categories actives pour les filtres.
 *
 * Interactions :
 *   - Actions PUBLIQUES (pas de verification d'authentification)
 *   - Utilise la formule Haversine en SQL brut ($queryRaw) pour le calcul de distance
 *   - Prisma 7 ne supporte pas PostGIS, d'ou le calcul SQL natif
 *   - Les tables Prisma sont mappees : stylist_profiles, users, stylist_services,
 *     service_categories
 *   - Appelees par le hook useSearchStylists (TanStack Query)
 *
 * Formule Haversine :
 *   distance = 6371 * acos(
 *     cos(radians(lat1)) * cos(radians(lat2)) *
 *     cos(radians(lng2) - radians(lng1)) +
 *     sin(radians(lat1)) * sin(radians(lat2))
 *   )
 *
 * Exemple :
 *   const result = await searchStylists({
 *     city: "Paris", latitude: 48.85, longitude: 2.35,
 *     radiusKm: 10, sortBy: "distance", page: 1
 *   })
 */
"use server"

import { db } from "@/shared/lib/db"
import { searchFiltersSchema } from "../schemas/search-schemas"
import { SEARCH_RESULTS_PER_PAGE } from "@/shared/lib/constants"
import type { ActionResult } from "@/shared/types"
import type { SearchResponse, SearchStylistResult } from "../types"

/**
 * Resultat brut de la requete SQL Haversine
 * Les noms de colonnes sont en snake_case car ce sont les noms SQL directs
 */
interface RawStylistRow {
  id: string
  user_name: string
  user_image: string | null
  bio: string | null
  city: string
  latitude: number
  longitude: number
  distance_km: number
  is_verified: boolean
  /** Note moyenne (null si aucun avis) — calculee via sous-requete SQL */
  avg_rating: number | null
  /** Nombre d'avis — calcule via sous-requete SQL */
  review_count: bigint
}

/**
 * searchStylists — Rechercher des coiffeuses par localisation
 *
 * 1. Valide les filtres avec Zod
 * 2. Execute une requete SQL Haversine pour trouver les coiffeuses dans le rayon
 * 3. Compte le total pour la pagination
 * 4. Enrichit chaque resultat avec les services et categories
 * 5. Retourne la reponse paginee
 *
 * @param input - Filtres de recherche bruts (valides par Zod)
 * @returns ActionResult<SearchResponse> - Resultats pagines ou erreur
 */
export async function searchStylists(
  input: unknown
): Promise<ActionResult<SearchResponse>> {
  // 1. Valider les filtres
  const parsed = searchFiltersSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Filtres invalides" }
  }

  const { latitude, longitude, radiusKm, categoryId, sortBy, page } = parsed.data
  const offset = (page - 1) * SEARCH_RESULTS_PER_PAGE

  try {
    // 2. Clause WHERE supplementaire pour filtrer par categorie
    // Si categoryId est fourni, on filtre les coiffeuses qui ont au moins
    // un service dans cette categorie
    const categoryFilter = categoryId
      ? `AND EXISTS (
          SELECT 1 FROM stylist_services ss
          WHERE ss."stylistId" = sp.id AND ss."categoryId" = '${categoryId}'
        )`
      : ""

    // 3. Clause ORDER BY selon le tri demande
    // - distance : tri par distance croissante (plus proche en premier)
    // - price_asc : tri par prix minimum croissant (moins cher en premier)
    // - price_desc : tri par prix minimum decroissant (plus cher en premier)
    // Note : on utilise price_min (calcule dans la sous-requete) pour le tri par prix
    let orderClause: string
    switch (sortBy) {
      case "price_asc":
        orderClause = "price_min ASC NULLS LAST, distance_km ASC"
        break
      case "price_desc":
        orderClause = "price_min DESC NULLS LAST, distance_km ASC"
        break
      default:
        orderClause = "distance_km ASC"
    }

    // 4. Requete principale : sous-requete calcule distance + prix min,
    //    requete externe filtre par distance et applique ORDER/LIMIT
    // On utilise une sous-requete car on ne peut pas filtrer par un alias
    // calcule (distance_km) directement dans WHERE de la meme requete.
    const stylists = await db.$queryRawUnsafe<RawStylistRow[]>(`
      SELECT id, user_name, user_image, bio, city, latitude, longitude,
             is_verified, distance_km, avg_rating, review_count
      FROM (
        SELECT
          sp.id,
          u.name AS user_name,
          u.image AS user_image,
          sp.bio,
          sp.city,
          sp.latitude,
          sp.longitude,
          sp."isVerified" AS is_verified,
          (
            6371 * acos(
              LEAST(1.0, GREATEST(-1.0,
                cos(radians($1)) * cos(radians(sp.latitude)) *
                cos(radians(sp.longitude) - radians($2)) +
                sin(radians($1)) * sin(radians(sp.latitude))
              ))
            )
          ) AS distance_km,
          (SELECT MIN(ss.price) FROM stylist_services ss WHERE ss."stylistId" = sp.id) AS price_min,
          (SELECT AVG(r.rating) FROM reviews r WHERE r."stylistId" = sp.id) AS avg_rating,
          (SELECT COUNT(*) FROM reviews r WHERE r."stylistId" = sp.id) AS review_count
        FROM stylist_profiles sp
        INNER JOIN users u ON u.id = sp."userId"
        WHERE sp."isActive" = true
          AND sp.latitude IS NOT NULL
          AND sp.longitude IS NOT NULL
          AND u."isActive" = true
          -- Onboarding complet : profil renseigne (bio + photo)
          AND sp.bio IS NOT NULL
          AND u.image IS NOT NULL
          -- Onboarding complet : au moins 1 prestation
          AND EXISTS (
            SELECT 1 FROM stylist_services ss2
            WHERE ss2."stylistId" = sp.id
          )
          -- Onboarding complet : au moins 1 disponibilite active
          AND EXISTS (
            SELECT 1 FROM availabilities av
            WHERE av."stylistId" = sp.id AND av."isActive" = true
          )
          -- Onboarding complet : au moins 1 photo portfolio
          AND EXISTS (
            SELECT 1 FROM portfolio_images pi2
            WHERE pi2."stylistId" = sp.id
          )
          ${categoryFilter}
      ) AS results
      WHERE distance_km <= $3
      ORDER BY ${orderClause}
      LIMIT $4 OFFSET $5
    `,
      latitude,
      longitude,
      radiusKm,
      SEARCH_RESULTS_PER_PAGE,
      offset
    )

    // 5. Compter le total de resultats (sans LIMIT/OFFSET)
    const countResult = await db.$queryRawUnsafe<[{ count: bigint }]>(`
      SELECT COUNT(*) as count
      FROM stylist_profiles sp
      INNER JOIN users u ON u.id = sp."userId"
      WHERE sp."isActive" = true
        AND sp.latitude IS NOT NULL
        AND sp.longitude IS NOT NULL
        AND u."isActive" = true
        -- Onboarding complet : profil renseigne (bio + photo)
        AND sp.bio IS NOT NULL
        AND u.image IS NOT NULL
        -- Onboarding complet : au moins 1 prestation
        AND EXISTS (
          SELECT 1 FROM stylist_services ss2
          WHERE ss2."stylistId" = sp.id
        )
        -- Onboarding complet : au moins 1 disponibilite active
        AND EXISTS (
          SELECT 1 FROM availabilities av
          WHERE av."stylistId" = sp.id AND av."isActive" = true
        )
        -- Onboarding complet : au moins 1 photo portfolio
        AND EXISTS (
          SELECT 1 FROM portfolio_images pi2
          WHERE pi2."stylistId" = sp.id
        )
        ${categoryFilter}
        AND (
          6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians($1)) * cos(radians(sp.latitude)) *
              cos(radians(sp.longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(sp.latitude))
            ))
          )
        ) <= $3
    `,
      latitude,
      longitude,
      radiusKm
    )

    const totalCount = Number(countResult[0]?.count ?? 0)
    const totalPages = Math.max(1, Math.ceil(totalCount / SEARCH_RESULTS_PER_PAGE))

    // 6. Enrichir chaque resultat avec les services et categories
    // On utilise Prisma pour charger les services de chaque coiffeuse trouvee
    const stylistIds = stylists.map((s) => s.id)

    // Charger les services groupes par coiffeuse (1 seule requete)
    const services = stylistIds.length > 0
      ? await db.stylistService.findMany({
          where: { stylistId: { in: stylistIds } },
          include: { category: { select: { name: true } } },
        })
      : []

    // Construire un map stylistId -> services pour un acces rapide
    const servicesByStylist = new Map<string, typeof services>()
    for (const service of services) {
      const existing = servicesByStylist.get(service.stylistId) ?? []
      existing.push(service)
      servicesByStylist.set(service.stylistId, existing)
    }

    // 7. Transformer les resultats bruts en SearchStylistResult
    const results: SearchStylistResult[] = stylists.map((row) => {
      const stylistServices = servicesByStylist.get(row.id) ?? []
      const prices = stylistServices.map((s) => s.price)
      const categoryNames = [...new Set(stylistServices.map((s) => s.category.name))]

      return {
        id: row.id,
        userName: row.user_name,
        userImage: row.user_image,
        bio: row.bio,
        city: row.city,
        latitude: row.latitude,
        longitude: row.longitude,
        distanceKm: Math.round(row.distance_km * 10) / 10, // Arrondi a 1 decimale
        isVerified: row.is_verified,
        serviceCount: stylistServices.length,
        priceMin: prices.length > 0 ? Math.min(...prices) : null,
        priceMax: prices.length > 0 ? Math.max(...prices) : null,
        categoryNames,
        // Note moyenne arrondie a 1 decimale (ex: 4.666 -> 4.7)
        averageRating: row.avg_rating
          ? Math.round(Number(row.avg_rating) * 10) / 10
          : null,
        reviewCount: Number(row.review_count),
      }
    })

    return {
      success: true,
      data: {
        stylists: results,
        totalCount,
        page,
        totalPages,
        center: { latitude, longitude },
      },
    }
  } catch (error) {
    console.error("[searchStylists] Erreur SQL :", error)
    return { success: false, error: "Erreur lors de la recherche" }
  }
}

/** Type enrichi d'une categorie active (utilise par la page d'accueil et les filtres) */
export interface ActiveCategory {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  /** Nombre de services proposes dans cette categorie */
  serviceCount: number
}

/**
 * ActiveCategoryWithChildren — Categorie racine avec ses sous-categories
 *
 * Utilise par :
 *   - CategoryFlipCard sur la page d'accueil (verso de la carte flip)
 *
 * Exemple : { id: "...", name: "Tresses", children: [{ name: "Box Braids" }, ...] }
 */
export interface ActiveCategoryWithChildren extends ActiveCategory {
  /** Sous-categories actives (tableau vide si aucune sous-categorie) */
  children: ActiveCategory[]
}

/**
 * getActiveCategories — Recuperer les categories racines actives avec leurs sous-categories
 *
 * Utilisee par :
 *   - La page d'accueil (CategoryFlipCard : face avant + verso liste sous-cats)
 *   - Le composant SearchFilters (utilise uniquement id et name)
 *
 * Retourne uniquement les categories racines (parentId: null).
 * Chaque categorie inclut ses enfants directs actifs.
 * Action publique : pas de verification d'authentification.
 *
 * @returns ActionResult<ActiveCategoryWithChildren[]>
 */
export async function getActiveCategories(): Promise<
  ActionResult<ActiveCategoryWithChildren[]>
> {
  try {
    // Charger uniquement les categories racines (parentId: null)
    // avec leurs sous-categories actives incluses
    const categories = await db.serviceCategory.findMany({
      where: {
        isActive: true,
        parentId: null, // Uniquement les categories racines
      },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        _count: { select: { services: true } },
        // Inclure les sous-categories actives, triees par nom
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            _count: { select: { services: true } },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    })

    /* Transformer _count.services en serviceCount pour la racine ET les enfants */
    const data: ActiveCategoryWithChildren[] = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      imageUrl: cat.imageUrl,
      serviceCount: cat._count.services,
      children: cat.children.map((child) => ({
        id: child.id,
        name: child.name,
        description: child.description,
        imageUrl: child.imageUrl,
        serviceCount: child._count.services,
      })),
    }))

    return { success: true, data }
  } catch (error) {
    console.error("[getActiveCategories] Erreur :", error)
    return { success: false, error: "Impossible de charger les categories" }
  }
}
