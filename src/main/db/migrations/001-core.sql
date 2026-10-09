CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 200),
  description TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL CHECK(state IN ('LOCKED', 'ACTIVE', 'SHADOW', 'CLEARED')),
  rank TEXT NOT NULL CHECK(rank IN ('E', 'D', 'C', 'B', 'A', 'S')),
  ability_focus TEXT CHECK(ability_focus IS NULL OR ability_focus IN ('youtube', 'vibeCoding', 'business')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX one_active_project ON projects(state) WHERE state = 'ACTIVE';
CREATE UNIQUE INDEX one_shadow_project ON projects(state) WHERE state = 'SHADOW';

CREATE TABLE quests (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
  objective TEXT NOT NULL CHECK(length(objective) BETWEEN 1 AND 2000),
  state TEXT NOT NULL CHECK(state IN ('OPEN', 'EVIDENCE_PENDING', 'REVISION_REQUIRED', 'COMPLETED', 'REJECTED')),
  reward_xp INTEGER NOT NULL CHECK(reward_xp > 0),
  youtube_xp INTEGER NOT NULL CHECK(youtube_xp >= 0),
  vibe_coding_xp INTEGER NOT NULL CHECK(vibe_coding_xp >= 0),
  business_xp INTEGER NOT NULL CHECK(business_xp >= 0),
  deadline INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK(youtube_xp + vibe_coding_xp + business_xp = reward_xp)
);

CREATE TABLE quest_steps (
  id TEXT PRIMARY KEY,
  quest_id TEXT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK(position >= 0),
  text TEXT NOT NULL CHECK(length(text) BETWEEN 1 AND 500),
  completed_at INTEGER,
  UNIQUE(quest_id, position)
);

CREATE TABLE evidence (
  id TEXT PRIMARY KEY,
  quest_id TEXT NOT NULL REFERENCES quests(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK(type IN ('FILE', 'URL', 'GIT_COMMIT', 'SCREENSHOT', 'METRIC')),
  normalized_locator TEXT NOT NULL CHECK(length(normalized_locator) BETWEEN 1 AND 2048),
  content_hash TEXT NOT NULL CHECK(length(content_hash) = 64),
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(metadata_json)),
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX one_evidence_locator_hash ON evidence(quest_id, normalized_locator, content_hash);

CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  quest_id TEXT NOT NULL REFERENCES quests(id) ON DELETE RESTRICT,
  evidence_set_hash TEXT NOT NULL CHECK(length(evidence_set_hash) = 64),
  decision TEXT NOT NULL CHECK(decision IN ('complete', 'revise', 'reject')),
  reason TEXT NOT NULL CHECK(length(reason) BETWEEN 1 AND 1000),
  actor TEXT NOT NULL CHECK(actor IN ('codex', 'user')),
  created_at INTEGER NOT NULL
);

CREATE TABLE xp_ledger (
  id TEXT PRIMARY KEY,
  quest_id TEXT NOT NULL REFERENCES quests(id) ON DELETE RESTRICT,
  evidence_set_hash TEXT NOT NULL CHECK(length(evidence_set_hash) = 64),
  youtube_xp INTEGER NOT NULL CHECK(youtube_xp >= 0),
  vibe_coding_xp INTEGER NOT NULL CHECK(vibe_coding_xp >= 0),
  business_xp INTEGER NOT NULL CHECK(business_xp >= 0),
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX one_xp_award_per_evidence_set ON xp_ledger(quest_id, evidence_set_hash);

CREATE TABLE ability_progress (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  youtube_xp INTEGER NOT NULL DEFAULT 0 CHECK(youtube_xp >= 0),
  youtube_level INTEGER NOT NULL DEFAULT 1 CHECK(youtube_level >= 1),
  vibe_coding_xp INTEGER NOT NULL DEFAULT 0 CHECK(vibe_coding_xp >= 0),
  vibe_coding_level INTEGER NOT NULL DEFAULT 1 CHECK(vibe_coding_level >= 1),
  business_xp INTEGER NOT NULL DEFAULT 0 CHECK(business_xp >= 0),
  business_level INTEGER NOT NULL DEFAULT 1 CHECK(business_level >= 1),
  updated_at INTEGER NOT NULL
);

INSERT INTO ability_progress(id, updated_at) VALUES(1, 0);

CREATE TABLE inventory_items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  quest_id TEXT REFERENCES quests(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL CHECK(kind IN ('OUTPUT', 'SHADOW_AUTOMATION')),
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 200),
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(metadata_json)),
  created_at INTEGER NOT NULL
);

CREATE TABLE rank_events (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  previous_rank TEXT NOT NULL CHECK(previous_rank IN ('E', 'D', 'C', 'B', 'A', 'S')),
  next_rank TEXT NOT NULL CHECK(next_rank IN ('E', 'D', 'C', 'B', 'A', 'S')),
  evidence_id TEXT NOT NULL REFERENCES evidence(id) ON DELETE RESTRICT,
  criteria_version TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE controller_allowlist (
  action_id TEXT PRIMARY KEY,
  rule_json TEXT NOT NULL CHECK(json_valid(rule_json)),
  enabled INTEGER NOT NULL CHECK(enabled IN (0, 1)),
  updated_at INTEGER NOT NULL
);

CREATE TABLE blocked_domains (
  pattern TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL CHECK(enabled IN (0, 1)),
  updated_at INTEGER NOT NULL
);

CREATE TABLE focus_sessions (
  id TEXT PRIMARY KEY,
  quest_id TEXT NOT NULL REFERENCES quests(id) ON DELETE RESTRICT,
  started_at INTEGER NOT NULL,
  planned_end_at INTEGER NOT NULL,
  actual_end_at INTEGER,
  state TEXT NOT NULL CHECK(state IN ('ACTIVE', 'COMPLETED', 'OVERRIDDEN', 'TIMED_OUT')),
  override_reason TEXT
);

CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL CHECK(actor IN ('system', 'codex', 'user')),
  command TEXT NOT NULL CHECK(length(command) BETWEEN 1 AND 200),
  input_summary_json TEXT NOT NULL CHECK(json_valid(input_summary_json)),
  result_json TEXT NOT NULL CHECK(json_valid(result_json)),
  created_at INTEGER NOT NULL
);
