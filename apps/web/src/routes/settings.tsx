import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageContainer, PageHeader } from "@/components/page-shell";

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
    <PageContainer className="max-w-4xl">
      <PageHeader
        eyebrow="Compte et sécurité"
        title="Réglages"
        description="Gérez votre profil, vos identifiants et les appareils connectés à votre espace Recastly."
      />
      <div className="flex flex-col gap-5">
        <ProfileImageCard image={user.image ?? undefined} />
        <UpdateNameCard name={user.name} />
        <EmailCard email={user.email} />
        <ChangePasswordCard />
        <SessionsCard />
        <DeleteAccountCard />
      </div>
    </PageContainer>
  );
}
