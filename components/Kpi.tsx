export function Kpis({ children }: { children: React.ReactNode }) { return <section className="kpis">{children}</section>; }
export function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="kpi"><div className="label">{label}</div><div className="value">{value}</div>{sub ? <div className="sub">{sub}</div> : null}</div>;
}
