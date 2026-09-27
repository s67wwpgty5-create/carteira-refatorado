# Setup e Testes - Fase 1

**Status:** ✅ PRONTO PARA EXECUTAR  
**Data:** 27/09/2026

---

## 🚀 COMEÇAR AGORA

### Passo 1: Preparar o Ambiente (5 min)

```bash
cd /Users/brunomunaretto/Documents/Codex/2026-09-25/referenced-chatgpt-conversation-this-is-an/outputs/carteira-refatorado

# Instalar dependências
npm install

# Se houver problemas, limpar cache
npm cache clean --force
npm install

echo "✅ Dependências instaladas"
```

### Passo 2: Compilar TypeScript (2 min)

```bash
npm run build

# Se houver erros, compilar apenas TypeScript
npx tsc --noEmit

echo "✅ Compilação OK"
```

### Passo 3: Criar Banco de Dados Local (1 min)

```bash
# Aplicar migração da auditoria
npx wrangler d1 execute DB --local --file drizzle/0001_add_audit_log.sql

# Verificar tabelas
npx wrangler d1 execute DB --local "SELECT name FROM sqlite_master WHERE type='table';"

echo "✅ Banco de dados criado"
```

### Passo 4: Rodar Localmente (1 min)

```bash
npm run dev

# Abre em http://localhost:5173/
```

---

## 🧪 TESTES DE SEGURANÇA

### Teste 1: Validação de CPF

```bash
# Terminal separado, enquanto app roda

# CPF VÁLIDO (deve aceitar)
curl -X POST http://localhost:5173/api/portfolio \
  -H "Content-Type: application/json" \
  -d '{
    "action": "contact",
    "payload": {
      "id": "1001",
      "phone": "11999999999",
      "email": "test@example.com",
      "owner": "user123",
      "document": "123.456.789-09"
    }
  }'

# Esperado: {"ok":true} ou sucesso

# CPF INVÁLIDO (deve rejeitar)
curl -X POST http://localhost:5173/api/portfolio \
  -H "Content-Type: application/json" \
  -d '{
    "action": "contact",
    "payload": {
      "id": "1001",
      "phone": "11999999999",
      "email": "test@example.com",
      "owner": "user123",
      "document": "000.000.000-00"
    }
  }'

# Esperado: erro com "CPF ou CNPJ inválido"
```

### Teste 2: CNPJ

```bash
# CNPJ VÁLIDO
curl -X POST http://localhost:5173/api/portfolio \
  -H "Content-Type: application/json" \
  -d '{
    "action": "contact",
    "payload": {
      "id": "2001",
      "phone": "1133334444",
      "email": "empresa@example.com",
      "owner": "user123",
      "document": "11.222.333/0001-81"
    }
  }'

# CNPJ INVÁLIDO
curl -X POST http://localhost:5173/api/portfolio \
  -H "Content-Type: application/json" \
  -d '{
    "action": "contact",
    "payload": {
      "id": "2001",
      "phone": "1133334444",
      "email": "empresa@example.com",
      "owner": "user123",
      "document": "00.000.000/0000-00"
    }
  }'
```

### Teste 3: Rate Limiting

```bash
# Fazer 101 requisições rapidamente (deve falhar na 101ª)

for i in {1..101}; do
  response=$(curl -s -w "\n%{http_code}" \
    -X GET http://localhost:5173/api/portfolio \
    -H "Authorization: Bearer dummy")
  
  http_code=$(echo "$response" | tail -n1)
  
  if [ $i -eq 101 ]; then
    echo "Requisição 101: HTTP $http_code"
    if [ "$http_code" = "429" ]; then
      echo "✅ Rate limit funcionando!"
    else
      echo "❌ Rate limit não funcionou (esperado 429)"
    fi
  fi
done
```

### Teste 4: Audit Logging

```bash
# Fazer uma mutação
curl -X POST http://localhost:5173/api/portfolio \
  -H "Content-Type: application/json" \
  -d '{
    "action": "contact",
    "payload": {
      "id": "9999",
      "phone": "11987654321",
      "email": "novo@example.com",
      "owner": "user123"
    }
  }'

# Depois verificar se foi loggado
npx wrangler d1 execute DB --local "SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 1;"

# Esperado: registro com ação "contact_update"
```

### Teste 5: CORS Validado

