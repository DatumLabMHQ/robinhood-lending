'use client';
import { usePathname } from 'next/navigation';
import { config } from '@/datum.config';

export const NAV: { href: string; label: string }[] = (config as { nav?: { href: string; label: string }[] }).nav ?? [{ href: '/', label: 'Overview' }];

export function Nav() {
  const p = usePathname();
  return <nav className="nav">{NAV.map((n) => <a key={n.href} href={n.href} className={p === n.href ? 'on' : ''}>{n.label}</a>)}</nav>;
}
