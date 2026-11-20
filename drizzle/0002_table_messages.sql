CREATE TABLE table_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_id TEXT NOT NULL REFERENCES score_tables(id),
  request_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at INTEGER NOT NULL,
  UNIQUE (table_id, request_id)
);
--> statement-breakpoint
CREATE INDEX table_messages_by_table ON table_messages (table_id, id);
