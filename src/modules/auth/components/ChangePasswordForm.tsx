/**
 * ChangePasswordForm — Formulaire de changement de mot de passe (utilisateur connecte)
 *
 * Role : Permettre a un utilisateur connecte de modifier son mot de passe
 *        en saisissant son mot de passe actuel et le nouveau souhait.
 *
 * Interactions :
 *   - Utilise le hook useAuth() pour appeler changePassword (Better Auth)
 *   - Valide les champs avec changePasswordSchema (Zod)
 *   - Affiche un toast de succes et reset le formulaire apres modification
 *   - Integre dans les pages profil client et coiffeuse, dans une Card "Securite"
 *
 * Exemple :
 *   <ChangePasswordForm />
 */
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/shared/components/common/PasswordInput"
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
import {
  changePasswordSchema,
  type ChangePasswordSchema,
} from "@/modules/auth/schemas/auth-schemas"
import { useAuth } from "@/modules/auth/hooks/useAuth"

export function ChangePasswordForm() {
  const { changePassword, isLoading } = useAuth()

  // Configuration React Hook Form avec resolver Zod
  const form = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  // Soumission du formulaire : change le mot de passe via Better Auth
  async function onSubmit(data: ChangePasswordSchema) {
    const result = await changePassword(data.currentPassword, data.newPassword)
    // Reset le formulaire apres succes pour vider les champs
    if (result.success) {
      form.reset()
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Securite</CardTitle>
        </div>
        <CardDescription>
          Modifiez votre mot de passe pour securiser votre compte.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Champ mot de passe actuel */}
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe actuel</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Votre mot de passe actuel"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Champ nouveau mot de passe */}
            <FormField
              control={form.control}
              name="newPassword"
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

            {/* Champ confirmation nouveau mot de passe */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Retapez le nouveau mot de passe"
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

            {/* Bouton de soumission */}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Modification en cours...
                </>
              ) : (
                "Modifier le mot de passe"
              )}
            </Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  )
}
