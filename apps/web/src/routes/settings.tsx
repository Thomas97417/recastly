import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/use-current-user";

import ChangePasswordCard from "@/components/settings/change-password-card";
import DeleteAccountCard from "@/components/settings/delete-account-card";
import ProfileImageCard from "@/components/settings/profile-image-card";
import SessionsCard from "@/components/settings/sessions-card";
import EmailCard from "@/components/settings/update-email-card";
import UpdateNameCard from "@/components/settings/update-name-card";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Réglages — Recastly" },
      {
        name: "description",
        content: "Gérez votre compte Recastly, votre email et vos sessions.",
      },
    ],
  }),
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const user = useCurrentUser();

  if (!user) return null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Réglages</h1>
        <p className="text-sm text-muted-foreground">
          Gérez votre profil, votre sécurité et vos sessions.
        </p>
      </div>
      <ProfileImageCard image={user.image ?? undefined} />
      <UpdateNameCard name={user.name} />
      <EmailCard email={user.email} />
      <ChangePasswordCard />
      <SessionsCard />
      <DeleteAccountCard />
    </div>
  );
}
