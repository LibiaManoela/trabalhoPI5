// mostrar informação de próxima consulta
function saldo(){
    const valor = document.getElementById('valor');
    const checkbox = document.getElementById('toggleSaldo');

    const visivel = 'Terça-feira, 14h';
    const oculto = '*********';

    if (valor) {
        valor.textContent = visivel;
    }

    if (checkbox) {
        checkbox.addEventListener('change', function() {
            valor.textContent = this.checked ? visivel : oculto;
        });
    }
}

window.onload = function() {
    saldo();
};
