# Plan Incremental — NappyMarket

## Vue d'ensemble

Le projet est decoupe en **8 phases** progressives. Chaque phase produit
un increment fonctionnel testable. On ne passe a la phase suivante qu'apres
validation de la precedente.

**Stack** : Next.js 16 + Turbopack + pnpm + TypeScript + Tailwind v4 + shadcn/ui
+ Prisma 7 + ZenStack + Better Auth + TanStack Query + Zustand + Immer + Zod
+ React Hook Form + Stripe Connect + Leaflet/OSM + API Adresse Gouv + Resend
+ Supabase (Cloud, Storage, Realtime) + Vercel

---

## Phase 1 — Fondations (Setup & Infrastructure) ✅ TERMINEE

**Objectif** : Projet Next.js fonctionnel avec la stack configuree,
              deploye sur Vercel, connecte a Supabase.

### Taches

- [x] 1.1 Initialiser le projet Next.js avec TypeScript, Tailwind CSS et pnpm
- [x] 1.2 Installer et configurer les dependances
- [x] 1.3 Installer les 7 Agent Skills (best practices)
- [x] 1.4 Creer la structure de dossiers modulaire
- [x] 1.5 Configurer Prisma 7 avec prisma.config.ts + Supabase
- [x] 1.6 Creer le schema Prisma complet + push vers Supabase
- [x] 1.7 Configurer ZenStack (placeholder pour les access policies)
- [x] 1.8 Creer .env.local et .env.example
- [x] 1.9 Creer le layout racine avec providers (QueryProvider, Toaster)
- [x] 1.10 Creer les composants layout (Header, Footer)
- [x] 1.11 Page d'accueil placeholder
- [x] 1.12 Installer TanStack Query + provider
- [x] pnpm build passe sans erreur

---

## Phase 2 — Authentification ✅ TERMINEE

**Objectif** : Inscription, connexion, deconnexion fonctionnels
              avec separation des roles (Client, Coiffeuse, Admin).

### Skills a consulter
- better-auth-best-practices : config auth, sessions, middleware
- next-best-practices : middleware, routes protegees, server actions
- vercel-react-best-practices : composants formulaires, hooks
- frontend-design : design des pages connexion/inscription

### Taches

- [x] 2.1 Configurer Better Auth (server + client)
  - Provider email/password avec Prisma adapter
  - Session management (7 jours, renouvellement auto)
  - Plugin inferAdditionalFields pour le typage client
  - Route handler catch-all /api/auth/[...all]
- [x] 2.2 Creer le module src/modules/auth/
  - Schemas Zod : loginSchema, registerSchema (Zod v4 API)
  - Hook useSession (wrapper Better Auth useSession)
  - Hook useAuth (login, register, logout avec redirections)
  - Types TypeScript (AuthUser, AuthSession, UserRole)
- [x] 2.3 Page d'inscription (/inscription)
  - Formulaire React Hook Form + resolver Zod
  - Choix du role avec RadioGroup visuel (icones User/Scissors)
  - Champs : role, prenom, nom, email, mot de passe
  - Validation Zod v4 (messages francais)
- [x] 2.4 Page de connexion (/connexion)
  - Formulaire React Hook Form + resolver Zod
  - Redirection apres connexion selon le role
