import type { SystemDatabase } from '../db/database';

const importKey = 'initial-projects-v1';

const lockedProjects = [
  ['ai-editing-automation', 'AI 편집 자동화 애플리케이션'],
  ['n8n-company-engine', 'n8n-company-engine-worktree 자동화 엔진'],
  ['malva-ai', 'Malva AI 영상 제작'],
  ['symphony', 'SYMPHONY 회사'],
  ['youtube-korean-adaptation', '영어 YouTube 한국어 각색 워크플로'],
  ['lee-relay', 'LEE RELAY'],
  ['github-100k-stars', 'GitHub 100,000 스타 저장소 목표'],
  ['ranking-shorts', 'YouTube 랭킹 쇼츠'],
  ['instagram-card-news', 'Instagram 카드뉴스 자동화'],
  ['jesus-youtube', '예수님 콘텐츠 YouTube 채널'],
  ['localhost-organizer', '로컬호스트 서버 정리 도구'],
  ['token-saver', 'TOKEN SAVER'],
  ['antistudy', 'ANTISTUDY 회사'],
  ['model-repair', 'AI 모델 수리 회사'],
  ['wall-staring', 'Instagram 벽보기 챌린지'],
  ['daily-small-project', '하루 하나 작은 프로젝트 게시'],
  ['personal-showcase', '개인 프로젝트 자랑 계정'],
] as const;

export function runInitialImport(systemDb: SystemDatabase): void {
  const alreadyImported = systemDb.db
    .prepare('SELECT 1 FROM schema_migrations WHERE version = ?')
    .get(importKey);
  if (alreadyImported) return;

  systemDb.withTransaction(() => {
    const now = Date.now();
    const insertProject = systemDb.db.prepare(`
      INSERT INTO projects(id, name, description, state, rank, ability_focus, created_at, updated_at)
      VALUES(?, ?, '', ?, 'E', ?, ?, ?)
    `);
    insertProject.run('all-ai-channel', '모두를 위한 AI', 'ACTIVE', 'youtube', now, now);
    for (const [id, name] of lockedProjects) {
      insertProject.run(id, name, 'LOCKED', null, now, now);
    }

    systemDb.db.prepare(`
      INSERT INTO quests(
        id, project_id, title, objective, state, reward_xp, youtube_xp, vibe_coding_xp,
        business_xp, deadline, created_at, updated_at
      ) VALUES(?, ?, ?, ?, 'OPEN', 25, 25, 0, 0, NULL, ?, ?)
    `).run(
      'free-unlimited-video-check',
      'all-ai-channel',
      '무료·무제한 AI 영상 생성기 검증',
      'ByteDance, Vheer, Hunyuan의 무료·무제한 주장을 직접 사용하고 출처로 검증한다.',
      now,
      now,
    );

    const insertStep = systemDb.db.prepare(`
      INSERT INTO quest_steps(id, quest_id, position, text, completed_at) VALUES(?, ?, ?, ?, NULL)
    `);
    insertStep.run('initial-step-hook', 'free-unlimited-video-check', 0, '강한 후킹 촬영');
    insertStep.run('initial-step-screen', 'free-unlimited-video-check', 1, '세 도구 실제 사용 화면 녹화');
    insertStep.run('initial-step-evidence', 'free-unlimited-video-check', 2, '출처와 제한 조건 정리');

    systemDb.db.prepare('INSERT INTO schema_migrations(version, applied_at) VALUES(?, ?)').run(importKey, now);
  });
}
