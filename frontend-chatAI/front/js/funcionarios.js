const BACKEND_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async function () {
    const tableBody = document.getElementById('funcionariosTableBody');
    const usuarioId = localStorage.getItem('usuarioId');
    const usuarioPerfil = localStorage.getItem('usuarioPerfil');

    if (usuarioPerfil !== 'ADMINISTRADOR') {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #c62828;">Acesso negado: somente administradores podem visualizar e gerenciar usuários.</td>
            </tr>
        `;
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/usuarios`, {
            headers: {
                'x-usuario-id': usuarioId,
            },
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar funcionários.');
        }

        const usuarios = await response.json();

        if (usuarios.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #999;">Nenhum funcionário cadastrado.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = usuarios.map(usuario => `
            <tr>
                <td>${usuario.nome}</td>
                <td>${usuario.perfil}</td>
                <td>${usuario.username}</td>
                <td>${usuario.registro_profissional || '-'}</td>
                <td>${usuario.ativo ? 'Ativo' : 'Inativo'}</td>
                <td style="text-align: center;">
                    ${usuario.id !== Number(usuarioId) ? `<button class="button button-secondary" type="button" onclick="excluirUsuario(${usuario.id})">Excluir</button>` : '<span style="color: #999;">-</span>'}
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #c62828;">Erro ao carregar funcionários. Tente novamente.</td>
            </tr>
        `;
    }
});

async function excluirUsuario(usuarioIdParaExcluir) {
    const usuarioId = localStorage.getItem('usuarioId');
    if (!confirm('Deseja realmente desativar este usuário? Esta ação não pode ser revertida pela interface.')) {
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/usuarios/${usuarioIdParaExcluir}`, {
            method: 'DELETE',
            headers: {
                'x-usuario-id': usuarioId,
            },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao excluir usuário.');
        }

        alert(`Usuário ${data.usuario.nome} desativado com sucesso.`);
        window.location.reload();
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert(error.message || 'Erro ao excluir usuário.');
    }
}
