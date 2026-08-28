import type { ConvexQueryClient } from "@convex-dev/react-query";
import type { QueryClient } from "@tanstack/react-query";

import { useEffect } from "react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useLocation,
  useRouteContext,
  useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";

import { Toaster } from "@/components/ui/sonner";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCurrentUser } from "@/hooks/use-current-user";
import { authClient } from "@/lib/auth-client";
import { getToken } from "@/lib/auth-server";

import Header from "../components/header";
import ErrorBoundary from "../components/error-boundary";
import NotFound from "../components/not-found";
import appCss from "../index.css?url";
import { ThemeProvider } from "@/components/theme-provider";
import { PostHogProvider, usePostHog } from "posthog-js/react";

const getAuth = createServerFn({ method: "GET" }).handler(async () => {
  return await getToken();
});

const posthogApiKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

const options = {
  api_host: posthogHost,
  capture_exceptions: true,
  debug: import.meta.env.DEV,
  defaults: "2026-01-30",
} as const;

export interface RouterAppContext {
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Recastly",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootDocument,
  beforeLoad: async (ctx) => {
    const token = await getAuth();
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }
    return {
      isAuthenticated: !!token,
      token,
    };
  },
  errorComponent: ErrorBoundary,
  notFoundComponent: NotFound,
});

function RootDocument() {
  const context = useRouteContext({ from: Route.id });

  if (!posthogApiKey || !posthogHost) {
    if (import.meta.env.DEV) {
      const missingVariable = !posthogApiKey
        ? "VITE_PUBLIC_POSTHOG_KEY"
        : "VITE_PUBLIC_POSTHOG_HOST";

      throw new Error(
        `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
      );
    }

    return <AppShell context={context} identifyUser={false} />;
  }

  return (
    <PostHogProvider apiKey={posthogApiKey} options={options}>
      <AppShell context={context} identifyUser />
    </PostHogProvider>
  );
}

function AppShell({
  context,
  identifyUser,
}: {
  context: ReturnType<typeof useRouteContext>;
  identifyUser: boolean;
}) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const hasAppSidebar =
    context.isAuthenticated &&
    ["/dashboard", "/streamers", "/library", "/recordings", "/settings"].some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

  return (
    <ConvexBetterAuthProvider
      client={context.convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={context.token}
    >
      {identifyUser && <PostHogUserIdentification />}
      <html lang="fr" suppressHydrationWarning>
        <head>
          <HeadContent />
        </head>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            disableTransitionOnChange
            storageKey="vite-ui-theme"
          >
            <TooltipProvider>
              {hasAppSidebar ? (
                <SidebarProvider>
                  <AppSidebar />
                  <SidebarInset className="h-svh min-w-0 overflow-hidden md:h-[calc(100svh-1rem)]">
                    <AppHeader />
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <Outlet />
                    </div>
                  </SidebarInset>
                </SidebarProvider>
              ) : (
                <div className="grid h-svh grid-rows-[auto_1fr]">
                  <Header />
                  <div className="overflow-y-auto">
                    <Outlet />
                  </div>
                </div>
              )}
            </TooltipProvider>
            <Toaster richColors />
            <TanStackRouterDevtools position="bottom-right" />
            <Scripts />
          </ThemeProvider>
        </body>
      </html>
    </ConvexBetterAuthProvider>
  );
}

function PostHogUserIdentification() {
  const posthog = usePostHog();
  const router = useRouter();
  const user = useCurrentUser();
  const distinctId =
    user &&
    (("id" in user && typeof user.id === "string" && user.id) ||
      ("_id" in user && typeof user._id === "string" && user._id));

  useEffect(() => {
    if (!user || !distinctId) return;

    posthog.identify(distinctId, {
      email: user.email,
      name: user.name,
    });
  }, [distinctId, posthog, user?.email, user?.name]);

  useEffect(
    () =>
      router.subscribe("onResolved", ({ fromLocation, toLocation }) => {
        if (fromLocation?.pathname !== toLocation.pathname) {
          posthog.capture("$pageview");
        }
      }),
    [posthog, router],
  );

  return null;
}
