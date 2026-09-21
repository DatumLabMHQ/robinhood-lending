'use client';
// The sign-in gate. The overview is open to everyone; every other page asks once for a name, an email
// and an occupation before it opens (config.gate: enabled, free paths). Two rules keep it safe:
//   1. the server never renders a page blurred or inert, so nothing that fails to hydrate can leave a
//      reader stuck behind a gate they cannot answer, and crawlers always see the page;
//   2. the blur itself is CSS, switched by data-gate on <html>, which a tiny inline script sets from
//      localStorage or the cookie before the first paint, so a signed-in reader sees no flash.
// React only adds inert and the dialog once the browser has answered. Leads go to /api/gate, which
// puts them on the Datum Labs list.
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LockKeyIcon, SpinnerGapIcon, UserCircleIcon } from '@phosphor-icons/react';
import { config } from '@/datum.config';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

const KEY = 'datum_gate_unlocked';
// What the reader does, as a list to pick from rather than a box to type in. Sent to the list as the Occupation field.
const OCCUPATIONS = ['Analyst', 'Protocol founder or team', 'Investor or allocator', 'Trader', 'Researcher', 'Developer or engineer', 'Risk manager', 'Curator or vault manager', 'Journalist or writer', 'Student', 'Other'];
const GATE: { enabled: boolean; free: string[] } = { enabled: true, free: ['/'], ...((config as { gate?: { enabled?: boolean; free?: string[] } }).gate ?? {}) };
const isFree = (path: string) => GATE.free.some((f) => (f === '/' ? path === '/' : path === f || path.startsWith(f + '/')));
// Read once, tolerantly: either store on its own is enough, and a browser that refuses both fails open.
const remembered = () => {
  let ls = false, ck = false;
  try { ls = localStorage.getItem(KEY) === '1'; } catch { /* private mode */ }
  try { ck = /(^|;\s*)datum_gate=1(;|$)/.test(document.cookie); } catch { /* blocked */ }
  return ls || ck;
};
// Write both, independently, so one store refusing does not lose the other.
const remember = () => {
  try { localStorage.setItem(KEY, '1'); } catch { /* private mode: the cookie may still hold */ }
  try { document.cookie = 'datum_gate=1; max-age=31536000; path=/; samesite=lax'; } catch { /* blocked */ }
};
// The flag the stylesheet reads. Absent during server rendering, which is what keeps the page open there.
const flag = (unlocked: boolean) => { try { document.documentElement.dataset.gate = unlocked ? 'open' : 'locked'; } catch { /* no document */ } };
// Runs while the browser parses the page, before anything is painted, and fails open on any error.
const BOOT = `try{var k=localStorage.getItem('${KEY}')==='1'}catch(e){k=false}try{var c=/(^|;\\s*)datum_gate=1(;|$)/.test(document.cookie)}catch(e){c=false}document.documentElement.dataset.gate=(k||c)?'open':'locked'`;

type Ctx = { unlocked: boolean | null; open: boolean; setOpen: (v: boolean) => void; unlock: () => void };
const GateContext = React.createContext<Ctx | null>(null);
export const useGate = () => React.useContext(GateContext);

export function GateProvider({ children }: { children: React.ReactNode }) {
  // null until the browser has been asked. Nothing is gated in that window: the server renders the page
  // open, and the inline script below has already blurred it in CSS if the reader has not signed in.
  const [unlocked, setUnlocked] = React.useState<boolean | null>(GATE.enabled ? null : true);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { if (!GATE.enabled) return; const u = remembered(); flag(u); setUnlocked(u); }, []);
  const unlock = React.useCallback(() => { remember(); flag(true); setUnlocked(true); setOpen(false); }, []);
  return (
    <GateContext.Provider value={{ unlocked, open, setOpen, unlock }}>
      {GATE.enabled ? <script dangerouslySetInnerHTML={{ __html: BOOT }} /> : null}
      {children}
    </GateContext.Provider>
  );
}

/** Wraps a page: free paths render as they are; gated paths render blurred and inert until signed in. */
export function Gate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const g = useGate();
  // data-gate-scope marks a page the stylesheet may blur; whether it does is the reader's flag on <html>.
  const scoped = GATE.enabled && !isFree(path);
  // Only true once the browser has answered and said no, so the server and the first client render agree
  // that the page is open and no failed hydration can leave it inert.
  const gated = scoped && Boolean(g) && g!.unlocked === false;
  return (
    <>
      {/* The wrapper keeps the page's own vertical rhythm (the same column and gaps as the layout), so wrapping changes nothing when signed in. */}
      <div data-slot="page" data-gate-scope={scoped ? '' : undefined} inert={gated || undefined} aria-hidden={gated || undefined} className="flex flex-col gap-4 md:gap-6">{children}</div>
      {g ? <GateDialog open={gated || (g.open && g.unlocked !== true)} required={gated} /> : null}
    </>
  );
}

function GateDialog({ open, required }: { open: boolean; required: boolean }) {
  const g = useGate()!;
  const path = usePathname();
  const [form, setForm] = React.useState({ name: '', email: '', occupation: '' });
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = React.useState('');
  const field = (k: keyof typeof form) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }), disabled: status === 'loading', required: true });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading'); setError('');
    try {
      const res = await fetch('/api/gate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...form, source: config.slug, path }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Something went wrong'); }
      setStatus('idle'); g.unlock();
    } catch (err) { setStatus('error'); setError(err instanceof Error ? err.message : 'Something went wrong'); }
  }
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!required) g.setOpen(v); }}>{/* required: close requests (Escape, outside click) are ignored */}
      <DialogContent showCloseButton={!required} className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground"><LockKeyIcon className="size-5" /></div>
          <DialogTitle className="font-serif text-xl font-medium">Sign in to open the full dashboard</DialogTitle>
          <DialogDescription>The overview is open to everyone. The rest of {config.title} asks for your name, your email and what you do, once; this browser remembers it.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="grid gap-1.5"><Label htmlFor="gate-name">Full name</Label><Input id="gate-name" autoComplete="name" placeholder="Ada Lovelace" {...field('name')} /></div>
          <div className="grid gap-1.5"><Label htmlFor="gate-email">Email</Label><Input id="gate-email" type="email" autoComplete="email" placeholder="name@company.com" {...field('email')} /></div>
          <div className="grid gap-1.5">
            <Label htmlFor="gate-occupation">What you do</Label>
            <NativeSelect id="gate-occupation" required value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} disabled={status === 'loading'}>
              <NativeSelectOption value="" disabled>Choose one</NativeSelectOption>
              {OCCUPATIONS.map((o) => <NativeSelectOption key={o} value={o}>{o}</NativeSelectOption>)}
            </NativeSelect>
          </div>
          <Button type="submit" className="mt-1" disabled={status === 'loading'}>{status === 'loading' ? <><SpinnerGapIcon className="animate-spin" />Opening</> : 'Open the dashboard'}</Button>
          {error ? <p className="text-center text-xs text-destructive">{error}</p> : null}
          <p className="text-center text-xs text-muted-foreground">Your details join the Datum Labs list. No spam; unsubscribe any time.</p>
          {required ? <Link href="/" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Back to the overview</Link> : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** The header's Sign in button: shows only while the browser is known to be signed out. */
export function SignInButton() {
  const g = useGate();
  if (!g || g.unlocked !== false) return null;
  return <Button variant="outline" size="sm" onClick={() => g.setOpen(true)}><UserCircleIcon />Sign in</Button>;
}
