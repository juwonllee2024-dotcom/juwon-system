import { useEffect, useState } from 'react';
import type { SystemStatus } from '../../main/ipc/contracts';
import { QuestCard } from '../components/QuestCard';
import { StatCard } from '../components/StatCard';
import type { JuwonSystemApi } from '../system-api';

export interface StatusViewProps {
  api: JuwonSystemApi;
  onOpenQuest(id: string): void;
  onOpenCommand(): void;
}

export function StatusView({ api, onOpenQuest, onOpenCommand }: StatusViewProps) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void api.getStatus().then((response) => {
      if (!active) return;
      if (response.ok) setStatus(response.value);
      else setError(response.message);
    });
    return () => { active = false; };
  }, [api]);

  return (
    <main className="system-shell">
      <header className="system-header">
        <div>
          <span className="eyebrow">JUWON SYSTEM // A</span>
          <h1>PLAYER STATUS</h1>
        </div>
        <button className="secondary" type="button" onClick={onOpenCommand}>PROJECTS</button>
      </header>
      {error && <p role="alert">{error}</p>}
      {!status && !error && <p role="status">불러오는 중…</p>}
      {status && (
        <>
          <section className="hero-panel">
            <span>PLAYER LEVEL</span>
            <strong>{String(status.playerLevel).padStart(2, '0')}</strong>
            <small>{status.playerXp} TOTAL XP</small>
          </section>
          <section className="stats-grid" aria-label="능력치">
            <StatCard label="YOUTUBE" {...status.abilities.youtube} />
            <StatCard label="VIBE CODING" {...status.abilities.vibeCoding} />
            <StatCard label="BUSINESS" {...status.abilities.business} />
          </section>
          <section className="gate-panel">
            <span className="eyebrow">ACTIVE GATE</span>
            <h2>{status.activeGate?.name ?? '활성 프로젝트 없음'}</h2>
            {status.activeGate && <span className="rank">RANK {status.activeGate.rank}</span>}
          </section>
          {status.currentQuest ? (
            <QuestCard quest={status.currentQuest} onOpen={() => onOpenQuest(status.currentQuest!.id)} />
          ) : (
            <p className="empty-panel">현재 퀘스트가 없습니다.</p>
          )}
        </>
      )}
    </main>
  );
}
