const BACKEND_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', function () {
    const cadastroForm = document.getElementById('cadastroForm');
    const mensagemErro = document.getElementById('mensagem-erro');
    const mensagemSucesso = document.getElementById('mensagem-sucesso');

    const usuarioId = localStorage.getItem('usuarioId');
    const usuarioPerfil = localStorage.getItem('usuarioPerfil');

    if (usuarioPerfil !== 'ADMINISTRADOR') {
        mensagemErro.textContent = 'Acesso negado: somente administradores podem cadastrar novos usuários.';
        mensagemErro.style.display = 'block';
        if (cadastroForm) {
            cadastroForm.style.display = 'none';
        }
        return;
    }

    if (cadastroForm) {
        cadastroForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const nome = document.getElementById('nome').value.trim();
            const username = document.getElementById('username').value.trim();
            const senha = document.getElementById('senha').value;
            const confirmaSenha = document.getElementById('confirmaSenha').value;
            const perfil = document.getElementById('perfil').value;
            const registro_profissional = document.getElementById('registro_profissional').value.trim() || null;

            if (!nome || !username || !senha || !perfil) {
                mensagemErro.textContent = 'Preencha todos os campos obrigatórios.';
                mensagemErro.style.display = 'block';
                mensagemSucesso.style.display = 'none';
                return;
            }

            if (senha !== confirmaSenha) {
                mensagemErro.textContent = 'As senhas não conferem.';
                mensagemErro.style.display = 'block';
                mensagemSucesso.style.display = 'none';
                return;
            }

            if (senha.length < 6) {
                mensagemErro.textContent = 'A senha deve ter no mínimo 6 caracteres.';
                mensagemErro.style.display = 'block';
                mensagemSucesso.style.display = 'none';
                return;
            }

            try {
                const response = await fetch(`${BACKEND_URL}/usuarios`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-usuario-id': usuarioId,
                    },
                    body: JSON.stringify({
                        nome,
                        username,
                        senha,
                        perfil,
                        registro_profissional,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Erro ao cadastrar usuário.');
                }

                mensagemSucesso.textContent = `Usuário ${nome} cadastrado com sucesso!`;
                mensagemSucesso.style.display = 'block';
                mensagemErro.style.display = 'none';
                cadastroForm.reset();

                setTimeout(() => {
                    window.location.href = 'funcionarios.html';
                }, 2000);
            } catch (error) {
                console.error('Erro ao cadastrar usuário:', error);
                mensagemErro.textContent = error.message || 'Erro ao conectar com o servidor.';
                mensagemErro.style.display = 'block';
                mensagemSucesso.style.display = 'none';
            }
        });
    }
});
