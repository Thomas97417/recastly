import { useNavigate } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Library, LogOut, Settings, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

import { Button } from "./ui/button";

export default function UserMenu() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const posthog = usePostHog();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="flex items-center gap-2 px-2" />
        }
      >
        <span className="hidden text-sm font-medium sm:inline-block">
          {user?.name}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-muted-foreground text-xs leading-none">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
            <User className="mr-2 size-4" />
            Vue d’ensemble
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/library" })}>
            <Library className="mr-2 size-4" />
            Bibliothèque
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
            <Settings className="mr-2 size-4" />
            Réglages
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  posthog.reset();
                  navigate({ to: "/" });
                  location.reload();
                },
              },
            });
          }}
        >
          <LogOut className="mr-2 size-4" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
