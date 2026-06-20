// validação do Login
async function login() {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");

    errorMessage.textContent = '';

    if (!user || !pass) {
        errorMessage.textContent = 'Preencha usuário e senha antes de continuar.';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                usuario: user,
                senha: pass,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            errorMessage.textContent = data.error || 'Erro ao conectar com o servidor de login.';
            return;
        }

        if (data.isValid === true && data.usuario) {
            localStorage.setItem('usuarioId', data.usuario.id);
            localStorage.setItem('usuarioNome', data.usuario.nome);
            localStorage.setItem('usuarioPerfil', data.usuario.perfil);
            localStorage.setItem('usuarioUsername', data.usuario.username);
            localStorage.setItem('usuarioRegistro', data.usuario.registro_profissional || '');

            alert("Login bem-sucedido!");
            window.location.href = '/html/dashboard.html';
            return;
        }

        errorMessage.textContent = data.error || 'Usuário ou senha incorretos.';
    } catch (error) {
        console.error('Login fetch error:', error);
        errorMessage.textContent = 'Não foi possível conectar ao servidor de autenticação.';
    }
}

// Mostrar modal de confirmação de logout
function mostrarConfirmacaoLogout() {
    // Verificar se o modal já existe
    let modal = document.getElementById('confirmacaoLogoutModal');
    if (!modal) {
        criarModalLogout();
        modal = document.getElementById('confirmacaoLogoutModal');
    }
    modal.style.display = 'block';
}

// Criar modal de confirmação de logout
function criarModalLogout() {
    const modal = document.createElement('div');
    modal.id = 'confirmacaoLogoutModal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        z-index: 2000;
        justify-content: center;
        align-items: center;
    `;
    
    const conteudo = document.createElement('div');
    conteudo.style.cssText = `
        background-color: white;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        text-align: center;
    `;
    
    conteudo.innerHTML = `
        <h2 style="margin: 0 0 15px 0; color: var(--blue-dark); font-size: 1.3rem;">Confirmar Logout</h2>
        <p style="margin: 0 0 25px 0; color: #666; font-size: 0.95rem;">
            Você realmente deseja sair da sua conta?
        </p>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button onclick="confirmarLogout()" class="button button-primary" style="flex: 1;">Sim, Sair</button>
            <button onclick="cancelarLogout()" class="button button-secondary" style="flex: 1;">Cancelar</button>
        </div>
    `;
    
    modal.appendChild(conteudo);
    document.body.appendChild(modal);
    
    // Fechar modal ao clicar fora
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            cancelarLogout();
        }
    });
}

// Confirmar logout e desconectar
function confirmarLogout() {
    // Limpar localStorage
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('usuarioNome');
    localStorage.removeItem('usuarioPerfil');
    localStorage.removeItem('usuarioUsername');
    localStorage.removeItem('usuarioRegistro');
    
    // Redirecionar para login
    window.location.href = '/html/login.html';
}

// Cancelar logout
function cancelarLogout() {
    const modal = document.getElementById('confirmacaoLogoutModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Função de logout (compatibilidade)
function logout() {
    mostrarConfirmacaoLogout();
}

// fechar mensagem dos cookies na HomePage
function cookies(){
    const cookies = document.getElementById('cookies')
    const header  = document.getElementById('header')
    header.removeChild(cookies)
}
