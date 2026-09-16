// Reads specific to this dashboard: vaults on the chain and DefiLlama context for the whole chain.
// Dashboard file (not a kit file). Shapes stay small so the pages are only layout.
import { cache } from 'react';
import { config } from '@/datum.config';
import { hasKey, query } from './datum';
import { num } from './format';
import { SAMPLE_AS_OF } from './sample';
import type { Point, Share } from './types';

export type Vault = { id: string; name: string; symbol: string; asset: string; version: number; tvl: number; apy: number; netApy: number; fee: number; idle: number; curator: string; address: string };

const isoDaysAgo = (n: number, from = new Date()) => { const d = new Date(from); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };

/** Listed vaults on the chain, largest first. */
export const loadVaults = cache(async (): Promise<{ asOf: string; vaults: Vault[] }> => {
  if (!hasKey()) return sampleVaults();
  const v = config.resources.vaults;
  const r = await query(v.product, v.name, { ...v.filters, limit: 500 });
  const vaults: Vault[] = r.rows.map((x) => ({
    id: String(x.vault_address ?? ''), name: String(x.name ?? ''), symbol: String(x.symbol ?? ''), asset: String(x.asset_symbol ?? ''), version: num(x.vault_version),
    tvl: num(x.total_assets_usd), apy: num(x.apy), netApy: num(x.net_apy), fee: num(x.fee_pct), idle: num(x.idle_assets_usd),
    curator: String(x.curator ?? x.curator_names ?? 'n/a'), address: String(x.vault_address ?? ''),
  })).sort((a, b) => b.tvl - a.tvl);
  return { asOf: (r.day ?? '').slice(0, 10), vaults };
});

/** DefiLlama's view of lending on the chain: every protocol it tracks, latest day and a 400-day total. */
export const loadChain = cache(async (): Promise<{ asOf: string; byProtocol: Share[]; series: Point[] }> => {
  if (!hasKey()) return sampleChain();
  const c = config.resources.chainTvl;
  const r = await query(c.product, c.name, { ...c.filters, since: isoDaysAgo(400), limit: 5000 });
  const byDay = new Map<string, number>(); let latest = '';
  for (const x of r.rows) { const d = String(x.day).slice(0, 10); byDay.set(d, (byDay.get(d) ?? 0) + num(x.tvl_usd)); if (d > latest) latest = d; }
  const byProtocol: Share[] = r.rows.filter((x) => String(x.day).slice(0, 10) === latest).map((x) => ({ name: String(x.slug), value: num(x.tvl_usd) })).sort((a, b) => b.value - a.value);
  const series: Point[] = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, tvl]) => ({ day, tvl }));
  return { asOf: latest, byProtocol, series };
});

// Sample data for a run without a key, labelled as such by the page frame.
function sampleVaults(): { asOf: string; vaults: Vault[] } {
  const rows: [string, string, string, number, number, number, string][] = [
    ['Steakhouse USDG', 'steakUSDG', 'USDG', 2, 458.9e6, 3.64, 'Steakhouse'], ['Gauntlet USDC Prime', 'gtUSDCp', 'USDC', 1, 212.4e6, 4.02, 'Gauntlet'],
    ['Re7 WETH', 're7WETH', 'WETH', 1, 88.1e6, 2.31, 'Re7'], ['Block Analitica USDT', 'baUSDT', 'USDT', 2, 41.7e6, 3.9, 'Block Analitica'],
  ];
  return { asOf: SAMPLE_AS_OF, vaults: rows.map(([name, symbol, asset, version, tvl, netApy, curator], i) => ({ id: `0xbeef${i}`, name, symbol, asset, version, tvl, apy: netApy + 0.3, netApy, fee: version === 2 ? 0 : 10, idle: tvl * 0.06, curator, address: `0xbeef${i}` })) };
}
function sampleChain(): { asOf: string; byProtocol: Share[]; series: Point[] } {
  const days = 120; const series: Point[] = []; let v = 380e6;
  for (let i = days; i >= 0; i--) { v *= 1 + (Math.sin(i / 9) * 0.004 + 0.0025); const d = new Date(SAMPLE_AS_OF + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - i); series.push({ day: d.toISOString().slice(0, 10), tvl: Math.round(v) }); }
  return { asOf: SAMPLE_AS_OF, byProtocol: [{ name: 'morpho-blue', value: 525.4e6 }, { name: 'aave-v3', value: 61.2e6 }, { name: 'compound-v3', value: 18.9e6 }], series };
}
