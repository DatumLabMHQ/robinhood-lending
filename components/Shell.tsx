import { config } from '@/datum.config';
import { health } from '@/lib/datum';
import { Nav } from './Nav';

export async function Shell({ children }: { children: React.ReactNode }) {
  let h: { ok: boolean; last_build: string | null } | null = null;
  try { h = await health(); } catch { h = null; }
  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <div className="brand">{config.title}<small>Datum Labs</small></div>
          <Nav />
        </div>
        <div className="meta">
          {h ? <>platform build {h.last_build ? new Date(h.last_build).toUTCString().slice(5, 22) : '—'} UTC · <span className={`pill ${h.ok ? '' : 'warn'}`}>{h.ok ? 'healthy' : 'degraded'}</span></> : <span className="pill bad">platform unreachable</span>}
        </div>
      </header>
      {children}
      <footer className="foot">Every number on this page comes from the Datum data platform's curated tables, read through datum-api. Definitions live in datum-context; disagreements with other sources are logged, not hidden.</footer>
    </div>
  );
}
