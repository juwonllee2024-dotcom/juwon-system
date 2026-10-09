import { useState } from 'react';
import type { JuwonSystemApi } from './system-api';
import { CommandView } from './views/CommandView';
import { QuestView } from './views/QuestView';
import { StatusView } from './views/StatusView';
import './styles/system.css';

type View = 'status' | 'quest' | 'command';

function browserApi(): JuwonSystemApi {
  return window.juwonSystem;
}

export interface AppProps {
  api?: JuwonSystemApi;
}

export function App({ api = browserApi() }: AppProps) {
  const [view, setView] = useState<View>('status');
  const [questId, setQuestId] = useState<string | null>(null);

  if (view === 'quest' && questId) {
    return <QuestView api={api} questId={questId} onBack={() => setView('status')} />;
  }
  if (view === 'command') {
    return <CommandView api={api} onBack={() => setView('status')} />;
  }
  return (
    <StatusView
      api={api}
      onOpenQuest={(id) => {
        setQuestId(id);
        setView('quest');
      }}
      onOpenCommand={() => setView('command')}
    />
  );
}
