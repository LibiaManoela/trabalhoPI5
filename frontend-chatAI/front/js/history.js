const BACKEND_URL = 'http://localhost:3000';

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Formata o CPF para exibição legível
function formatarCPF(cpf) {
    if (!cpf) return '-';
    const cpfLimpo = cpf.replace(/\D/g, ''); // Remove tudo que não for número
    if (cpfLimpo.length !== 11) return cpf;
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// Quando for popular a tabela:
cellCpf.textContent = formatarCPF(triagem.cpf);

// Quando for popular o modal:
document.getElementById('modalCPF').textContent = formatarCPF(triagem.cpf);

// Formata o diagnóstico da IA para exibição legível
function formatarDiagnostico(diagnosticoRaw) {
    if (!diagnosticoRaw) return 'Sem diagnóstico';
    
    // Formata números ordinais (1. 2. 3.) em blocos estruturados
    const blocos = diagnosticoRaw.split(/(?=\d+\.\s)/);
    
    return blocos.map(bloco => {
        const linhas = bloco.trim().split('\n');
        let html = '';
        
        linhas.forEach((linha, idx) => {
            if (linha.match(/^\d+\./)) {
                // Linha com número (título do bloco)
                html += `<strong style="color: var(--blue-dark); display: block; margin-top: ${idx > 0 ? '12px' : '0'}; margin-bottom: 6px;">${linha.trim()}</strong>`;
            } else if (linha.trim()) {
                // Linha de conteúdo
                html += `<span style="display: block; margin-bottom: 4px;">${linha.trim()}</span>`;
            }
        });
        
        return html;
    }).join('');
}

// Abre o modal com detalhes da triagem
function abrirDetalhesModal(triagem) {
    document.getElementById('modalNomePaciente').textContent = triagem.nome_paciente || '-';
    document.getElementById('modalCPF').textContent = triagem.cpf || '-';
    document.getElementById('modalIdade').textContent = (triagem.idade_paciente ?? '-') + ' anos';
    document.getElementById('modalSexo').textContent = triagem.sexo_paciente || '-';
    document.getElementById('modalAnamnese').textContent = triagem.dados_anamnese || 'Não informado';
    document.getElementById('modalDiagnostico').innerHTML = formatarDiagnostico(triagem.diagnostico_ia);
    document.getElementById('modalStatus').textContent = triagem.status || 'PENDENTE';
    document.getElementById('modalRisco').textContent = triagem.classificacao_risco || 'Não informado';
    
    document.getElementById('detalhesModal').style.display = 'block';
}

// Fecha o modal
function fecharDetalhesModal() {
    document.getElementById('detalhesModal').style.display = 'none';
}

// Fecha modal ao clicar fora
window.addEventListener('click', function(event) {
    const modal = document.getElementById('detalhesModal');
    if (event.target === modal) {
        fecharDetalhesModal();
    }
});

async function carregarTriagens() {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        const response = await fetch(`${BACKEND_URL}/triagens`, {
            headers: {
                'x-usuario-id': usuarioId,
            },
        });
        if (!response.ok) {
            throw new Error('Erro ao buscar triagens.');
        }

        const triagens = await response.json();
        return triagens;
    } catch (error) {
        console.error(error);
        return [];
    }
}

