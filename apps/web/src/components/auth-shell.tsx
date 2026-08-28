import type { ReactNode } from "react";

import { Radio } from "lucide-react";

export function AuthShell({
  icon,
  title,
  description,
  children,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="relative flex min-h-full items-center justify-center overflow-hidden px-4 py-10 sm:py-14">
      <div className="pointer-events-none absolute left-1/2 top-12 -z-10 size-80 -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 text-sm font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Radio className="size-4" />
          </span>
          Recastly
        </div>
        <div className="rounded-3xl border border-border/70 bg-card/95 p-6 shadow-xl shadow-indigo-950/5 backdrop-blur sm:p-8 dark:shadow-black/20">
          <div className="mb-7 text-center">
            {icon && (
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                {icon}
              </div>
            )}
            <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
