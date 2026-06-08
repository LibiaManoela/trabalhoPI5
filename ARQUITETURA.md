# 🏗️ ARQUITETURA DO SISTEMA HCI Vitta

## 1️⃣ Componentes Principais

```
┌─────────────────────────────────────────────────────────────┐
│                     NAVEGADOR DO USUÁRIO                    │
│                 (localhost:5500 - Frontend)                 │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/JSON
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              NODE.JS EXPRESS BACKEND                         │
│              (localhost:3000)                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Endpoints:                                            │  │
│  │  POST /login         - Autentica usuário             │  │
│  │  POST /usuarios      - Cadastra novo usuário         │  │
│  │  PUT /usuarios/:id   - Edita usuário                 │  │
│  │  GET /usuarios       - Lista usuários                │  │
│  │  GET /usuarios/:id   - Busca usuário específico      │  │
│  │  POST /triagem       - Cria triagem                  │  │
│  │  GET /triagens       - Lista triagens                │  │
│  │  POST /triagens/:id/validacao - Valida triagem       │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │ Query SQL
                   ▼
┌─────────────────────────────────────────────────────────────┐
│            POSTGRESQL DATABASE                               │
│            (localhost:5432)                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tabelas:                                              │  │
│  │  ├─ usuarios (nome, username, perfil, etc)          │  │
│  │  ├─ triagens (nome_paciente, diagnóstico, etc)      │  │
│  │  └─ retroalimentacao_medica (validações)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ Fluxo de Dados por Funcionalidade

### 📝 CADASTRO DE USUÁRIO

```
Usuário acessa cadastro.html
         │
         ▼
Preenche formulário (nome, username, senha, perfil)
         │
         ▼
JavaScript faz POST para /usuarios
         │
         ▼
Backend valida dados
         │
         ├─ Se válido: Faz hash da senha com bcrypt
         │   Insere em tabela usuarios
         │   Retorna status 201
         │
         └─ Se inválido: Retorna erro 400/409
         │
         ▼
Frontend mostra mensagem de sucesso ou erro
```

---

### 🔐 LOGIN

```
Usuário acessa login.html
         │
         ▼
Digita username e senha
         │
         ▼
JavaScript faz POST /login com {usuario, senha}
         │
         ▼
Backend:
  1. Busca usuário na tabela usuarios
  2. Compara senha com hash usando bcrypt.compare()
  3. Se válido: Retorna {isValid: true, usuario: {...}}
  
         ▼
Frontend:
  1. Salva dados em localStorage (usuarioId, usuarioNome, etc)
  2. Redireciona para dashboard.html
```

---

### ✏️ EDIÇÃO DE PERFIL

```
Usuário em profile.html
         │
         ▼
GET /usuarios/:id (carrega dados)
         │
         ▼
Formulário exibe dados (nome/username readonly, outros editáveis)
         │
         ▼
Usuário edita campos (senha, registro_profissional, etc)
         │
         ▼
PUT /usuarios/:id com {campos que mudaram}
         │
         ▼
Backend:
  1. Se tem 'senha': faz hash com bcrypt
  2. Atualiza apenas campos enviados
  3. Retorna usuário atualizado
         │
         ▼
Frontend mostra "Perfil atualizado com sucesso!"
```

---

### 💬 CRIAR TRIAGEM (COM IA)

```
Usuário em chat.html
         │
         ▼
Digita sintomas (ex: "febre 39.5°C, dor de garganta")
         │
         ▼
JavaScript faz POST /gemini-chat com {mensagem}
         │
         ▼
Backend:
  1. Cria registro em tabela triagens
  2. Salva: nome_paciente, idade, dados_anamnese, usuario_id
  3. Chama IA Engine (Python API)
  4. Recebe: diagnostico_ia, classificacao_risco
  5. Salva na triagem e retorna tudo
         │
         ▼
Frontend exibe resposta da IA + triagem criada
         │
         ▼
Triagem aparece em history.html com status PENDENTE
```

---

### ✅ VALIDAÇÃO MÉDICA (MÉDICO VALIDA)

```
MÉDICO acessa appointment.html
         │
         ▼
GET /triagens (busca triagens pendentes)
         │
         ▼
Exibe triagens com status = PENDENTE
         │
         ▼
