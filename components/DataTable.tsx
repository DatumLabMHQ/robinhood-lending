export type Col = { key: string; label: string; num?: boolean; fmt?: (v: unknown, row: Record<string, unknown>) => string };
export function DataTable({ cols, rows, empty = 'No rows.' }: { cols: Col[]; rows: Record<string, unknown>[]; empty?: string }) {
  if (!rows.length) return <div className="note">{empty}</div>;
  return (
    <div className="table-wrap"><table>
      <thead><tr>{cols.map((c) => <th key={c.key} className={c.num ? 'num' : ''}>{c.label}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{cols.map((c) => <td key={c.key} className={c.num ? 'num' : ''}>{c.fmt ? c.fmt(r[c.key], r) : String(r[c.key] ?? '—')}</td>)}</tr>)}</tbody>
    </table></div>
  );
}
