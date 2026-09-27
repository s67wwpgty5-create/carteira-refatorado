-- Add audit_log table for security and compliance
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_id TEXT,
  resource_kind TEXT,
  timestamp TEXT NOT NULL,
  changes TEXT,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS audit_log_owner_timestamp ON audit_log(owner, timestamp);
CREATE INDEX IF NOT EXISTS audit_log_user_id ON audit_log(user_id);
