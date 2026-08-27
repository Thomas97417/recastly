import { Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { Radio } from "lucide-react";

import UserMenu from "./user-menu";
import { ModeToggle } from "./mode-toggle";
import { buttonVariants } from "./ui/button";

const linkStyles =
  "whitespace-nowrap rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground [&.active]:bg-muted [&.active]:font-medium [&.active]:text-foreground";

export default function Header() {
  return (
    <header className="border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-4 lg:gap-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-base font-semibold tracking-tight"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Radio className="size-4" />
            </span>
            <span className="hidden sm:inline">Recastly</span>
          </Link>
          <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
            <Authenticated>
              <Link to="/dashboard" className={linkStyles}>
                Vue d’ensemble
              </Link>
              <Link to="/streamers" className={linkStyles}>
                Streamers
              </Link>
              <Link to="/library" className={linkStyles}>
                Bibliothèque
              </Link>
              <Link to="/settings" className={linkStyles}>
                Réglages
              </Link>
            </Authenticated>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ModeToggle />
          <Authenticated>
            <UserMenu />
          </Authenticated>
          <Unauthenticated>
            <Link
              to="/sign-in"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Connexion
            </Link>
          </Unauthenticated>
        </div>
      </div>
    </header>
  );
}
