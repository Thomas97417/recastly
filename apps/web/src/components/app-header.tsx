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

export function AppHeader() {
  const pathname = useLocation({ select: (location) => location.pathname });

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur supports-backdrop-filter:bg-background/75">
      <SidebarTrigger className="-ml-1" />
      <div className="h-4 w-px bg-border" aria-hidden="true" />
      <p className="truncate text-sm font-medium">{getPageTitle(pathname)}</p>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <ModeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
