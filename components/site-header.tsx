import { config } from '@/datum.config';
import { loadOverview, platformStatus } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { CommandMenu } from '@/components/command-menu';
import { ThemeToggle } from '@/components/ThemeToggle';

export async function SiteHeader() {
  const [s, o] = await Promise.all([platformStatus(), loadOverview()]);
  const status = s.sample ? { label: 'Sample data', cls: 'text-(--brand-blue)' }
    : s.ok === null ? { label: 'Platform unreachable', cls: 'text-(--red)' }
    : s.ok ? { label: `Platform healthy · ${s.asOf ?? ''}`, cls: 'text-(--green)' } : { label: 'Platform degraded', cls: 'text-(--yellow)' };
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4 data-vertical:self-auto" />
        <span className="truncate text-base font-medium">{config.title}</span>
        <div className="ml-auto flex items-center gap-2">
          <CommandMenu markets={o.markets.map((m) => ({ id: m.id, collateral: m.collateral, loan: m.loan, protocol: m.protocol }))} />
          <Badge variant="outline" className={`hidden sm:inline-flex ${status.cls}`}><span className="size-1.5 rounded-full bg-current" />{status.label}</Badge>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
