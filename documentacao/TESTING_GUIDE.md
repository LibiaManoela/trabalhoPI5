# 🚀 Guia Completo: Como Rodar e Testar o Sistema HCI Vitta

## PARTE 1: EXECUTAR O SISTEMA

### Pré-requisitos
- ✅ Docker Desktop instalado e rodando
- ✅ Docker Compose instalado
- ✅ Git (para clonar/controlar versão)

### Passo 1: Iniciar todos os serviços

```bash
cd "c:\Projetos Facul\trabalhoPI5"
docker-compose up --build
```

**O que acontece:**
- 🐘 PostgreSQL 15 inicia na porta 5432
- 🎛️ pgAdmin inicia na porta 8080 (admin: admin@pgadmin.org / 090106)
- 🤖 IA Engine inicia na porta 5000
- 🔌 Backend Node.js inicia na porta 3000
- 📋 Database se carrega com schema inicial

**Saída esperada (aguarde ~30 segundos):**
```
database | LOG:  database system is ready to accept connections
ia_engine | INFO:  * Running on http://0.0.0.0:5000
backend-chatai | Backend running on port 3000
```

### Passo 2: Testar conectividade (sem fechar o terminal anterior)

Abra outro terminal PowerShell:

```bash
# Testar Backend
curl http://localhost:3000/usuarios

# Testar IA Engine
curl http://localhost:5000/status

# Testar pgAdmin
Start-Process http://localhost:8080
```

---

## PARTE 2: TESTAR O FRONTEND

### Opção A:

**Acesse no navegador:**
```
http://localhost:5500/html/login.html
```

### Opção B: VSCode Live Server
- Clique direito em `login.html` → "Open with Live Server"

---

## PARTE 3: FLUXO COMPLETO DE TESTES

### 🔐 TESTE 1: Cadastro de Novo Usuário

1. **Acesse**: http://localhost:5500/html/cadastro.html

2. **Preencha o formulário:**
   ```
   Nome Completo: Dr. João Silva
   Usuário: joao.silva
   Senha: senha123
   Confirmar Senha: senha123
   Perfil: MEDICO
   COREN/CRM: 12345/SP
   ```

3. **Clique**: "Cadastrar Funcionário"

4. **Resultado esperado**: 
   - ✅ Mensagem: "Usuário Dr. João Silva cadastrado com sucesso!"
   - ✅ Redireciona para funcionarios.html (2 segundos)

5. **Verifique**: Lista de funcionários mostra novo usuário

---

### 🔐 TESTE 2: Login e Acesso ao Perfil

1. **Acesse**: http://localhost:5500/html/login.html

2. **Login com novo usuário:**
   ```
   Usuário: joao.silva
   Senha: senha123
   ```

3. **Clique**: "Acessar"

4. **Resultado esperado**:
   - ✅ Alert: "Login bem-sucedido!"
   - ✅ Redireciona para dashboard.html
   - ✅ localStorage contém: usuarioId, usuarioNome, usuarioPerfil

5. **Clique** em "Perfil" na navegação

6. **Verifique os dados carregados:**
   ```
   Nome: Dr. João Silva
   Usuário: joao.silva
   Perfil: MEDICO
   COREN/CRM: 12345/SP
   Data de Cadastro: [data atual]
   ```

---

### ✏️ TESTE 3: Editar Perfil

1. **Na página de perfil**, preencha:
   ```
   Nova Senha: novasenha456
   Confirmar Senha: novasenha456
   COREN/CRM: 99999/RJ (novo valor)
   ```

2. **Clique**: "Salvar Alterações"

3. **Resultado esperado**:
   - ✅ Mensagem: "Perfil atualizado com sucesso!"
   - ✅ Página recarrega automaticamente
   - ✅ Novo COREN exibido

4. **Teste nova senha**:
   - Clique "Sair"
   - Faça login com:
     ```
     Usuário: joao.silva
     Senha: novasenha456
     ```
   - ✅ Deve funcionar!

---

### 👥 TESTE 4: Listagem de Funcionários

1. **Acesse**: http://localhost:5500/html/funcionarios.html

2. **Verifique tabela:**
   - Deve listar todos os usuários cadastrados
   - Colunas: Nome, Perfil, Usuário, Registro Profissional, Status
   - Botão "+ Novo Funcionário" funciona

3. **Adicione outro usuário:**
   - Clique "+ Novo Funcionário"
   - Cadastre como ENFERMEIRO (pode ter COREN também)
   - Volte à listagem
   - ✅ Novo usuário aparece na tabela

---

### 💬 TESTE 5: Criar uma Triagem (IA)

1. **Acesse**: http://localhost:5500/html/chat.html

2. **Na seção de chat, envie mensagem:**
   ```
   "Paciente com febre alta (39.5°C), dor de garganta e tosse"
   ```

