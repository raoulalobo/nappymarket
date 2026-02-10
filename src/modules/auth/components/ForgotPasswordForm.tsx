/**
 * ForgotPasswordForm — Formulaire de demande de reinitialisation de mot de passe
 *
 * Role : Permettre a un utilisateur deconnecte de demander un email
 *        de reinitialisation de mot de passe en saisissant son adresse email.
 *
 * Interactions :
 *   - Utilise le hook useAuth() pour appeler forgotPassword (Better Auth)
 *   - Valide l'email avec forgotPasswordSchema (Zod)
 *   - Affiche un message de confirmation apres envoi (sans reveler
 *     si le compte existe, pour des raisons de securite)
 *   - Lien retour vers /connexion
 *
 * Exemple :
 *   <ForgotPasswordForm />
 */
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { Loader2, Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  forgotPasswordSchema,
  type ForgotPasswordSchema,
} from "@/modules/auth/schemas/auth-schemas"
import { useAuth } from "@/modules/auth/hooks/useAuth"

export function ForgotPasswordForm() {
  const { forgotPassword, isLoading } = useAuth()

  /** Indique si l'email a ete envoye avec succes (affiche le message de confirmation) */
  const [emailSent, setEmailSent] = useState(false)

  // Configuration React Hook Form avec resolver Zod
  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  // Soumission du formulaire : envoie l'email de reinitialisation
  async function onSubmit(data: ForgotPasswordSchema) {
    const result = await forgotPassword(data.email)
    // Afficher le message de confirmation meme si l'email n'existe pas (securite)
    if (result.success) {
      setEmailSent(true)
    }
  }

  // Ecran de confirmation apres envoi de l'email
  if (emailSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Email envoye</CardTitle>
          <CardDescription>
            Si un compte existe avec cette adresse email, vous recevrez un lien
            de reinitialisation dans quelques instants.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-center text-sm text-muted-foreground">
            Vous n&apos;avez pas recu l&apos;email ?{" "}
            <button
              type="button"
              onClick={() => setEmailSent(false)}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Renvoyer
            </button>
          </p>
          <Link
            href="/connexion"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour a la connexion
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Mot de passe oublie</CardTitle>
        <CardDescription>
          Entrez votre adresse email pour recevoir un lien de reinitialisation.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Champ email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="votre@email.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            {/* Bouton de soumission */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                "Envoyer le lien"
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