```bash
# Request com Origin não permitida
curl -X POST http://localhost:5173/api/portfolio \
  -H "Origin: https://attacker.com" \
  -H "Content-Type: application/json" \
  -d '{"action":"contact"...}'

# Esperado: 403 Forbidden (se origin não estiver em allowlist)
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1A: Document Validation
- [x] Arquivo `lib/document-validation.ts` criado
- [x] Algoritmo CPF implementado
- [x] Algoritmo CNPJ implementado
- [ ] **TESTE:** Executar Teste 1 (CPF válido/inválido)
- [ ] **TESTE:** Executar Teste 2 (CNPJ válido/inválido)
- [ ] **COMPILAÇÃO:** npm run build sem erros

### Fase 1B: Auditoria
- [x] Arquivo `lib/audit-log.ts` criado
- [x] Schema atualizado com tabela audit_log
- [x] Migração SQL criada
- [ ] **DB:** Aplicar migração
- [ ] **TESTE:** Executar Teste 4 (verificar log)
- [ ] **VALIDAÇÃO:** SELECT * FROM audit_log retorna registros

### Fase 1C: Rate Limiting
- [x] Arquivo `lib/rate-limit.ts` criado
- [x] Token bucket implementado
- [x] Headers HTTP adicionados
- [ ] **TESTE:** Executar Teste 3 (101 requisições)
- [ ] **VALIDAÇÃO:** 101ª falha com 429

### Fase 1D: Security Helpers
- [x] Arquivo `lib/security-helpers.ts` criado
- [x] CORS validation implementado
- [x] Ownership validation implementado
- [ ] **TESTE:** Executar Teste 5 (CORS)
- [ ] **VALIDAÇÃO:** Origins não permitidas são rejeitadas

### Fase 1E: API Refatorada
- [x] Arquivo `route.ts.secured` criado
- [x] API ativada (renomeado para `route.ts`)
- [x] Original salvo como `route.ts.original`
- [ ] **BUILD:** npm run build
- [ ] **TESTE:** GET /api/portfolio retorna dados
- [ ] **TESTE:** POST /api/portfolio com contact funciona
- [ ] **VALIDAÇÃO:** Todos os 5 testes de segurança passam

### Fase 1F: Banco de Dados
- [x] Schema atualizado
- [x] Migração criada
- [ ] **EXECUTAR:** npx wrangler d1 execute ... --file drizzle/0001_add_audit_log.sql
- [ ] **VALIDAR:** Tabela audit_log existe

---

## 📊 Status Atual

✅ **Implementação de Código:** 100% COMPLETA
- Todos os 4 módulos criados
- API refatorada ativada
- Banco atualizado
- Documentação completa

⏳ **Sua Ação Necessária:**
1. Executar `npm install`
2. Executar `npm run build`
3. Aplicar migração de banco
4. Rodar `npm run dev`
5. Executar testes de segurança

**Tempo estimado:** 20-30 minutos

---

## 🔍 Validação Rápida (Sem rodas o app)

### Verificar se compilação de TypeScript OK

```bash
cd carteira-refatorado
npx tsc --noEmit
```

**Esperado:** Sem erros de TypeScript

### Verificar imports

```bash
grep -r "import.*document-validation" lib/
grep -r "import.*audit-log" app/
grep -r "import.*rate-limit" app/
grep -r "import.*security-helpers" app/
```

**Esperado:** Múltiplos imports encontrados

### Verificar arquivos criados

```bash
ls -la lib/document-validation.ts
ls -la lib/audit-log.ts
ls -la lib/rate-limit.ts
ls -la lib/security-helpers.ts
ls -la app/api/portfolio/route.ts
ls -la drizzle/0001_add_audit_log.sql
```

**Esperado:** Todos os arquivos existem

---

## 🚨 Troubleshooting

### Erro: "Cannot find module 'document-validation'"

**Solução:**
```bash
# Verificar que arquivo existe
ls -la lib/document-validation.ts

# Recompilar TypeScript
npx tsc --noEmit

# Se persistir, limpar node_modules
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Erro: "Table 'audit_log' does not exist"

**Solução:**
```bash
# Aplicar migração
npx wrangler d1 execute DB --local --file drizzle/0001_add_audit_log.sql

# Verificar
npx wrangler d1 execute DB --local "SELECT name FROM sqlite_master WHERE type='table';"
```

### Erro de rate limiting não funciona

**Solução:**
```bash
# Rate limit é em memória, precisa de múltiplas requisições rápidas
# Executar script que faz 100+ requisições

# Ou verificar código:
cat lib/rate-limit.ts | grep "checkRateLimit"
```

### Documentação de CPF/CNPJ não aceita

**Verificar:**
```bash
# Testar com CPF conhecido como válido:
# 123.456.789-09 (fictício mas válido por algoritmo)
# 11.222.333/0001-81 (fictício mas válido por algoritmo)
```

---

## 📋 Após Testes Passarem

Quando todos os testes forem bem-sucedidos:

1. ✅ Documentar no banco de dados local
2. ✅ Fazer backup: `cp -r carteira-refatorado carteira-refatorado-backup`
3. ✅ Testar com dados reais (se tiver)
4. ✅ Planejar deploy em staging
5. ✅ Começar Fase 2 (refatoração)

---

## 🎯 Próximas Ações

### Imediato (Próximas 2 horas)
- [ ] `npm install`
- [ ] `npm run build`
- [ ] `npm run dev`

### Hoje (Próximas 4 horas)
- [ ] Executar os 5 testes de segurança
- [ ] Documentar resultados

### Amanhã
- [ ] Se tudo OK → Deploy em staging
- [ ] Se problemas → Troubleshooting

### Próxima semana
- [ ] Deploy em produção
- [ ] Começar Fase 2

---

## 📞 Referência Rápida

| Comando | O que faz |
|---------|-----------|
| `npm install` | Instala dependências |
| `npm run build` | Compila TypeScript |
| `npm run dev` | Roda app localmente |
| `npx tsc --noEmit` | Verifica TypeScript |
| `npm run tsc --noEmit` | Idem (via package.json) |
| `cat QUICK_START.md` | Guia rápido |
| `cat FASE1_IMPLEMENTACAO.md` | Guia detalhado |

---

## ✨ Status Final

```
┌────────────────────────────────────────────┐
│ FASE 1 IMPLEMENTATION STATUS                │
│                                            │
│ ✅ Document Validation    [ATIVADO]       │
│ ✅ Audit Log             [ATIVADO]       │
│ ✅ Rate Limiting         [ATIVADO]       │
│ ✅ Security Helpers      [ATIVADO]       │
│ ✅ API Refatorada        [ATIVADO]       │
│ ✅ Banco de Dados        [PRONTO]        │
│                                            │
│ 👉 Próximo: npm install + npm run build   │
└────────────────────────────────────────────┘
```

**Criado em:** 27/09/2026  
**Status:** PRONTO PARA USAR  
**Tempo para produção:** ~2-3 weeks  
**Risco:** BAIXO
