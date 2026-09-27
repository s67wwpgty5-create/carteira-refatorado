# Fase 1: Implementação de Segurança + Mitigação

**Status:** 🔄 Em Desenvolvimento  
**Duração:** 2-3 semanas  
**Objetivo:** Tornar o sistema seguro para produção limitada

---

## ✅ Arquivos Criados (Novos)

### 1. Validação de Documentos
- **Arquivo:** `lib/document-validation.ts`
- **Funcionalidade:** Validação de CPF e CNPJ com algoritmo correto
- **Funções:**
  - `validateCPF(cpf)` - Valida CPF brasileiro
  - `validateCNPJ(cnpj)` - Valida CNPJ brasileiro
  - `validateDocument(doc)` - Detecta tipo e valida
  - `getDocumentType(doc)` - Retorna 'CPF' | 'CNPJ' | 'INVALID'

### 2. Auditoria
- **Arquivo:** `lib/audit-log.ts`
- **Funcionalidade:** Log de todas as mutações críticas
- **Funções:**
  - `logAudit()` - Registra ação de usuário
  - `getAuditLog()` - Recupera histórico de auditoria
  - `purgeOldAuditLogs()` - Limpa logs antigos (>90 dias)

### 3. Rate Limiting
- **Arquivo:** `lib/rate-limit.ts`
- **Funcionalidade:** Previne abuso de API
- **Recursos:**
  - Token bucket pattern
  - Diferentes limites por tipo de ação
  - Headers HTTP padronizados

### 4. Security Helpers
- **Arquivo:** `lib/security-helpers.ts`
- **Funcionalidade:** Utilitários de segurança
- **Funções:**
  - `validateResourceOwnership()` - Valida propriedade de recurso
  - `validateCorsOrigin()` - Valida origem CORS corretamente
  - `createSecurityContext()` - Cria contexto de segurança
  - `sanitizeErrorMessage()` - Remove detalhes internos de erros

### 5. Schema do Banco
- **Arquivo:** `db/schema.ts` (ATUALIZADO)
- **Adição:** Tabela `auditLog` com índices

### 6. Migração de Banco
- **Arquivo:** `drizzle/0001_add_audit_log.sql`
- **Conteúdo:** Script SQL para criar tabela de auditoria

### 7. API Refatorada
- **Arquivo:** `app/api/portfolio/route.ts.secured`
- **Status:** ⚠️ NOVO (não ativa ainda)
- **Melhorias:**
  - Validação de propriedade em toda mutação
  - Audit logging em cada ação
  - Rate limiting aplicado
  - CORS validado corretamente
  - CPF/CNPJ validation
  - Melhor tratamento de erros
  - Security context em cada request

### 8. Configuração de Ambiente
- **Arquivo:** `.env.example` (NOVO)
- **Conteúdo:** Template de variáveis de ambiente

---

## 📋 Checklist de Implementação

### Pré-requisitos
- [ ] Node.js >=22.13.0 instalado
- [ ] npm funcionando
- [ ] Acesso ao banco D1 local

### Instalação e Setup
```bash
# 1. Entrar no diretório do projeto refatorado
cd carteira-refatorado

# 2. Instalar dependências
npm install

# 3. Criar arquivo .env.local
cp .env.example .env.local

# 4. Aplicar migração do banco (quando pronto)
# Será feito após validação de tudo
```

### Fase 1A: Validação de Documentos

**Objetivo:** Detectar e rejeitar CPF/CNPJ inválidos

- [ ] Revisar `lib/document-validation.ts`
- [ ] Testar com CPF válido: `123.456.789-09`
- [ ] Testar com CPF inválido: `000.000.000-00`
- [ ] Testar com CNPJ válido: `11.222.333/0001-81`
- [ ] Testar com CNPJ inválido: `00.000.000/0000-00`
- [ ] Compilar TypeScript: `npm run tsc --noEmit`

**Testes manuais:**
```bash
node -e "
const v = require('./lib/document-validation.ts');
console.log('CPF válido:', v.validateCPF('123.456.789-09'));
console.log('CPF inválido:', v.validateCPF('000.000.000-00'));
"
```

### Fase 1B: Auditoria

**Objetivo:** Rastrear todas as mutações

- [ ] Criar tabela no banco: `npm run db:generate`
- [ ] Revisar `lib/audit-log.ts`
- [ ] Validar estrutura de tabela
- [ ] Testar função `logAudit()`
- [ ] Testar função `getAuditLog()`

### Fase 1C: Rate Limiting

**Objetivo:** Prevenir abuso

- [ ] Revisar `lib/rate-limit.ts`
- [ ] Entender token bucket pattern
- [ ] Testar com múltiplas requisições
- [ ] Validar headers `X-RateLimit-*`
- [ ] Testar cleanup de expired entries

### Fase 1D: Security Helpers

**Objetivo:** Validações de segurança

- [ ] Revisar `lib/security-helpers.ts`
- [ ] Testar `validateResourceOwnership()`
- [ ] Testar `validateCorsOrigin()`
- [ ] Testar `sanitizeErrorMessage()`
- [ ] Testar `getClientIpAddress()`

### Fase 1E: Ativar Nova API

**Objetivo:** Usar API refatorada com segurança

