import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { Button } from "./ui/button";

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-7 px-4 py-16 text-center">
      <div className="flex max-w-md flex-col items-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Compass className="size-6" />
        </span>
        <span className="mt-5 bg-linear-to-b from-foreground to-foreground/25 bg-clip-text text-8xl font-semibold leading-none tracking-[-0.08em] text-transparent select-none">
          404
        </span>
        <h1 className="mt-4 text-xl font-semibold text-foreground">
          Cette page reste introuvable
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          Elle a peut-être été déplacée ou n’existe plus. Revenez à votre espace
          pour reprendre là où vous en étiez.
        </p>
      </div>
      <Link to="/">
        <Button size="lg">Revenir à l’accueil</Button>
      </Link>
    </div>
  );
}
