/**
 * ResetPasswordForm — Formulaire de reinitialisation de mot de passe
 *
 * Role : Permettre a un utilisateur de definir un nouveau mot de passe
 *        apres avoir clique sur le lien de reinitialisation recu par email.
 *        Le token est extrait des searchParams de l'URL.
 *
 * Interactions :
 *   - Utilise le hook useAuth() pour appeler resetPassword (Better Auth)
 *   - Valide les champs avec resetPasswordSchema (Zod)
 *   - Redirige vers /connexion apres succes (via useAuth)
 *   - Affiche un message d'erreur si le token est absent ou invalide
 *
 * Exemple :
 *   <ResetPasswordForm token="abc123" />
 */
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/shared/components/common/PasswordInput"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  resetPasswordSchema,
  type ResetPasswordSchema,
} from "@/modules/auth/schemas/auth-schemas"
import { useAuth } from "@/modules/auth/hooks/useAuth"

/** Props du composant : le token de reinitialisation extrait de l'URL */
interface ResetPasswordFormProps {
  token: string | null
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { resetPassword, isLoading } = useAuth()

  // Configuration React Hook Form avec resolver Zod
  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  // Soumission du formulaire : envoie le nouveau mot de passe avec le token
  async function onSubmit(data: ResetPasswordSchema) {
    if (!token) return
    await resetPassword(token, data.password)
  }

  // Si pas de token dans l'URL, afficher un message d'erreur
  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Lien invalide</CardTitle>
          <CardDescription>
            Le lien de reinitialisation est invalide ou a expire.
            Veuillez effectuer une nouvelle demande.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link
            href="/mot-de-passe-oublie"
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Demander un nouveau lien
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
        <CardDescription>
          Choisissez un nouveau mot de passe pour votre compte.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Champ nouveau mot de passe */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nouveau mot de passe</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Minimum 8 caracteres"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Champ confirmation mot de passe */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmer le mot de passe</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Retapez le mot de passe"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Indication des regles de mot de passe */}
            <p className="text-xs text-muted-foreground">
              Le mot de passe doit contenir au moins 8 caracteres, une majuscule et un chiffre.
            </p>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            {/* Bouton de soumission */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reinitialisation en cours...
                </>
              ) : (
                "Reinitialiser le mot de passe"
              )}
            </Button>

            {/* Lien retour vers la connexion */}
            <Link
              href="/connexion"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour a la connexion
            </Link>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
