const BACKEND_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async function () {
    const triagensCarregando = document.getElementById('triagensCarregando');
    const triagensLista = document.getElementById('triagensLista');
    const triagensVazias = document.getElementById('triagensVazias');

    const usuarioId = localStorage.getItem('usuarioId');
    const usuarioPerfil = localStorage.getItem('usuarioPerfil');

    // Verificar se o usuário é médico
    if (usuarioPerfil !== 'MEDICO') {
        triagensCarregando.textContent = 'Acesso negado: Apenas médicos podem validar triagens.';
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/triagens`, {
            headers: {
                'x-usuario-id': usuarioId,
            },
        });
        
        if (!response.ok) {
            throw new Error('Erro ao buscar triagens.');
        }

        const triagens = await response.json();

        // Filtrar triagens com status PENDENTE
        const triagensModeration = triagens.filter(t => t.status === 'PENDENTE');

        if (triagensModeration.length === 0) {
            triagensCarregando.style.display = 'none';
            triagensVazias.style.display = 'block';
            return;
        }

        triagensCarregando.style.display = 'none';

        // Renderizar cada triagem
        triagensLista.innerHTML = triagensModeration.map(triagem => `
            <div class="info-card" style="background-color: var(--white); border-left: 5px solid var(--blue-light); padding: 18px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h3>Paciente: ${triagem.nome_paciente || 'Não informado'} (ID: #${triagem.id})</h3>
                    <span style="background-color: var(--soft-blue); color: var(--blue-dark); padding: 4px 8px; font-size: 0.8rem; border-radius: 4px; font-weight: bold;">
                        Triado por: ${triagem.usuario_nome || 'Sistema'}
                    </span>
                </div>
                
                <p style="margin: 8px 0;"><strong>Idade:</strong> ${triagem.idade_paciente || '-'} anos</p>
                <p style="margin: 8px 0;"><strong>Dados da Triagem:</strong> ${triagem.dados_anamnese || '-'}</p>
                
                <div style="background-color: #fff; padding: 12px; border: 1px solid var(--gray-light); border-radius: 6px; margin: 10px 0;">
                    <p style="margin: 0; color: var(--blue-dark);"><strong>Diagnóstico Sugerido pela IA:</strong> ${triagem.diagnostico_ia || '-'}</p>
                    <p style="margin: 5px 0 0 0; font-weight: 600; color: var(--orange);">
                        Classificação de Risco: <strong>${triagem.classificacao_risco || '-'}</strong>
                    </p>
                </div>

                <!-- Formulário de Validação -->
                <div class="validacao-form" data-triagem-id="${triagem.id}">
                    <div class="form-group" style="margin-top: 15px;">
                        <label for="diagnostico_correto_${triagem.id}">Diagnóstico Correto (opcional)</label>
                        <input type="text" id="diagnostico_correto_${triagem.id}" placeholder="Confirme ou corrija o diagnóstico" />
                    </div>

                    <div class="form-group">
                        <label for="observacoes_${triagem.id}">Observações Clínicas (opcional)</label>
                        <textarea id="observacoes_${triagem.id}" placeholder="Adicione observações ou ajustes..."></textarea>
                    </div>

                    <div class="form-group" style="display: flex; gap: 10px; margin-top: 15px;">
                        <button type="button" class="button button-primary" style="background-color: #2e7d32; flex: 1;" onclick="validarTriagem(${triagem.id}, true, ${usuarioId})">
                            ✓ Aprovar Diagnóstico
                        </button>
                        <button type="button" class="button button-secondary" style="border-color: #c62828; color: #c62828; flex: 1;" onclick="validarTriagem(${triagem.id}, false, ${usuarioId})">
                            ✗ Rejeitar / Retificar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Erro ao carregar triagens:', error);
        triagensCarregando.textContent = 'Erro ao carregar triagens. Tente novamente.';
    }
});

async function validarTriagem(triagemId, aprovado, medicoId) {
    const formulario = document.querySelector(`[data-triagem-id="${triagemId}"]`);
    const diagnostico_correto = document.getElementById(`diagnostico_correto_${triagemId}`).value.trim() || null;
    const observacoes_clinicas = document.getElementById(`observacoes_${triagemId}`).value.trim() || null;

    try {
        const response = await fetch(`${BACKEND_URL}/triagens/${triagemId}/validacao`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                medico_id: medicoId,
                aprovado: aprovado,
                diagnostico_correto: diagnostico_correto,
                observacoes_clinicas: observacoes_clinicas,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao validar triagem.');
        }

        const statusMensagem = aprovado ? 'Diagnóstico aprovado com sucesso!' : 'Diagnóstico rejeitado e corrigido.';
        alert(statusMensagem);

        // Recarregar a página para refletir as mudanças
        window.location.reload();

    } catch (error) {
        console.error('Erro ao validar triagem:', error);
        alert('Erro: ' + error.message);
    }
}
