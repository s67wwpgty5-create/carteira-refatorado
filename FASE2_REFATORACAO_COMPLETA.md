# Fase 2: Refatoração Completa

**Status:** ✅ IMPLEMENTAÇÃO EM ANDAMENTO  
**Duração:** 2-3 semanas  
**Objetivo:** Melhorar manutenibilidade, testes e escalabilidade

---

## 📊 Componentes a Decompor

### Antes: 1 Componente Monolítico
- `app/portfolio.tsx` - ~1200 linhas, tudo junto

### Depois: 10 Componentes Especializados

```
components/portfolio/
├── PortfolioLayout.tsx           ✅ CRIADO
├── PortfolioFilters.tsx          ✅ CRIADO
├── PortfolioTable.tsx            ⏳ A criar
├── PortfolioTableRow.tsx         ⏳ A criar
├── ClientSheet.tsx               ⏳ A criar
├── ContactForm.tsx               ⏳ A criar
├── ActivitySection.tsx           ⏳ A criar
├── BatchWhatsApp.tsx             ⏳ A criar
├── EmailDialog.tsx               ⏳ A criar
├── ABCCurveSection.tsx           ⏳ A criar
├── StatsBar.tsx                  ⏳ A criar
└── SearchBar.tsx                 ⏳ A criar

hooks/
├── usePortfolioState.ts          ⏳ A criar
├── usePortfolioFilters.ts        ⏳ A criar
├── useClientSheet.ts             ⏳ A criar
└── useActivities.ts              ⏳ A criar

types/
├── portfolio.ts                  ⏳ A criar
└── contact.ts                    ⏳ A criar
```

---

## 🗄️ Normalização do Banco de Dados

### Schema Atual (Genérico)
```sql
records (owner, kind, id, payload: JSON, updated)
imports (id, owner, metadata: JSON, created)
imported_clients (batch, id, payload: JSON)
audit_log (id, owner, user_id, action, ...)
```

### Schema Normalizado (Novo)

```sql
-- USUÁRIOS
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL
);

-- CLIENTES
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  document TEXT NOT NULL,
  contract TEXT,
  sector TEXT,
  first_activity DATE,
  last_activity DATE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(owner, document)
);
CREATE INDEX idx_clients_owner ON clients(owner);
CREATE INDEX idx_clients_document ON clients(document);

-- CONTATOS
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  owner TEXT NOT NULL REFERENCES users(id),
  phone TEXT,
  email TEXT,
  region TEXT,
  city TEXT,
  commercial_phone TEXT,
  contact_source TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(client_id, owner)
);
CREATE INDEX idx_contacts_client ON contacts(client_id);
Create INDEX idx_contacts_owner ON contacts(owner);

-- DADOS MENSAIS
CREATE TABLE monthly_data (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- YYYY-MM
  items INTEGER NOT NULL DEFAULT 0,
  cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(client_id, month)
);
Create INDEX idx_monthly_data_client ON monthly_data(client_id);
CREATE INDEX idx_monthly_data_month ON monthly_data(month);

-- SERVIÇOS
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  monthly_data_id TEXT NOT NULL REFERENCES monthly_data(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  items INTEGER NOT NULL DEFAULT 0,
  cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_services_monthly ON services(monthly_data_id);

-- ATIVIDADES
CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL REFERENCES users(id),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  due_date DATE,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_activities_client ON activities(client_id);
CREATE INDEX idx_activities_owner ON activities(owner);
CREATE INDEX idx_activities_due ON activities(due_date);

-- PÚBLICOS
CREATE TABLE audiences (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  client_ids TEXT NOT NULL, -- JSON array
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_audiences_owner ON audiences(owner);

-- AGENDAMENTOS
CREATE TABLE schedules (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL REFERENCES users(id),
  audience_id TEXT NOT NULL REFERENCES audiences(id),
  message TEXT NOT NULL,
  status TEXT NOT NULL, -- pending, sent, failed
  scheduled_for TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_schedules_owner ON schedules(owner);
CREATE INDEX idx_schedules_status ON schedules(status);

-- MANTER COMPATIBILITY (deprecado)
records (owner, kind, id, payload: JSON, updated)
imports (id, owner, metadata: JSON, created)
imported_clients (batch, id, payload: JSON)
audit_log (...)
```

---

