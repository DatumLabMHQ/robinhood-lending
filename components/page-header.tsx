// Thesis first: the question the page answers as the heading, the one-line answer with the
// as-of date underneath. Numbers come after, never before.
export function PageHeader({ eyebrow, question, answer }: { eyebrow?: string; question: string; answer: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 px-4 lg:px-6">
      {eyebrow ? <div className="text-xs font-medium text-muted-foreground">{eyebrow}</div> : null}
      <h1 className="text-2xl font-semibold tracking-tight text-balance">{question}</h1>
      <p className="max-w-[72ch] text-sm text-muted-foreground">{answer}</p>
    </div>
  );
}
