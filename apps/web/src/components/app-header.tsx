import { useLocation } from "@tanstack/react-router";

import { ModeToggle } from "@/components/mode-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import UserMenu from "@/components/user-menu";

function getPageTitle(pathname: string) {
  if (pathname === "/streamers") return "Streamers";
  if (pathname === "/library") return "Bibliothèque";
  if (pathname.startsWith("/recordings/")) return "Détail de l’archive";
  if (pathname === "/settings") return "Réglages";
  return "Vue d’ensemble";
}

function getPageContext(pathname: string) {
  if (pathname === "/streamers") return "Surveillance Twitch";
  if (pathname === "/library") return "Vos enregistrements";
  if (pathname.startsWith("/recordings/")) return "Bibliothèque";
  if (pathname === "/settings") return "Compte et sécurité";
  return "Espace personnel";
}

export function AppHeader() {
  const pathname = useLocation({ select: (location) => location.pathname });

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl sm:px-6">
      <SidebarTrigger className="-ml-1" />
      <div className="h-5 w-px bg-border" aria-hidden="true" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {getPageTitle(pathname)}
        </p>
        <p className="hidden truncate text-[0.68rem] text-muted-foreground sm:block">
          {getPageContext(pathname)}
        </p>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <ModeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
