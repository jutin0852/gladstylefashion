"use client";

import React from "react";
import { adminNav } from "@/data/static-data";
import { IconBuildingStore, IconExternalLink, IconSparkles } from "@tabler/icons-react";

import { NavDocuments } from "@/components/ui/nav-documents";
import { NavMain } from "@/components/ui/nav-main";
import { NavUser } from "@/components/ui/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: { name: string; email: string; role: string } }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-black/10 px-3 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:!p-1.5 hover:bg-transparent active:bg-transparent">
              <span className="grid size-8 place-items-center bg-[#d3146d] text-white"><IconSparkles className="size-4" /></span>
              <span><span className="block text-sm font-semibold">Glad Style</span><span className="block text-[10px] uppercase tracking-[.14em] text-muted-foreground">Store manager</span></span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="pt-3">
        <NavMain items={adminNav.navMain} />
        <NavDocuments items={adminNav.documents} />
      </SidebarContent>
      <SidebarFooter className="border-t border-black/10 p-3">
        <NavUser user={{ ...user, avatar: "" }} />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <IconBuildingStore className="!size-5" />
                <span className=" font-semibold">Your shop</span>
                <IconExternalLink className="ml-auto" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
