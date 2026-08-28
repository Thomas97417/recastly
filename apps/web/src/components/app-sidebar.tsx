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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Recastly"
              render={
                <Link to="/dashboard" onClick={closeMobileSidebar} />
              }
              className="h-10"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Radio className="size-4" />
              </span>
              <span className="truncate text-sm font-semibold tracking-tight">
                Recastly
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
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
