const BACKEND_URL = 'http://localhost:3000';

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

document.addEventListener('DOMContentLoaded', async function () {
    const usuarioId = localStorage.getItem('usuarioId');
    const perfilForm = document.getElementById('perfilForm');
    const carregando = document.getElementById('carregando');
    const mensagemErro = document.getElementById('mensagem-erro');
    const mensagemSucesso = document.getElementById('mensagem-sucesso');
    const btnSalvar = document.getElementById('btnSalvar');
    const btnCancelar = document.getElementById('btnCancelar');

    if (!usuarioId) {
        carregando.textContent = 'Erro: Usuário não identificado. Faça login novamente.';
        return;
    }

    // Carregar dados do usuário
    try {
        const response = await fetch(`${BACKEND_URL}/usuarios/${usuarioId}`, {
            headers: {
                'x-usuario-id': usuarioId,
            },
        });
        
        if (!response.ok) {
            throw new Error('Erro ao buscar dados do usuário.');
        }

        const usuario = await response.json();

        // Popular formulário
        document.getElementById('nome').value = usuario.nome || '';
        document.getElementById('username').value = usuario.username || '';
        document.getElementById('perfil').value = usuario.perfil || '';
        document.getElementById('sexo').value = usuario.sexo || '';
        document.getElementById('registro_profissional').value = usuario.registro_profissional || '';
        document.getElementById('statusUsuario').textContent = usuario.ativo ? 'Ativo' : 'Inativo';
        document.getElementById('dataCadastro').textContent = formatDate(usuario.criado_em) || '--';

        carregando.style.display = 'none';
        perfilForm.style.display = 'block';

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        carregando.textContent = 'Erro ao carregar dados do perfil. Tente novamente.';
    }

    // Salvar alterações
    if (btnSalvar) {
        btnSalvar.addEventListener('click', async function (event) {
            event.preventDefault();

            const senha = document.getElementById('senha').value;
            const confirmaSenha = document.getElementById('confirmaSenha').value;
            const registro_profissional = document.getElementById('registro_profissional').value.trim() || null;

            // Validação
            if (senha || confirmaSenha) {
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
            }

            try {
                const body = {};
                
                if (senha) {
                    body.senha = senha;
                }
                
                if (registro_profissional) {
                    body.registro_profissional = registro_profissional;
                }

                // Se nenhum campo foi alterado, mostrar mensagem
                if (Object.keys(body).length === 0) {
                    mensagemErro.textContent = 'Nenhum campo foi alterado.';
                    mensagemErro.style.display = 'block';
                    mensagemSucesso.style.display = 'none';
                    return;
                }

                const response = await fetch(`${BACKEND_URL}/usuarios/${usuarioId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-usuario-id': usuarioId,
                    },
                    body: JSON.stringify(body),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Erro ao atualizar perfil.');
                }

                mensagemSucesso.textContent = 'Perfil atualizado com sucesso!';
                mensagemSucesso.style.display = 'block';
                mensagemErro.style.display = 'none';

                // Limpar campos de senha
                document.getElementById('senha').value = '';
                document.getElementById('confirmaSenha').value = '';

                // Atualizar localStorage se necessário
                if (registro_profissional) {
                    localStorage.setItem('usuarioRegistro', registro_profissional);
                }

                setTimeout(() => {
                    mensagemSucesso.style.display = 'none';
                }, 3000);

            } catch (error) {
                console.error('Erro ao atualizar perfil:', error);
                mensagemErro.textContent = error.message || 'Erro ao conectar com o servidor.';
                mensagemErro.style.display = 'block';
                mensagemSucesso.style.display = 'none';
            }
        });
    }

    // Cancelar edição
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function () {
            // Recarregar a página
            window.location.reload();
        });
    }
});
