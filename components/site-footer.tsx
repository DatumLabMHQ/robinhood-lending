// Provenance, on every page: where the numbers come from and when they were taken.
import { platformStatus } from '@/lib/data';

export async function SiteFooter() {
  const s = await platformStatus();
  return (
    <footer className="mt-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t px-4 py-4 text-xs text-muted-foreground lg:px-6">
      <span className="max-w-[80ch]">Every number on this page comes from the Datum data platform&rsquo;s curated tables, read through datum-api. Definitions live in datum-context; disagreements with other sources are logged, not hidden.</span>
      <span className="tabular-nums">{s.sample ? 'Sample data' : `As of ${s.asOf ?? 'n/a'} UTC`} · Datum Labs</span>
    </footer>
  );
}
