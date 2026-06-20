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

            await mostrarAlertaPersonalizado('Sucesso!', "Login realizado com sucesso!", 'sucesso');
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
        border-radius: 18px; 
        box-shadow: 0 10px 40px rgba(10, 32, 82, 0.15); 
        max-width: 400px;
        width: 90%; 
        text-align: center;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
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
    modal.addEventListener('click', function (event) {
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
function cookies() {
    const cookies = document.getElementById('cookies')
    const header = document.getElementById('header')
    header.removeChild(cookies)
}

// Função global para substituir os alerts()
// Retorna uma Promise para podermos usar await (esperar o usuário clicar em OK)
function mostrarAlertaPersonalizado(titulo, mensagem, tipo = 'info') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.id = 'alertaPersonalizadoModal';
        
        // Cores baseadas no tipo (sucesso, erro ou info)
        let corTitulo = 'var(--blue-dark)';
        let corBotao = 'var(--blue-light)';
        
        if (tipo === 'erro') {
            corTitulo = '#c62828'; // Vermelho do seu protocolo
            corBotao = '#c62828';
        } else if (tipo === 'sucesso') {
            corTitulo = '#43a047'; // Verde do seu protocolo
            corBotao = '#43a047';
        }

        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(10, 32, 82, 0.4);
            backdrop-filter: blur(4px);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        const conteudo = document.createElement('div');
        conteudo.style.cssText = `
            background-color: white;
            padding: 30px;
            border-radius: 18px;
            box-shadow: 0 10px 40px rgba(10, 32, 82, 0.15);
            max-width: 400px;
            width: 90%;
            text-align: center;
            transform: translateY(20px);
            transition: transform 0.3s ease;
        `;
        
        conteudo.innerHTML = `
            <h2 style="margin: 0 0 15px 0; color: ${corTitulo}; font-size: 1.3rem;">${titulo}</h2>
            <p style="margin: 0 0 25px 0; color: rgba(10, 32, 82, 0.78); font-size: 1rem; line-height: 1.5;">
                ${mensagem}
            </p>
            <button id="btnFecharAlerta" class="button" style="background-color: ${corBotao}; color: white; width: 100%;">OK</button>
        `;
        
        modal.appendChild(conteudo);
        document.body.appendChild(modal);

        // Animação de entrada
        setTimeout(() => {
            modal.style.opacity = '1';
            conteudo.style.transform = 'translateY(0)';
        }, 10);

        // Função para fechar e resolver a Promise
        const fecharModal = () => {
            modal.style.opacity = '0';
            conteudo.style.transform = 'translateY(20px)';
            setTimeout(() => {
                modal.remove();
                resolve(); // Libera o código para continuar rodando
            }, 300);
        };

        // Fechar ao clicar no botão
        document.getElementById('btnFecharAlerta').addEventListener('click', fecharModal);
    });
}