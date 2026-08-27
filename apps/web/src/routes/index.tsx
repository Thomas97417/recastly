import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { ArrowRight, Clock3, Radio, ShieldCheck, Youtube } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Recastly — Vos lives Twitch, archivés automatiquement" },
      {
        name: "description",
        content:
          "Suivez vos streamers Twitch préférés et retrouvez automatiquement leurs lives dans votre bibliothèque privée.",
      },
    ],
  }),
  component: HomeComponent,
});

const features = [
  {
    icon: Radio,
    title: "Détection automatique",
    text: "Recastly réagit dès qu’une chaîne suivie passe en direct.",
  },
  {
    icon: Clock3,
    title: "Archives longue durée",
    text: "Les longues sessions sont découpées en parties faciles à consulter.",
  },
  {
    icon: Youtube,
    title: "Lecture sur YouTube",
    text: "Chaque partie prête est lisible depuis votre bibliothèque Recastly.",
  },
  {
    icon: ShieldCheck,
    title: "Accès personnel",
    text: "Seuls les abonnés présents au début du live voient son archive.",
  },
];

function HomeComponent() {
  return (
    <main className="overflow-hidden">
      <section className="relative mx-auto flex min-h-[72vh] max-w-6xl items-center px-5 py-20 lg:px-8">
        <div className="absolute -top-32 right-64 -z-10 size-144 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-0 left-72 -z-10 size-128 rounded-full bg-violet-500/10 blur-[120px]" />
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-red-500" />
            </span>
            Votre magnétoscope Twitch personnel
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
            Ne manquez plus les lives qui comptent.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Recastly surveille jusqu’à dix chaînes Twitch, archive leurs directs
            et les range automatiquement dans une bibliothèque privée.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Authenticated>
              <Link to="/dashboard" className={buttonVariants({ size: "lg" })}>
                Ouvrir le tableau de bord <ArrowRight className="size-4" />
              </Link>
            </Authenticated>
            <Unauthenticated>
              <Link to="/sign-up" className={buttonVariants({ size: "lg" })}>
                Créer mon espace <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/sign-in"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Se connecter
              </Link>
            </Unauthenticated>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Prototype personnel · Captures limitées à deux flux simultanés
          </p>
        </div>
      </section>

      <section className="border-y bg-card/50">
        <div className="mx-auto grid max-w-6xl gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="bg-background p-6 lg:p-8">
              <Icon className="mb-5 size-5 text-primary" />
              <h2 className="font-medium">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {text}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
