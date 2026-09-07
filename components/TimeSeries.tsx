'use client';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export type Point = { day: string; [k: string]: number | string };
const fmtUsd = (v: number) => (Math.abs(v) >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : Math.abs(v) >= 1e6 ? `$${(v / 1e6).toFixed(0)}M` : `$${(v / 1e3).toFixed(0)}K`);

export function TimeSeries({ data, series, unit = 'usd' }: { data: Point[]; series: { key: string; label: string; color?: string }[]; unit?: 'usd' | 'pct' }) {
  const f = unit === 'usd' ? fmtUsd : (v: number) => `${v.toFixed(1)}%`;
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <defs>{series.map((s, i) => <linearGradient key={s.key} id={`g${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={s.color ?? 'var(--accent)'} stopOpacity={0.35} /><stop offset="100%" stopColor={s.color ?? 'var(--accent)'} stopOpacity={0} /></linearGradient>)}</defs>
          <CartesianGrid stroke="var(--rule)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: 'var(--muted)', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'var(--rule)' }} minTickGap={28} />
          <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={f} width={62} />
          <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--rule)', borderRadius: 8, fontSize: 12 }} formatter={(v: number, n: string) => [f(v), series.find((s) => s.key === n)?.label ?? n]} />
          {series.map((s, i) => <Area key={s.key} type="monotone" dataKey={s.key} name={s.key} stroke={s.color ?? 'var(--accent)'} fill={`url(#g${i})`} strokeWidth={1.8} dot={false} isAnimationActive={false} />)}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
