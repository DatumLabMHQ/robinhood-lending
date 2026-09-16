// The kit's chart guide: every chart in components/charts, live on sample data, with the rule for
// when to use it and when not to. Keep it in a dashboard or delete the route; the rules also
// live in docs/CHARTS.md in the kit.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { AreaChart, BarChart, DonutChart, LineChart, RadarChart, RadialChart } from '@/components/charts';
import { notFound } from 'next/navigation';
import { loadOverview, platformStatus, showKit } from '@/lib/data';

export const metadata = { title: 'Chart guide' };

function Guide({ title, use, not, children }: { title: string; use: string; not: string; children: React.ReactNode }) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription><b className="font-medium text-foreground">Use for</b> {use} <b className="font-medium text-foreground">Not for</b> {not}</CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">{children}</CardContent>
    </Card>
  );
}

export default async function ChartGuide() {
  if (!showKit(await platformStatus())) notFound();
  const d = await loadOverview();
  const radar = ['Liquidity', 'Utilisation', 'Oracle', 'Governance', 'Collateral', 'Track record'].map((axis, i) => ({ axis, Aave: [92, 71, 88, 80, 76, 95][i], Morpho: [74, 83, 70, 62, 88, 64][i] }));
  const byProtocolByMonth = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((name, i) => ({ name, Aave: 2.4e9 + i * 1.2e8, Morpho: 1.6e9 + i * 1.5e8, Compound: 0.7e9 + i * 2e7 }));
  return (
    <>
      <PageHeader eyebrow="Kit" question="Which chart, when?" answer="Six charts cover a data dashboard. Each one below states the rule it was built for; the same rules sit at the top of its file in components/charts and in docs/CHARTS.md." />
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-2">
        <Guide title="Area chart" use="totals that accumulate or drift over time: supplied, borrowed, TVL, volume. Stack parts of one whole; expand to show shares over time." not="rates and ratios, anything that crosses zero, or a handful of points.">
          <AreaChart data={d.history} series={[{ key: 'supply', label: 'Supplied' }, { key: 'borrow', label: 'Borrowed' }]} unit="usd" height={240} legend />
        </Guide>
        <Guide title="Line chart" use="rates and ratios read as a level: APYs, utilisation, spreads, prices. Up to four series; dots when points are sparse." not="volumes and totals, or categories.">
          <LineChart data={d.rates} series={[{ key: 'supply_apy', label: 'Supply APY' }, { key: 'borrow_apy', label: 'Borrow APY' }]} unit="pct" height={240} legend />
        </Guide>
        <Guide title="Bar chart" use="one value per category: supply by chain, by protocol, by asset. Horizontal with labels for rankings and long names." not="long time series, more than about twelve categories, or shares of a whole.">
          <BarChart data={d.byChain} x="name" series={[{ key: 'value', label: 'Supplied' }]} unit="usd" horizontal labels height={240} />
        </Guide>
        <Guide title="Stacked bar chart" use="composition per period when there are few periods: supply by protocol per month. The tooltip carries a total." not="daily series (use a stacked area) or more than six parts.">
          <BarChart data={byProtocolByMonth} x="name" series={[{ key: 'Aave', label: 'Aave' }, { key: 'Morpho', label: 'Morpho' }, { key: 'Compound', label: 'Compound' }]} unit="usd" stacked legend height={240} />
        </Guide>
        <Guide title="Donut chart" use="shares of one whole at one moment, two to six slices: share by protocol, by chain, by collateral. Hover isolates a slice; the centre shows the total." not="more than six slices (rank and group the rest as Other), change over time, or comparing two wholes.">
          <DonutChart items={d.byProtocol} unit="usd" height={220} centerLabel="supplied" />
        </Guide>
        <Guide title="Radar chart" use="a profile across four to eight dimensions on one shared scale: a risk scorecard, one protocol against another." not="values on different scales, time series, more than three series, or anything that needs a precise reading.">
          <RadarChart data={radar} series={[{ key: 'Aave', label: 'Aave' }, { key: 'Morpho', label: 'Morpho' }]} height={260} legend />
        </Guide>
        <Guide title="Radial chart" use="one value against a real maximum: utilisation of a market, a supply cap that is x% filled, a target reached." not="comparing several values, totals with no ceiling, or trends.">
          <div className="flex flex-wrap items-center justify-around gap-4">
            <RadialChart value={d.kpis.utilization} label="utilised" height={180} />
            <RadialChart value={68} max={100} label="cap filled" height={180} color="var(--chart-2)" />
          </div>
        </Guide>
        <Guide title="Tables, not charts" use="exact values people will read off, sort or search: markets, positions, addresses. A table with sortable numeric columns beats a chart with twelve bars." not="a trend or a share, which a picture shows faster.">
          <p className="text-sm text-muted-foreground">See the markets table on the overview: sortable headers, a filter, a Columns menu, paging, and each row opens the market.</p>
        </Guide>
      </div>
    </>
  );
}
