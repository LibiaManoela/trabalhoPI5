# 🚀 COMO RODAR NO WINDOWS - Guia Simples

## ⚡ FORMA MAIS FÁCIL (Recomendado)

### Passo 1: Abra o Explorador de Arquivos
```
Windows Explorer → Vá para: c:\Projetos Facul\trabalhoPI5
```

### Passo 2: Dê 2 cliques em `START.bat`
- Arquivo: `START.bat`
- **Não é para abrir com editor, é para clicar 2x normalmente!**

### Passo 3: Aguarde (~30 segundos)
Você verá:
- ✅ Uma janela preta (logs do Docker)
- ✅ Outra janela com "Iniciando servidor Frontend"
- ✅ Navegador abre automaticamente em http://localhost:5500

**Pronto! O sistema está rodando.** ✅

---

## 🚨 Se o navegador NÃO abrir automaticamente

### Teste 1: Acesse manualmente
Abra seu navegador (Chrome, Edge, Firefox) e digite:
```
http://localhost:5500/html/login.html
```

Se funcionar, ótimo! ✅

### Teste 2: Se aparecer erro "Não foi possível conectar"

**Verifique se a janela do Frontend está rodando:**
- Você deve ver 2 janelas de console abertas
- Uma com logs do Docker (muitas linhas)
- Outra com "Iniciando servidor Frontend"

**Se a janela do Frontend fechou:**

Abra Command Prompt manualmente e execute:
```cmd
cd c:\Projetos Facul\trabalhoPI5\frontend-chatAI\front
python -m http.server 5500
```

Se aparecer:
```
Serving HTTP on 0.0.0.0 port 5500 (http://0.0.0.0:5500/)
```

✅ **Deu certo!** Agora acesse: http://localhost:5500/html/login.html

---

## 🔧 PLANO B: Se START.bat não funcionar

### Opção 1: Executar manualmente em 3 terminais

**Terminal 1 - Docker:**
```cmd
cd c:\Projetos Facul\trabalhoPI5
docker-compose up --build
```

Aguarde até ver:
```
backend-chatai | Backend running on port 3000
```

**Terminal 2 - Frontend Server:**
```cmd
cd c:\Projetos Facul\trabalhoPI5\frontend-chatAI\front
python -m http.server 5500
```

Deve aparecer:
```
Serving HTTP on 0.0.0.0 port 5500
```

**Terminal 3 - Navegador:**
```
http://localhost:5500/html/login.html
```

---

## ❌ Problemas Comuns

### ❓ "Python não é reconhecido como comando"

Você precisa instalar Python. Faça:

```cmd
# Verifique se Python está instalado
python --version

# Se não estiver:
# 1. Baixe de: https://www.python.org/downloads/
# 2. Instale marcando "Add Python to PATH"
# 3. Reinicie o Command Prompt
```

---

### ❓ "Docker não está rodando"

```cmd
# Verifique:
docker --version

# Se aparecer erro, inicie o Docker Desktop:
# 1. Abra aplicações
# 2. Procure "Docker Desktop"
# 3. Clique para iniciar
# 4. Espere a ícone na bandeja ficar azul
# 5. Tente novamente
```

---

### ❓ "Porta 5500 já está em uso"

Outra aplicação está usando a porta. Tente:

```cmd
# Use outra porta:
python -m http.server 8888

# Depois acesse:
http://localhost:8888/html/login.html
```

---

### ❓ Frontend carrega mas mostra erro "Erro ao conectar"

Verifique o console do navegador (F12):

1. Abra http://localhost:5500/html/login.html
2. Clique F12 (Developer Tools)
3. Clique na aba "Console"
4. Veja as mensagens de erro

**Comum:**
```
Failed to fetch http://localhost:3000/usuarios
```

**Solução:** Backend não está rodando
- Verifique se Docker iniciou (Terminal 1)
- Aguarde mais ~20 segundos
- Recarregue a página (F5)

---

### ❓ Docker não inicia ou dá erro

```cmd
# Tente:
docker-compose down -v
docker-compose up --build

# Se ainda falhar:
# 1. Reinicie o Docker Desktop
# 2. Aguarde ~1 minuto
# 3. Tente novamente
```

---

## ✅ Checklist de Validação

Quando tudo estiver funcionando, você verá:

- [ ] **Janela 1 (Docker)**: Muitos logs coloridos, última linha com "Backend running on port 3000"
- [ ] **Janela 2 (Frontend)**: "Serving HTTP on 0.0.0.0 port 5500"
- [ ] **Navegador**: http://localhost:5500/html/login.html carrega com formulário de login
- [ ] **Teste**: Digite qualquer coisa no login e clique - se mostrar erro, é porque backend respondeu ✅

Se todos os itens ✅, o sistema está **100% funcionando**!

---

## 🎯 Próximos Passos

### 1. Cadastrar novo usuário
```
URL: http://localhost:5500/html/cadastro.html
Nome: Dr. Teste
Usuário: drteste
Senha: senha123
Perfil: MEDICO
Clicar: Cadastrar Funcionário
```

### 2. Fazer login
```
URL: http://localhost:5500/html/login.html
Usuário: dreste
Senha: senha123
Clicar: Acessar
```

### 3. Explorar sistema
```
Dashboard → Perfil → Histórico → Validação → Equipe
```

---

## 📞 Ainda não funciona?

Se nenhuma das soluções acima funcionou:

1. **Descreva o erro exato** que você vê
2. **Print do console** (F12 → Console)
3. **Print da janela do Docker** (logs)
4. **Sistema operacional** (Windows 10/11?)
5. **Versões instaladas**:
   ```cmd
   python --version
   node --version
   docker --version
   ```

---

## 🛑 Como Parar o Sistema

### Parar sem perder dados:
```cmd
# Em qualquer terminal:
docker-compose down
```

### Parar e perder tudo (resetar):
```cmd
# ⚠️ CUIDADO - Apaga dados:
docker-compose down -v
```

---

## 📋 Resumen Rápido

| Problema | Solução |
|----------|---------|
| START.bat não funciona | Clique 2x (não editor), se abrir bloco de notas, clique direito → "Run as administrator" |
| Frontend não carrega | Aguarde 30 segundos, F5 para recarregar |
| Backend não responde | Verifique janela Docker, pode estar iniciando ainda |
| Porta ocupada | Use outra porta: `python -m http.server 8888` |
| Python não existe | Instale de https://www.python.org/downloads/ |
| Docker não existe | Instale de https://www.docker.com/products/docker-desktop |

---

**Dúvidas? Execute `START.bat` e tudo acontece automaticamente! 🚀**
