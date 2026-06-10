# 📚 Documentação Completa - HCI Vitta

## 📖 Arquivos de Documentação Criados

### 1. **QUICKSTART.md** ⚡
**Objetivo**: Começar rápido (5 minutos)  
**Leia este primeiro!**
- Como rodar o sistema (automático ou manual)
- Troubleshooting rápido
- URLs e credenciais
- Checklist de validação

**Usar quando**: Quer apenas iniciar e testar rapidinho

---

### 2. **TESTING_GUIDE.md** 🧪
**Objetivo**: Testar tudo completamente
- Fluxo completo de 7 testes
- Teste cadastro, login, perfil, funcionários
- Teste triagem com IA
- Teste validação médica
- Verificação no banco (pgAdmin)
- Testes de erro (edge cases)

**Usar quando**: Quer fazer testes completos e validar cada funcionalidade

---

### 3. **ARQUITETURA.md** 🏗️
**Objetivo**: Entender como o sistema funciona
- Diagrama dos componentes
- Fluxo de dados (7 funcionalidades)
- Schema do banco de dados
- Camadas da aplicação
- Segurança (auth, SQL injection, etc)
- Exemplo de requisição completa

**Usar quando**: Quer entender a arquitetura ou fazer manutenção

---

### 4. **START_SYSTEM.ps1** (PowerShell) 🚀
**Objetivo**: Iniciar tudo com 1 clique
- Script automatizado
- Abre múltiplas janelas
- Verifica Docker
- Mostra resumo de URLs

**Como usar**:
```powershell
cd "c:\Projetos Facul\trabalhoPI5"
.\START_SYSTEM.ps1
```

---

### 5. **START_SYSTEM.bat** (Command Prompt) 🚀
**Objetivo**: Alternativa ao PowerShell
- Simples em batch
- Funciona em Command Prompt

**Como usar**:
```cmd
cd c:\Projetos Facul\trabalhoPI5
START_SYSTEM.bat
```

---

## 🎯 Qual Documento Ler?

```
┌─────────────────────────────────────────────┐
│   Você quer fazer O QUÊ?                    │
├─────────────────────────────────────────────┤
│                                              │
│ "Rodar o sistema agora"                     │
│   └─→ QUICKSTART.md (2 minutos)             │
│                                              │
│ "Testar todas as funcionalidades"           │
│   └─→ TESTING_GUIDE.md (30 minutos)         │
│                                              │
│ "Entender como funciona"                    │
│   └─→ ARQUITETURA.md (15 minutos)           │
│                                              │
│ "Fazer manutenção / Debug"                  │
│   └─→ ARQUITETURA.md + TESTING_GUIDE.md     │
│                                              │
│ "Fazer deploy em produção"                  │
│   └─→ README.md principal                   │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 🚀 5 Passos para Começar

### 1. Abra um terminal PowerShell
```powershell
cd "c:\Projetos Facul\trabalhoPI5"
```

### 2. Execute o startup (escolha um)
```powershell
# Opção A - PowerShell Automático
.\START_SYSTEM.ps1

# Opção B - Manual (mais controle)
docker-compose up --build
```

### 3. Abra outro terminal
```powershell
cd "c:\Projetos Facul\trabalhoPI5\frontend-chatAI\front"
python -m http.server 5500
```

### 4. Acesse no navegador
```
http://localhost:5500/html/login.html
```

### 5. Teste o sistema
Siga o **TESTING_GUIDE.md** para validar cada parte

---

## 📊 Estrutura de Arquivos

```
c:\Projetos Facul\trabalhoPI5\
├── 📄 README.md                  ← Documentação principal
├── 📄 QUICKSTART.md              ← LEIA ISTO PRIMEIRO
├── 📄 TESTING_GUIDE.md           ← Testes completos
├── 📄 ARQUITETURA.md             ← Explicação técnica
│
├── 🚀 START_SYSTEM.ps1           ← Script startup (PowerShell)
├── 🚀 START_SYSTEM.bat           ← Script startup (Batch)
│
├── 📁 backend-chatAI/
│   ├── main.js                   ← Servidor Express
│   └── package.json
│
├── 📁 frontend-chatAI/
│   └── front/
│       ├── html/
│       │   ├── login.html        ← Login
│       │   ├── cadastro.html     ← Novo usuário (NOVO)
│       │   ├── profile.html      ← Editar perfil (ATUALIZADO)
│       │   ├── funcionarios.html ← Lista (ATUALIZADO)
│       │   ├── appointment.html  ← Validação médica (REESCRITO)
│       │   ├── chat.html         ← IA triagem
│       │   └── dashboard.html
│       └── js/
│           ├── app.js            ← Login (ATUALIZADO)
│           ├── cadastro.js       ← Novo usuário (NOVO)
│           ├── profile.js        ← Editar perfil (NOVO)
│           ├── funcionarios.js   ← Lista (NOVO)
│           └── appointment.js    ← Validação (REESCRITO)
│
├── 📁 IA_Engine/
│   ├── api.py
│   └── requirements.txt
│
└── 📁 .github/
    └── docker-compose.yml        ← Orquestração