- [x] 2.5 Middleware Next.js pour la protection des routes
  - Verifie le cookie de session Better Auth
  - Routes protegees : /client/*, /coiffeuse/dashboard/*, /admin/*
  - Verification du role dans les layouts (pas dans le middleware Edge)
- [x] 2.6 Store Zustand auth-store (state UI: modale connexion)
- [x] 2.7 Composant UserMenu dans le Header (connecte/deconnecte)
  - Avatar avec initiales, dropdown menu, liens selon le role
- [x] 2.8 Creer un user ADMIN en seed (prisma/seed.ts)
- [x] 2.9 Schema Prisma mis a jour pour Better Auth
  - Tables Session, Account, Verification ajoutees
  - User adapte (name, emailVerified, image + champs custom)
  - Adaptateur @prisma/adapter-pg pour Prisma 7 client engine
- [x] pnpm build passe sans erreur

### Tests Phase 2

- [ ] Inscription Cliente OK -> redirige vers /client
- [ ] Inscription Coiffeuse OK -> redirige vers /coiffeuse
- [ ] Connexion avec mauvais mot de passe -> erreur affichee
- [ ] Acces /coiffeuse/dashboard sans auth -> redirige vers /connexion
- [ ] Acces /admin en tant que CLIENT -> erreur 403
- [ ] Deconnexion -> retour a l'accueil

---

## Phase 3 — Profils & Catalogue ✅ TERMINEE

**Objectif** : Les coiffeuses peuvent completer leur profil, gerer leur
              portfolio. L'admin gere le catalogue de prestations.

### Skills a consulter
- supabase-postgres-best-practices : Storage buckets, RLS policies, queries
- vercel-react-best-practices : composants upload, grilles, formulaires
- vercel-composition-patterns : layout des pages profil, slots
- frontend-design : design profil public, portfolio grid, formulaires admin

### Taches

- [x] 3.1 Module src/modules/stylist/
  - Page profil coiffeuse (edition) : bio, ville, adresse, rayon
  - Upload photo de profil (Supabase Storage)
  - Gestion du portfolio : upload/suppression de photos avant/apres
  - Selection des prestations dans le catalogue + prix personnalises
  - Hooks TanStack Query : useStylistProfile, useUpdateProfile, usePortfolio
- [x] 3.2 Module src/modules/admin/
  - Page catalogue CRUD : creer/modifier/supprimer des categories
  - Liste des coiffeuses inscrites avec statut (verifie/non verifie)
  - Action valider/suspendre un profil coiffeuse
  - Hooks TanStack Query : useCategories, useStylists (admin)
- [x] 3.3 Configurer Supabase Storage
  - Bucket avatars (photos de profil)
  - Bucket portfolio (photos de realisations)
  - Policies d'acces (upload: owner only, read: public)
- [x] 3.4 Composants partages (ImageUpload, Avatar, PortfolioGrid)
- [x] 3.5 Page profil public coiffeuse (/coiffeuse/[id])
- [x] 3.6 Profil cliente (edition) : adresse, telephone
- [x] 3.7 Seed : categories de coiffures par defaut

### Tests Phase 3

- [x] La coiffeuse peut completer son profil et uploader des photos
- [x] Le portfolio s'affiche correctement sur le profil public
- [x] L'admin peut creer/modifier/supprimer des categories
- [x] Les images sont bien stockees sur Supabase Storage
- [x] Un visiteur non connecte voit le profil public sans erreur

---

## Phase 4 — Recherche & Decouverte

**Objectif** : Les clientes peuvent chercher des coiffeuses par ville
              et parcourir les resultats sur une carte interactive.

### Skills a consulter
- next-best-practices : SSR pour le SEO des resultats, server actions
- vercel-react-best-practices : composants SearchBar, StylistCard, hooks
- vercel-composition-patterns : layout split liste/carte, responsive
- frontend-design : design page d'accueil, resultats, carte, UX recherche
- supabase-postgres-best-practices : requetes geographiques, index, performance

### Taches

- [ ] 4.1 Module src/modules/search/
  - Composant SearchBar : autocompletion ville via API Adresse Gouv
  - Composant SearchResults : liste de coiffeuses avec pagination
  - Composant StylistCard : apercu (photo, nom, ville, prestations)
  - Composant SearchMap : carte Leaflet/OpenStreetMap avec markers
  - Hook TanStack Query : useSearchStylists (query avec filtres)
  - Hook : useAddressAutocomplete (API Adresse Gouv)
- [ ] 4.2 Integration Leaflet / OpenStreetMap
  - Chargement dynamique (next/dynamic, SSR: false)
  - Markers cliquables -> popup avec apercu coiffeuse
- [ ] 4.3 Page d'accueil (/) : hero + recherche + categories
- [ ] 4.4 Page de resultats (/recherche)
  - Vue split liste/carte (desktop), toggle (mobile)
  - Filtres, tri, pagination
- [ ] 4.5 Store Zustand search-filters-store (filtres UI uniquement)

### Tests Phase 4

- [ ] La recherche par ville retourne les coiffeuses dans la zone
- [ ] L'autocompletion d'adresse fonctionne
- [ ] La carte Leaflet affiche les markers
- [ ] Le filtre par prestation fonctionne
- [ ] La pagination fonctionne

---

## Phase 5 — Disponibilites & Reservation

**Objectif** : Les coiffeuses definissent leurs creneaux, les clientes
              peuvent reserver un creneau.

### Skills a consulter
- next-best-practices : server actions pour CRUD reservations
- vercel-react-best-practices : composants calendrier, formulaires multi-etapes
- frontend-design : UX flow de reservation, design calendrier
- supabase-postgres-best-practices : transactions, contraintes d'unicite

### Taches

- [ ] 5.1 Module src/modules/booking/
  - Composants : AvailabilityCalendar, BookingForm, BookingCard
  - Server actions : createBooking, cancelBooking, getBookings
  - Hooks TanStack Query : useAvailability, useBookings, useCreateBooking
  - Schemas Zod : bookingSchema, availabilitySchema
- [ ] 5.2 Gestion des disponibilites (espace coiffeuse)
- [ ] 5.3 Flow de reservation (espace cliente)
  - Store Zustand : booking-flow-store (etape courante du flow UI)
- [ ] 5.4 Tableau des reservations (coiffeuse)
- [ ] 5.5 Historique des reservations (cliente)
- [ ] 5.6 Notifications email via Resend (templates React Email)

### Tests Phase 5

- [ ] La coiffeuse peut definir ses disponibilites
- [ ] La cliente peut creer une reservation
- [ ] Un creneau reserve n'est plus disponible
- [ ] L'annulation libere le creneau

---

## Phase 6 — Paiement Stripe

**Objectif** : Paiement en ligne integre avec Stripe Connect.

### Skills a consulter
- next-best-practices : API routes pour webhooks, server actions
- vercel-react-best-practices : composants Stripe Elements
- frontend-design : design page de paiement, UX securite

### Taches

- [ ] 6.1 Module src/modules/payment/
  - Config Stripe (server + client)
  - Server actions : createPaymentIntent, createConnectAccount
  - Webhook handler : /api/stripe/webhook
  - Composant PaymentForm (Stripe Elements / PaymentElement)
  - Hook TanStack Query : usePaymentStatus
- [ ] 6.2 Stripe Connect pour les coiffeuses
- [ ] 6.3 Integration dans le flow de reservation
- [ ] 6.4 Webhook Stripe (payment_intent.succeeded, etc.)
- [ ] 6.5 Commission plateforme (application_fee_amount)
- [ ] 6.6 Page recapitulative de paiement

### Tests Phase 6

- [ ] Le paiement test fonctionne (mode test Stripe)
- [ ] La commission est correctement prelevee
- [ ] Le webhook met a jour le statut de la reservation

---

## Phase 7 — Messagerie Temps Reel

**Objectif** : Chat en temps reel entre cliente et coiffeuse.

### Skills a consulter
- supabase-postgres-best-practices : Realtime subscriptions, RLS
- vercel-react-best-practices : composants chat, gestion d'etat
- vercel-composition-patterns : layout split conversations/chat
- frontend-design : design chat, bulles, responsive mobile

### Taches

- [ ] 7.1 Module src/modules/messaging/
  - Composants : ChatWindow, MessageBubble, ConversationList
  - Server actions : sendMessage, getConversations
  - Hook TanStack Query : useMessages (query + realtime push via setQueryData)
  - Store Zustand : chat-ui-store (conversation active, onglet ouvert)
- [ ] 7.2 Integration Supabase Realtime
- [ ] 7.3 Pages de messagerie (client + coiffeuse)
- [ ] 7.4 Notifications de nouveaux messages (badge + email)
- [ ] 7.5 Lien automatique avec les reservations

### Tests Phase 7

- [ ] Un message envoye apparait instantanement chez le destinataire
- [ ] L'indicateur "non lu" fonctionne
- [ ] Le chat fonctionne sur mobile

---

## Phase 8 — Admin Dashboard & Polish

**Objectif** : Dashboard admin, SEO, performance, accessibilite.

### Skills a consulter
- next-best-practices : SEO, metadata, sitemap, performance
- vercel-react-best-practices : Suspense, loading states
- vercel-composition-patterns : layouts admin, dashboard patterns
- frontend-design : accessibilite, responsive audit
- agent-browser : tests E2E manuels assistes

### Taches

- [ ] 8.1 Dashboard Admin complet (stats, graphiques, gestion users)
- [ ] 8.2 SEO & Metadata (generateMetadata, sitemap, Open Graph)
- [ ] 8.3 Performance (next/image, Suspense, pagination serveur, cache)
- [ ] 8.4 Pages legales (CGU, confidentialite, mentions legales)
- [ ] 8.5 Responsive & Accessibilite (audit, ARIA, contrastes)
- [ ] 8.6 Gestion des erreurs (404, 500, error boundaries, toasts)
- [ ] 8.7 Tests E2E via agent-browser

### Tests Phase 8

- [ ] Lighthouse score > 90
- [ ] Toutes les pages sont responsives
- [ ] SEO fonctionnel (metadata, indexation)
- [ ] Dashboard admin affiche des donnees coherentes

---

## Phase 9 — Internationalisation (future)

**Objectif** : Etendre NappyMarket au-dela de la France (Belgique, Suisse,
              Afrique, DOM-TOM, etc.) en adaptant le geocoding, la carte
              et les contenus multilingues.

### 9.1 Geocoding & Autocompletion internationale

**Probleme** : L'API Adresse Gouv ne couvre que la France metropolitaine.
Pour une expansion internationale, il faut un service de geocoding mondial.

**Architecture actuelle (decouplage)** :
- Le geocoding (API Adresse Gouv) est isole dans `useAddressAutocomplete.ts`
- Le store Zustand recoit `{ city, latitude, longitude }` — format generique
- La carte (Leaflet) recoit les coordonnees du store — independant du geocoding
- **Changer de service de geocoding n'impacte QUE le hook d'autocompletion**

**Alternatives evaluees** :

| Service | Gratuit | Couverture | Autocompletion | Limites gratuites |
|---|---|---|---|---|
| **Nominatim (OSM)** | 100% | Monde | Oui | 1 req/s (suffisant avec debounce) |
| **Photon (Komoot)** | 100% | Monde | Oui | Self-host ou API publique |
| **Mapbox Geocoding** | Freemium | Monde | Excellente | 100k req/mois |
| **MapTiler Geocoding** | Freemium | Monde | Oui | 100k req/mois |
| **LocationIQ** | Freemium | Monde | Oui | 5k req/jour |
| **Google Places API** | Non | Monde | Excellente | ~11k req/mois (200$ credits) |
| **Geoapify** | Freemium | Monde | Oui | 3k req/jour |

**Strategie recommandee : approche hybride**
- Garder API Adresse Gouv pour la France (meilleure precision)
- Ajouter Nominatim ou Mapbox pour les autres pays
- Router dans `useAddressAutocomplete.ts` selon le pays cible
- Le format de sortie `AddressSuggestion[]` reste identique

### 9.2 Carte interactive

- Leaflet/OSM fonctionne deja a l'international (pas de changement requis)
- Alternative future : Mapbox GL JS ou MapLibre (si besoin de tuiles stylisees)
- Le decoupage carte/geocoding permet de migrer independamment

### 9.3 Contenus multilingues (i18n)

- Ajouter next-intl ou next-i18next
- Externaliser tous les textes en fichiers de traduction
- Adapter les schemas Zod (messages d'erreur par locale)

### 9.4 Devise & Paiement

- Stripe supporte deja les devises internationales
- Adapter le format de prix selon la locale (EUR, XOF, CHF...)

### Taches

- [ ] 9.1 Abstraire le geocoding (interface commune, routing par pays)
- [ ] 9.2 Integrer un service de geocoding international
- [ ] 9.3 Configurer i18n (next-intl)
- [ ] 9.4 Adapter Stripe pour les devises internationales
- [ ] 9.5 Tester avec des adresses hors France

---

## Resume des Phases

| Phase | Nom                          | Dependances | Priorite | Statut    |
| ----- | ---------------------------- | ----------- | -------- | --------- |
| 1     | Fondations                   | Aucune      | Critique | ✅ FAIT   |
| 2     | Authentification             | Phase 1     | Critique | ✅ FAIT   |
| 3     | Profils & Catalogue          | Phase 2     | Critique | ✅ FAIT   |
| 4     | Recherche & Decouverte       | Phase 3     | Haute    | A faire   |
| 5     | Disponibilites & Reservation | Phase 4     | Haute    | A faire   |
| 6     | Paiement Stripe              | Phase 5     | Haute    | A faire   |
| 7     | Messagerie Temps Reel        | Phase 2     | Moyenne  | A faire   |
| 8     | Admin Dashboard & Polish     | Toutes      | Moyenne  | A faire   |
| 9     | Internationalisation         | Phase 8     | Basse    | Future    |

> **Note** : La Phase 7 (Messagerie) peut etre developpee en parallele
> des Phases 4-6 car elle ne depend que de la Phase 2 (Auth).
