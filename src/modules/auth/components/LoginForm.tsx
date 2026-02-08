/**
 * LoginForm — Formulaire de connexion
 *
 * Role : Permettre a l'utilisateur de se connecter avec son email
 *        et son mot de passe. Validation Zod + React Hook Form.
 *
 * Interactions :
 *   - Utilise le hook useAuth() pour la mutation de connexion
 *   - Valide les champs avec loginSchema (Zod)
 *   - Affiche les erreurs de validation en francais
 *   - Redirige selon le role apres connexion reussie (via useAuth)
 *
 * Exemple :
 *   <LoginForm />
 */
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { Loader2 } from "lucide-react"
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
import { loginSchema, type LoginSchema } from "@/modules/auth/schemas/auth-schemas"
import { useAuth } from "@/modules/auth/hooks/useAuth"

export function LoginForm() {
  const { login, isLoading } = useAuth()

  // Configuration React Hook Form avec resolver Zod
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Soumission du formulaire
  async function onSubmit(data: LoginSchema) {
    await login(data)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Connexion</CardTitle>
        <CardDescription>
          Connectez-vous a votre compte NappyMarket
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

            {/* Champ mot de passe */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Votre mot de passe"
                      autoComplete="current-password"
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
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>

            {/* Lien vers l'inscription */}
            <p className="text-center text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link
                href="/inscription"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Creer un compte
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
