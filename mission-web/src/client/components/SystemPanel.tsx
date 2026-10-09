import type { PropsWithChildren } from 'react';

export function SystemPanel({ eyebrow, title, children }: PropsWithChildren<{ eyebrow: string; title: string }>) {
  return (
    <section className="system-panel">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
