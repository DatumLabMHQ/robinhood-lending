// The frame every page shares: shadcn's sidebar layout (dashboard-01 block) with the Datum nav,
// the status banner above the content and the provenance footer below it.
import { AppSidebar } from '@/components/app-sidebar';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StatusBanner } from '@/components/status-banner';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { loadOverview, platformStatus, showKit } from '@/lib/data';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [o, s] = await Promise.all([loadOverview(), platformStatus()]);
  return (
    <SidebarProvider style={{ '--sidebar-width': 'calc(var(--spacing) * 64)', '--header-height': 'calc(var(--spacing) * 12)' } as React.CSSProperties}>
      <AppSidebar variant="inset" marketCount={o.markets.length} showKit={showKit(s)} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6 empty:hidden"><StatusBanner /></div>
              {children}
            </div>
          </div>
          <SiteFooter />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