## 🧪 Testes a Implementar

### Tests Structure
```
tests/
├── unit/
│   ├── document-validation.test.ts
│   ├── audit-log.test.ts
│   ├── rate-limit.test.ts
│   ├── portfolio.test.ts
│   └── filters.test.ts
├── integration/
│   ├── api.test.ts
│   └── database.test.ts
└── e2e/
    └── portfolio-flow.test.ts
```

### Test Coverage Targets
- Unit tests: 70%+ coverage
- Integration tests: APIs
- E2E tests: Critical flows (import, filter, export)

---

## 📋 Tarefas de Implementação

### Semana 1: Decomposição de Componentes

- [ ] **Dia 1-2: Criar componentes básicos**
  - `PortfolioLayout.tsx` ✅ PRONTO
  - `PortfolioFilters.tsx` ✅ PRONTO
  - `PortfolioTable.tsx`
  - `PortfolioTableRow.tsx`

- [ ] **Dia 3: Diálogos e sheets**
  - `ClientSheet.tsx`
  - `BatchWhatsApp.tsx`
  - `EmailDialog.tsx`

- [ ] **Dia 4-5: Seções e helpers**
  - `ActivitySection.tsx`
  - `ABCCurveSection.tsx`
  - `StatsBar.tsx`
  - `SearchBar.tsx`
  - `ContactForm.tsx`

- [ ] **Dia 6-7: Custom hooks**
  - `usePortfolioState.ts`
  - `usePortfolioFilters.ts`
  - `useClientSheet.ts`
  - `useActivities.ts`

### Semana 2: Refatoração de Banco

- [ ] **Dia 1-2: Criar novo schema**
  - Migração SQL
  - Índices
  - Foreign keys

- [ ] **Dia 3-4: Migração de dados**
  - Script de migração
  - Validação de integridade
  - Rollback plan

- [ ] **Dia 5-6: Atualizar APIs**
  - Refatorar queries
  - Validar performance
  - Testes de compatibilidade

- [ ] **Dia 7: Cleanup**
  - Deprecar schema antigo
  - Documentar migration guide

### Semana 3: Testes e Documentação

- [ ] **Dia 1-2: Testes unitários**
  - Componentes
  - Hooks
  - Utilities

- [ ] **Dia 3-4: Testes integração**
  - APIs
  - Database
  - Validações

- [ ] **Dia 5-6: Testes E2E**
  - Fluxo de importação
  - Fluxo de filtros
  - Fluxo de export

- [ ] **Dia 7: Documentação**
  - Architecture docs
  - Component docs
  - Migration guide

---

## 🏗️ Arquitetura Refatorada

### Estrutura de Pastas
```
carteira-refatorado/
├── components/
│   ├── portfolio/        (novos subcomponentes)
│   └── ui/              (existente)
├── hooks/               (custom hooks)
├── types/               (type definitions)
├── lib/
│   ├── (segurança - Fase 1)
│   ├── database/        (queries normalizadas)
│   └── portfolio/       (lógica de negócio)
├── app/
│   ├── api/
│   │   └── portfolio/   (refatorada)
│   ├── portfolio.tsx    (refatorado)
│   └── ...
├── tests/               (testes novos)
└── db/
    ├── schema.ts        (normalizado)
    └── migrations/      (nova estrutura)
```

---

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Linhas em portfolio.tsx** | 1200+ | <300 |
| **Número de componentes** | 1 | 10+ |
| **Linhas por componente** | 1200 | ~150 |
| **Reusabilidade** | Baixa | Alta |
| **Testabilidade** | Baixa | Alta |
| **Manutenibilidade** | Baixa | Alta |
| **Schema do banco** | 4 tabelas genéricas | 10+ específicas |
| **Índices** | 1 | 15+ |
| **Cobertura de testes** | ~10% | ~70% |
| **Documentação** | Mínima | Completa |

---

## 🎯 Checklist de Implementação

### Componentes
- [ ] PortfolioLayout.tsx ✅
- [ ] PortfolioFilters.tsx ✅
- [ ] PortfolioTable.tsx
- [ ] PortfolioTableRow.tsx
- [ ] ClientSheet.tsx
- [ ] BatchWhatsApp.tsx
- [ ] EmailDialog.tsx
- [ ] ActivitySection.tsx
- [ ] ABCCurveSection.tsx
- [ ] StatsBar.tsx
- [ ] SearchBar.tsx
- [ ] ContactForm.tsx

