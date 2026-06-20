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
Preenche formulário (nome, username, senha, perfil, sexo)  ← NOVO: campo sexo obrigatório
         │
         ▼
JavaScript faz POST /usuarios com:
  {
    nome: "...",
    username: "...",
    senha: "...",
    perfil: "MEDICO|ENFERMEIRO|RECEPCIONISTA|ADMINISTRADOR",
    sexo: "FEMININO|MASCULINO|OUTRO|PREFIRO_NAO_INFORMAR",  ← NOVO
    registro_profissional: "..." (opcional)
  }
         │
         ▼
Backend valida dados
         │
         ├─ Se perfil inválido → Retorna erro 400
         ├─ Se sexo inválido → Retorna erro 400
         ├─ Se username/CRM duplicado → Retorna erro 409
         │
         └─ Se válido: 
             1. Faz hash da senha com bcrypt
             2. Insere em tabela usuarios (com sexo)
             3. Retorna status 201
         │
         ▼
Frontend mostra mensagem de sucesso
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
Preenche formulário:
  - CPF do paciente (11 dígitos)              ← NOVO
  - Nome completo do paciente                 ← Novo campo obrigatório
  - Sexo/Gênero do paciente                   ← NOVO: FEMININO|MASCULINO|OUTRO|PREFIRO_NAO_INFORMAR
  - Idade do paciente
  - Sintomas/Anamnese (textarea)
         │
         ▼
JavaScript valida e faz POST /minhaIA-chat com:
  {
    message: "descrição dos sintomas",
    usuario_id: (id do profissional logado),
    nome_paciente: "...",
    cpf: "11111111111",                       ← NOVO
    sexo_paciente: "FEMININO|...",            ← NOVO
    idade_paciente: 45
  }
         │
         ▼
Backend:
  1. Valida campos obrigatórios (CPF, nome, sexo, idade, sintomas)
  2. Envia sintomas para IA Engine (Python)
  3. Recebe diagnóstico_ia do motor RAG
  4. Cria registro em triagens com:
     - usuario_id (profissional)
     - nome_paciente, cpf, sexo_paciente, idade_paciente
     - dados_anamnese = mensagem enviada
     - diagnostico_ia = resposta da IA
     - status = PENDENTE
  5. Retorna triagem criada
         │
         ▼
Frontend exibe resposta da IA com aviso:
  "⚠️ Este diagnóstico foi gerado por IA. Ainda não possui validação médica."
         │
         ▼
Triagem agora aparece em appointment.html (para médicos validarem)
```

---

### ✅ VALIDAÇÃO MÉDICA (MÉDICO VALIDA)

```
MÉDICO acessa appointment.html
         │
         ▼
GET /triagens (busca triagens com status PENDENTE)
         │
         ▼
Exibe triagens pendentes de validação
         │
         ▼
MÉDICO lê dados da triagem:
  - Dados do paciente (nome, CPF, sexo, idade)          ← NOVO: Inclui CPF e sexo
  - Anamnese digitada
  - Diagnóstico sugerido pela IA
         │
         ▼
MÉDICO preenche validação:
  - Diagnóstico Correto (ou confirma o da IA)
  - Observações Clínicas (comentários/feedback)
         │
         ▼
Clica "Aprovar Diagnóstico" ou "Rejeitar / Retificar"
         │
         ▼
POST /triagens/:id/validacao com:
  {
    medico_id: (id do médico logado),
    aprovado: true|false,
    diagnostico_correto: "...",
    observacoes_clinicas: "..."
  }
         │
         ▼
Backend (Transação ACID):
  1. Insere registro em retroalimentacao_medica
  2. TRIGGER automático executa:
     - Se aprovado=true  → UPDATE triagens SET status='APROVADO'
     - Se aprovado=false → UPDATE triagens SET status='REPROVADO'
  3. Retorna status 201
         │
         ▼
Frontend: Recarrega appointment.html (triagem desaparece da lista)
         │
         ▼
Triagem agora em HISTORY.HTML com novo status (APROVADO ou REPROVADO)
```

---

### 👥 LISTAR FUNCIONÁRIOS

```
ADMIN acessa funcionarios.html
         │
         ▼
