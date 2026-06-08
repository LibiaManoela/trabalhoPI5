# 📋 COMO RODAR E TESTAR - Guia Rápido

## 🚀 OPÇÃO 1: Startup Automático (Mais Fácil)

### Windows - Execute um destes:

**Opção A - PowerShell (Recomendado):**
```powershell
cd "c:\Projetos Facul\trabalhoPI5"
.\START_SYSTEM.ps1
```

**Opção B - Command Prompt:**
```cmd
cd c:\Projetos Facul\trabalhoPI5
START_SYSTEM.bat
```

**O que acontece:**
- ✅ Para containers antigos
- ✅ Inicia Backend, Database, IA Engine em nova janela
- ✅ Inicia Frontend Server em outra janela
- ✅ Abre navegador automaticamente

---

## 🚀 OPÇÃO 2: Startup Manual (Mais Controle)

### Terminal 1 - Iniciar Containers:
```bash
cd "c:\Projetos Facul\trabalhoPI5"
docker-compose up --build
```

### Terminal 2 - Iniciar Frontend:
```bash
cd "c:\Projetos Facul\trabalhoPI5\frontend-chatAI\front"
python -m http.server 5500
```

### Terminal 3 (Opcional) - Monitorar Database:
```bash
docker-compose logs -f database
```

---

## 🌐 ACESSAR O SISTEMA

```
http://localhost:5500/html/login.html
```

---

## 👤 LOGIN PADRÃO (para testes iniciais)

Se precisar de um usuário pré-configurado (verifique no banco):

| Campo | Valor |
|-------|-------|
| Usuário | usuario |
| Senha | senha |
| Ou: | (cadastre um novo) |

---

## 📊 FERRAMENTAS EXTRAS

### PgAdmin - Consultar Banco
```
http://localhost:8080
Login: admin@pgadmin.org
Senha: 090106
```

### Backend API Docs (se usar Swagger)
```
http://localhost:3000/usuarios
```

---

## 🧪 FLUXO DE TESTE COMPLETO (5 minutos)

1. **Acesse**: http://localhost:5500/html/login.html
2. **Cadastre novo usuário** → cadastro.html
3. **Faça login** com novo usuário
4. **Vá para Perfil** → edite dados
5. **Crie uma triagem** → chat.html
6. **Como MÉDICO, valide** → appointment.html
7. **Verifique histórico** → history.html

---

## ⚠️ TROUBLESHOOTING

### Frontend não carrega
```
1. Verifique se Python está instalado: python --version
2. Verifique se porta 5500 está livre: netstat -ano | findstr :5500
3. Tente outro terminal ou outra porta:
   python -m http.server 8888
   Então: http://localhost:8888/html/login.html
```

### Backend não responde
```
1. Verifique logs: docker-compose logs backend-chatAI
2. Verifique se porta 3000 está livre: netstat -ano | findstr :3000
3. Reinicie: docker-compose restart backend-chatAI
```

### Database não conecta
```
1. Verifique se PostgreSQL iniciou: docker-compose logs database
2. Reinicie: docker-compose restart database
3. Se perder dados, limpe volume: docker-compose down -v
```

### Dados antigos aparecem
```
# Limpar TUDO e recomeçar:
docker-compose down -v
docker-compose up --build
```

---

## 🛑 PARAR O SISTEMA

### Terminal com docker-compose:
```bash
Ctrl + C
```

### Ou em outro terminal:
```bash
docker-compose down
```

### Para limpar tudo (CUIDADO - perde dados):
```bash
docker-compose down -v
```

---

## 📖 TESTES DETALHADOS

Para guia completo de testes com todos os casos de uso:

👉 **Veja: [TESTING_GUIDE.md](TESTING_GUIDE.md)**

---

## ✅ Checklist Rápido

- [ ] Docker Desktop está rodando
- [ ] `docker-compose up --build` funciona
- [ ] Frontend carrega em http://localhost:5500
- [ ] Consegue cadastrar novo usuário
- [ ] Consegue fazer login
- [ ] Consegue editar perfil
- [ ] Consegue criar triagem
- [ ] MÉDICO consegue validar triagem

Se todos os itens passarem ✅, o sistema está 100% pronto!

---

## 📱 URLs Importantes

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost:5500/html/login.html | Interface Web |
| Backend | http://localhost:3000 | API REST |
| pgAdmin | http://localhost:8080 | Gestor de Database |
| IA Engine | http://localhost:5000 | Motor de Triagem (Python) |
| Database | localhost:5432 | PostgreSQL (sem web) |

---

## 🔐 Credenciais Padrão

| Sistema | Usuário | Senha |
|---------|---------|-------|
| pgAdmin | admin@pgadmin.org | 090106 |
| PostgreSQL | postgres | 090106 |
| App (novo) | Cadastre via cadastro.html | - |

---

Dúvidas? Verifique os logs ou consulte [TESTING_GUIDE.md](TESTING_GUIDE.md) 📚