MÉDICO lê diagnóstico IA e preenche:
  - Diagnóstico Correto (field)
  - Observações Clínicas (textarea)
         │
         ▼
Clica "Aprovar" ou "Rejeitar"
         │
         ▼
POST /triagens/:id/validacao com:
  {
    medico_id: [id do médico logado],
    aprovado: true/false,
    diagnostico_correto: "...",
    observacoes_clinicas: "..."
  }
         │
         ▼
Backend (transação):
  1. Cria registro em retroalimentacao_medica
  2. Atualiza status da triagem:
     - Se aprovado=true  → status = APROVADO
     - Se aprovado=false → status = REPROVADO_CORRIGIDO
  3. Se erro: rollback (tudo ou nada)
         │
         ▼
Frontend: Recarrega página (triagem desaparece)
         │
         ▼
Triagem agora em HISTORY.HTML com novo status
```

---

### 👥 LISTAR FUNCIONÁRIOS

```
Usuário acessa funcionarios.html
         │
         ▼
JavaScript faz GET /usuarios
         │
         ▼
Backend retorna array com todos os usuários:
  [
    { id, nome, username, perfil, registro_profissional, ativo, criado_em },
    { id, nome, username, perfil, registro_profissional, ativo, criado_em },
    ...
  ]
         │
         ▼
Frontend renderiza tabela HTML com dados
```

---

## 3️⃣ Banco de Dados (PostgreSQL)

### Tabela: usuarios
```sql
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR NOT NULL,
  username VARCHAR UNIQUE NOT NULL,
  senha_hash VARCHAR NOT NULL,        -- bcrypt hashed
  perfil ENUM('RECEPCIONISTA', 'ENFERMEIRO', 'MEDICO', 'ADMINISTRADOR'),
  registro_profissional VARCHAR,      -- COREN ou CRM
  criado_em TIMESTAMP DEFAULT NOW(),
  ativo BOOLEAN DEFAULT TRUE
);
```

### Tabela: triagens
```sql
CREATE TABLE triagens (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios,
  nome_paciente VARCHAR,
  idade_paciente INTEGER,
  dados_anamnese TEXT,               -- queixa do paciente
  diagnostico_ia VARCHAR,            -- resposta da IA
  classificacao_risco VARCHAR,       -- VERMELHA, LARANJA, etc
  status ENUM('PENDENTE', 'APROVADO', 'REPROVADO_CORRIGIDO'),
  criado_em TIMESTAMP DEFAULT NOW()
);
```

### Tabela: retroalimentacao_medica
```sql
CREATE TABLE retroalimentacao_medica (
  id SERIAL PRIMARY KEY,
  triagem_id INTEGER UNIQUE REFERENCES triagens,
  medico_id INTEGER REFERENCES usuarios,
  aprovado BOOLEAN,                  -- true/false
  diagnostico_correto VARCHAR,       -- o que o médico disse
  observacoes_clinicas TEXT,         -- comentários
  avaliado_em TIMESTAMP DEFAULT NOW()
);
```

---

## 4️⃣ Camadas da Aplicação

### 🎨 Frontend Layer (JavaScript Vanilla)
- **Localização**: `frontend-chatAI/front/`
- **Responsabilidades**:
  - Capturar entrada do usuário
  - Validação client-side
  - Fazer requisições HTTP
  - Renderizar UI
  - Gerenciar localStorage (session)
- **Sem framework**: HTML + CSS + Vanilla JS (Fetch API)

### 🔌 Backend Layer (Node.js Express)
- **Localização**: `backend-chatAI/main.js`
- **Responsabilidades**:
  - Receber requisições HTTP
  - Validar dados
  - Executar queries SQL
  - Hashing de senhas (bcrypt)
  - Transações (para validação)
  - Retornar JSON
- **Tecnologia**: Express.js, pg (driver PostgreSQL), bcryptjs

### 💾 Database Layer (PostgreSQL)
- **Localização**: Container Docker
- **Responsabilidades**:
  - Persistir dados
  - Garantir integridade (constraints, FK)
  - Executar queries SQL
  - Manter relacionamentos

### 🤖 IA Layer (Python FastAPI)
- **Localização**: `IA_Engine/api.py`
- **Responsabilidades**:
  - Processar sintomas
  - Gerar diagnóstico com modelo LLM
  - Retornar classificação de risco
- **Tecnologia**: FastAPI, llama-index, ChromaDB, Mistral

---

## 5️⃣ Segurança

### 🔐 Autenticação
```
1. Senha armazenada como HASH (bcrypt - 10 rounds)
2. Nunca armazenada em plaintext
3. Comparação com bcrypt.compare()
4. localStorage mantém SESSION (não senha)
```

### 🛡️ Autorização
```
1. Verificação de perfil em appointment.html
   (apenas MEDICO pode validar)
