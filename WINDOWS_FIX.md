# 🆘 SOLUÇÃO PARA WINDOWS - LEIA ISTO!

## ❌ O que NÃO fazer:

❌ Clique direito no `.ps1` e "Editar"
❌ Clique 2x no `.ps1` se abrir no Bloco de Notas
❌ Tentar rodar via PowerShell se não sabe

---

## ✅ O que FAZER:

### OPÇÃO 1: Forma Mais Fácil (Recomendada)

**Abra o Explorador de Arquivos** (Windows Explorer):

1. Vá para: `c:\Projetos Facul\trabalhoPI5`

2. **Clique 2x em `START.bat`** (não é editor de texto, é para executar!)

3. Aguarde ~30 segundos

4. Serão abertas **2 janelas**:
   - Janela 1: Logs do Docker (muita coisa verde/branca)
   - Janela 2: Servidor Frontend iniciado

5. Seu navegador abre automaticamente

**Se não abrir, acesse manualmente:**
```
http://localhost:5500/html/login.html
```

---

### OPÇÃO 2: Se START.bat não funcionar

Abra **2 terminais Command Prompt** (CMD):

**Terminal 1:**
```
Pressione: Windows + R
Digite: cmd
Pressione: Enter

Copie e cole:
cd /d c:\Projetos Facul\trabalhoPI5
docker-compose up --build
```

Aguarde aparecer:
```
backend-chatai | Backend running on port 3000
```

**Terminal 2 (NOVO/Diferente do primeiro):**
```
Pressione: Windows + R
Digite: cmd
Pressione: Enter

Copie e cole:
cd /d c:\Projetos Facul\trabalhoPI5\frontend-chatAI\front
python -m http.server 5500
```

Aguarde aparecer:
```
Serving HTTP on 0.0.0.0 port 5500
```

**Navegador:**
```
Acesse: http://localhost:5500/html/login.html
```

---

### OPÇÃO 3: Usando os Scripts de Inicialização Separados

**Em 2 terminais diferentes:**

Terminal 1:
```cmd
clique 2x em: c:\Projetos Facul\trabalhoPI5\DOCKER_START.bat
```

Terminal 2:
```cmd
clique 2x em: c:\Projetos Facul\trabalhoPI5\FRONTEND_START.bat
```

Depois acesse:
```
http://localhost:5500/html/login.html
```

---

## 🧪 TESTAR SE FUNCIONOU

### Se tudo está certo:

1. ✅ Abram 2 janelas (Docker + Frontend)
2. ✅ Terminal do Docker mostra muitos logs
3. ✅ Terminal do Frontend mostra "Serving HTTP on..."
4. ✅ http://localhost:5500/html/login.html carrega página com formulário

### Se algo errou:

❌ **Se a página não carrega:**
- Aguarde +30 segundos (primeira vez demora)
- Aperte F5 no navegador
- Se ainda não funcionar, Docker pode estar com erro

❌ **Se Docker está com erro:**
- Feche TODOS os terminais
- Abra Docker Desktop (aplicação)
- Aguarde a ícone ficar azul na bandeja
- Tente novamente

❌ **Se aparecer "Python não encontrado":**
- Instale Python: https://www.python.org/downloads/
- Marque "Add Python to PATH"
- Reinicie o terminal

---

## 🚀 APÓS FUNCIONAR - PRÓXIMOS PASSOS

### 1. Cadastrar Usuário
```
URL: http://localhost:5500/html/cadastro.html

Preencha:
  Nome: Dr. Teste
  Usuário: drteste
  Senha: 123456
  Perfil: MEDICO
  COREN: 12345/SP

Clique: Cadastrar Funcionário
```

### 2. Fazer Login
```
URL: http://localhost:5500/html/login.html

Preencha:
  Usuário: drteste
  Senha: 123456

Clique: Acessar
```

### 3. Explore o Sistema
```
Dashboard → Perfil (editar dados)
          → Histórico (ver triagens)
          → Validação (você é MEDICO)
          → Equipe (lista de usuários)
```

---

## 📊 ACESSOS PRINCIPAIS

| O quê | URL |
|------|-----|
| Login | http://localhost:5500/html/login.html |
| Cadastro | http://localhost:5500/html/cadastro.html |
| Dashboard | http://localhost:5500/html/dashboard.html |
| Perfil | http://localhost:5500/html/profile.html |
| Triagem IA | http://localhost:5500/html/chat.html |
| Histórico | http://localhost:5500/html/history.html |
| Validação | http://localhost:5500/html/appointment.html |
| Equipe | http://localhost:5500/html/funcionarios.html |
| **pgAdmin** | http://localhost:8080 (admin@pgadmin.org / 090106) |

---

## ⚠️ ERROS COMUNS E SOLUÇÕES

### Erro: "Failed to fetch http://localhost:3000/usuarios"

**Causa:** Backend não respondeu

**Solução:**
1. Verifique se Terminal 1 (Docker) está rodando
2. Aguarde +30 segundos
3. Aperte F5 para recarregar página

---

### Erro: "This site can't be reached"

**Causa:** Servidor Frontend não iniciou

**Solução:**
1. Verifique se Terminal 2 mostra "Serving HTTP on..."
2. Se não estiver, execute manualmente:
   ```cmd
   cd c:\Projetos Facul\trabalhoPI5\frontend-chatAI\front
   python -m http.server 5500
   ```
3. Tente outra porta se 5500 está ocupada:
   ```cmd
   python -m http.server 8888
   Depois acesse: http://localhost:8888/html/login.html
   ```

---

### Erro: "docker-compose: command not found"

**Causa:** Docker não instalado ou não está no PATH

**Solução:**
1. Instale Docker Desktop: https://www.docker.com/products/docker-desktop
2. Reinicie o terminal
3. Tente novamente

---

### Erro: "permission denied"

**Solução:**
1. Clique direito no CMD
2. Escolha "Run as administrator"
3. Tente novamente

---

## 🛑 PARA PARAR

### Parar sem perder dados:
```cmd
# Em qualquer terminal rodando docker:
CTRL + C

# Ou execute:
docker-compose down
```

### Parar tudo (riscos de perder dados - não recomendado):
```cmd
docker-compose down -v
```

---

## ✅ CHECKLIST FINAL

- [ ] Docker Desktop está instalado
- [ ] Python está instalado (`python --version` funciona)
- [ ] Consegui executar START.bat ou os 2 terminais
- [ ] Janela Docker mostra "Backend running on port 3000"
- [ ] Janela Frontend mostra "Serving HTTP on 0.0.0.0 port 5500"
- [ ] http://localhost:5500/html/login.html carrega
- [ ] Consegui cadastrar novo usuário
- [ ] Consegui fazer login

Se todos os checkboxes tiverem ✅, seu sistema está **100% funcional!** 🎉

---

**Dúvidas? Siga OPÇÃO 2 passo a passo - é a mais segura!**
