import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { toast } from "sonner";
import z from "zod";

import { AuthShell } from "@/components/auth-shell";
import { authClient } from "@/lib/auth-client";

import { GitHubLoginButton, GoogleLoginButton } from "./social-login-buttons";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import PasswordInput from "./ui/password-input";

export default function SignInForm() {
  const posthog = usePostHog();
  const navigate = useNavigate({ from: "/" });
  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(value, {
        onSuccess: () => {
          posthog.capture("user_signed_in");
          navigate({ to: "/dashboard" });
          toast.success("Connexion réussie.");
        },
        onError: (error) => {
          if (error.error.status === 403) {
            toast.error("Vérifiez votre adresse email avant de vous connecter.");
          } else {
            toast.error(error.error.message || error.error.statusText);
          }
        },
      });
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Adresse email invalide"),
        password: z
          .string()
          .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
      }),
    },
  });

  return (
    <AuthShell
      icon={<LogIn className="size-5" />}
      title="Heureux de vous revoir"
      description="Connectez-vous pour retrouver vos chaînes et vos dernières archives."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-5"
      >
        <form.Field name="email">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Adresse email</Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                placeholder="vous@exemple.fr"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-xs text-destructive">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={field.name}>Mot de passe</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <PasswordInput
                id={field.name}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-xs text-destructive">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Subscribe>
          {(state) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? "Connexion…" : "Se connecter"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-3 text-xs text-muted-foreground">
            ou continuer avec
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GitHubLoginButton />
        <GoogleLoginButton />
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link to="/sign-up" className="font-semibold text-primary hover:underline">
          Créer un espace
        </Link>
        <span className="mx-2">·</span>
        <Link to="/verify-email" className="hover:text-foreground hover:underline">
          Vérifier l’email
        </Link>
      </div>
    </AuthShell>
  );
}