2. Backend valida usuario_id antes de retornar dados
3. Transações garantem atomicidade
```

### 🚨 Injeção SQL
```
1. Todas queries usam prepared statements ($1, $2, etc)
2. Nunca concatenar strings nas queries
3. pg driver sanitiza automaticamente
```

---

## 6️⃣ Fluxo de Startup (Docker)

```
docker-compose up --build
    │
    ├─ Cria/inicia Container: database (PostgreSQL)
    │   └─ Executa schema SQL inicial
    │
    ├─ Cria/inicia Container: pgadmin
    │   └─ Interface web para gerenciar database
    │
    ├─ Cria/inicia Container: ia_engine
    │   └─ Python FastAPI rodando em http://0.0.0.0:5000
    │
    └─ Cria/inicia Container: backend-chatAI
        └─ Node.js Express rodando em http://0.0.0.0:3000
            └─ Conecta ao banco (DB_HOST=database)

Frontend (separado):
    python -m http.server 5500
    └─ Serve arquivos HTML/CSS/JS em http://localhost:5500
```

---

## 7️⃣ Variáveis de Ambiente

### `backend-chatAI/.env` (ou docker-compose.yml)
```
DB_USER=postgres
DB_PASSWORD=090106
DB_HOST=database (dentro do Docker) ou localhost (local)
DB_PORT=5432
DB_NAME=hcivitta_db
IA_ENGINE_URL=http://ia_engine:5000 (dentro Docker) ou http://localhost:5000 (local)
```

---

## 8️⃣ Exemplo: Requisição Completa

### POST /usuarios (Cadastro)

```javascript
// Frontend envia:
fetch('http://localhost:3000/usuarios', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: "Dr. João",
    username: "joao.silva",
    senha: "senha123",      // PLAINTEXT (será hasheada)
    perfil: "MEDICO",
    registro_profissional: "12345/SP"
  })
});

// Backend recebe e processa:
app.post('/usuarios', async (req, res) => {
  const { nome, username, senha, perfil, registro_profissional } = req.body;
  
  // Validação
  if (!nome || !username || !senha || !perfil) {
    return res.status(400).json({ error: 'Campos obrigatórios' });
  }
  
  // Hashing
  const senhaHash = bcrypt.hashSync(senha, 10);  // ← Bcrypt aqui!
  
  // SQL Seguro (prepared statement)
  const result = await pool.query(
    `INSERT INTO usuarios (nome, username, senha_hash, perfil, registro_profissional, ativo)
     VALUES ($1, $2, $3, $4, $5, TRUE)
     RETURNING id, nome, username, perfil, registro_profissional, ativo`,
    [nome, username, senhaHash, perfil, registro_profissional || null]
  );
  
  // Retorna sucesso
  res.status(201).json({ usuario: result.rows[0] });
});

// Frontend recebe resposta:
{
  "usuario": {
    "id": 3,
    "nome": "Dr. João",
    "username": "joao.silva",
    "perfil": "MEDICO",
    "registro_profissional": "12345/SP",
    "ativo": true
  }
}
```

---

## 9️⃣ Melhorias Futuras Possíveis

- [ ] JWT tokens para melhor autenticação
- [ ] API docs com Swagger
- [ ] Logs centralizados
- [ ] Caching com Redis
- [ ] Testes automatizados (Jest + Supertest)
- [ ] Rate limiting
- [ ] HTTPS/TLS em produção
- [ ] CI/CD pipeline
- [ ] Monitoramento (Prometheus/Grafana)
- [ ] Backup automático do banco

---

**Sistema completo e documentado! 🎉**
