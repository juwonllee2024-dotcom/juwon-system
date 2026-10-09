export function AbilityBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="ability">
      <span>{label}</span><strong>{value}</strong>
      <div className="ability-track"><i style={{ width: `${Math.min(100, value * 5)}%` }} /></div>
    </div>
  );
}
