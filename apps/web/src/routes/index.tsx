import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Library,
  Play,
  Radio,
  ShieldCheck,
  Sparkles,
  Youtube,
} from "lucide-react";

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
    title: "Détection instantanée",
    text: "La capture démarre dès qu’une chaîne suivie passe en direct.",
  },
  {
    icon: Clock3,
    title: "Pensé pour les longs lives",
    text: "Chaque session est découpée en parties simples à parcourir.",
  },
  {
    icon: Youtube,
    title: "Lecture sans friction",
    text: "Les vidéos prêtes sont consultables depuis votre bibliothèque.",
  },
  {
    icon: ShieldCheck,
    title: "Archives personnelles",
    text: "Vos accès sont figés au démarrage de chaque enregistrement.",
  },
];

function HomeComponent() {
  return (
    <main className="overflow-hidden">
      <section className="relative border-b border-border/60">
        <div className="pointer-events-none absolute -left-28 top-10 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-1/3 size-80 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="relative mx-auto grid min-h-[78vh] max-w-7xl items-center gap-14 px-5 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3.5 py-2 text-xs font-semibold text-primary shadow-xs">
              <Sparkles className="size-3.5" />
              Votre mémoire Twitch, toujours disponible
            </div>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Chaque live compte.
              <span className="block text-primary">Gardez-les tous.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Recastly surveille vos chaînes préférées, capture leurs directs et
              organise chaque session dans une bibliothèque privée, prête à être
              regardée quand vous le souhaitez.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Authenticated>
                <Link to="/dashboard" className={buttonVariants({ size: "lg" })}>
                  Ouvrir mon espace <ArrowRight />
                </Link>
              </Authenticated>
              <Unauthenticated>
                <Link to="/sign-up" className={buttonVariants({ size: "lg" })}>
                  Commencer maintenant <ArrowRight />
                </Link>
                <Link
                  to="/sign-in"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  Se connecter
                </Link>
              </Unauthenticated>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-primary" /> Jusqu’à 10 chaînes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-primary" /> Capture automatique
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-primary" /> Archives privées
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-primary/8 blur-2xl" />
            <div className="rounded-[2rem] border border-border/70 bg-card/90 p-3 shadow-2xl shadow-indigo-950/10 backdrop-blur dark:shadow-black/30">
              <div className="rounded-[1.4rem] border border-border/60 bg-background/70 p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                      En ce moment
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">Votre bibliothèque</h2>
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <Library className="size-5" />
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  <ArchivePreview
                    live
                    name="LumaLive"
                    title="Session création & discussion"
                    meta="Capture en cours · 720p"
                  />
                  <ArchivePreview
                    name="NovaPlays"
                    title="Découverte du nouveau chapitre"
                    meta="Hier · 3 parties · 08 h 24"
                  />
                  <ArchivePreview
                    name="StudioMika"
                    title="Speedrun communautaire"
                    meta="24 août · 2 parties · 05 h 11"
                  />
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-accent/60 px-4 py-3 text-xs">
                  <span className="text-muted-foreground">Stockage local nettoyé après envoi</span>
                  <span className="font-semibold text-accent-foreground">Automatique</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Simple par conception
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            De Twitch à votre bibliothèque, sans intervention.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs transition duration-200 hover:-translate-y-1 hover:border-primary/20 hover:shadow-md"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-6 font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ArchivePreview({
  live = false,
  name,
  title,
  meta,
}: {
  live?: boolean;
  name: string;
  title: string;
  meta: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-3.5 shadow-xs">
      <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        {live ? <Radio className="size-5 text-red-500" /> : <Play className="size-5 text-primary" />}
        {live && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-card" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{name}</p>
          {live && (
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[0.6rem] font-bold text-red-600 dark:text-red-300">
              LIVE
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{title}</p>
        <p className="mt-1 text-[0.68rem] text-muted-foreground/75">{meta}</p>
      </div>
    </div>
  );
}
