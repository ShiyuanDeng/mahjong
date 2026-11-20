CREATE TABLE score_tables (
  id TEXT PRIMARY KEY NOT NULL,
  editor_hash TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  stamp TEXT NOT NULL,
  snapshot TEXT NOT NULL
);
