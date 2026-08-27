import { createFileRoute, redirect } from "@tanstack/react-router";
import ForgotPasswordForm from "@/components/forgot-password-form";

export const Route = createFileRoute("/(auth)/forgot-password")({
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — Recastly" },
      {
        name: "description",
        content: "Réinitialisez votre mot de passe Recastly.",
      },
    ],
  }),
  beforeLoad: async ({ context }) => {
    if (context.isAuthenticated) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <ForgotPasswordForm />;
}
