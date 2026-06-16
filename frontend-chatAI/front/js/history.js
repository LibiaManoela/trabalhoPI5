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

    if (usuarioPerfil !== 'ADMINISTRADOR') {
        exibirAcessoNegado('Acesso negado: somente administradores podem visualizar o histórico completo de processos.');
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
        cellDetalhes.innerHTML = `Idade: ${triagem.idade_paciente ?? '-'} anos<br>
            IA: ${triagem.diagnostico_ia || 'Sem diagnóstico'}<br>
            Risco: ${triagem.classificacao_risco || 'Não informado'}`;
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

        const corpoTabela = document.getElementById('corpoTabelaTransacoes');
        const linhas = corpoTabela.querySelectorAll('tr');
        const dadosTabela = [];

        linhas.forEach((linha) => {
            const colunas = linha.querySelectorAll('td');
            const linhaDados = Array.from(colunas).map((td) => td.textContent);
            dadosTabela.push(linhaDados);
        });

        doc.autoTable({
            head: [['Data', 'Paciente', 'CPF', 'Profissional', 'Status Avaliação', 'Detalhes']],
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
