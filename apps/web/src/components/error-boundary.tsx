import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

export default function ErrorBoundary({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-7 px-4 py-16 text-center">
      <div className="flex max-w-md flex-col items-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </span>
        <h1 className="mt-5 text-xl font-semibold text-foreground">
          Un imprévu est survenu
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          La page n’a pas pu être chargée correctement. Vous pouvez réessayer
          sans perdre vos données.
        </p>
        {import.meta.env.DEV && error instanceof Error && (
          <pre className="mt-4 max-w-lg overflow-auto rounded-lg border bg-muted/50 p-4 text-left text-xs text-destructive">
            {error.message}
          </pre>
        )}
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          className="hover:cursor-pointer"
          onClick={() => {
            reset();
            router.invalidate();
          }}
        >
          Réessayer
        </Button>
        <Link to="/">
          <Button variant="ghost" size="lg" className="hover:cursor-pointer">
            Revenir à l’accueil
          </Button>
        </Link>
      </div>
    </div>
  );
}
