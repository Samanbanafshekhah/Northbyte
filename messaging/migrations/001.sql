PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL,
 password TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('super_admin','admin','team_member','client')), created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
 token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 csrf TEXT NOT NULL, expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);
CREATE TABLE IF NOT EXISTS projects (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL,
 status TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS conversations (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, project_id TEXT UNIQUE REFERENCES projects(id),
 client_id TEXT NOT NULL REFERENCES users(id), status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','pending','resolved','closed')),
 assigned_to TEXT REFERENCES users(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS conversations_client ON conversations(client_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS conversations_assignee ON conversations(assigned_to,status,updated_at DESC);
CREATE TABLE IF NOT EXISTS conversation_participants (
 conversation_id TEXT NOT NULL REFERENCES conversations(id), user_id TEXT NOT NULL REFERENCES users(id),
 last_read_message_id INTEGER NOT NULL DEFAULT 0, muted INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(conversation_id,user_id)
);
CREATE TABLE IF NOT EXISTS messages (
 id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id TEXT NOT NULL REFERENCES conversations(id),
 sender_id TEXT NOT NULL REFERENCES users(id), body TEXT NOT NULL, reply_to_id INTEGER REFERENCES messages(id),
 is_internal INTEGER NOT NULL DEFAULT 0, edited_at TEXT, deleted_at TEXT, created_at TEXT NOT NULL,
 client_nonce TEXT NOT NULL, UNIQUE(sender_id,client_nonce)
);
CREATE INDEX IF NOT EXISTS messages_history ON messages(conversation_id,id DESC);
CREATE TABLE IF NOT EXISTS message_attachments (
 id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations(id), uploader_id TEXT NOT NULL REFERENCES users(id),
 message_id INTEGER REFERENCES messages(id), original_filename TEXT NOT NULL, mime_type TEXT NOT NULL,
 file_size INTEGER NOT NULL, data BLOB NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS attachments_message ON message_attachments(message_id);
CREATE TABLE IF NOT EXISTS message_reactions (
 message_id INTEGER NOT NULL REFERENCES messages(id), user_id TEXT NOT NULL REFERENCES users(id), emoji TEXT NOT NULL,
 PRIMARY KEY(message_id,user_id,emoji)
);
CREATE TABLE IF NOT EXISTS events (
 id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id TEXT NOT NULL REFERENCES conversations(id),
 type TEXT NOT NULL, internal INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS events_conversation ON events(conversation_id,id);
CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