JavaScript faz GET /usuarios (com header x-usuario-id)
         │
         ▼
Backend retorna array com todos os usuários:
  [
    { id, nome, sexo, username, perfil, registro_profissional, ativo },  ← NOVO: sexo
    { id, nome, sexo, username, perfil, registro_profissional, ativo },
    ...
  ]
         │
         ▼
Frontend renderiza tabela HTML com dados
```

---

## 3️⃣ Banco de Dados (PostgreSQL)

### 📋 Tipos ENUM do Sistema

```sql
-- Perfis/Papéis de usuários
CREATE TYPE perfil_usuario AS ENUM ('RECEPCIONISTA', 'ENFERMEIRO', 'MEDICO', 'ADMINISTRADOR');

-- Estados das triagens no ciclo de vida
CREATE TYPE status_triagem AS ENUM ('PENDENTE', 'APROVADO', 'REPROVADO');

-- Opções de sexo/gênero (conforme formulário)
CREATE TYPE sexo_opcoes AS ENUM ('FEMININO', 'MASCULINO', 'OUTRO', 'PREFIRO_NAO_INFORMAR');
```

### Tabela: usuarios
```sql
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  sexo sexo_opcoes NOT NULL,                    -- NOVO: Campo obrigatório
  username VARCHAR(50) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,             -- bcrypt hashed
  perfil perfil_usuario NOT NULL,               -- ENUM: Tipo de acesso
  registro_profissional VARCHAR(30) UNIQUE,     -- COREN ou CRM
  criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ativo BOOLEAN DEFAULT TRUE
);

-- Índice para login rápido
CREATE INDEX idx_usuarios_username ON usuarios(username);
```

### Tabela: triagens
```sql
CREATE TABLE triagens (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,  -- Quem fez a triagem
  nome_paciente VARCHAR(150) NOT NULL,
  cpf CHAR(11) NOT NULL,                        -- NOVO: Identificação do paciente
  sexo_paciente sexo_opcoes NOT NULL,           -- NOVO: Sexo declarado do paciente
  idade_paciente INT,
  dados_anamnese TEXT NOT NULL,                 -- Queixa/sintomas
  diagnostico_ia TEXT NOT NULL,                 -- Resposta da IA
  classificacao_risco VARCHAR(50),              -- Protocolo (ex: VERMELHA, LARANJA)
  status status_triagem DEFAULT 'PENDENTE',     -- ENUM: Ciclo de vida
  criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Índices para buscas rápidas
CREATE INDEX idx_triagens_status ON triagens(status);
CREATE INDEX idx_triagens_cpf ON triagens(cpf);  -- Histórico rápido do paciente
```

### Tabela: retroalimentacao_medica
```sql
CREATE TABLE retroalimentacao_medica (
  id SERIAL PRIMARY KEY,
  triagem_id INT UNIQUE REFERENCES triagens(id) ON DELETE CASCADE,  -- 1:1 com triagem
  medico_id INT REFERENCES usuarios(id) ON DELETE RESTRICT,         -- Médico que validou
  aprovado BOOLEAN NOT NULL,                    -- true=APROVADO, false=REPROVADO
  diagnostico_correto TEXT,                     -- Diagnóstico correto do médico
  observacoes_clinicas TEXT,                    -- Feedback/comentários
  avaliado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### ⚙️ Trigger: Atualização Automática de Status

```sql
-- Função que atualiza status na triagem após validação médica
CREATE OR REPLACE FUNCTION fn_atualizar_status_triagem()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.aprovado = TRUE THEN
        UPDATE triagens SET status = 'APROVADO' WHERE id = NEW.triagem_id;
    ELSIF NEW.aprovado = FALSE THEN
        UPDATE triagens SET status = 'REPROVADO' WHERE id = NEW.triagem_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Executa a função automaticamente após inserção em retroalimentacao_medica
CREATE TRIGGER trg_apos_inserir_retroalimentacao
AFTER INSERT ON retroalimentacao_medica
FOR EACH ROW
EXECUTE FUNCTION fn_atualizar_status_triagem();
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
