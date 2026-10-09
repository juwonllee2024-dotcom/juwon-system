import { useEffect, useState } from 'react';
import type { BootstrapDto } from '../domain/contracts';
import { browserApi, type MissionApi, type ReadyState } from './api';
import { AwakeningView } from './views/AwakeningView';
import { MissionView } from './views/MissionView';

const emptyBootstrap: BootstrapDto = {
  profile: null, mission: null,
  progress: { totalXp: 0, playerLevel: 1, abilities: { focus: 0, knowledge: 0, execution: 0 }, lastAwardXp: 0, newAward: false }
};

export function App({ api = browserApi }: { api?: MissionApi } = {}) {
  const [ready, setReady] = useState<ReadyState | null>(null);
  const [bootstrap, setBootstrap] = useState<BootstrapDto | null>(null);

  useEffect(() => {
    let active = true;
    api.getBootstrap().then((data) => { if (active) setBootstrap(data); }).catch(() => { if (active) setBootstrap(emptyBootstrap); });
    return () => { active = false; };
  }, [api]);

  if (ready) return <MissionView api={api} profile={ready.profile} mission={ready.mission} />;
  if (!bootstrap) return <main className="awakening-shell"><h1>MISSION</h1><p>당신의 미션이 시작되었습니다.</p><p>시스템 동기화 중…</p></main>;
  if (!bootstrap.profile) return <AwakeningView api={api} onReady={setReady} />;
  if (bootstrap.mission) return <MissionView api={api} profile={bootstrap.profile} mission={bootstrap.mission} initialProgress={bootstrap.progress} />;
  return <main className="mission-shell"><header className="status-line"><span>{bootstrap.profile.codeName}</span><strong>LEVEL {bootstrap.progress.playerLevel}</strong></header><h1>MISSION</h1><p>현재 미션을 완료했습니다.</p><p className="total-xp">TOTAL XP {bootstrap.progress.totalXp}</p></main>;
}
