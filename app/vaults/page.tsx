import { usd, pct } from '@/lib/datum';
import { listedVaults } from '@/lib/robinhood';
import { DataTable } from '@/components/DataTable';
export const revalidate = 300;

export default async function Vaults() {
  const { day, rows } = await listedVaults();
  return (
    <main>
      <h1>Vaults</h1>
      <p className="lede">Listed Morpho vaults on Robinhood Chain as of {day ?? 'the latest day'}, Vault V1 and V2, with the curator the platform attributes them to.</p>
      <section className="panel">
        <DataTable cols={[
          { key: 'name', label: 'Vault' }, { key: 'asset_symbol', label: 'Asset' }, { key: 'curator', label: 'Curator' },
          { key: 'vault_version', label: 'Version', fmt: (v: unknown) => `V${v}` },
          { key: 'total_assets_usd', label: 'TVL', num: true, fmt: (v: unknown) => usd(v) },
          { key: 'net_apy', label: 'Net APY', num: true, fmt: (v: unknown) => pct(v) }, { key: 'apy', label: 'Gross APY', num: true, fmt: (v: unknown) => pct(v) },
          { key: 'fee_pct', label: 'Perf. fee', num: true, fmt: (v: unknown) => pct(v, 0) },
        ]} rows={rows} />
      </section>
    </main>
  );
}