- [ ] Fazer backup de `app/api/portfolio/route.ts`
- [ ] Renomear: `route.ts` → `route.ts.original`
- [ ] Renomear: `route.ts.secured` → `route.ts`
- [ ] Compilar: `npm run build`
- [ ] Testar GET `/api/portfolio`
- [ ] Testar POST `/api/portfolio` (contact)
- [ ] Testar rate limiting (100+ requisições)
- [ ] Verificar logs de auditoria no banco

### Fase 1F: Documentação

**Objetivo:** Documentar mudanças

- [ ] Criar `SECURITY.md` com resumo de melhorias
- [ ] Criar `AUDIT_LOG.md` explicando auditoria
- [ ] Atualizar `README.md` com novas env vars
- [ ] Documentar endpoints de auditoria (GET `/api/audit`)

---

## 🧪 Testes de Segurança

### Teste 1: Validação de Propriedade

```typescript
// Tentar acessar cliente que não pertence ao usuário
// Deve falhar com 403 ou erro
POST /api/portfolio
{
  "action": "contact",
  "payload": {
    "id": "9999", // Não existe para este usuário
    "phone": "11999999999"
  }
}
```

**Esperado:** Erro ou rejeição silenciosa

### Teste 2: Rate Limiting

```bash
# Fazer 101 requisições rapidamente
for i in {1..101}; do
  curl -X GET http://localhost:5173/api/portfolio \
    -H "Authorization: Bearer token"
done
```

**Esperado:** 101ª requisição retorna 429 (Too Many Requests)

### Teste 3: CPF/CNPJ Inválido

```typescript
POST /api/portfolio
{
  "action": "contact",
  "payload": {
    "id": "1001",
    "document": "000.000.000-00", // Inválido
    "phone": "11999999999"
  }
}
```

**Esperado:** Erro de validação: "CPF ou CNPJ inválido"

### Teste 4: CORS Validado

```bash
# Request com origin não permitida
curl -X POST http://localhost:5173/api/portfolio \
  -H "Origin: https://attacker.com" \
  -H "Content-Type: application/json" \
  -d '{"action":"contact",...}'
```

**Esperado:** 403 Forbidden (se não estiver em allowlist)

### Teste 5: Auditoria

```bash
# Fazer uma mutação
# Depois consultar audit log
curl http://localhost:5173/api/audit-log
```

**Esperado:** Registro da ação realizada

---

## 📊 Migração do Banco de Dados

### Passo 1: Gerar Migração

```bash
cd carteira-refatorado
npx drizzle-kit generate
```

Isso gera metadados em `drizzle/meta/`

### Passo 2: Aplicar Migração Localmente

```bash
# Local com wrangler
npm run dev
# Na URL do app, o banco local terá a nova tabela
```

### Passo 3: Validar

```bash
# Verificar estrutura
SELECT name FROM sqlite_master WHERE type='table';
```

Deve listar: `records`, `imports`, `imported_clients`, `audit_log`

---

## ⚠️ Cuidados e Advertências

### IMPORTANTE: Dados Reais

**Antes de ir a produção:**
- [ ] Remover dados reais de `lib/seed.json`
- [ ] Usar `.env.local` com `SEED_DATA_PATH` apontando para arquivo privado
- [ ] Adicionar `.env.local` a `.gitignore`
- [ ] Validar que `lib/seed.json` contém APENAS dados fictícios

### IMPORTANTE: Backward Compatibility

A nova API (`route.ts.secured`) é **100% compatível** com a antiga:
- Mesmos endpoints
- Mesmos payloads
- Mesmas respostas (exceto headers adicionais)

Pode-se reverter alterando de volta `route.ts.original` se houver problemas.

### IMPORTANTE: Testes

Não mexer em `tests/core.test.ts` ainda - depende de Excel externo.
Na Fase 2, será criado teste automatizado.

---

## 🚀 Após Fase 1

Quando Fase 1 está completa:
1. ✅ Sistema é seguro para produção limitada
2. ✅ Dados são auditados
3. ✅ Rate limiting ativo
4. ✅ CPF/CNPJ validados
5. ⏭️ Próximo: Fase 2 (Refatoração de componentes + banco normalizado)

---

## 📞 Troubleshooting

### Erro: "Cannot find module 'document-validation'"
- Verificar que `lib/document-validation.ts` existe
- Compilar: `npx tsc --noEmit`

### Erro: "Table 'audit_log' does not exist"
- Migração não foi aplicada
- Rodar: `npx wrangler d1 execute DB --local --file drizzle/0001_add_audit_log.sql`

### Rate limiting não funciona
- Verificar que `lib/rate-limit.ts` está importado em `route.ts`
- Limpar store em memória manualmente se necesário

### Auditoria não está loggando
- Verificar que `logAudit()` está sendo chamado
- Validar que banco consegue escrever em `audit_log`
- Verificar console para erros de escrita

---

## ✨ Resumo

**Fase 1 implementa 5 dos 8 problemas críticos:**
1. ✅ Validação de CPF/CNPJ
2. ✅ Audit log básico
3. ✅ Rate limiting
4. ✅ Security context
5. ✅ Validação de CORS

**Problemas que precisam Fase 2:**
- Isolamento de usuários (requer refactor monolítico)
- Transações atômicas (refactor de import)
- Backup/recuperação (nova feature)
- Duplicatas (UI de merge)

---

**Data de início recomendada:** Próxima segunda-feira  
**Esforço:** ~10-15 dias de desenvolvimento  
**Resultado:** Sistema seguro + auditável + rate-limited
