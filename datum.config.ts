// The only file most dashboards need to edit. Name the product, the platform resources the pages
// read, and the questions to show. The client in lib/datum.ts and the components do the rest.
export const CHAIN_ID = 4663;                // Robinhood Chain
export const CHAIN_SLUG = 'robinhood chain'; // DefiLlama's chain key

export const config = {
  // 'draft' until `datum check <slug>` prints READY and the owner signs the brief; the page says so.
  status: 'draft' as 'draft' | 'live',
  slug: 'robinhood-lending',
  title: 'State of Lending on Robinhood Chain',
  description: 'Every lending market and vault on Robinhood Chain, read hourly from the Datum data platform. Morpho is the chain\'s lending layer today; the smaller protocols DefiLlama lists are tracked beside it.',
  resources: {
    markets: { product: 'morpho', name: 'markets' },
    vaults: { product: 'morpho', name: 'vaults' },
    curators: { product: 'morpho', name: 'curators' },
    defillama: { product: 'defillama', name: 'tvl' },
  },
  questions: [] as string[],
  filters: { chain_id: String(CHAIN_ID) } as Record<string, string>,
  nav: [
    { href: '/', label: 'Overview' },
    { href: '/markets', label: 'Markets' },
    { href: '/vaults', label: 'Vaults' },
  ],
};
export type DatumConfig = typeof config;
