# Plan : Refonte design page profil public `/coiffeuse/[id]`

## Contexte

La page profil public d'une coiffeuse a un design brut et incoherent avec le reste de la plateforme :
- **Pas de Header/Footer** — l'utilisateur n'a aucune navigation
- **Layout plat** — tout empile sans sections visuelles distinctes
- **Pas de CTA** — aucun bouton "Reserver" ou lien vers les resultats
- **Avatar petit** — 128px sans mise en valeur
- **Sections Prestations et Portfolio** — design minimal

Les autres pages publiques (accueil, /recherche) ont Header + Footer + sections structurees.

## Fichier a modifier

**`src/app/(public)/coiffeuse/[id]/page.tsx`** — fichier unique

## Modifications

### 1. Wrapper Header + Footer
Ajouter `<Header />` et `<Footer />` comme toutes les autres pages publiques.

### 2. Lien retour
Bouton "Retour a la recherche" en haut avec icone ArrowLeft (comme un breadcrumb).

### 3. Section Hero redesignee
- Avatar agrandi (160px) avec bordure et ring
- Layout horizontal (avatar gauche, infos droite) sur desktop
- Nom en h1 plus grand (text-3xl)
- Ville avec icone MapPin
- Badge "Verifiee" en variant secondary
- Bio dans un bloc stylise
- **Bouton CTA "Reserver"** (placeholder href="#", sera fonctionnel en Phase 5)

### 4. Section Prestations amelioree
- Titre avec Separator shadcn
- Grille de Card shadcn plus lisibles : badge categorie en haut, prix en primary, duree en badge outline
- Description en texte muted

### 5. Section Portfolio amelioree
- Titre avec compteur "(X photos)"
- Grille responsive identique (deja bien, 2/3/4 cols)
- Conserver le hover zoom + caption overlay (deja present)

### 6. Conteneur principal
- Wrapper `max-w-4xl mx-auto` pour centrer le contenu
- Spacing coherent entre sections (space-y-10)

## Composants reutilises (deja existants)
- `Header` : `src/shared/components/layout/Header.tsx`
- `Footer` : `src/shared/components/layout/Footer.tsx`
- `Badge` : `src/components/ui/badge.tsx`
- `Card, CardContent, CardHeader, CardTitle` : `src/components/ui/card.tsx`
- `Button` : `src/components/ui/button.tsx`
- `Separator` : `src/components/ui/separator.tsx`
- `formatPrice` : `src/shared/lib/utils.ts`
- Icones lucide : MapPin, ArrowLeft, Clock, Scissors

## Verification
- La page affiche Header + Footer
- Le bouton "Retour" ramene vers /recherche
- L'avatar est plus grand et mieux presente
- Les prestations sont dans une grille claire
- Le portfolio est inchange (deja correct)
- La page est responsive (mobile/tablette/desktop)
