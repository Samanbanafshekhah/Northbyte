ALTER TABLE events ADD COLUMN message_id INTEGER REFERENCES messages(id);
