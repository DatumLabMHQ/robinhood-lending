'use client';
// Vaults on the kit's DataTable. Dashboard file: the columns belong to this product.
import { Badge } from '@/components/ui/badge';
import { AssetAvatar } from '@/components/asset-avatar';
import { DataTable, defineColumns, SortHeader } from '@/components/data-table';
import { pct, usd } from '@/lib/format';
import type { Vault } from '@/lib/robinhood';

const LABELS: Record<string, string> = { name: 'Vault', asset: 'Asset', curator: 'Curator', version: 'Version', tvl: 'TVL', netApy: 'Net APY', apy: 'Gross APY', fee: 'Fee', idle: 'Idle' };
const NUMERIC = ['tvl', 'netApy', 'apy', 'fee', 'idle'];
const columns = defineColumns<Vault>((col) => [
  col.accessor('name', { header: 'Vault', enableHiding: false, cell: ({ row }) => (
    <span className="flex items-center gap-2.5"><AssetAvatar symbol={row.original.asset} /><span className="leading-tight"><span className="block font-medium">{row.original.name}</span><span className="block text-xs text-muted-foreground">{row.original.symbol}</span></span></span>) }),
  col.accessor('asset', { header: 'Asset', cell: ({ row }) => <span className="text-muted-foreground">{row.original.asset}</span> }),
  col.accessor('curator', { header: 'Curator', cell: ({ row }) => <span className="text-muted-foreground">{row.original.curator}</span> }),
  col.accessor('version', { header: 'Version', cell: ({ row }) => <Badge variant="outline" className="px-1.5 text-muted-foreground">V{row.original.version}</Badge> }),
  col.accessor('tvl', { header: ({ column }) => <SortHeader column={column} label="TVL" />, cell: ({ row }) => <span className="tabular-nums">{usd(row.original.tvl)}</span> }),
  col.accessor('netApy', { header: ({ column }) => <SortHeader column={column} label="Net APY" />, cell: ({ row }) => <span className="tabular-nums">{pct(row.original.netApy)}</span> }),
  col.accessor('apy', { header: ({ column }) => <SortHeader column={column} label="Gross APY" />, cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{pct(row.original.apy)}</span> }),
  col.accessor('fee', { header: 'Fee', cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{pct(row.original.fee, 0)}</span> }),
  col.accessor('idle', { header: ({ column }) => <SortHeader column={column} label="Idle" />, cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{usd(row.original.idle)}</span> }),
]);
const search = (v: Vault, q: string) => `${v.name} ${v.symbol} ${v.asset} ${v.curator}`.toLowerCase().includes(q);

export function VaultsTable({ data, title, caption, pageSize = 10 }: { data: Vault[]; title: string; caption: React.ReactNode; pageSize?: number }) {
  return <DataTable<Vault> rows={data} columns={columns} title={title} caption={caption} getRowId={(v) => v.id} search={search} searchPlaceholder="Filter vaults" numeric={NUMERIC} labels={LABELS} initialSort={[{ id: 'tvl', desc: true }]} pageSize={pageSize} noun="vault" empty="No vaults match." />;
}
