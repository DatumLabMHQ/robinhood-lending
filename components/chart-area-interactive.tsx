'use client';
// Supplied and borrowed over time: shadcn's chart-area-interactive recipe (card, a native select
// for the range, gradient areas, indicator tooltip) fed by our normalised history rows. Needs
// "use client": the range is state.
import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { shortDay, usd } from '@/lib/format';
import type { Point } from '@/lib/types';

const chartConfig = {
  supply: { label: 'Supplied', color: 'var(--chart-1)' },
  borrow: { label: 'Borrowed', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const RANGES = [{ value: '90d', label: 'Last 3 months', days: 90 }, { value: '30d', label: 'Last 30 days', days: 30 }, { value: '7d', label: 'Last 7 days', days: 7 }];

export function ChartAreaInteractive({ data, asOf, grain = 'daily' }: { data: Point[]; asOf: string; grain?: 'daily' | 'weekly' }) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState('90d');
  React.useEffect(() => { if (isMobile) setTimeRange('30d'); }, [isMobile]);

  // Filter relative to the last day in the data, not to today: sample and history stay honest.
  const last = data.length ? new Date(String(data[data.length - 1].day) + 'T00:00:00Z') : new Date(asOf + 'T00:00:00Z');
  const days = RANGES.find((r) => r.value === timeRange)?.days ?? 90;
  const start = new Date(last); start.setUTCDate(last.getUTCDate() - days);
  const rows = data.filter((p) => new Date(String(p.day) + 'T00:00:00Z') >= start);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Supplied and borrowed</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">Supplied is the ceiling, borrowed is the demand; the gap between them is the idle liquidity that sets rates. Our own count, {grain} points, as of {asOf}.</span>
          <span className="@[540px]/card:hidden">{grain === 'weekly' ? 'Weekly' : 'Daily'}, as of {asOf}</span>
        </CardDescription>
        <CardAction>
          <NativeSelect size="sm" aria-label="Time range" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            {RANGES.map((r) => <NativeSelectOption key={r.value} value={r.value}>{r.label}</NativeSelectOption>)}
          </NativeSelect>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={rows} margin={{ left: 0, right: 8, top: 4, bottom: 0 }} accessibilityLayer>
            <defs>
              <linearGradient id="fillSupply" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-supply)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-supply)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillBorrow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-borrow)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-borrow)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={(v) => shortDay(String(v))} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickCount={4} width={56} tickFormatter={(v) => usd(v)} />
            <ChartTooltip cursor={false} defaultIndex={isMobile ? -1 : Math.max(0, rows.length - 8)}
              content={<ChartTooltipContent labelFormatter={(v) => shortDay(String(v))} indicator="dot"
                formatter={(value, name) => (
                  <div className="flex w-full items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: `var(--color-${String(name)})` }} />
                    <span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig]?.label ?? String(name)}</span>
                    <span className="ml-auto font-medium tabular-nums text-foreground">{usd(value)}</span>
                  </div>
                )} />} />
            <Area dataKey="supply" type="natural" fill="url(#fillSupply)" stroke="var(--color-supply)" strokeWidth={2} isAnimationActive={false} />
            <Area dataKey="borrow" type="natural" fill="url(#fillBorrow)" stroke="var(--color-borrow)" strokeWidth={2} isAnimationActive={false} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
