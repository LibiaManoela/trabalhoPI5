# 🎯 COMECE AQUI - Windows Users

## 👉 3 Passos para Rodar Tudo

### Passo 1: Abra 2 Terminais (Command Prompt)

**Terminal 1:**
```
Pressione: Windows + R
Digite: cmd
Pressione: Enter
```

**Terminal 2:**
```
Pressione: Windows + R (de novo)
Digite: cmd
Pressione: Enter
```

Agora você tem 2 janelas de terminal abertas.

---

### Passo 2: No Terminal 1, Execute (copie e cole):

```cmd
cd /d c:\Projetos Facul\trabalhoPI5
docker-compose up --build
```

**Aguarde até aparecer:**
```
backend-chatai | Backend running on port 3000
```

**NÃO feche este terminal!** Deixe rodando.

---

### Passo 3: No Terminal 2, Execute (copie e cole):

```cmd
cd /d c:\Projetos Facul\trabalhoPI5\frontend-chatAI\front
python -m http.server 5500
```

**Aguarde até aparecer:**
```
Serving HTTP on 0.0.0.0 port 5500
```

**NÃO feche este terminal!** Deixe rodando.

---

## 🌐 Pronto! Acesse no Navegador:

```
http://localhost:5500/html/login.html
```

---

## 🚀 Primeiro Teste

### Cadastre um usuário:
1. Clique em "Não tem conta?" ou vá para: http://localhost:5500/html/cadastro.html
2. Preencha:
   ```
   Nome: Dr. Teste
   Usuário: drteste
   Senha: 123456
   Perfil: MEDICO
   ```
3. Clique "Cadastrar Funcionário"
4. Se funcionar ✅, o sistema está pronto!

---

## ❌ Problemas?

### "Python não encontrado"
```
Instale: https://www.python.org/downloads/
(marque "Add Python to PATH")
Reinicie o terminal
```

### "Docker não encontrado"
```
Instale: https://www.docker.com/products/docker-desktop
Reinicie o terminal
```

### "Página não carrega"
```
Aguarde 30 segundos
Aperte F5 no navegador
Verifique se ambos terminais estão com logs
```

### "Backend responde mas frontend não conecta"
```
Abra F12 no navegador → Console → veja o erro
Geralmente é porque backend ainda está iniciando
Aguarde +20 segundos e recarregue (F5)
```

---

## 📖 Mais Detalhes?

- **Tudo não funciona?** → Leia: `WINDOWS_FIX.md`
- **Quer testar todas funcionalidades?** → Leia: `TESTING_GUIDE.md`
- **Quer entender a arquitetura?** → Leia: `ARQUITETURA.md`

---

## 🛑 Para Parar

**Em ambos terminais:**
```
Pressione: CTRL + C
```

---

**Pronto! Sistema rodando! 🎉**
