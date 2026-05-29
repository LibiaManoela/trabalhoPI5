// carregar consultas agendadas
function carregarTransacoes() {
    const registrosSalvos = localStorage.getItem('registrosGlobais');
    return registrosSalvos ? JSON.parse(registrosSalvos) : [];
}

// salvar registros
function salvarTransacoes(registros) {
    localStorage.setItem('registrosGlobais', JSON.stringify(registros));
}

// coletar, validar, processar e salvar nova consulta
document.addEventListener('DOMContentLoaded', function() {
    const agendamentoForm = document.getElementById('agendaConsultaForm');

    if (agendamentoForm) {
        agendamentoForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const especialidade = document.getElementById('especialidade').value;
            const dataConsulta = document.getElementById('dataConsulta').value;

            if (especialidade && dataConsulta) {
                let registrosGlobais = carregarTransacoes();

                const novoRegistro = {
                    evento: 'Consulta agendada',
                    detalhes: `Especialidade: ${especialidade} | Data: ${dataConsulta}`,
                    data: new Date().toLocaleDateString('pt-BR'),
                };

                registrosGlobais.push(novoRegistro);
                salvarTransacoes(registrosGlobais);

                agendamentoForm.reset();

                console.log('Consulta agendada registrada:', novoRegistro);
                console.log('Todos os registros:', registrosGlobais);

                alert(`Consulta em ${dataConsulta} para ${especialidade} agendada com sucesso!`);
            } else {
                alert('Por favor, preencha a especialidade e a data da consulta.');
            }
        });
    } else {
        console.warn('Formulário com ID "agendaConsultaForm" não encontrado.');
    }
});