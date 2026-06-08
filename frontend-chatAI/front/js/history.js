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
        const response = await fetch(`${BACKEND_URL}/triagens`);
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

document.addEventListener('DOMContentLoaded', async function () {
    const corpoTabelaTransacoes = document.getElementById('corpoTabelaTransacoes');
    const mensagemSemTransacoes = document.getElementById('mensagem-sem-transacoes');
    const totalSpan = document.getElementById('totalTransacoes');

    if (!corpoTabelaTransacoes || !mensagemSemTransacoes || !totalSpan) {
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

        const cellEvento = row.insertCell();
        cellEvento.textContent = `${triagem.nome_paciente || 'Paciente desconhecido'} — ${triagem.status}`;

        const cellDetalhes = row.insertCell();
        cellDetalhes.innerHTML = `IA: ${triagem.diagnostico_ia || 'Sem diagnóstico'}<br>
            Risco: ${triagem.classificacao_risco || 'Não informado'}<br>
            Profissional: ${triagem.usuario_nome || 'Não identificado'}`;
    });

    totalSpan.textContent = triagens.length;
});

const btnGerarPDF = document.getElementById('btnGerarPDF');
if (btnGerarPDF) {
    btnGerarPDF.addEventListener('click', () => {
        const doc = new jsPDF();
        doc.text('Relatório de atendimentos', 14, 15);

        const corpoTabela = document.getElementById('corpoTabelaTransacoes');
        const linhas = corpoTabela.querySelectorAll('tr');
        const dadosTabela = [];

        linhas.forEach((linha) => {
            const colunas = linha.querySelectorAll('td');
            const linhaDados = Array.from(colunas).map((td) => td.textContent);
            dadosTabela.push(linhaDados);
        });

        doc.autoTable({
            head: [['Data', 'Evento', 'Detalhes']],
            body: dadosTabela,
            startY: 25,
            theme: 'grid',
            styles: {
                fontSize: 10,
                cellPadding: 4,
            },
            headStyles: {
                fillColor: [37, 150, 190],
            },
        });

        doc.text(`Total de registros: ${document.getElementById('totalTransacoes').textContent}`, 14, doc.lastAutoTable.finalY + 10);
        doc.save('historico-atendimentos.pdf');
    });
}
