import { useForm } from "@tanstack/react-form";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { toast } from "sonner";
import z from "zod";

import { AuthShell } from "@/components/auth-shell";
import PasswordInput from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";

import { Button } from "./ui/button";
import { Label } from "./ui/label";

export default function ResetPasswordForm() {
  const navigate = useNavigate();
  const posthog = usePostHog();
  const search = useSearch({ strict: false }) as { token?: string };
  const token = search?.token;
  const form = useForm({
    defaultValues: { newPassword: "", confirmPassword: "" },
    onSubmit: async ({ value }) => {
      const { error } = await authClient.resetPassword({
        newPassword: value.newPassword,
        token: token!,
      });
      if (error) {
        toast.error(error.message || "Impossible de modifier le mot de passe.");
      } else {
        posthog.capture("password_reset_completed");
        toast.success("Mot de passe réinitialisé.");
        navigate({ to: "/sign-in" });
      }
    },
    validators: {
      onSubmit: z
        .object({
          newPassword: z
            .string()
            .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
          confirmPassword: z.string(),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: "Les mots de passe ne correspondent pas.",
          path: ["confirmPassword"],
        }),
    },
  });

  if (!token) {
    return (
      <AuthShell
        icon={<KeyRound className="size-5" />}
        title="Lien invalide"
        description="Ce lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau pour continuer."
      >
        <Link to="/forgot-password" className="block">
          <Button variant="outline" className="w-full">
            Demander un nouveau lien
          </Button>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      icon={<KeyRound className="size-5" />}
      title="Nouveau mot de passe"
      description="Choisissez un mot de passe unique d’au moins 8 caractères."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-5"
      >
        <form.Field name="newPassword">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <PasswordInput
                id="newPassword"
                placeholder="8 caractères minimum"
                autoComplete="new-password"
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

        <form.Field name="confirmPassword">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Confirmez le mot de passe"
                autoComplete="new-password"
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
              {state.isSubmitting ? "Enregistrement…" : "Modifier le mot de passe"}
            </Button>
          )}
        </form.Subscribe>
      </form>
      <Link
        to="/sign-in"
        className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        Revenir à la connexion
      </Link>
    </AuthShell>
  );
}