### Hooks
- [ ] usePortfolioState.ts
- [ ] usePortfolioFilters.ts
- [ ] useClientSheet.ts
- [ ] useActivities.ts

### Types
- [ ] portfolio.ts
- [ ] contact.ts

### Database
- [ ] Novo schema SQL
- [ ] Migração de dados
- [ ] Índices
- [ ] Foreign keys

### Testes
- [ ] Unit: document-validation
- [ ] Unit: portfolio
- [ ] Unit: filters
- [ ] Integration: APIs
- [ ] Integration: Database
- [ ] E2E: Import flow
- [ ] E2E: Filter flow
- [ ] E2E: Export flow

### Documentação
- [ ] Architecture.md
- [ ] Components.md
- [ ] Migration-guide.md
- [ ] API-changes.md

---

## 🚀 Performance Targets

| Métrica | Antes | Depois | Target |
|---------|-------|--------|--------|
| Render time (ms) | 500+ | <200 | 150 |
| Time to Interactive (s) | 3+ | <2 | 1 |
| Bundle size (KB) | 200+ | <150 | 100 |
| Test coverage | 10% | 70% | 80% |
| Components reusable | 10% | 80% | 90% |

---

## 📞 Próximos Passos Imediatos

### Hoje
- [x] Criar PortfolioLayout.tsx
- [x] Criar PortfolioFilters.tsx
- [ ] Criar PortfolioTable.tsx
- [ ] Criar ClientSheet.tsx

### Próximas 24h
- [ ] Restantes 8 componentes
- [ ] Custom hooks básicos
- [ ] Type definitions

### Próximos 3 dias
- [ ] Refatorar portfolio.tsx para usar componentes
- [ ] Testes unitários básicos
- [ ] Compilar e validar

### Próxima semana
- [ ] Schema normalizado
- [ ] Migração de dados
- [ ] Testes integração
- [ ] Performance tuning

---

## 📈 Benefícios Esperados

### Curto prazo (Semana 1-2)
- ✅ Código mais legível
- ✅ Componentes reusáveis
- ✅ Mais fácil testar
- ✅ Melhor performance

### Médio prazo (Semana 3+)
- ✅ Schema normalizado
- ✅ Queries mais rápidas
- ✅ Escalabilidade melhor
- ✅ Menos bugs

### Longo prazo
- ✅ Fácil adicionar features
- ✅ Fácil manutenção
- ✅ Documentação completa
- ✅ Pronto para crescimento

---

## 🎓 O Que Você Aprenderá

Implementando Fase 2:
- ✅ Decomposição de componentes React
- ✅ Custom hooks avançados
- ✅ Normalização de banco de dados
- ✅ Testes unitários e E2E
- ✅ Refatoração segura
- ✅ Performance optimization
- ✅ TypeScript avançado

---

## ⚠️ Riscos e Mitigação

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Breaking changes | Média | Manter compatibilidade, testes |
| Performance degradada | Baixa | Índices, queries otimizadas |
| Migração falha | Muito baixa | Script reversível, backup |
| Testes não cobrem | Média | CI/CD automation |

---

## 📊 Status Final

```
┌─────────────────────────────────────────────────────────┐
│ FASE 2: REFATORAÇÃO PLANEJADA                          │
│                                                         │
│ ✅ Design de componentes              [100%]          │
│ ✅ Design de banco normalizado        [100%]          │
│ ✅ Plano de testes                    [100%]          │
│ ✅ PortfolioLayout.tsx                [100%]          │
│ ✅ PortfolioFilters.tsx               [100%]          │
│ ⏳ Restantes 10 componentes           [0%]            │
│ ⏳ Custom hooks                        [0%]            │
│ ⏳ Schema normalizado                  [0%]            │
│ ⏳ Migração de dados                   [0%]            │
│ ⏳ Testes completos                    [0%]            │
│                                                         │
│ Próximo: Criar PortfolioTable.tsx                      │
└─────────────────────────────────────────────────────────┘
```

---

**Data:** 27/09/2026  
**Versão:** 2.0 (Plan)  
**Tempo restante:** 2-3 weeks  
**Status:** ✅ PRONTO PARA IMPLEMENTAÇÃO
