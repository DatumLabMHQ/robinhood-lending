// The only file most dashboards need to edit. Name the product, the platform resources the pages
// read, how their columns map onto the normalised shapes in lib/types.ts, and the navigation.
// lib/data.ts and the components do the rest. Without DATUM_API_KEY the pages run on labelled sample data.

// `datum new dashboard` fills the {{placeholders}}. Until then the template runs as the reference
// dashboard under these fallbacks, so it can be opened and judged as is.
const ph = (v: string, fallback: string) => (v.startsWith('{{') && v.endsWith('}}') ? fallback : v);

export const config = {
  // 'draft' until `datum check <slug>` prints READY and the owner signs the brief; the page says so.
  status: 'live' as 'draft' | 'live',
  slug: ph('robinhood-lending', 'reference-dashboard'),
  title: ph('State of Lending on Robinhood Chain', 'State of lending'),
  description: ph('Every listed Morpho market and vault on Robinhood Chain, read hourly from the Datum data platform, with the rest of the chain\'s lending tracked beside it.', 'The reference dashboard for Datum Labs: the standard look and structure, running on labelled sample data until a platform key is set.'),
  // The question the overview answers. Pages lead with it.
  question: 'Where does lending on Robinhood Chain stand today, and is it growing?',
  // The product the markets belong to, as shown on the page and used for its logo.
  product: { slug: 'morpho', label: 'Morpho', defillamaSlug: 'morpho-blue' },
  // This dashboard is one chain. Morpho is its lending layer; DefiLlama's other protocols are context.
  chain: { id: 4663, name: 'Robinhood Chain', defillamaChain: 'robinhood chain' },
  // Resources are product/name pairs from GET /api/v1/products on datum-api. `filters` must be
  // filters that resource declares (see /api/v1/products); anything else is ignored by the API.
  resources: {
    // One row per chain, market and UTC day. Latest day by default; `day=` or `since=` for history.
    markets: { product: 'morpho', name: 'markets', filters: { listed: 'true', chain_id: '4663' } as Record<string, string> },
    // The positions sample (largest suppliers and borrowers per market, twice a day) and its health bands.
    // When the platform does not serve them yet, the market page hides those two cards.
    positions: { product: 'morpho', name: 'positions' },
    health: { product: 'morpho', name: 'health' },
    vaults: { product: 'morpho', name: 'vaults', filters: { listed: 'true', chain_id: '4663' } as Record<string, string> },
    // DefiLlama's own figure for the same protocol, stored beside ours for the reconciliation note.
    comparison: { product: 'defillama', name: 'tvl', filters: { slug: 'morpho-blue', chain: 'robinhood chain' } as Record<string, string> },
    // Every lending protocol DefiLlama tracks on the chain, for the context cards on the overview.
    chainTvl: { product: 'defillama', name: 'tvl', filters: { chain: 'robinhood chain' } as Record<string, string> },
  },
  // Column names in the markets resource for each normalised field (lib/types.ts Market), and
  // which of them the resource stores as fractions (0.86) rather than percent (86).
  fields: {
    id: 'market_id', chain: 'chain_id', collateral: 'collateral_symbol', loan: 'loan_symbol',
    supplied: 'supply_assets_usd', borrowed: 'borrow_assets_usd', utilization: 'utilization', supply_apy: 'supply_apy', borrow_apy: 'borrow_apy', lltv: 'lltv', day: 'day',
    // extra columns shown on the market page when present
    liquidity: 'liquidity_assets_usd', collateralValue: 'collateral_assets_usd', badDebt: 'bad_debt_usd', fee: 'fee_pct', address: 'market_id',
  },
  fractions: ['lltv'] as string[],
  // How far back the overview trend goes, and how often it samples our own count (one API call
  // per point, so weekly points keep it to about a dozen calls).
  trend: { days: 90, stepDays: 7 },
  // The sign-in gate: the overview is open to everyone; every other page asks once for a name, an email
  // and an occupation (kept on that browser). Leads join the Datum Labs list through app/api/gate.
  gate: { enabled: true, free: ['/'] as string[] },
  nav: [
    { href: '/', label: 'Overview' },
    { href: '/markets', label: 'Markets' },
    { href: '/vaults', label: 'Vaults' },
    { href: '/methodology', label: 'Methodology' },
  ],
  // Shown on the methodology page. Keep them honest: what is read, how often, what it excludes.
  // role: 'headline' is our own count; 'comparison' is stored beside it and never the headline.
  sources: [
    { name: 'Datum data platform', role: 'headline' as 'headline' | 'comparison', cadence: 'hourly snapshots', detail: 'Every listed Morpho market and vault on Robinhood Chain (chain id 4663), read through datum-api. Daily grain is the last observation of the UTC day. The platform holds this chain from 4 September 2026.' },
    { name: 'DefiLlama', role: 'comparison' as 'headline' | 'comparison', cadence: 'daily', detail: 'The chain-level lending TVL by protocol, back 400 days, and the reconciliation figure for Morpho. Its TVL counts collateral, ours counts assets supplied to markets, so the two differ by definition.' },
  ],
  definitions: [
    { term: 'Supplied', unit: 'USD', text: 'Value of loan assets supplied to listed markets at the snapshot, at the platform price feed.' },
    { term: 'Borrowed', unit: 'USD', text: 'Value of outstanding debt in listed markets.' },
    { term: 'Utilisation', unit: '%', text: 'Borrowed divided by supplied, per market and in aggregate. Above 85% withdrawals may queue.' },
    { term: 'Supply APY', unit: '% a year', text: 'The rate the protocol reports for suppliers at the snapshot. The headline is weighted by supplied value.' },
    { term: 'Borrow APY', unit: '% a year', text: 'The rate borrowers pay at the snapshot, before fees.' },
    { term: 'LLTV', unit: '%', text: 'Liquidation loan to value: the debt to collateral ratio at which a position can be liquidated.' },
    { term: 'Listed', unit: 'flag', text: 'Markets and vaults the protocol lists in its own interface. Unlisted ones exist on chain but include dust and fake-price entries, so they are excluded from every number here.' },
    { term: 'Vault TVL', unit: 'USD', text: 'Assets deposited in a vault at the snapshot, including the part not yet allocated to a market (idle).' },
    { term: 'Net APY', unit: '% a year', text: 'What a vault depositor earns after the vault fee, as the protocol reports it, including rewards.' },
    { term: 'Curator', unit: 'name', text: 'The entity that sets a vault allocations and caps, as the platform attributes it.' },
  ],
};
export type DatumConfig = typeof config;
