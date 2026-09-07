import { config } from '@/datum.config';
import { usd, pct, num } from '@/lib/datum';
import { listedMarkets, listedVaults, marketHistory, chainProtocols } from '@/lib/robinhood';
import { Kpi, Kpis } from '@/components/Kpi';
import { DataTable } from '@/components/DataTable';
import { TimeSeries } from '@/components/TimeSeries';

export const revalidate = 300;

export default async function Overview() {
  const [markets, vaults, history, llama] = await Promise.all([listedMarkets(), listedVaults(), marketHistory(), chainProtocols()]);
  const supply = markets.rows.reduce((s, m) => s + num(m.supply_assets_usd), 0);
  const borrow = markets.rows.reduce((s, m) => s + num(m.borrow_assets_usd), 0);
  const collateral = markets.rows.reduce((s, m) => s + num(m.collateral_assets_usd), 0);
  const vaultTvl = vaults.rows.reduce((s, v) => s + num(v.total_assets_usd), 0);
  const llamaTotal = llama.latest.reduce((s, p) => s + num(p.tvl_usd), 0);
  const morphoLlama = llama.latest.find((p) => p.slug === 'morpho-blue');
  const ownNet = supply - borrow + collateral;
  return (
    <main>
      <h1>{config.title}</h1>
      <p className="lede">{config.description}</p>
      <Kpis>
        <Kpi label="Supplied (Morpho, listed)" value={usd(supply)} sub={`${markets.rows.length} markets · ${markets.day ?? ''}`} />
        <Kpi label="Borrowed" value={usd(borrow)} sub={`${supply ? ((borrow / supply) * 100).toFixed(1) : '0'}% of supply`} />
        <Kpi label="Collateral posted" value={usd(collateral)} sub="across listed markets" />
        <Kpi label="Vault TVL (listed)" value={usd(vaultTvl)} sub={`${vaults.rows.length} vault${vaults.rows.length === 1 ? '' : 's'}`} />
        <Kpi label="Chain lending TVL (DefiLlama)" value={usd(llamaTotal)} sub={`${llama.latest.length} protocols · ${llama.latestDay}`} />
      </Kpis>

      <div className="grid2">
        <section className="panel">
          <div className="panel-head"><h2>Chain lending TVL, DefiLlama, 400 days</h2><span className="meta">sum of tracked protocols</span></div>
          <TimeSeries data={llama.total} series={[{ key: 'tvl', label: 'TVL' }]} />
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Morpho supplied and borrowed, our own count</h2><span className="meta">daily since {history[0]?.day ?? '—'}</span></div>
          {history.length > 1 ? <TimeSeries data={history} series={[{ key: 'supply', label: 'Supplied' }, { key: 'borrow', label: 'Borrowed', color: 'var(--warn)' }]} /> : <p className="note">The platform started snapshotting this chain on 4 September 2026; the chart fills in as days accumulate. Today: {usd(supply)} supplied, {usd(borrow)} borrowed.</p>}
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><h2>Protocols on the chain</h2><span className="meta">DefiLlama, {llama.latestDay}</span></div>
        <DataTable cols={[
          { key: 'slug', label: 'Protocol' },
          { key: 'tvl_usd', label: 'TVL', num: true, fmt: (v) => usd(v) },
          { key: 'borrowed_usd', label: 'Borrowed', num: true, fmt: (v) => (v == null ? '—' : usd(v)) },
          { key: 'share', label: 'Share', num: true, fmt: (_v, r) => pct(llamaTotal ? (num(r.tvl_usd) / llamaTotal) * 100 : 0, 1) },
        ]} rows={llama.latest} />
        <p className="note">Reconciliation: our own count of Morpho on this chain is {usd(ownNet)} (supplied minus borrowed plus collateral, listed markets); DefiLlama reports {morphoLlama ? usd(morphoLlama.tvl_usd) : '—'}. The gap is unlisted markets and vault idle balances, both stored, neither in the headline.</p>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>Largest markets</h2><a href="/markets" className="meta">all markets →</a></div>
        <DataTable cols={[
          { key: 'collateral_symbol', label: 'Collateral' }, { key: 'loan_symbol', label: 'Loan' },
          { key: 'supply_assets_usd', label: 'Supplied', num: true, fmt: (v) => usd(v) }, { key: 'borrow_assets_usd', label: 'Borrowed', num: true, fmt: (v) => usd(v) },
          { key: 'utilization', label: 'Utilization', num: true, fmt: (v) => pct(v, 1) }, { key: 'supply_apy', label: 'Supply APY', num: true, fmt: (v) => pct(v) }, { key: 'borrow_apy', label: 'Borrow APY', num: true, fmt: (v) => pct(v) },
        ]} rows={markets.rows.slice(0, 8)} />
      </section>
    </main>
  );
}
