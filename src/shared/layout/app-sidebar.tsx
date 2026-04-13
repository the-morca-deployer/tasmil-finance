"use client";

import { FooterSidebarSection } from "@/shared/layout/footer-sidebar";
import { HeaderSidebar } from "@/shared/layout/header-sidebar";
import { NavGroup } from "@/shared/layout/nav-group";
import { sidebarData, type SidebarData } from "@/shared/layout/sidebar-data";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/shared/ui/sidebar";

export function AppSidebar({
  sidebarData: customData,
  ...props
}: React.ComponentProps<typeof Sidebar> & { sidebarData?: SidebarData }) {
  const data = customData || sidebarData;
  return (
    <Sidebar collapsible="icon" side="left" variant="floating" {...props}>
      <SidebarHeader>
        <HeaderSidebar header={data.header} />
      </SidebarHeader>
      <SidebarContent>
        {data.navGroups.map((navGroup, index) => (
          <NavGroup key={index} {...navGroup} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <FooterSidebarSection />
      </SidebarFooter>
    </Sidebar>
  );
}
