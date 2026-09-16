'use client';
// Search and jump: shadcn Command in a dialog, opened from the header button or cmd+k.
// Groups: the pages from datum.config.ts and every market by symbol, protocol or chain.
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { BookOpenIcon, MagnifyingGlassIcon, SquaresFourIcon, TableIcon, VaultIcon } from '@phosphor-icons/react';
import { config } from '@/datum.config';
import { Button } from '@/components/ui/button';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@/components/ui/command';

export type CommandMarket = { id: string; collateral: string; loan: string; protocol: string };
const ICONS: Record<string, React.ReactNode> = { '/': <SquaresFourIcon />, '/markets': <TableIcon />, '/vaults': <VaultIcon />, '/methodology': <BookOpenIcon /> };

export function CommandMenu({ markets }: { markets: CommandMarket[] }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen((o) => !o); } };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);
  const go = (href: string) => { setOpen(false); router.push(href); };
  return (
    <>
      <Button variant="outline" size="sm" className="text-muted-foreground" onClick={() => setOpen(true)}>
        <MagnifyingGlassIcon /><span className="hidden md:inline">Search markets</span>
        <kbd className="pointer-events-none ml-1 hidden rounded border bg-muted px-1.5 font-mono text-[10px] font-medium md:inline-block">⌘K</kbd>
      </Button>
      {open ? <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Jump to a page or a market">
        <Command>
          <CommandInput placeholder="Search pages and markets" />
          <CommandList>
            <CommandEmpty>Nothing matches.</CommandEmpty>
            <CommandGroup heading="Pages">
              {config.nav.map((n) => (
                <CommandItem key={n.href} value={`page ${n.label}`} onSelect={() => go(n.href)}>{ICONS[n.href] ?? <SquaresFourIcon />}<span>{n.label}</span></CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Markets">
              {markets.map((m) => (
                <CommandItem key={m.id} value={`${m.collateral} ${m.loan} ${m.protocol}`} onSelect={() => go(`/markets/${m.id}`)}>
                  <TableIcon /><span>{m.collateral} / {m.loan}</span><CommandShortcut>{m.protocol}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog> : null}
    </>
  );
}
