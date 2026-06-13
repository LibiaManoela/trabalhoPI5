// validação do Login
function login() {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");

    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            usuario: user,  
            senha: pass      
        })
    }).then((response)=>{
        return response.json();
    }).then((data)=>{
        if(data.isValid){
            // Salvar dados do usuário no localStorage
            localStorage.setItem('usuarioId', data.usuario.id);
            localStorage.setItem('usuarioNome', data.usuario.nome);
            localStorage.setItem('usuarioPerfil', data.usuario.perfil);
            localStorage.setItem('usuarioUsername', data.usuario.username);
            localStorage.setItem('usuarioRegistro', data.usuario.registro_profissional || '');
            
            alert("Login bem-sucedido!");
            window.location.href = "dashboard.html";
        } else {
            errorMessage.textContent = "Usuário ou senha incorretos.";
       }
    })
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