```

---

## 🎓 Aprenda o Projeto

### Iniciante - "Quero apenas usar"
1. Leia: **QUICKSTART.md**
2. Execute: `.\START_SYSTEM.ps1`
3. Teste: Siga TESTING_GUIDE.md

### Intermediário - "Quero entender"
1. Leia: **ARQUITETURA.md**
2. Estude: Diagramas de fluxo
3. Teste: Cada funcionalidade em TESTING_GUIDE.md

### Avançado - "Quero modificar/manter"
1. Leia: **README.md** completo
2. Estude: **ARQUITETURA.md**
3. Examine: Código em `backend-chatAI/main.js`
4. Teste: Edge cases em TESTING_GUIDE.md

---

## 🆘 Ajuda Rápida

### Sistema não inicia?
→ Veja seção **TROUBLESHOOTING** em **QUICKSTART.md**

### Teste específico falha?
→ Veja passo correspondente em **TESTING_GUIDE.md**

### Não entendo o fluxo?
→ Veja **ARQUITETURA.md** com diagramas

### Frontend não carrega dados?
→ Verifique F12 (DevTools) → Console → Logs de erro

### Banco de dados com problema?
→ Acesse pgAdmin: http://localhost:8080

---

## ✅ Validação Rápida

```bash
# Terminal 1: Inicia containers
cd "c:\Projetos Facul\trabalhoPI5"
docker-compose up --build

# Terminal 2: Inicia frontend
cd "c:\Projetos Facul\trabalhoPI5\frontend-chatAI\front"
python -m http.server 5500

# Terminal 3: Testa backend
curl http://localhost:3000/usuarios

# Navegador:
http://localhost:5500/html/login.html
```

Se tudo responde ✅, o sistema está pronto!

---

## 🎯 Checklist Final

- [ ] Li QUICKSTART.md
- [ ] Rodei `docker-compose up --build`
- [ ] Frontend carrega em http://localhost:5500
- [ ] Consegui cadastrar usuário
- [ ] Consegui fazer login
- [ ] Consegui editar perfil
- [ ] Consegui criar triagem
- [ ] Médico conseguiu validar triagem
- [ ] Dados aparecem em pgAdmin

Todos ✅? **Parabéns, o sistema está 100% operacional!** 🎉

---

## 📞 Documentos por Caso de Uso

| Caso de Uso | Documento | Seção |
|-------------|-----------|-------|
| Iniciar sistema | QUICKSTART.md | Opção 1 ou 2 |
| Cadastrar usuário | TESTING_GUIDE.md | Teste 1 |
| Fazer login | TESTING_GUIDE.md | Teste 2 |
| Editar perfil | TESTING_GUIDE.md | Teste 3 |
| Listar funcionários | TESTING_GUIDE.md | Teste 4 |
| Criar triagem | TESTING_GUIDE.md | Teste 5 |
| Validar triagem | TESTING_GUIDE.md | Teste 6 |
| Entender fluxo | ARQUITETURA.md | Seção 2 |
| Debug de erro | ARQUITETURA.md | + TESTING_GUIDE.md |
| Verificar banco | TESTING_GUIDE.md | Parte 4 |

---

## 🚀 Próximos Passos

1. **Execute**: `.\START_SYSTEM.ps1`
2. **Teste**: Siga TESTING_GUIDE.md
3. **Estude**: Leia ARQUITETURA.md
4. **Customize**: Modifique conforme necessário

---

**Bem-vindo ao HCI Vitta! 🏥**

Dúvidas? Verifique a documentação correspondente acima!
