import type { ComponentProps } from "react";

import { Link, useLocation } from "@tanstack/react-router";
import {
  House,
  LayoutDashboard,
  Library,
  Radio,
  Settings,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Vue d’ensemble",
    to: "/dashboard" as const,
    icon: LayoutDashboard,
  },
  {
    title: "Streamers",
    to: "/streamers" as const,
    icon: Users,
  },
  {
    title: "Bibliothèque",
    to: "/library" as const,
    icon: Library,
  },
];

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const { isMobile, setOpenMobile } = useSidebar();

  function closeMobileSidebar() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader className="px-3 pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Recastly"
              render={
                <Link to="/dashboard" onClick={closeMobileSidebar} />
              }
              className="h-12 px-2"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20">
                <Radio className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold tracking-tight">
                  Recastly
                </span>
                <span className="block truncate text-[0.65rem] font-normal text-sidebar-foreground/50">
                  Archives Twitch
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-3 pt-4">
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map(({ title, to, icon: Icon }) => {
                const isActive =
                  pathname === to ||
                  (to === "/library" && pathname.startsWith("/recordings/"));

                return (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={title}
                      render={<Link to={to} onClick={closeMobileSidebar} />}
                    >
                      <Icon />
                      <span>{title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="mx-1 mb-2 rounded-2xl border border-sidebar-border/70 bg-background/45 p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-50" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Surveillance active
          </div>
          <p className="mt-1.5 text-[0.68rem] leading-5 text-sidebar-foreground/55">
            Les directs de vos chaînes sont détectés automatiquement.
          </p>
        </div>
        <SidebarSeparator className="mx-0" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/settings"}
              tooltip="Réglages"
              render={<Link to="/settings" onClick={closeMobileSidebar} />}
            >
              <Settings />
              <span>Réglages</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Retour au site"
              render={<Link to="/" onClick={closeMobileSidebar} />}
            >
              <House />
              <span>Retour au site</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
