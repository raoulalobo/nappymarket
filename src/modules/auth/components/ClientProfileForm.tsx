/**
 * ClientProfileForm — Formulaire d'edition du profil cliente
 *
 * Role : Permettre a une cliente de creer ou modifier son profil
 *        (ville et adresse par defaut pour les prestations a domicile).
 *        Le formulaire pre-remplit les champs si un profil existe deja.
 *
 * Interactions :
 *   - Utilise useClientProfile() pour charger le profil existant (TanStack Query)
 *   - Utilise useUpdateClientProfile() pour sauvegarder les modifications
 *   - Valide les champs avec un schema Zod inline (city et address optionnels)
 *   - React Hook Form gere l'etat du formulaire et la validation
 *   - Affiche un Skeleton pendant le chargement initial des donnees
 *   - Le toast de succes/erreur est gere dans le hook useUpdateClientProfile
 *
 * Exemple :
 *   // Dans la page /client/profil
 *   import { ClientProfileForm } from "@/modules/auth/components/ClientProfileForm"
 *   <ClientProfileForm />
 */
"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

/* Composants shadcn/ui */
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

/* Hooks de gestion du profil cliente (TanStack Query) */
import {
  useClientProfile,
  useUpdateClientProfile,
} from "@/modules/auth/hooks/useClientProfile"

/* ------------------------------------------------------------------ */
/* Schema Zod inline pour la validation du formulaire                  */
/* ------------------------------------------------------------------ */

/**
 * Schema de validation pour le profil cliente.
 * Les champs sont optionnels car la cliente n'est pas obligee
 * de tout renseigner immediatement.
 *
 * Exemple de donnees valides :
 *   { city: "Paris", address: "12 rue de la Paix", phone: "06 12 34 56 78" }
 *   { city: "Lyon" }  // address et phone optionnels
 *   {}                 // tous optionnels
 */
const clientProfileSchema = z.object({
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^(?:(?:\+33|0)\s?[1-9])(?:[\s.-]?\d{2}){4}$/.test(val),
      { message: "Numero de telephone invalide (format francais attendu)" }
    ),
})

/** Type TypeScript infere du schema Zod */
type ClientProfileFormData = z.infer<typeof clientProfileSchema>

/* ------------------------------------------------------------------ */
/* Composant principal                                                 */
/* ------------------------------------------------------------------ */

/**
 * ClientProfileForm
 *
 * Composant client qui affiche un formulaire de profil cliente.
 * Les champs sont pre-remplis si le profil existe deja en base.
 * Un Skeleton est affiche pendant le chargement initial.
 */
export function ClientProfileForm() {
  /* ------------------------------------------------------------------ */
  /* Hooks : profil et mutation                                         */
  /* ------------------------------------------------------------------ */

  /** Charger le profil existant (ou null si premiere visite) */
  const { profile, isLoading } = useClientProfile()

  /** Mutation pour sauvegarder le profil (upsert) */
  const { updateProfile, isUpdating } = useUpdateClientProfile()

  /* ------------------------------------------------------------------ */
  /* Configuration React Hook Form + Zod                                */
  /* ------------------------------------------------------------------ */

  /**
   * Initialiser le formulaire avec des valeurs par defaut vides.
   * Les vraies valeurs seront injectees via reset() une fois le profil charge.
   */
  const form = useForm<ClientProfileFormData>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: {
      city: "",
      address: "",
      phone: "",
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
        city: profile.city ?? "",
        address: profile.address ?? "",
        phone: profile.user.phone ?? "",
      })
    }
  }, [profile, form])

  /* ------------------------------------------------------------------ */
  /* Soumission du formulaire                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Appeler la server action updateClientProfile via la mutation.
   * Le toast de succes/erreur est gere dans le hook useUpdateClientProfile.
   */
  async function onSubmit(data: ClientProfileFormData) {
    await updateProfile(data)
  }

  /* ------------------------------------------------------------------ */
  /* Etat de chargement : afficher un Skeleton                          */
  /* ------------------------------------------------------------------ */

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          {/* Skeleton pour le titre */}
          <Skeleton className="h-8 w-48" />
          {/* Skeleton pour la description */}
          <Skeleton className="h-4 w-80 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Skeleton pour le champ ville */}
          <Skeleton className="h-10 w-full" />
          {/* Skeleton pour le champ adresse */}
          <Skeleton className="h-10 w-full" />
          {/* Skeleton pour le champ telephone */}
          <Skeleton className="h-10 w-full" />
          {/* Skeleton pour le bouton */}
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
          Votre adresse par defaut pour les prestations a domicile.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Formulaire React Hook Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Champ ville : optionnel, nom de la ville de residence */}
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

            {/* Champ adresse : optionnel, adresse complete pour les prestations */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
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

            {/* Champ telephone : optionnel, format francais (06/07 ou +33) */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telephone</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="Ex : 06 12 34 56 78"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bouton de soumission avec indicateur de chargement (Loader2) */}
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
