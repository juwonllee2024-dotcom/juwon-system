import { afterEach, expect, test } from 'vitest';
import { cleanupE2eDirectories, createE2eDataDir, fixturePath, launchPackagedCore } from './helpers/core-driver';

afterEach(cleanupE2eDirectories);

test('A to B evidence-backed progression survives restart', async () => {
  const testDataDir = await createE2eDataDir();
  const app = await launchPackagedCore({ dataDir: testDataDir });
  await expect(app.statusHeading()).resolves.toContain('PLAYER STATUS');
  await app.openCurrentQuest();
  await expect(app.questHeading()).resolves.toContain('QUEST DETAIL');
  await app.submitEvidence(fixturePath('hook.mp4'));
  await app.completePendingReviewForTest('video is playable');
  await expect(app.youtubeXp()).resolves.toBe(25);
  await app.restart();
  await expect(app.youtubeXp()).resolves.toBe(25);
  await app.close();
});