3. **Resultado esperado**:
   - ✅ IA responde com diagnóstico preliminar
   - ✅ Triagem é criada no banco de dados (status: PENDENTE)
   - ✅ Triagem aparece no histórico

4. **Verifique no histórico**:
   - Clique em "Histórico de Admissões"
   - Deve ver a triagem com diagnóstico IA

---

### ✅ TESTE 6: Validação Médica (CRÍTICO)

**Pré-requisito**: Faça login como MEDICO (joao.silva)

1. **Acesse**: http://localhost:5500/html/appointment.html

2. **Verifique triagem pendente**:
   - Deve carregar a triagem criada no TESTE 5
   - Exibe: Nome paciente, idade, diagnóstico IA, classificação de risco

3. **Formulário de validação:**
   ```
   Diagnóstico Correto: Faringite Aguda
   Observações: Paciente responsivo, responde bem ao tratamento inicial
   ```

4. **Clique**: "✓ Aprovar Diagnóstico"

5. **Resultado esperado**:
   - ✅ Alert: "Diagnóstico aprovado com sucesso!"
   - ✅ Página recarrega
   - ✅ Triagem desaparece (status mudou para APROVADO)

6. **Teste rejeição** (crie outra triagem antes):
   - Na nova triagem, clique "✗ Rejeitar / Retificar"
   - Preencha diagnóstico correto
   - ✅ Status muda para REPROVADO_CORRIGIDO

---

## PARTE 4: VERIFICAR DADOS NO BANCO

### Acessar pgAdmin

```
URL: http://localhost:8080
Login: admin@pgadmin.org / 090106
```

1. **Conectar ao servidor:**
   - Left side: "Add New Server"
   - Host: database
   - Port: 5432
   - User: postgres
   - Password: 090106
   - DB: hcivitta_db

2. **Verificar tabelas:**

   **Usuários cadastrados:**
   ```sql
   SELECT id, nome, username, perfil, ativo FROM usuarios ORDER BY criado_em DESC;
   ```

   **Triagens criadas:**
   ```sql
   SELECT id, nome_paciente, diagnostico_ia, classificacao_risco, status FROM triagens;
   ```

   **Validações médicas:**
   ```sql
   SELECT t.id, t.nome_paciente, r.aprovado, r.diagnostico_correto, r.status 
   FROM triagens t
   LEFT JOIN retroalimentacao_medica r ON t.id = r.triagem_id;
   ```

---

## PARTE 5: TESTES DE ERRO (Validação)

### ❌ TESTE 7: Tentativas de Erro

#### A. Cadastro com erro
- **Tente cadastrar** com username já existente
  - ✅ Deve retornar: "Usuário ou registro profissional já existe."

#### B. Login inválido
- **Tente login** com senha errada
  - ✅ Deve mostrar: "Usuário ou senha incorretos."

#### C. Validação sem ser MEDICO
- **Login como ENFERMEIRO** (não-médico)
- **Acesse** appointment.html
  - ✅ Deve mostrar: "Acesso negado: Apenas médicos podem validar triagens."

#### D. Formulários incompletos
- **Cadastro** sem nome
  - ✅ Deve validar no frontend: "Preencha todos os campos obrigatórios."

---

## PARTE 6: PARAR O SISTEMA

No terminal onde rodou `docker-compose up`:

```bash
# Parar todos os containers (sem perder dados)
Ctrl + C

# ou em outro terminal:
docker-compose down

# Se quiser limpar TUDO (cuidado - perde dados):
docker-compose down -v
```

---

## TROUBLESHOOTING

### ❓ Backend não inicia
```bash
# Verificar logs
docker-compose logs backend-chatAI

# Comum: porta 3000 já em uso
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

### ❓ Frontend não carrega dados
```bash
# Verificar console do navegador (F12)
# Verificar se backend está rodando: curl http://localhost:3000/usuarios
# Verificar localStorage: localStorage.getItem('usuarioId')
```

### ❓ Banco de dados não conecta
```bash
# Reiniciar postgres
docker-compose restart database

# Verificar senha
# Default: 090106
```

### ❓ Dados antigos aparecem
```bash
# Limpar volume do postgres
docker-compose down -v
docker-compose up --build
```

---

## RESUMO: Checklist Completo

- [ ] `docker-compose up --build` executa sem erros
- [ ] Backend responde em http://localhost:3000/usuarios
- [ ] Frontend carrega em http://localhost:5500/html/login.html
- [ ] Cadastro de novo usuário funciona
- [ ] Login com novo usuário funciona
- [ ] Perfil carrega dados corretos
- [ ] Edição de perfil salva mudanças
- [ ] Listagem de funcionários mostra todos os usuários
- [ ] Triagem de IA cria registro no banco
- [ ] Médico consegue validar triagem
- [ ] Status da triagem muda após validação
- [ ] pgAdmin mostra tabelas com dados corretos

Quando todos os checkboxes estiverem ✅, o sistema está **100% pronto para uso!**
