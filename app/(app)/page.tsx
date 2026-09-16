// Overview: the question, the one-line answer, then the numbers. Cards, chart and table read
// the normalised data from lib/data.ts (the platform, or labelled sample data without a key).
import { config } from '@/datum.config';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { MarketsTable } from '@/components/markets-table';
import { PageHeader } from '@/components/page-header';
import { SectionCards } from '@/components/section-cards';
import { loadOverview } from '@/lib/data';
import { loadChain } from '@/lib/robinhood';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, BarChart } from '@/components/charts';
import { count, pct, usd } from '@/lib/format';

export const revalidate = 300;

export default async function Overview() {
  const [d, chain] = await Promise.all([loadOverview(), loadChain()]);
  const k = d.kpis;
  return (
    <>
      <PageHeader eyebrow="Overview" question={config.question}
        answer={<>{usd(k.supplied)} is supplied across {count(k.markets)} markets and {pct(k.utilization, 1)} of it is borrowed. Supply moved {k.suppliedChange7d >= 0 ? 'up' : 'down'} {pct(Math.abs(k.suppliedChange7d), 1)} over seven days, as of {d.asOf}.</>} />
      <SectionCards kpis={k} asOf={d.asOf} />
      <div className="px-4 lg:px-6"><ChartAreaInteractive data={d.history} asOf={d.asOf} grain={d.historyGrain} /></div>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-2">
        <Card className="@container/card">
          <CardHeader><CardTitle>Lending on the chain, DefiLlama, 400 days</CardTitle><CardDescription>The only series older than the platform. DefiLlama TVL for every lending protocol on {config.chain.name}, so the shape of the chain is visible before 4 September; it counts collateral, so it sits above our supplied figure.</CardDescription></CardHeader>
          <CardContent className="px-2 sm:px-6"><AreaChart data={chain.series} series={[{ key: 'tvl', label: 'Chain lending TVL', color: 'var(--chart-3)' }]} unit="usd" height={220} /></CardContent>
        </Card>
        <Card className="@container/card">
          <CardHeader><CardTitle>Protocols on the chain</CardTitle><CardDescription>DefiLlama TVL by protocol on {chain.asOf}. Morpho is the lending layer; the rest is the long tail the platform does not count in the headline.</CardDescription></CardHeader>
          <CardContent className="px-2 sm:px-6"><BarChart data={chain.byProtocol} x="name" series={[{ key: 'value', label: 'TVL', color: 'var(--chart-3)' }]} unit="usd" horizontal labels height={220} categoryWidth={120} /></CardContent>
        </Card>
      </div>
      <MarketsTable data={d.markets} title="Markets" pageSize={8}
        caption={<><b className="font-medium text-foreground">Where the money actually is.</b> A handful of markets carry most of the supply; their utilisation is the per-market risk that the aggregate hides. Largest first.</>} />
      {d.reconciliation ? (
        <p className="px-4 text-sm text-muted-foreground lg:px-6"><b className="font-medium text-foreground">Reconciliation.</b> Our own count of supplied value is {usd(d.reconciliation.ours)}; {d.reconciliation.theirsSource} reports {usd(d.reconciliation.theirs)} TVL. {d.reconciliation.note}</p>
      ) : null}
    </>
  );
}
