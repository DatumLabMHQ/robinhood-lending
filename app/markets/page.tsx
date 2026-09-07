import { usd, pct } from '@/lib/datum';
import { allMarkets } from '@/lib/robinhood';
import { DataTable } from '@/components/DataTable';
export const revalidate = 300;

export default async function Markets() {
  const { day, rows } = await allMarkets();
  const listed = rows.filter((m) => m.listed), unlisted = rows.filter((m) => !m.listed);
  const cols = [
    { key: 'collateral_symbol', label: 'Collateral' }, { key: 'loan_symbol', label: 'Loan' },
    { key: 'lltv', label: 'LLTV', num: true, fmt: (v: unknown) => pct(Number(v) * 100, 0) },
    { key: 'supply_assets_usd', label: 'Supplied', num: true, fmt: (v: unknown) => usd(v) }, { key: 'borrow_assets_usd', label: 'Borrowed', num: true, fmt: (v: unknown) => usd(v) },
    { key: 'collateral_assets_usd', label: 'Collateral', num: true, fmt: (v: unknown) => usd(v) },
    { key: 'utilization', label: 'Util.', num: true, fmt: (v: unknown) => pct(v, 1) }, { key: 'supply_apy', label: 'Supply APY', num: true, fmt: (v: unknown) => pct(v) }, { key: 'borrow_apy', label: 'Borrow APY', num: true, fmt: (v: unknown) => pct(v) },
    { key: 'bad_debt_usd', label: 'Bad debt', num: true, fmt: (v: unknown) => (v ? usd(v) : '—') },
  ];
  return (
    <main>
      <h1>Markets</h1>
      <p className="lede">Every Morpho market on Robinhood Chain as of {day ?? 'the latest day'}. Listed markets carry the headline numbers; unlisted ones include dust and unpriced experiments and are shown for completeness.</p>
      <section className="panel"><div className="panel-head"><h2>Listed</h2><span className="meta">{listed.length} markets</span></div><DataTable cols={cols} rows={listed} /></section>
      <section className="panel"><div className="panel-head"><h2>Unlisted</h2><span className="meta">{unlisted.length} markets · not in totals</span></div><DataTable cols={cols} rows={unlisted} /></section>
    </main>
  );
}
