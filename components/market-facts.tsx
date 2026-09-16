'use client';
// The market's parameters as a shadcn Item list, and its largest suppliers. Client because Item
// keeps context; the data arrives as plain props from the server page.
import { CalendarBlankIcon, EyeIcon, HashIcon, PercentIcon, ShieldCheckIcon, UsersThreeIcon } from '@phosphor-icons/react';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from '@/components/ui/item';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AssetAvatar } from '@/components/asset-avatar';
import { address, pct, usd } from '@/lib/format';
import type { Fact, Holder } from '@/lib/types';

const ICON: Record<string, React.ReactNode> = {
  'Liquidation LTV': <ShieldCheckIcon />, Oracle: <EyeIcon />, 'Interest rate model': <PercentIcon />, Curator: <UsersThreeIcon />, Created: <CalendarBlankIcon />, 'Market address': <HashIcon />,
};

export function MarketFacts({ facts }: { facts: Fact[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Parameters</CardTitle><CardDescription>What the market was set up with. These change rarely and by governance, so a change is news.</CardDescription></CardHeader>
      <CardContent className="px-2">
        <ItemGroup>
          {facts.map((f, i) => (
            <div key={f.label}>
              {i > 0 ? <ItemSeparator /> : null}
              <Item size="sm">
                <ItemMedia variant="icon">{ICON[f.label] ?? <HashIcon />}</ItemMedia>
                <ItemContent>
                  <ItemTitle>{f.label}</ItemTitle>
                  <ItemDescription>{f.note ?? ''}</ItemDescription>
                </ItemContent>
                <span className="ml-auto shrink-0 text-sm font-medium tabular-nums">{f.label === 'Market address' ? <span className="font-mono text-xs">{address(f.value)}</span> : f.value}</span>
              </Item>
            </div>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}

export function MarketHolders({ suppliers }: { suppliers: Holder[] }) {
  if (!suppliers.length) return null;
  return (
    <Card>
      <CardHeader><CardTitle>Largest suppliers</CardTitle><CardDescription>Concentration is the quiet risk: one address leaving is a rate shock for everyone else.</CardDescription></CardHeader>
      <CardContent className="px-2">
        <ItemGroup>
          {suppliers.map((h, i) => (
            <div key={h.address}>
              {i > 0 ? <ItemSeparator /> : null}
              <Item size="sm">
                <ItemMedia><AssetAvatar symbol={h.address.slice(2, 4)} className="size-7" /></ItemMedia>
                <ItemContent>
                  <ItemTitle className="font-mono text-xs">{address(h.address, 6)}</ItemTitle>
                  <ItemDescription>{pct(h.share, 1)} of supply</ItemDescription>
                </ItemContent>
                <span className="ml-auto shrink-0 text-sm font-medium tabular-nums">{usd(h.supplied)}</span>
              </Item>
            </div>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
