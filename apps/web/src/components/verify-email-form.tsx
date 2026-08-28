import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { AuthShell } from "@/components/auth-shell";
import { authClient } from "@/lib/auth-client";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function VerifyEmailForm() {
  const posthog = usePostHog();
  const [sent, setSent] = useState(false);
  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      try {
        await authClient.sendVerificationEmail({
          email: value.email,
          callbackURL: "/sign-in",
        });
        posthog.capture("email_verification_requested");
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
        description="Si un compte correspond à cette adresse, un nouveau lien de vérification vient d’être envoyé."
      >
        <Link to="/sign-in" className="block">
          <Button variant="outline" className="w-full">
            <ArrowLeft /> Revenir à la connexion
          </Button>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      icon={<Mail className="size-5" />}
      title="Vérifiez votre email"
      description="Demandez un nouveau lien pour activer votre espace Recastly."
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
              {state.isSubmitting ? "Envoi…" : "Envoyer l’email"}
            </Button>
          )}
        </form.Subscribe>
      </form>
      <Link
        to="/sign-in"
        className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-4" /> Revenir à la connexion
      </Link>
    </AuthShell>
  );
}
