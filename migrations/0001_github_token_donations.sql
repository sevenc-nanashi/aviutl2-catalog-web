CREATE TABLE github_token_donations (
  github_user_id INTEGER PRIMARY KEY,
  github_login TEXT NOT NULL,
  token_ciphertext TEXT NOT NULL,
  token_iv TEXT NOT NULL,
  publish_login INTEGER NOT NULL CHECK (publish_login IN (0, 1)),
  available_at INTEGER NOT NULL DEFAULT 0,
  rate_limit_remaining INTEGER,
  rate_limit_reset_at INTEGER,
  last_used_at INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX github_token_donations_availability
ON github_token_donations (available_at, last_used_at);

CREATE INDEX github_token_donations_public_logins
ON github_token_donations (publish_login, github_login COLLATE NOCASE);
