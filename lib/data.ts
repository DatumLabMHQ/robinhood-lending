// Loads the normalised shapes the pages read. From the platform when DATUM_API_KEY is set,
// otherwise from lib/sample.ts, labelled as sample on every page.
import { cache } from 'react';
import { config } from '@/datum.config';
import { hasKey, query } from './datum';
import { sampleOverview, sampleMarket } from './sample';
import type { FrameData } from './platform';
export { platformStatus, showKit } from './platform';
import { num, usd } from './format';
import { chainLogo, chainName, protocolLogo } from './chains';
import type { Holder, Market, MarketDetail, Overview, Point, Share } from './types';

const F = config.fields;
const frac = new Set(config.fractions);
const scale = (field: string, v: unknown) => num(v) * (frac.has(field) ? 100 : 1);
const risk = (u: number): Market['risk'] => (u > 85 ? 'high' : u > 70 ? 'moderate' : 'safe');
const isoDaysAgo = (n: number, from = new Date()) => { const d = new Date(from); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
export const marketKey = (chain: unknown, id: unknown) => `${chain}-${String(id).toLowerCase()}`;

function toMarket(r: Record<string, unknown>): Market {
  const supplied = num(r[F.supplied]), borrowed = num(r[F.borrowed]);
  const util = r[F.utilization] !== undefined && r[F.utilization] !== null ? scale('utilization', r[F.utilization]) : supplied ? (borrowed / supplied) * 100 : 0;
  return {
    id: marketKey(r[F.chain], r[F.id]), protocol: config.product.label, chain: chainName(String(r[F.chain])),
    collateral: String(r[F.collateral] ?? ''), loan: String(r[F.loan] ?? ''), supplied, borrowed, utilization: util,
    supply_apy: scale('supply_apy', r[F.supply_apy]), borrow_apy: scale('borrow_apy', r[F.borrow_apy]), lltv: scale('lltv', r[F.lltv]), risk: risk(util),
    address: String(r[F.address] ?? ''), logos: { protocol: protocolLogo(config.product.defillamaSlug), chain: chainLogo(String(r[F.chain])) },
  };
}
function sumBy(markets: Market[], key: 'chain' | 'protocol'): Share[] {
  const m = new Map<string, number>();
  markets.forEach((x) => m.set(x[key], (m.get(x[key]) ?? 0) + x.supplied));
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
const totals = (rows: Record<string, unknown>[]): { supply: number; borrow: number } =>
  rows.reduce<{ supply: number; borrow: number }>((a, r) => ({ supply: a.supply + num(r[F.supplied]), borrow: a.borrow + num(r[F.borrowed]) }), { supply: 0, borrow: 0 });

/** The overview: latest listed markets from the platform, our own count sampled weekly for the trend,
 *  DefiLlama's latest figure beside ours for the reconciliation note. */
export const loadOverview = cache(async (): Promise<Overview> => {
  if (!hasKey()) return sampleOverview();
  const m = config.resources.markets, cmp = config.resources.comparison;
  const latest = await query(m.product, m.name, { ...m.filters, limit: 5000 });
  const day = (latest.day ?? String(latest.rows[0]?.[F.day] ?? '')).slice(0, 10);
  const asOfDate = new Date(day + 'T00:00:00Z');
  const markets = latest.rows.map(toMarket).sort((a, b) => b.supplied - a.supplied);
  const { supply: supplied, borrow: borrowed } = totals(latest.rows);

  // Trend: our own count on a set of past days, one call each (the daily table holds one row per market).
  const offsets: number[] = [];
  for (let d = config.trend.days; d >= config.trend.stepDays; d -= config.trend.stepDays) offsets.push(d);
  if (!offsets.includes(7)) offsets.push(7);
  const past = await Promise.all(offsets.sort((a, b) => b - a).map(async (o) => {
    const r = await query(m.product, m.name, { ...m.filters, day: isoDaysAgo(o, asOfDate), limit: 5000 }).catch(() => null);
    return r && r.rows.length ? { day: isoDaysAgo(o, asOfDate), ...totals(r.rows) } : null;
  }));
  let points = past.filter((p): p is { day: string; supply: number; borrow: number } => p !== null);
  // Young data: when fewer than six weekly points exist, sample the last two weeks daily instead.
  let grain: Overview['historyGrain'] = 'weekly';
  if (points.length < 6) {
    const have = new Set(points.map((p) => p.day));
    const daily = await Promise.all(Array.from({ length: 13 }, (_, i) => 14 - i).filter((o) => !have.has(isoDaysAgo(o, asOfDate))).map(async (o) => {
      const r = await query(m.product, m.name, { ...m.filters, day: isoDaysAgo(o, asOfDate), limit: 5000 }).catch(() => null);
      return r && r.rows.length ? { day: isoDaysAgo(o, asOfDate), ...totals(r.rows) } : null;
    }));
    points = [...points, ...daily.filter((p): p is { day: string; supply: number; borrow: number } => p !== null)].sort((a, b) => a.day.localeCompare(b.day));
    grain = 'daily';
  }
  const history: Point[] = [...points, { day, supply: supplied, borrow: borrowed }];
  const weekAgo = points.find((p) => p.day === isoDaysAgo(7, asOfDate));

  // Reconciliation: DefiLlama's latest TVL and borrowed for the same protocol, summed over its chains.
  let reconciliation: Overview['reconciliation'] = null;
  try {
    const c = await query(cmp.product, cmp.name, { ...cmp.filters, limit: 5000 });
    const tvl = c.rows.reduce((a, r) => a + num(r.tvl_usd), 0), bor = c.rows.reduce((a, r) => a + num(r.borrowed_usd), 0);
    if (tvl) reconciliation = { ours: supplied, theirs: tvl, theirsSource: `DefiLlama (${(c.day ?? '').slice(0, 10)})`, note: `DefiLlama's TVL counts collateral posted, so it is larger than assets supplied by definition; it reports ${(bor / 1e9).toFixed(2)}B borrowed against our ${(borrowed / 1e9).toFixed(2)}B.` };
  } catch { reconciliation = null; }

  return {
    asOf: day, sample: false,
    kpis: {
      supplied, borrowed,
      suppliedChange7d: weekAgo && weekAgo.supply ? (supplied / weekAgo.supply - 1) * 100 : 0,
      borrowedChange7d: weekAgo && weekAgo.borrow ? (borrowed / weekAgo.borrow - 1) * 100 : 0,
      markets: markets.length, utilization: supplied ? (borrowed / supplied) * 100 : 0,
      supplyApy: supplied ? markets.reduce((a, x) => a + x.supply_apy * x.supplied, 0) / supplied : 0,
    },
    history, historyGrain: grain, rates: [], byChain: sumBy(markets, 'chain'), byProtocol: sumBy(markets, 'protocol'), markets, reconciliation,
  };
});

/** One market for the detail page: its own daily rows for the trend window, plus the largest suppliers
 *  and the health-factor bands from the positions sample when the platform serves it (otherwise the
 *  reads fail quietly, the lists stay empty and their cards hide). */
export const loadMarket = cache(async (id: string): Promise<MarketDetail | null> => {
  if (!hasKey()) return sampleMarket(id);
  const o = await loadOverview();
  const market = o.markets.find((x) => x.id === id);
  if (!market) return null;
  const [chain, ...rest] = id.split('-'); const marketId = rest.join('-');
  const m = config.resources.markets;
  const since = isoDaysAgo(config.trend.days, new Date(o.asOf + 'T00:00:00Z'));
  const hist = await query(m.product, m.name, { [F.chain]: chain, [F.id]: marketId, since, limit: 1000 });
  const rows = hist.rows.map((r) => ({ day: String(r[F.day] ?? '').slice(0, 10), supplied: num(r[F.supplied]), borrowed: num(r[F.borrowed]), sa: scale('supply_apy', r[F.supply_apy]), ba: scale('borrow_apy', r[F.borrow_apy]), u: r[F.utilization] != null ? scale('utilization', r[F.utilization]) : 0 }))
    .filter((r) => r.day).sort((a, b) => a.day.localeCompare(b.day));
  const history: Point[] = rows.map((r) => ({ day: r.day, supply: r.supplied, borrow: r.borrowed }));
  const rates: Point[] = rows.map((r) => ({ day: r.day, supply_apy: r.sa, borrow_apy: r.ba, utilization: r.u }));
  const latest = hist.rows.find((r) => String(r[F.day] ?? '').slice(0, 10) === o.asOf) ?? hist.rows[0] ?? {};
  const usdFact = (label: string, field: string, note: string) => (latest[field] != null ? [{ label, value: usd(latest[field]), note }] : []);
  const facts = [
    { label: 'Liquidation LTV', value: `${market.lltv.toFixed(1)}%`, note: 'Loan to value at which a position can be liquidated' },
    ...usdFact('Idle liquidity', F.liquidity, 'Supplied and not borrowed; what can be withdrawn now'),
    ...usdFact('Collateral posted', F.collateralValue, 'USD value of collateral backing the debt'),
    ...usdFact('Bad debt', F.badDebt, 'Debt no longer covered by collateral'),
    ...(latest[F.fee] != null ? [{ label: 'Protocol fee', value: `${num(latest[F.fee]).toFixed(2)}%`, note: 'Share of interest taken by the protocol' }] : []),
    { label: 'Chain', value: market.chain },
    { label: 'Market address', value: market.address ?? 'n/a' },
  ];
  // Largest suppliers and collateral by health-factor band, from morpho/positions and morpho/health.
  let suppliers: Holder[] = [], healthBands: Share[] = [], healthCoverage: MarketDetail['healthCoverage'];
  const pos = config.resources.positions, hl = config.resources.health;
  const [p, h] = await Promise.all([
    query(pos.product, pos.name, { [F.chain]: chain, [F.id]: marketId, side: 'supply', limit: 20 }).catch(() => null),
    query(hl.product, hl.name, { [F.chain]: chain, [F.id]: marketId, limit: 1 }).catch(() => null),
  ]);
  if (p) suppliers = p.rows.filter((r) => num(r.supply_assets_usd) > 0).slice(0, 10).map((r) => ({ address: String(r.user_address ?? ''), supplied: num(r.supply_assets_usd), share: num(r.share_of_market_pct) }));
  const b = h?.rows[0];
  if (b && num(b.borrowers_tracked) > 0) {
    healthBands = ([['Below 1.05', 'hf_below_1_05_usd'], ['1.05 to 1.25', 'hf_1_05_to_1_25_usd'], ['1.25 to 1.5', 'hf_1_25_to_1_5_usd'], ['1.5 to 2', 'hf_1_5_to_2_usd'], ['Above 2', 'hf_above_2_usd']] as const).map(([name, key]) => ({ name, value: num(b[key]) }));
    healthCoverage = { borrowers: num(b.borrowers_tracked), pct: num(b.borrow_coverage_pct) };
  }
  return { asOf: o.asOf, sample: false, market, history, rates, facts, suppliers, healthBands, healthCoverage };
});

// ── What the frame needs from this dashboard (lib/platform.ts FrameData) ──
/** Every market, for the cmd+k palette. */
export const searchItems: FrameData['searchItems'] = async () => {
  const o = await loadOverview();
  return o.markets.map((m) => ({ label: `${m.collateral} / ${m.loan}`, href: `/markets/${m.id}`, hint: m.protocol }));
};
/** The market count next to Markets in the sidebar. */
export const navBadges: FrameData['navBadges'] = async () => {
  const o = await loadOverview();
  return { '/markets': o.markets.length };
};
