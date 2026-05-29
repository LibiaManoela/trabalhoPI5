// mostrar/ocultar número do convênio
function detalhes() {
    const numeroConvenio = document.getElementById('numero-cartao');
    const checkbox = document.getElementById('toggleDetalhes');

    const visivel = '1234 5678 9012 3456';
    const oculto = '************';

    if (checkbox && numeroConvenio) {
        checkbox.addEventListener('change', function () {
            numeroConvenio.textContent = this.checked ? visivel : oculto;
        });
    }
}

window.onload = detalhes;