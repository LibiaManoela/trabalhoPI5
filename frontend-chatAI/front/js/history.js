document.addEventListener("DOMContentLoaded", function () {
    const corpoTabelaTransacoes = document.getElementById("corpoTabelaTransacoes");
    const mensagemSemTransacoes = document.getElementById("mensagem-sem-transacoes");
    const totalSpan = document.getElementById("totalTransacoes");

    const registrosSalvos = localStorage.getItem("registrosGlobais");
    let registrosGlobais = registrosSalvos ? JSON.parse(registrosSalvos) : [];

    registrosGlobais = registrosGlobais.filter((registro) => {
        const dataRegistro = moment(registro.data, "DD/MM/YYYY");
        return dataRegistro.isBetween(moment().subtract(30, "days"), moment());
    });

    if (!corpoTabelaTransacoes || !mensagemSemTransacoes || !totalSpan) {
        return;
    }

    if (registrosGlobais.length === 0) {
        mensagemSemTransacoes.style.display = "block";
    } else {
        mensagemSemTransacoes.style.display = "none";

        registrosGlobais.reverse();

        registrosGlobais.forEach((registro) => {
            const row = corpoTabelaTransacoes.insertRow();

            const cellData = row.insertCell();
            cellData.textContent = registro.data;

            const cellEvento = row.insertCell();
            cellEvento.textContent = registro.evento;

            const cellDetalhes = row.insertCell();
            cellDetalhes.textContent = registro.detalhes;
        });

        totalSpan.textContent = registrosGlobais.length;
    }
});

// gerar relatório de saúde
const btnGerarPDF = document.getElementById("btnGerarPDF");
if (btnGerarPDF) {
    btnGerarPDF.addEventListener("click", () => {
        const doc = new jsPDF();

        doc.text("Relatório de registros de saúde referente aos últimos 30 dias", 14, 15);

        const corpoTabela = document.getElementById("corpoTabelaTransacoes");
        const linhas = corpoTabela.querySelectorAll("tr");

        const dadosTabela = [];

        linhas.forEach((linha) => {
            const colunas = linha.querySelectorAll("td");
            const linhaDados = Array.from(colunas).map((td) => td.textContent);
            dadosTabela.push(linhaDados);
        });

        doc.autoTable({
            head: [["Data", "Evento", "Detalhes"]],
            body: dadosTabela,
            startY: 25,
            theme: "grid",
            styles: {
                fontSize: 10,
                cellPadding: 4,
            },
            headStyles: {
                fillColor: [37, 150, 190],
            },
        });

        doc.text(
            `Total de registros: ${document.getElementById("totalTransacoes").textContent}`,
            14,
            doc.lastAutoTable.finalY + 10
        );

        doc.save("registro-saude.pdf");
    });
}
