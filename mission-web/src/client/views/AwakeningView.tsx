import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { MissionApi, ReadyState } from '../api';
import { SystemPanel } from '../components/SystemPanel';

export function AwakeningView({ api, onReady }: { api: MissionApi; onReady: (state: ReadyState) => void }) {
  const [birthYear, setBirthYear] = useState('');
  const [permission, setPermission] = useState(false);
  const [codeName, setCodeName] = useState('');
  const [subject, setSubject] = useState('일반');
  const [goalText, setGoalText] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [profileCreated, setProfileCreated] = useState<Awaited<ReturnType<MissionApi['createProfile']>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const profile = profileCreated ?? await api.createProfile({
        birthYear: Number(birthYear),
        isAtLeast13: true,
        guardianPermission: permission as true,
        codeName,
        termsVersion: '2026-08-25'
      });
      setProfileCreated(profile);
      const mission = await api.createGoal({
        type: 'ASSIGNMENT', subject, goalText, deadline
      });
      onReady({ profile, mission });
    } catch (caught) {
      const code = typeof caught === 'object' && caught && 'code' in caught ? String(caught.code) : '';
      setError(code === 'AGE_OR_PERMISSION_REQUIRED'
        ? '현재 조건으로는 가입할 수 없습니다. 보호자와 함께 이용 조건을 확인해 주세요.'
        : '미션을 만들지 못했습니다. 입력을 확인하고 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="awakening-shell">
      <h1>MISSION</h1>
      <p>당신의 미션이 시작되었습니다.</p>
      <SystemPanel eyebrow="AWAKENING" title="첫 목표를 입력하세요">
        <form onSubmit={submit}>
          <label>출생연도<input required inputMode="numeric" value={birthYear} onChange={(event) => setBirthYear(event.target.value)} /></label>
          <label className="check"><input required type="checkbox" checked={permission} onChange={(event) => setPermission(event.target.checked)} />보호자와 이용 약관을 확인했고 이용 허락을 받았습니다.</label>
          <label>코드네임<input required minLength={2} maxLength={24} value={codeName} onChange={(event) => setCodeName(event.target.value)} /></label>
          <label>과목<input required value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
          <label>과제 또는 시험<input required minLength={3} value={goalText} onChange={(event) => setGoalText(event.target.value)} /></label>
          <label>마감일<input required type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></label>
          {error && <p ref={errorRef} tabIndex={-1} role="alert">{error}</p>}
          <button disabled={submitting} type="submit">{submitting ? '생성 중…' : '미션 생성'}</button>
        </form>
      </SystemPanel>
    </main>
  );
}
