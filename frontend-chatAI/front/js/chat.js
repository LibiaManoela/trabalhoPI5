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
  mensagemDiv.classList.add('mensagem-box');
  mensagemDiv.classList.add(remetente === 'usuario' ? 'mensagem-usuario' : 'mensagem-ia');

  const mensagemHeader = document.createElement('div');
  mensagemHeader.classList.add('mensagem-header');
  mensagemHeader.textContent = remetente === 'usuario' ? 'Entrada do profissional' : 'Resposta da IA';

  const mensagemBody = document.createElement('div');
  mensagemBody.classList.add('mensagem-body');

  if (remetente === 'usuario') {
    mensagemBody.textContent = texto;
  } else {
    mensagemBody.innerHTML = texto.replace(/\n/g, '<br>');
  }

  mensagemDiv.appendChild(mensagemHeader);
  mensagemDiv.appendChild(mensagemBody);

  if (isAiResult) {
    const avisoDiv = document.createElement('div');
    avisoDiv.classList.add('mensagem-ia-notice');
    avisoDiv.innerHTML = '<strong>⚠️ Atenção:</strong> Este diagnóstico preditivo foi gerado por IA com base em protocolos clínicos. <b>Ainda não possui validação médica.</b>';
    mensagemDiv.appendChild(avisoDiv);
  }

  chatContainer.appendChild(mensagemDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function enviarMensagemDoUsuario() {
  enviarBtn.textContent = 'Enviando...';
  enviarBtn.disabled = true;
  const cpf = document.getElementById('cpf-input').value.trim();
  const nomePaciente = document.getElementById('nome-paciente-input').value.trim();
  const idadePaciente = document.getElementById('idade-paciente-input').value.trim();
  const sexoPaciente = document.getElementById('sexo-paciente-input').value.trim();
  const dadosAnamnese = mensagemInput.value.trim();

  if (!cpf || !nomePaciente || !idadePaciente || !sexoPaciente || !dadosAnamnese) {
    adicionarMensagem('Por favor, preencha todos os campos antes de enviar.', 'IA', false);
    return;
  }

  const mensagemUsuario = `Nome: ${nomePaciente}\nCPF: ${cpf}\nIdade: ${idadePaciente} anos\nSexo: ${sexoPaciente}\n\nSintomas:\n${dadosAnamnese}`;
  adicionarMensagem(mensagemUsuario, 'usuario');
  mensagemInput.value = '';

  const loadingId = 'loading-' + Date.now();
  const loadingDiv = document.createElement('div');
  loadingDiv.id = loadingId;
  loadingDiv.classList.add('mensagem', 'mensagem-ia');
  loadingDiv.innerHTML = "<i>Analisando sintomas e cruzando dados clínicos...</i>";
  chatContainer.appendChild(loadingDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    const response = await fetch(`${BACKEND_URL}/minhaIA-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: dadosAnamnese,
        usuario_id: Number(localStorage.getItem('usuarioId')) || null,
        nome_paciente: nomePaciente,
        idade_paciente: Number(idadePaciente) || null,
        cpf: cpf,
        sexo_paciente: document.getElementById('sexo-paciente-input').value.trim() || null
      }),
    });

    document.getElementById(loadingId).remove();

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Falha na comunicação com a API');
    }

    const data = await response.json();
    const respostaIA = data.reply || "Não entendi sua solicitação. Pode reformular?";

    adicionarMensagem(respostaIA, 'IA', true);

  } catch (error) {
    console.error('Erro:', error);
    document.getElementById(loadingId)?.remove();
    adicionarMensagem("Desculpe, houve um erro de conexão ao processar os sintomas.", 'IA', false);
  }
  enviarBtn.textContent = 'Enviar';
  enviarBtn.disabled = false;
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