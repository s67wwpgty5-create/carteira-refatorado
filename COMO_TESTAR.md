# 🧪 COMO TESTAR O SISTEMA LOCALMENTE

**Link de Teste:** http://localhost:5173/

---

## 🚀 COMEÇAR EM 1 MINUTO

### Opção 1: Script Automático (Mais Fácil)

```bash
cd /Users/brunomunaretto/Documents/Codex/2026-09-25/referenced-chatgpt-conversation-this-is-an/outputs/carteira-refatorado

bash RUN_TESTE.sh
```

**Resultado:**
- Instala dependências
- Compila TypeScript
- Inicia servidor em http://localhost:5173/
- Pressione `Ctrl+C` para parar

### Opção 2: Comandos Manuais

```bash
cd /Users/brunomunaretto/Documents/Codex/2026-09-25/referenced-chatgpt-conversation-this-is-an/outputs/carteira-refatorado

# Passo 1: Instalar
npm install

# Passo 2: Compilar
npm run build

# Passo 3: Rodar
npm run dev
```

---

## 🌐 ACESSAR O SISTEMA

Depois que rodar `npm run dev`, abra seu navegador:

```
http://localhost:5173/
```

**Você verá:**
- ✅ Layout com sidebar (Controle de Carteira)
- ✅ Menu de navegação (Visão geral, Clientes, Alertas, etc)
- ✅ Tabela de clientes
- ✅ Filtros de região, contrato, mês
- ✅ Barra de estatísticas

---

## 🧪 TESTES FUNCIONAIS

### 1. Verificar Segurança (Fase 1)

#### Teste: CPF/CNPJ Validation
```
1. Clique em um cliente
2. Abra a ficha (sheet)
3. Tente adicionar documento inválido: 000.000.000-00
4. Esperado: Erro "CPF ou CNPJ inválido"
```

#### Teste: Rate Limiting
```bash
# No console do navegador, fazer 100+ requisições:
for (let i = 0; i < 101; i++) {
  fetch('/api/portfolio').then(r => console.log(i, r.status))
}

# Esperado: Requisição 101+ retorna 429 (Too Many Requests)
```

#### Teste: Audit Log
```
1. Fazer uma mutação (editar contato)
2. Verificar no banco: SELECT * FROM audit_log
3. Esperado: Registro com ação 'contact_update'
```

### 2. Testar Componentes Refatorados (Fase 2)

#### Teste: Layout
```
1. Abra o app
2. Verificar se sidebar existe
3. Verificar se menu de navegação funciona
4. Esperado: Tudo visível e navegável
```

#### Teste: Filtros
```
1. Selecione região: "Todas as regiões"
2. Selecione contrato: "Contrato"
3. Selecione mês diferente
4. Esperado: Tabela filtra imediatamente
```

#### Teste: Tabela
```
1. Veja a tabela de clientes
2. Clique em um cliente para abrir ficha
3. Tente selecionar clientes (checkbox)
4. Esperado: Seleção funciona
```

#### Teste: Paginação
```
1. Mude "Empresas por página" para 20
2. Clique "Próxima"
3. Verificar se carrega próxima página
4. Esperado: Paginação funciona corretamente
```

### 3. Testar Performance

#### Tempo de Load
```bash
# Abrir DevTools (F12)
# Ir para "Network"
# Recarregar página
# Esperado: 
#   - Initial load < 3s
#   - Interaction < 2s
#   - API response < 500ms
```

#### Render Performance
```bash
# Em DevTools, ir para "Performance"
# Gravar uma ação (filtro, paginação)
# Esperado:
#   - Frame rate > 60fps
#   - No jank ou lag
```

---

## 📋 CHECKLIST DE TESTES

### Fase 1 (Segurança) ✅
- [ ] CPF/CNPJ validation rejeita inválido
- [ ] Rate limiting bloqueia após 100 req/h
- [ ] Audit log registra mutações
- [ ] CORS validado (origem correta)

### Fase 2 (Refatoração) ✅
- [ ] Layout renderiza corretamente
- [ ] Filtros funcionam
- [ ] Tabela mostra dados
- [ ] Paginação funciona
- [ ] Seleção de clientes funciona
- [ ] Abrir ficha funciona
- [ ] Editar contato funciona

### Performance
- [ ] Load time < 3s
- [ ] Interaction < 2s
- [ ] API response < 500ms
- [ ] Sem memory leaks
- [ ] Responsive (mobile ok)

---

## 🐛 TROUBLESHOOTING

### Erro: "npm: command not found"
```bash
# Node.js não está instalado
# Instale em: https://nodejs.org/ (v22.13.0+)
# Depois tente novamente
```

### Erro: "Port 5173 already in use"
```bash
# Outra aplicação está usando a porta
# Opção 1: Parar a outra aplicação
# Opção 2: Usar porta diferente
npm run dev -- --port 3000
```

