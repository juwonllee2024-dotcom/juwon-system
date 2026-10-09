import type { QuestDto } from '../../main/ipc/contracts';

export interface QuestCardProps {
  quest: QuestDto;
  onOpen(): void;
}

export function QuestCard({ quest, onOpen }: QuestCardProps) {
  return (
    <button className="quest-card" type="button" onClick={onOpen}>
      <span className="eyebrow">CURRENT QUEST</span>
      <strong>{quest.title}</strong>
      <span>{quest.objective}</span>
      <span className="reward">+{quest.rewardXp} XP</span>
    </button>
  );
}
