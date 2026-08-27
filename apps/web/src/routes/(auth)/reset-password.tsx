import { createFileRoute, redirect } from "@tanstack/react-router";
import ResetPasswordForm from "@/components/reset-password-form";

export const Route = createFileRoute("/(auth)/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — Recastly" },
      {
        name: "description",
        content: "Définissez un nouveau mot de passe Recastly.",
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
  return <ResetPasswordForm />;
}
