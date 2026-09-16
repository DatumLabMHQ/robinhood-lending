'use client';
// The left pane: shadcn Sidebar, inset variant, collapsing to icons (cmd+b). Navigation is data:
// pages come from datum.config.ts; the kit's own pages (KIT) show only in sample mode or with
// NEXT_PUBLIC_SHOW_KIT=true, so client dashboards never show kit internals. Icons are Phosphor only.
import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowSquareOutIcon, BookOpenIcon, ChartLineUpIcon, SquaresFourIcon, TableIcon, VaultIcon } from '@phosphor-icons/react';
import { config } from '@/datum.config';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu,
  SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from '@/components/ui/sidebar';

const ICONS: Record<string, React.ReactNode> = { '/': <SquaresFourIcon />, '/markets': <TableIcon />, '/vaults': <VaultIcon />, '/methodology': <BookOpenIcon /> };
const KIT = [{ href: '/kit/charts', label: 'Chart guide', icon: <ChartLineUpIcon /> }];

export function AppSidebar({ badges = {}, showKit = false, ...props }: React.ComponentProps<typeof Sidebar> & { badges?: Record<string, number>; showKit?: boolean }) {
  const path = usePathname();
  const active = (href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'));
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[slot=sidebar-menu-button]:p-1.5!" render={<Link href="/" />}>
              <Image src="/brand/datum-mark.png" alt="" width={24} height={24} className="size-6 shrink-0 rounded-[6px]" priority />
              <span className="text-base font-semibold">datum<span className="text-(--brand-blue)">labs</span></span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Pages</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {config.nav.map((n) => (
                <SidebarMenuItem key={n.href}>
                  <SidebarMenuButton tooltip={n.label} isActive={active(n.href)} render={<Link href={n.href} />}>
                    {ICONS[n.href] ?? <SquaresFourIcon />}<span>{n.label}</span>
                  </SidebarMenuButton>
                  {badges[n.href] ? <SidebarMenuBadge>{badges[n.href]}</SidebarMenuBadge> : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{showKit ? 'Kit' : 'Datum'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {showKit ? KIT.map((n) => (
                <SidebarMenuItem key={n.href}>
                  <SidebarMenuButton tooltip={n.label} isActive={active(n.href)} render={<Link href={n.href} />}>{n.icon}<span>{n.label}</span></SidebarMenuButton>
                </SidebarMenuItem>
              )) : null}
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="datumlab.xyz" render={<a href="https://www.datumlab.xyz" target="_blank" rel="noreferrer" />}><ArrowSquareOutIcon /><span>datumlab.xyz</span></SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="truncate px-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">{config.title}</div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
