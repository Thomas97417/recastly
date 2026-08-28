import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { usePostHog } from "posthog-js/react";

import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";

import {
  SettingsCard,
  SettingsCardContent,
  SettingsCardFooter,
  SettingsCardHeader,
} from "./settings-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

export default function DeleteAccountCard() {
  const posthog = usePostHog();
  const navigate = useNavigate();

  const handleDelete = async () => {
    await authClient.deleteUser({
      fetchOptions: {
        onSuccess: () => {
          posthog.capture("account_deleted");
          posthog.reset();
          navigate({ to: "/" });
          location.reload();
        },
        onError: (error) => {
          toast.error(error.error.message);
        },
      },
    });
  };

  return (
    <SettingsCard className="border-destructive/35">
      <SettingsCardContent>
        <SettingsCardHeader
          title="Supprimer le compte"
          description="Supprimez définitivement votre compte, vos accès et les données associées. Cette action est irréversible."
        />
      </SettingsCardContent>
      <SettingsCardFooter className="bg-destructive/10 dark:bg-destructive/10">
        <p className="text-sm text-muted-foreground">Cette action est définitive.</p>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                size="sm"
                variant="destructive"
                className="hover:cursor-pointer"
              />
            }
          >
            Supprimer mon compte
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <TriangleAlert className="size-5" />
              </AlertDialogMedia>
              <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
              <AlertDialogDescription>
                Votre accès aux archives sera retiré immédiatement. Cette action
                ne peut pas être annulée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleDelete}>
                Supprimer le compte
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SettingsCardFooter>
    </SettingsCard>
  );
}
