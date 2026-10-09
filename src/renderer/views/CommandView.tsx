import { useEffect, useState } from 'react';
import type { ProjectDto } from '../../main/ipc/contracts';
import type { JuwonSystemApi } from '../system-api';

const states = ['ACTIVE', 'SHADOW', 'LOCKED', 'CLEARED'] as const;

export interface CommandViewProps {
  api: JuwonSystemApi;
  onBack(): void;
}

export function CommandView({ api, onBack }: CommandViewProps) {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void api.listProjects().then((response) => {
      if (!active) return;
      if (response.ok) setProjects(response.value);
      else setError(response.message);
    });
    return () => { active = false; };
  }, [api]);

  return (
    <main className="system-shell command-view">
      <header className="system-header">
        <div><span className="eyebrow">JUWON SYSTEM // C</span><h1>PROJECT COMMAND</h1></div>
        <button className="secondary" type="button" onClick={onBack}>STATUS</button>
      </header>
      {error && <p role="alert">{error}</p>}
      <div className="project-columns">
        {states.map((state) => (
          <section className="project-group" key={state}>
            <h2>{state}</h2>
            {projects.filter((project) => project.state === state).map((project) => (
              <article key={project.id}>
                <strong>{project.name}</strong><span>RANK {project.rank}</span>
              </article>
            ))}
            {!projects.some((project) => project.state === state) && <p>—</p>}
          </section>
        ))}
      </div>
    </main>
  );
}
