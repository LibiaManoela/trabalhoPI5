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

// Função de logout
function logout() {
    // Limpar localStorage
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('usuarioNome');
    localStorage.removeItem('usuarioPerfil');
    localStorage.removeItem('usuarioUsername');
    localStorage.removeItem('usuarioRegistro');
    
    // Redirecionar para login
    window.location.href = 'login.html';
}

// fechar mensagem dos cookies na HomePage
function cookies(){
    const cookies = document.getElementById('cookies')
    const header  = document.getElementById('header')
    header.removeChild(cookies)
}