function exibirAcessoNegado(message) {
    const corpoTabelaTransacoes = document.getElementById('corpoTabelaTransacoes');
    const mensagemSemTransacoes = document.getElementById('mensagem-sem-transacoes');
    const totalSpan = document.getElementById('totalTransacoes');

    if (corpoTabelaTransacoes) {
        corpoTabelaTransacoes.innerHTML = `\n            <tr>\n                <td colspan="3" style="text-align: center; color: #c62828;">${message}</td>\n            </tr>\n        `;
    }
    if (mensagemSemTransacoes) {
        mensagemSemTransacoes.style.display = 'none';
    }
    if (totalSpan) {
        totalSpan.textContent = '0';
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    const corpoTabelaTransacoes = document.getElementById('corpoTabelaTransacoes');
    const mensagemSemTransacoes = document.getElementById('mensagem-sem-transacoes');
    const totalSpan = document.getElementById('totalTransacoes');
    const usuarioPerfil = localStorage.getItem('usuarioPerfil');

    if (!corpoTabelaTransacoes || !mensagemSemTransacoes || !totalSpan) {
        return;
    }

    if (usuarioPerfil !== 'ADMINISTRADOR' && usuarioPerfil !== 'MEDICO') {
        exibirAcessoNegado('Acesso negado: somente administradores e médicos podem visualizar o histórico completo de processos.');
        return;
    }

    const triagens = await carregarTriagens();

    if (!triagens || triagens.length === 0) {
        mensagemSemTransacoes.style.display = 'block';
        totalSpan.textContent = '0';
        return;
    }

    mensagemSemTransacoes.style.display = 'none';
    triagens.forEach((triagem) => {
        const row = corpoTabelaTransacoes.insertRow();

        const cellData = row.insertCell();
        cellData.textContent = formatDate(triagem.criado_em);

        const cellPaciente = row.insertCell();
        cellPaciente.textContent = triagem.nome_paciente || 'Não informado';

        const cellCpf = row.insertCell();
        cellCpf.textContent = triagem.cpf || '-';

        const cellProfissional = row.insertCell();
        cellProfissional.textContent = triagem.usuario_nome || 'Não identificado';

        const cellStatus = row.insertCell();
        cellStatus.textContent = triagem.status || 'PENDENTE';
        cellStatus.classList.add('status-cell');

        const cellDetalhes = row.insertCell();
        const botaoDetalhes = document.createElement('button');
        botaoDetalhes.className = 'button button-secondary';
        botaoDetalhes.style.width = '100%';
        botaoDetalhes.textContent = 'Ver Detalhes';
        botaoDetalhes.onclick = () => abrirDetalhesModal(triagem);
        cellDetalhes.appendChild(botaoDetalhes);
    });

    totalSpan.textContent = triagens.length;
});

const btnGerarPDF = document.getElementById('btnGerarPDF');
if (btnGerarPDF) {
    btnGerarPDF.addEventListener('click', () => {
        const jsPDFClass = window.jspdf?.jsPDF || window.jsPDF || window.jspdf;
        if (!jsPDFClass) {
            alert('Biblioteca de PDF não está carregada. Recarregue a página e tente novamente.');
            return;
        }

        const doc = new jsPDFClass({ unit: 'pt', format: 'a4' });
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(10, 32, 82);
        doc.text('Relatório de Histórico de Atendimentos', 40, 50);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(72, 82, 110);
        doc.text(`Gerado por: ${localStorage.getItem('usuarioNome') || 'Usuário'} — ${new Date().toLocaleString('pt-BR')}`, 40, 68);

        const triagens = await carregarTriagens();
        const dadosTabela = [];

        triagens.forEach((triagem) => {
            dadosTabela.push([
                formatDate(triagem.criado_em),
                triagem.nome_paciente || 'Não informado',
                triagem.cpf || '-',
                triagem.usuario_nome || 'Não identificado',
                triagem.status || 'PENDENTE',
                triagem.classificacao_risco || 'Não informado' // Informação útil para o PDF!
            ]);
        });

        doc.autoTable({
            head: [['Data', 'Paciente', 'CPF', 'Profissional', 'Status Avaliação', 'Risco']],
            body: dadosTabela,
            startY: 90,
            theme: 'striped',
            styles: {
                font: 'Helvetica',
                fontSize: 9,
                textColor: [20, 34, 70],
                cellPadding: 5,
            },
            headStyles: {
                fillColor: [37, 150, 190],
                textColor: 255,
                halign: 'center',
            },
            alternateRowStyles: {
                fillColor: [239, 248, 255],
            },
            columnStyles: {
                5: { cellWidth: 180 },
            },
        });

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`Total de registros: ${document.getElementById('totalTransacoes').textContent}`, 40, doc.lastAutoTable.finalY + 20);
        doc.save('historico-atendimentos.pdf');
    });
}
