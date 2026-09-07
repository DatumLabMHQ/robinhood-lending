// Reads for this dashboard, all through datum-api. Kept in one place so a page is only layout.
import { config, CHAIN_ID, CHAIN_SLUG } from '@/datum.config';
import { query, num } from '@/lib/datum';

export type Market = Record<string, unknown> & { market_id: string; collateral_symbol: string; loan_symbol: string; supply_assets_usd: number; borrow_assets_usd: number; collateral_assets_usd: number; utilization: number; supply_apy: number; borrow_apy: number; lltv: number; listed: boolean; day: string };
export type Vault = Record<string, unknown> & { vault_address: string; name: string; symbol: string; asset_symbol: string; total_assets_usd: number; net_apy: number; apy: number; fee_pct: number; curator: string; vault_version: number; listed: boolean };

export async function listedMarkets() {
  const r = await query('morpho', 'markets', { chain_id: CHAIN_ID, listed: true, limit: 200 });
  return { day: r.day, as_of: r.as_of, rows: r.rows as Market[] };
}
export async function allMarkets() {
  const r = await query('morpho', 'markets', { chain_id: CHAIN_ID, limit: 500 });
  return { day: r.day, rows: r.rows as Market[] };
}
export async function listedVaults() {
  const r = await query('morpho', 'vaults', { chain_id: CHAIN_ID, listed: true, limit: 200 });
  return { day: r.day, as_of: r.as_of, rows: r.rows as Vault[] };
}
/** Daily supply and borrow totals for listed markets on the chain, since the platform started (4 Sep 2026). */
export async function marketHistory(days = 120) {
  const since = new Date(Date.now() - days * 86400e3).toISOString().slice(0, 10);
  const r = await query('morpho', 'markets', { chain_id: CHAIN_ID, listed: true, since, limit: 5000 });
  const byDay = new Map<string, { supply: number; borrow: number; markets: number }>();
  for (const m of r.rows as Market[]) {
    const d = String(m.day).slice(0, 10); const cur = byDay.get(d) ?? { supply: 0, borrow: 0, markets: 0 };
    cur.supply += num(m.supply_assets_usd); cur.borrow += num(m.borrow_assets_usd); cur.markets += 1; byDay.set(d, cur);
  }
  return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, v]) => ({ day, ...v }));
}
/** DefiLlama's per-protocol TVL on the chain: the reconciliation figure and the only series that predates the platform. */
export async function chainProtocols(days = 400) {
  const since = new Date(Date.now() - days * 86400e3).toISOString().slice(0, 10);
  const r = await query('defillama', 'tvl', { chain: CHAIN_SLUG, since, limit: 5000 });
  const rows = r.rows as { slug: string; day: string; tvl_usd: number; borrowed_usd: number | null }[];
  const latestDay = rows.reduce((m, x) => (String(x.day) > m ? String(x.day) : m), '');
  const latest = rows.filter((x) => String(x.day) === latestDay).sort((a, b) => num(b.tvl_usd) - num(a.tvl_usd));
  const series = new Map<string, number>();
  for (const x of rows) series.set(String(x.day).slice(0, 10), (series.get(String(x.day).slice(0, 10)) ?? 0) + num(x.tvl_usd));
  return { latestDay: latestDay.slice(0, 10), latest, total: [...series.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, tvl]) => ({ day, tvl })) };
}
export const chainId = CHAIN_ID; export const cfg = config;
