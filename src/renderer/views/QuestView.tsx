import { useEffect, useState } from 'react';
import type { QuestDto } from '../../main/ipc/contracts';
import { EvidenceForm } from '../components/EvidenceForm';
import type { JuwonSystemApi } from '../system-api';

export interface QuestViewProps {
  api: JuwonSystemApi;
  questId: string;
  onBack(): void;
}

export function QuestView({ api, questId, onBack }: QuestViewProps) {
  const [quest, setQuest] = useState<QuestDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void api.getQuest(questId).then((response) => {
      if (!active) return;
      if (response.ok) setQuest(response.value);
      else setError(response.message);
    });
    return () => { active = false; };
  }, [api, questId]);

  return (
    <main className="system-shell">
      <header className="system-header">
        <div><span className="eyebrow">JUWON SYSTEM // B</span><h1>QUEST DETAIL</h1></div>
        <button className="secondary" type="button" onClick={onBack}>STATUS</button>
      </header>
      {error && <p role="alert">{error}</p>}
      {!quest && !error && <p role="status">불러오는 중…</p>}
      {quest && (
        <>
          <section className="quest-detail">
            <span className="state-chip">{quest.state}</span>
            <h2>{quest.title}</h2>
            <p>{quest.objective}</p>
            <ol>{quest.steps.map((step) => <li key={step.id}>{step.text}</li>)}</ol>
          </section>
          <section className="reward-panel">
            <span>REWARD</span><strong>+{quest.rewardXp} XP</strong>
            <small>YOUTUBE {quest.allocation.youtube} · VIBE CODING {quest.allocation.vibeCoding} · BUSINESS {quest.allocation.business}</small>
          </section>
          <EvidenceForm questId={quest.id} api={api} />
        </>
      )}
    </main>
  );
}
