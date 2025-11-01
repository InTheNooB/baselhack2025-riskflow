"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ClipboardList, FileText, Settings, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const pathname = usePathname();

  const navigationItems = [
    {
      title: "Chief Underwriter",
      items: [
        {
          title: "Cases",
          icon: ClipboardList,
          href: "/cases",
          description: "All insurance cases",
        },
        {
          title: "Reviews",
          icon: FileText,
          href: "/reviews",
          description: "Review escalated cases",
        },
        {
          title: "Configuration",
          icon: Settings,
          href: "/configuration",
          description: "System configuration",
        },
        {
          title: "Simulations",
          icon: TrendingUp,
          href: "/simulations",
          description: "Run simulations",
        },
      ],
    },
  ];

  return (
    <Sidebar collapsible="none">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <span className="text-xl font-bold">RF</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold">RiskFlow</span>
            <span className="text-xs text-muted-foreground">
              Insurance Platform
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navigationItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href || pathname?.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
