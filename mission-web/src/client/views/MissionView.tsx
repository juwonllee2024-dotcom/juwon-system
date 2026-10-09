import { useState, type FormEvent } from 'react';
import type { MissionDto, ProfileDto } from '../../domain/contracts';
import type { ProgressDto } from '../../domain/progression';
import type { MissionApi } from '../api';
import { AbilityBar } from '../components/AbilityBar';
import { SystemPanel } from '../components/SystemPanel';

const emptyProgress: ProgressDto = {
  totalXp: 0, playerLevel: 1, abilities: { focus: 0, knowledge: 0, execution: 0 }, lastAwardXp: 0, newAward: false
};

export function MissionView({ api, profile, mission: initialMission, initialProgress = emptyProgress }: {
  api: MissionApi; profile: ProfileDto; mission: MissionDto; initialProgress?: ProgressDto;
}) {
  const [mission, setMission] = useState(initialMission);
  const [progress, setProgress] = useState(initialProgress);
  const [helpOpen, setHelpOpen] = useState(false);
  const [help, setHelp] = useState('');
  const [summary, setSummary] = useState('');
  const [verification, setVerification] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [error, setError] = useState('');

  async function start() {
    try { setMission(await api.startMission(mission.id)); }
    catch { setError('미션을 시작하지 못했습니다. 다시 시도해 주세요.'); }
  }

  async function requestHelp(action: 'HINT' | 'EXPLAIN' | 'SPLIT') {
    try {
      const response = await api.coachMission(mission.id, { action });
      setHelp(response.kind === 'MESSAGE' ? response.text : response.steps.map((step) => step.text).join(' → '));
    } catch { setError('도움을 불러오지 못했습니다.'); }
  }

  async function submitEvidence(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const next = await api.completeMission(mission.id, { summary, verification });
      setProgress(next);
      if (next.newAward) setAnnouncement(`+${next.lastAwardXp} XP`);
    } catch { setError('증거를 더 구체적으로 적어 주세요.'); }
  }

  const active = mission.state === 'ACTIVE';
  return (
    <main className="mission-shell">
      <header className="status-line"><span>{profile.codeName}</span><strong>LEVEL {progress.playerLevel}</strong></header>
      <SystemPanel eyebrow="CURRENT MISSION" title={mission.title}>
        <p className="objective">{mission.objective}</p>
        <p>{mission.completionCondition}</p>
        <div className="mission-meta"><span>{mission.estimatedMinutes}분</span><span>+{mission.rewardXp} XP</span></div>
        {mission.state === 'READY' && <button className="primary" onClick={start}>미션 시작</button>}
        {active && <ol>{mission.steps.map((step) => <li key={step.id}>{step.text}</li>)}</ol>}
      </SystemPanel>

      <button className="secondary" onClick={() => setHelpOpen((open) => !open)}>도움 요청</button>
      {helpOpen && <section className="help-panel" aria-label="미션 도움">
        <button onClick={() => requestHelp('HINT')}>힌트</button>
        <button onClick={() => requestHelp('EXPLAIN')}>설명</button>
        <button onClick={() => requestHelp('SPLIT')}>작게 쪼개기</button>
        {help && <p>{help}</p>}
      </section>}

      {active && <form className="evidence" onSubmit={submitEvidence}>
        <label>완료한 내용<textarea required minLength={10} value={summary} onChange={(event) => setSummary(event.target.value)} /></label>
        <label>확인 방법<textarea required minLength={3} value={verification} onChange={(event) => setVerification(event.target.value)} /></label>
        <button className="primary" type="submit">증거 제출</button>
      </form>}
      {error && <p role="alert">{error}</p>}
      <div className="award" role="status" aria-live="polite">{announcement}</div>
      <section className="abilities" aria-label="능력치">
        <AbilityBar label="FOCUS" value={progress.abilities.focus} />
        <AbilityBar label="KNOWLEDGE" value={progress.abilities.knowledge} />
        <AbilityBar label="EXECUTION" value={progress.abilities.execution} />
      </section>
      <p className="total-xp">TOTAL XP {progress.totalXp}</p>
    </main>
  );
}
