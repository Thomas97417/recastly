import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { KeyRound, MailCheck } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { AuthShell } from "@/components/auth-shell";
import { authClient } from "@/lib/auth-client";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function ForgotPasswordForm() {
  const posthog = usePostHog();
  const [sent, setSent] = useState(false);
  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      try {
        await authClient.requestPasswordReset({
          email: value.email,
          redirectTo: "/reset-password",
        });
        posthog.capture("password_reset_requested");
        setSent(true);
      } catch {
        toast.error("Une erreur est survenue. Réessayez dans un instant.");
      }
    },
    validators: {
      onSubmit: z.object({ email: z.email("Adresse email invalide") }),
    },
  });

  if (sent) {
    return (
      <AuthShell
        icon={<MailCheck className="size-5" />}
        title="Consultez votre boîte mail"
        description="Si un compte correspond à cette adresse, nous venons d’envoyer un lien de réinitialisation."
      >
        <Link to="/sign-in" className="block text-center text-sm font-medium text-primary hover:underline">
          Revenir à la connexion
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      icon={<KeyRound className="size-5" />}
      title="Mot de passe oublié ?"
      description="Saisissez votre adresse email pour recevoir un lien de réinitialisation."
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
        <form.Subscribe>
          {(state) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? "Envoi…" : "Envoyer le lien"}
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
