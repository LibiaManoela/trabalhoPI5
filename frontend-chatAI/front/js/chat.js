const historicoMensagens = [];

const chatContainer = document.getElementById('chat-container');
const mensagemInput = document.getElementById('mensagem-input');
const enviarBtn = document.getElementById('enviar-btn');
const BACKEND_URL = 'http://localhost:3000';

// Atualizada para aceitar o alerta visual de IA
function adicionarMensagem(texto, remetente, isAiResult = false) {
  const novaMensagem = {
    texto: texto,
    remetente: remetente,
    timestamp: new Date().toISOString()
  };

  historicoMensagens.push(novaMensagem);

  const mensagemDiv = document.createElement('div'); 
  mensagemDiv.classList.add('mensagem');

  if (remetente === 'usuario') {
    mensagemDiv.classList.add('mensagem-usuario');
    mensagemDiv.textContent = texto; 
  } else {
    mensagemDiv.classList.add('mensagem-ia');
    
    // Converte quebras de linha da IA em quebras de linha do HTML
    const textoFormatado = texto.replace(/\n/g, '<br>');
    let htmlContent = textoFormatado;
    
    // Adiciona a caixa de aviso se for o resultado da triagem
    if (isAiResult) {
        htmlContent += `
            <div style="margin-top: 15px; padding: 12px; background-color: #fff3cd; color: #856404; border-left: 4px solid #ffeeba; border-radius: 4px; font-size: 0.9em; line-height: 1.4;">
                <strong>⚠️ Atenção:</strong> Este diagnóstico preditivo foi gerado por Inteligência Artificial baseado em protocolos clínicos. <b>Ainda não possui validação médica.</b>
            </div>
        `;
    }
    
    mensagemDiv.innerHTML = htmlContent;
  }

  chatContainer.appendChild(mensagemDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function enviarMensagemDoUsuario() {
  const texto = mensagemInput.value.trim();

  if (texto) { 
    adicionarMensagem(texto, 'usuario');
    mensagemInput.value = '';

    // Adiciona uma mensagem temporária de "Processando..."
    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = loadingId;
    loadingDiv.classList.add('mensagem', 'mensagem-ia');
    loadingDiv.innerHTML = "<i>Analisando sintomas e cruzando dados clínicos...</i>";
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
      const response = await fetch(`${BACKEND_URL}/gemini-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: texto }),
      });

      // Remove a mensagem de carregamento
      document.getElementById(loadingId).remove();

      if (!response.ok) {
        throw new Error('Falha na comunicação com a API');
      }

      const data = await response.json();
      const respostaIA = data.reply || "Não entendi sua solicitação. Pode reformular?";

      // Passa "true" no último parâmetro para ativar a caixa amarela de aviso
      adicionarMensagem(respostaIA, 'IA', true);

    } catch (error) {
      console.error('Erro:', error);
      document.getElementById(loadingId)?.remove();
      adicionarMensagem("Desculpe, houve um erro de conexão ao processar os sintomas.", 'IA', false);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
    adicionarMensagem("Olá! Insira os sintomas e os sinais vitais do paciente para realizar a triagem pelo Protocolo de Manchester.", "IA", false);

    enviarBtn.addEventListener('click', enviarMensagemDoUsuario);
    mensagemInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            enviarMensagemDoUsuario();
        }
    });
});