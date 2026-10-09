import { describe, expect, it } from 'vitest';
import { openDatabase } from '../../src/main/db/database';
import { createProjectService } from '../../src/main/services/projects';
import { createQuestService } from '../../src/main/services/quests';

describe('quest completion', () => {
  it('awards declared YouTube XP once for reviewed video evidence', async () => {
    const db = openDatabase(':memory:');
    createProjectService(db, () => 1000).create({ id: 'channel', name: '모두를 위한 AI', state: 'ACTIVE', rank: 'E' });
    const quests = createQuestService(db, () => 1000, async () => 'a'.repeat(64));
    quests.create({
      id: 'hook', projectId: 'channel', title: '후킹 촬영', objective: 'usable hook video',
      rewardXp: 25, allocation: { youtube: 25, vibeCoding: 0, business: 0 }, steps: ['record', 'submit'],
    });

    await quests.submitEvidence('hook', {
      type: 'FILE',
      locator: 'C:\\video\\hook.mp4',
      metadata: { durationSeconds: 24 },
    });
    expect(quests.review('hook', { decision: 'complete', reason: 'video is playable', actor: 'codex' }))
      .toMatchObject({ ok: true });
    expect(quests.review('hook', { decision: 'complete', reason: 'duplicate', actor: 'codex' }))
      .toMatchObject({ ok: false, code: 'QUEST_ALREADY_COMPLETED' });

    expect(db.db.prepare("SELECT youtube_xp, vibe_coding_xp, business_xp FROM ability_progress WHERE id = 1").get())
      .toEqual({ youtube_xp: 25, vibe_coding_xp: 0, business_xp: 0 });
    expect(db.db.prepare('SELECT COUNT(*) AS count FROM xp_ledger').get()).toEqual({ count: 1 });
    db.close();
  });
});
