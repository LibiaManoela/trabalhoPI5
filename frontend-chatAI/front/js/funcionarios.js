const BACKEND_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async function () {
    const tableBody = document.getElementById('funcionariosTableBody');

    try {
        const response = await fetch(`${BACKEND_URL}/usuarios`);

        if (!response.ok) {
            throw new Error('Erro ao buscar funcionários.');
        }

        const usuarios = await response.json();

        if (usuarios.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #999;">Nenhum funcionário cadastrado.</td>
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
            </tr>
        `).join('');

    } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #c62828;">Erro ao carregar funcionários. Tente novamente.</td>
            </tr>
        `;
    }
});
