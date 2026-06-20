const BACKEND_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async function () {
    const usuarioId = localStorage.getItem('usuarioId');
    const usuarioPerfil = localStorage.getItem('usuarioPerfil');

    if (!usuarioId) {
        console.error('Usuário não identificado');
        return;
    }

    try {
        // Buscar todas as triagens
        const response = await fetch(`${BACKEND_URL}/triagens`, {
            headers: {
                'x-usuario-id': usuarioId,
            },
        });

        if (!response.ok) {
            console.error('Erro ao buscar triagens');
            return;
        }

        const triagens = await response.json();

        // Contar triagens de hoje
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const triagenHoje = triagens.filter(t => {
            const dataTr = new Date(t.criado_em);
            dataTr.setHours(0, 0, 0, 0);
            return dataTr.getTime() === hoje.getTime();
        });

        // Contar triagens pendentes
        const triagensP = triagens.filter(t => t.status === 'PENDENTE');

        // Atualizar os cards no DOM
        const cards = document.querySelectorAll('.feature-card');
        
        if (cards.length >= 2) {
            // Primeiro card: Triagens de hoje
            const primeiroCard = cards[0];
            const pTag = primeiroCard.querySelector('p');
            if (pTag) {
                pTag.textContent = `${triagenHoje.length} ${triagenHoje.length === 1 ? 'Paciente' : 'Pacientes'}`;
            }

            // Segundo card: Triagens pendentes
            const segundoCard = cards[1];
            const pTag2 = segundoCard.querySelector('p');
            if (pTag2) {
                pTag2.textContent = `${triagensP.length} ${triagensP.length === 1 ? 'Caso' : 'Casos'}`;
            }
        }

    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
});
