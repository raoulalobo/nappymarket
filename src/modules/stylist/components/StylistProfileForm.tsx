/**
 * StylistProfileForm — Formulaire d'edition du profil coiffeuse
 *
 * Role : Permettre a une coiffeuse de creer ou modifier son profil
 *        (bio, ville, adresse, rayon de deplacement) et sa photo de profil.
 *        Le formulaire pre-remplit les champs si un profil existe deja.
 *
 * Interactions :
 *   - Utilise React Hook Form + zodResolver pour la validation (stylistProfileSchema)
 *   - Utilise useStylistProfile() pour charger le profil existant
 *   - Utilise useUpdateStylistProfile() pour sauvegarder les modifications
 *   - Utilise useUpdateAvatar() pour mettre a jour la photo de profil
 *   - Utilise useSession() pour obtenir le userId (necessaire pour ImageUpload)
 *   - Le composant ImageUpload gere l'upload vers Supabase Storage (bucket "avatars")
 *   - Affiche un Skeleton pendant le chargement initial des donnees
 *
 * Exemple :
 *   // Dans une page coiffeuse
 *   import { StylistProfileForm } from "@/modules/stylist/components/StylistProfileForm"
 *   <StylistProfileForm />
 */
"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

/* Composants shadcn/ui */
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton"

/* Composant commun d'upload d'image */
import { ImageUpload } from "@/shared/components/common/ImageUpload"

/* Schema Zod et type infere pour le formulaire */
import {
  stylistProfileSchema,
} from "@/modules/stylist/schemas/stylist-schemas"
import type { StylistProfileSchema } from "@/modules/stylist/schemas/stylist-schemas"

/* Hooks de gestion du profil coiffeuse (TanStack Query) */
import {
  useStylistProfile,
  useUpdateStylistProfile,
  useUpdateAvatar,
} from "@/modules/stylist/hooks/useStylistProfile"

/* Hook de session pour obtenir le userId */
import { useSession } from "@/modules/auth/hooks/useSession"

/**
 * StylistProfileForm
 *
 * Composant client qui affiche un formulaire de profil coiffeuse.
 * Les champs sont pre-remplis si le profil existe deja en base.
 * Un Skeleton est affiche pendant le chargement initial.
 */
export function StylistProfileForm() {
  /* ------------------------------------------------------------------ */
  /* Hooks : session, profil, mutations                                 */
  /* ------------------------------------------------------------------ */

  /** Recuperer l'utilisateur connecte (pour le userId de l'upload) */
  const { user } = useSession()

  /** Charger le profil existant (ou null si premiere visite) */
  const { profile, isLoading: isLoadingProfile } = useStylistProfile()

  /** Mutation pour sauvegarder le profil */
  const { updateProfile, isUpdating } = useUpdateStylistProfile()

  /** Mutation pour mettre a jour l'avatar */
  const { updateAvatar } = useUpdateAvatar()

  /* ------------------------------------------------------------------ */
  /* Configuration React Hook Form + Zod                                */
  /* ------------------------------------------------------------------ */

  /**
   * Initialiser le formulaire avec des valeurs par defaut vides.
   * Les vrais valeurs seront injectees via reset() une fois le profil charge.
   */
  const form = useForm<StylistProfileSchema>({
    resolver: zodResolver(stylistProfileSchema),
    defaultValues: {
      bio: "",
      city: "",
      address: "",
      radiusKm: 10,
    },
  })

  /* ------------------------------------------------------------------ */
  /* Pre-remplir le formulaire quand le profil est charge               */
  /* ------------------------------------------------------------------ */

  /**
   * Quand les donnees du profil arrivent du serveur,
   * reset() injecte les valeurs existantes dans tous les champs.
   * Exemple : profile.city = "Paris" -> le champ ville affiche "Paris"
   */
  useEffect(() => {
    if (profile) {
      form.reset({
        bio: profile.bio ?? "",
        city: profile.city ?? "",
        address: profile.address ?? "",
        radiusKm: profile.radiusKm ?? 10,
      })
    }
  }, [profile, form])

  /* ------------------------------------------------------------------ */
  /* Soumission du formulaire                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Appeler la server action updateStylistProfile via la mutation.
   * Le toast de succes/erreur est gere dans le hook useUpdateStylistProfile.
   */
  async function onSubmit(data: StylistProfileSchema) {
    await updateProfile(data)
  }

  /* ------------------------------------------------------------------ */
  /* Callback d'upload d'avatar                                         */
  /* ------------------------------------------------------------------ */

  /**
   * Appele par ImageUpload quand l'upload est termine.
   * Met a jour le champ User.image via la server action.
   * Exemple : url = "https://supabase.../avatars/user-123/photo.jpg"
   */
  function handleAvatarUpload(url: string) {
    updateAvatar(url)
  }

  /* ------------------------------------------------------------------ */
  /* Etat de chargement : afficher un Skeleton                          */
  /* ------------------------------------------------------------------ */

  if (isLoadingProfile) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Skeleton pour l'avatar */}
          <Skeleton className="h-32 w-32 rounded-full" />
          {/* Skeleton pour les champs du formulaire */}
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    )
  }

  /* ------------------------------------------------------------------ */
  /* Rendu du formulaire                                                */
  /* ------------------------------------------------------------------ */

  return (
    <Card className="w-full max-w-2xl mx-auto">
      {/* En-tete de la carte */}
      <CardHeader>
        <CardTitle className="text-2xl">Mon profil</CardTitle>
        <CardDescription>
          Completez votre profil pour etre visible par les clientes.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Section avatar : upload de la photo de profil */}
        {user && (
          <div className="mb-6">
            <p className="text-sm font-medium mb-2">Photo de profil</p>
            <ImageUpload
              bucket="avatars"
              userId={user.id}
              variant="avatar"
              currentImageUrl={profile?.user?.image ?? null}
              onUploadComplete={handleAvatarUpload}
              label="Changer la photo"
            />
          </div>
        )}

        {/* Formulaire React Hook Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Champ bio : description libre de la coiffeuse (max 500 caracteres) */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Parlez de vous, de votre experience et de vos specialites..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Champ ville : requis, minimum 2 caracteres */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ville</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex : Paris, Lyon, Marseille..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Champ adresse : optionnel, pour plus de precision */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Adresse{" "}
                    <span className="text-muted-foreground font-normal">
                      (optionnel)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex : 12 rue de la Paix"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Champ rayon de deplacement en km (1 a 50 km) */}
            <FormField
              control={form.control}
              name="radiusKm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rayon de deplacement (km)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      placeholder="10"
                      {...field}
                      /**
                       * Convertir la valeur string de l'input en number
                       * pour que Zod valide correctement le type
                       */
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bouton de soumission avec indicateur de chargement */}
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
