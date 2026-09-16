import { config } from '@/datum.config';
import { loadVaults } from '@/lib/robinhood';
import { count, pct, usd } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DonutChart } from '@/components/charts';
import { VaultsTable } from '@/components/vaults-table';

export const revalidate = 300;
export const metadata = { title: 'Vaults' };

export default async function Vaults() {
  const { asOf, vaults } = await loadVaults();
  const tvl = vaults.reduce((a, v) => a + v.tvl, 0);
  const top = vaults[0];
  const byCurator = new Map<string, number>();
  vaults.forEach((v) => byCurator.set(v.curator, (byCurator.get(v.curator) ?? 0) + v.tvl));
  const curators = [...byCurator.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const weighted = tvl ? vaults.reduce((a, v) => a + v.netApy * v.tvl, 0) / tvl : 0;
  return (
    <>
      <PageHeader eyebrow="Vaults" question={`Where do depositors on ${config.chain.name} put their money?`}
        answer={<>{count(vaults.length)} listed vaults hold {usd(tvl)} as of {asOf}, earning {pct(weighted)} net on average. {top ? `${top.name} alone holds ${usd(top.tvl)}, ${pct(tvl ? (top.tvl / tvl) * 100 : 0, 0)} of the total.` : ''}</>} />
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Vault TVL by curator</CardTitle><CardDescription>Who allocates the deposits. One curator holding most of the TVL is a concentration to know about, not a fault.</CardDescription></CardHeader>
          <CardContent><DonutChart items={curators} unit="usd" height={200} centerLabel="vault TVL" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>What a vault is</CardTitle><CardDescription>Why the vault page exists beside the markets page.</CardDescription></CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">A vault takes one asset from depositors and lends it across several markets under rules a curator sets: which markets, how much in each, and the caps. Depositors see one rate, the net APY after the vault fee. The markets page shows where that money lands; this page shows who steers it and what it earns.</CardContent>
        </Card>
      </div>
      <VaultsTable data={vaults} title="All listed vaults" pageSize={20}
        caption={<><b className="font-medium text-foreground">Every listed vault, largest first.</b> Idle is the part of TVL not yet lent out; a high idle share drags the net APY below the markets it allocates to.</>} />
    </>
  );
}
