export interface StatCardProps {
  label: string;
  level: number;
  xp: number;
}

export function StatCard({ label, level, xp }: StatCardProps) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>LV. {level}</strong>
      <small>{xp} XP</small>
    </article>
  );
}
