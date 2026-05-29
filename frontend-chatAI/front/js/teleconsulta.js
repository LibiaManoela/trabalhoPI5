function carregarTransacoes() {
    const registrosSalvos = localStorage.getItem('registrosGlobais');
    return registrosSalvos ? JSON.parse(registrosSalvos) : [];
}

function salvarTransacoes(registros) {
    localStorage.setItem('registrosGlobais', JSON.stringify(registros));
}

document.addEventListener('DOMContentLoaded', function() {
    const teleconsultaForm = document.getElementById('teleconsultaForm');

    if (teleconsultaForm) {
        teleconsultaForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const sintoma = document.getElementById('sintoma').value;
            const urgencia = document.getElementById('urgencia').value;

            if (sintoma && urgencia) {
                let registrosGlobais = carregarTransacoes();

                const novoRegistro = {
                    evento: 'Teleconsulta solicitada',
                    detalhes: `Sintoma: ${sintoma} | Urgência: ${urgencia}`,
                    data: new Date().toLocaleDateString('pt-BR'),
                    status: 'Pendente'
                };

                registrosGlobais.push(novoRegistro);
                salvarTransacoes(registrosGlobais);

                teleconsultaForm.reset();

                console.log('Teleconsulta registrada:', novoRegistro);
                console.log('Todos os registros:', registrosGlobais);

                alert(`Teleconsulta para ${sintoma} solicitada com sucesso!`);

            } else {
                alert('Por favor, descreva o sintoma e informe o nível de urgência.');
            }
        });
    } else {
        console.warn('Formulário com ID "teleconsultaForm" não encontrado.');
    }
});