/**
 * SCHEMA NORMALIZADO - Fase 2
 * Substitui o schema genérico por tabelas específicas
 *
 * Execução:
 * npx wrangler d1 execute DB --local --file db/schema-normalized.sql
 */

-- ============================================================================
-- TABELAS NORMALIZADAS
-- ============================================================================

-- USUÁRIOS (novo)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- CLIENTES (normalizado)
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  document TEXT,
  contract TEXT,
  sector TEXT,
  first_activity TEXT,
  last_activity TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(owner, id),
  FOREIGN KEY (owner) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_clients_owner ON clients(owner);
CREATE INDEX IF NOT EXISTS idx_clients_document ON clients(document);

-- CONTATOS (normalizado)
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  owner TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  region TEXT,
  city TEXT,
  commercial_phone TEXT,
  contact_source TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(client_id, owner),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (owner) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_contacts_client ON contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner);

-- DADOS MENSAIS (normalizado)
CREATE TABLE IF NOT EXISTS monthly_data (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  month TEXT NOT NULL,
  items INTEGER NOT NULL DEFAULT 0,
  cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(client_id, month),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
CREATE INDEX IF NOT EXISTS idx_monthly_data_client ON monthly_data(client_id);
CREATE INDEX IF NOT EXISTS idx_monthly_data_month ON monthly_data(month);

-- SERVIÇOS (novo)
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  monthly_data_id TEXT NOT NULL,
  name TEXT NOT NULL,
  items INTEGER NOT NULL DEFAULT 0,
  cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (monthly_data_id) REFERENCES monthly_data(id)
);
CREATE INDEX IF NOT EXISTS idx_services_monthly ON services(monthly_data_id);

-- ATIVIDADES (normalizado)
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  client_id TEXT NOT NULL,
  note TEXT NOT NULL,
  due_date TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner) REFERENCES users(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
CREATE INDEX IF NOT EXISTS idx_activities_client ON activities(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_owner ON activities(owner);
CREATE INDEX IF NOT EXISTS idx_activities_due ON activities(due_date);

-- PÚBLICOS (novo)
CREATE TABLE IF NOT EXISTS audiences (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  client_ids TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_audiences_owner ON audiences(owner);

-- AGENDAMENTOS (novo)
CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  audience_id TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_for TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner) REFERENCES users(id),
  FOREIGN KEY (audience_id) REFERENCES audiences(id)
);
CREATE INDEX IF NOT EXISTS idx_schedules_owner ON schedules(owner);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);

-- ============================================================================
-- MANTER COMPATIBILIDADE (DEPRECADO)
-- ============================================================================

-- Tabelas antigas mantidas para compatibilidade durante migração
-- Será removido em v3.0

-- CREATE TABLE records (owner, kind, id, payload, updated) - JÁ EXISTE
-- CREATE TABLE imports (id, owner, metadata, created) - JÁ EXISTE
-- CREATE TABLE imported_clients (batch, id, payload) - JÁ EXISTE
-- CREATE TABLE audit_log (...) - JÁ EXISTE (Fase 1)

-- ============================================================================
-- VIEWS (OPCIONAL)
-- ============================================================================

-- Vista para clientes ativos
CREATE VIEW IF NOT EXISTS active_clients AS
SELECT
  c.id,
  c.owner,
  c.name,
  c.document,
  c.last_activity,
  COUNT(DISTINCT m.month) as activity_months,
  COALESCE(SUM(m.cents), 0) as total_cents
FROM clients c
LEFT JOIN monthly_data m ON c.id = m.client_id
WHERE c.last_activity IS NOT NULL
GROUP BY c.id, c.owner, c.name, c.document, c.last_activity;

-- Vista para atividades pendentes
CREATE VIEW IF NOT EXISTS pending_activities AS
SELECT
  a.id,
  a.client_id,
  c.name as client_name,
  a.note,
  a.due_date,
  a.owner
FROM activities a
JOIN clients c ON a.client_id = c.id
WHERE a.completed_at IS NULL
ORDER BY a.due_date ASC;

-- ============================================================================
-- TRIGGERS (OPCIONAL)
-- ============================================================================

-- Atualizar updated_at automaticamente
CREATE TRIGGER IF NOT EXISTS update_clients_timestamp
AFTER UPDATE ON clients
BEGIN
  UPDATE clients SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_contacts_timestamp
AFTER UPDATE ON contacts
BEGIN
  UPDATE contacts SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_activities_timestamp
AFTER UPDATE ON activities
BEGIN
  UPDATE activities SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- DADOS INICIAIS (OPCIONAL)
-- ============================================================================

-- Inserir usuário padrão (substituir com dados reais)
INSERT OR IGNORE INTO users (id, email, created_at, updated_at)
VALUES ('demo-user', 'demo@example.com', datetime('now'), datetime('now'));
