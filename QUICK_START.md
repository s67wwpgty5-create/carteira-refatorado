# Quick Start - Fase 1 em 10 Minutos

**Para desenvolvedores que querem começar AGORA**

---

## 🚀 Os 5 Passos

### 1️⃣ Entenda o que foi feito
```
✅ 5 arquivos de segurança criados
✅ API refatorada com proteções
✅ Documentação pronta
```

**Arquivos críticos:**
- `lib/document-validation.ts` - CPF/CNPJ validation
- `lib/audit-log.ts` - Auditoria
- `lib/rate-limit.ts` - Rate limiting
- `app/api/portfolio/route.ts.secured` - Nova API
- `FASE1_IMPLEMENTACAO.md` - Guia completo

### 2️⃣ Leia o guia de implementação
```bash
cat FASE1_IMPLEMENTACAO.md
```
**Tempo:** 10-15 minutos  
**Tem:** Checklist, testes, step-by-step

### 3️⃣ Setup local
```bash
npm install
cp .env.example .env.local
npm run build
npm run dev
```
**Tempo:** 5 minutos  
**Resultado:** App rodando em http://localhost:5173

### 4️⃣ Teste as validações
```bash
# CPF válido
123.456.789-09 ✅

# CPF inválido  
000.000.000-00 ❌

# CNPJ válido
11.222.333/0001-81 ✅
```

### 5️⃣ Ative a nova API (quando pronto)
```bash
# Backup original
mv app/api/portfolio/route.ts app/api/portfolio/route.ts.original

# Ativar secured
mv app/api/portfolio/route.ts.secured app/api/portfolio/route.ts

# Deploy
npm run build
```

---

## 📊 O Que Cada Arquivo Faz

| Arquivo | O Quê | Impacto |
|---------|-------|--------|
| `document-validation.ts` | Valida CPF/CNPJ | Rejeita documentos inválidos |
| `audit-log.ts` | Loga tudo | Rastreabilidade total |
| `rate-limit.ts` | Limita requisições | Previne abuse |
| `security-helpers.ts` | Utils de segurança | Validação robusta |
| `route.ts.secured` | API protegida | Todas as proteções acima |

---

## ⚡ Resumo das Melhorias

```
ANTES                          DEPOIS
────────────────────────────────────────────
Sem validação de documento  →  CPF/CNPJ validados
Sem auditoria              →  Audit log completo
Sem rate limit             →  100 req/hora por user
CORS fraco                 →  Validação robusta
Sem security context       →  IP + User-Agent + ID
```

---

## 🧪 Um Teste Rápido

```bash
# 1. Abrir navegador
open http://localhost:5173

# 2. Login
# (use sua conta)

# 3. Ir para Clientes
# (portfolio.tsx em ação)

# 4. Editar contato
# Novo: CPF/CNPJ é validado
# Novo: Ação é loggada em audit_log

# 5. Fazer 101 requisições rápido
# 101ª falha com 429 (Too Many Requests)
```

---

## 📁 Estrutura de Pastas

```
carteira-refatorado/
├── lib/
│   ├── document-validation.ts      ✨ NOVO
│   ├── audit-log.ts                ✨ NOVO
│   ├── rate-limit.ts               ✨ NOVO
│   ├── security-helpers.ts         ✨ NOVO
│   └── validation.ts               ⚙️ ATUALIZADO
├── app/
│   └── api/
│       └── portfolio/
│           ├── route.ts            (ORIGINAL)
│           └── route.ts.secured    ✨ NOVO
├── db/
│   └── schema.ts                   ⚙️ ATUALIZADO
├── drizzle/
│   └── 0001_add_audit_log.sql      ✨ NOVO
├── .env.example                    ✨ NOVO
├── FASE1_IMPLEMENTACAO.md          ✨ GUIA
├── REFACTOR_STATUS.md              ✨ STATUS
└── QUICK_START.md                  ✨ ESTE ARQUIVO
```

---

## 🔥 Atalhos Importantes

### Validação de documento
```typescript
import { validateDocument } from '@/lib/document-validation';

if (validateDocument('123.456.789-09')) {
  console.log('CPF válido!');
}
```

### Logar auditoria
```typescript
import { logAudit } from '@/lib/audit-log';

await logAudit(db, userId, 'contact_update', clientId, 'contact', {
  before: old,
  after: updated
}, ipAddress, userAgent);
```

### Rate limiting
```typescript
import { applyRateLimit } from '@/lib/rate-limit';

const result = applyRateLimit(userId, 'contact');
if (!result.allowed) {
  return json({ error: 'Rate limit exceeded' }, 429);
}
```

### Validar CORS
```typescript
import { validateCorsOrigin } from '@/lib/security-helpers';

if (!validateCorsOrigin(request, allowedOrigins)) {
  return json({ error: 'Forbidden' }, 403);
}
```

---

## 💡 Dicas Práticas

1. **Comece com testes locais**
   - Nada quebra enquanto está em `.secured`
   - Ative apenas quando confiante

2. **Teste rate limiting**
   - 100+ requisições rápido deve falhar na 101ª
   - Confirma que está funcionando

3. **Valide documentos**
   - CPF 000.000.000-00 deve ser rejeitado
   - CNPJ 11.222.333/0001-81 deve passar

4. **Monitore audit log**
   - Toda ação cria registro
   - Use para debug e conformidade

5. **Tenha o .env.local**
   - `.git ignore` deve conter `.env.local`
   - Dados reais NUNCA vão para repo

---

## ❓ Dúvidas Rápidas

**P: Preciso fazer algo agora?**  
R: Leia `FASE1_IMPLEMENTACAO.md` e planeje próxima semana.

**P: Isso quebra o app atual?**  
R: NÃO. Código seguro está em `.secured`. Original está intacto.

**P: Quanto tempo leva?**  
R: 2-3 semanas para implementar e testar tudo.

**P: Posso testar sem ativar?**  
R: SIM! Arquivo `.secured` pode ser testado sem afetar produção.

**P: E o banco de dados?**  
R: Migração está em `0001_add_audit_log.sql`. Aplicar conforme guia.

---

## 🎯 Próximos Passos

1. ✅ Você está aqui (leu QUICK_START)
2. ⏭️ Leia FASE1_IMPLEMENTACAO.md (~15 min)
3. ⏭️ Setup local (npm install, npm run dev)
4. ⏭️ Testes de validação
5. ⏭️ Ativar nova API quando pronto
6. ⏭️ Fase 2: Refatoração

---

## 🏆 Benchmark

Esperado após Fase 1:
- ✅ CPF/CNPJ validados: 100%
- ✅ Auditoria funcionando: 100%
- ✅ Rate limit ativo: 100%
- ✅ CORS validado: 100%
- ✅ Segurança crítica: ✓ Resolvida
- 🟡 Problemas críticos: 5/8 resolvidos (62%)

---

**Criado em:** 27/09/2026  
**Para:** Começar Fase 1  
**Tempo de leitura:** 10 minutos  
**Próximo passo:** FASE1_IMPLEMENTACAO.md