### Erro: "Module not found"
```bash
# Dependências não instaladas
npm install
npm run build
```

### App não carrega dados
```bash
# Verificar console (F12)
# Verificar se há erros de API
# Tentar fazer login novamente
```

### Performance lenta
```bash
# Abrir DevTools (F12)
# Verificar Network tab
# Procurar por requisições lentas (>1s)
# Verificar tamanho do bundle
npm run build
```

---

## 📊 DADOS DE TESTE

### Login
- **URL:** http://localhost:5173/
- **Autenticação:** ChatGPT Platform (local)
- **Conta padrão:** demo@example.com (se existir)

### Clientes de Teste
- Base de dados local vem com seed.json
- Contém clientes reais do dataset original
- Dados são fictícios em dev (não produção)

### Importar Dados de Teste
```bash
# Se quiser adicionar mais dados:
# 1. Editar lib/seed.json
# 2. npm run dev (recarrega automático)
# 3. Dados aparecem no app
```

---

## 📈 NAVEGAÇÃO

### Views Disponíveis
1. **Visão geral** - Dashboard
2. **Clientes** - Tabela de clientes
3. **Alertas** - Clientes com alerta
4. **Curva ABC** - Gráfico de distribuição
5. **Acompanhamento** - Atividades
6. **Propostas** - Propostas de vendas
7. **Públicos e agendamentos** - Lotes
8. **Importar planilha** - Upload de dados

### Funcionalidades Testáveis
- ✅ Filtrar por região/contrato/mês
- ✅ Selecionar clientes em lote
- ✅ Abrir ficha do cliente
- ✅ Editar contato
- ✅ Registrar acompanhamento
- ✅ Exportar CSV WhatsApp
- ✅ Enviar WhatsApp em lote (abre abas)

---

## 🎯 CASOS DE USO PARA TESTAR

### Caso 1: Filtrar Clientes
```
1. Abrir app
2. Selecionar região: "Grande Vitória"
3. Selecionar contrato: "Contrato"
4. Tabela filtra automaticamente
5. ✓ Esperado: Mostra apenas clientes contratados em Grande Vitória
```

### Caso 2: Selecionar em Lote
```
1. Clicar em "Selecionar todos do filtro"
2. Verificar número de selecionados
3. Clicar "Limpar seleção"
4. ✓ Esperado: Seleção funciona
```

### Caso 3: Abrir Ficha do Cliente
```
1. Clicar no nome de um cliente
2. Abre sheet com detalhes
3. Ver histórico mensal
4. Ver contato
5. ✓ Esperado: Sheet abre e mostra dados
```

### Caso 4: Editar Contato
```
1. Na ficha, editar campo "Região"
2. Clicar "Salvar contato"
3. ✓ Esperado: Salva e mostra mensagem de sucesso
```

### Caso 5: Registrar Acompanhamento
```
1. Na ficha, preencher "Resumo do contato"
2. Adicionar "Próximo retorno"
3. Clicar "Registrar contato"
4. ✓ Esperado: Atividade aparece na lista
```

---

## 🔧 DESENVOLVIMENTO

### Após Fazer Alterações

```bash
# Se modificar componentes:
npm run build

# Se modificar estilos:
npm run dev  # recarrega automático

# Se modificar tipos TypeScript:
npx tsc --noEmit

# Se adicionar dependências:
npm install
npm run build
```

### Compilação
```bash
# Verificar erros TypeScript
npx tsc --noEmit

# Build para produção
npm run build

# Limpar build
rm -rf dist .next
npm run build
```

---

## 📊 CONSOLE ERRORS

### Esperado (não é erro)
```
- Modelo não encontrado em dev
- Contatos não carregados (API demo)
- Histórico não disponível
```

### NÃO Esperado (investigar)
```
- Erro de compilação TypeScript
- Crash do componente React
- Network error em requisição válida
```

---

## 🎉 PRÓXIMOS PASSOS APÓS TESTE

### Se Funcionar
```
✅ Pronto para deploy em staging
✅ Pronto para testes com usuários
✅ Pronto para produção (com cuidado)
```

### Se Não Funcionar
```
1. Verificar console (F12)
2. Verificar Network tab
3. Criar issue com screenshot
4. Reproduzir em branch nova
```

---

## 📞 SUPORTE

Se encontrar problemas:

1. **Verificar logs:**
   ```bash
   npm run dev 2>&1 | tee test.log
   ```

2. **Verificar tipos:**
   ```bash
   npx tsc --noEmit
   ```

3. **Limpar cache:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Verificar versão Node:**
   ```bash
   node --version  # deve ser >=22.13.0
   ```

---

**Link de Teste:** http://localhost:5173/

**Começar:** Rode `npm run dev` no terminal!
