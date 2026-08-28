import { Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { Radio } from "lucide-react";

import { ModeToggle } from "./mode-toggle";
import { buttonVariants } from "./ui/button";

export default function Header() {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-base font-semibold tracking-tight"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Radio className="size-4" />
            </span>
            <span>Recastly</span>
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ModeToggle />
          <Authenticated>
            <Link
              to="/dashboard"
              className={buttonVariants({ size: "sm" })}
            >
              Mon espace
            </Link>
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
