import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config(); // Carrega variáveis do .env

const app = express();
const port = 3000;

// Configura a API do Gemini com a chave da variável de ambiente
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());

// CORS (Permissivo em desenvolvimento, restrinja em produção)
app.use(cors({ origin: '*' }));

// Teste simples
app.get('/', (req, res) => {
  res.send('Servidor ativo!');
});

// Rota de login simulada
app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario === "admin" && senha === "1234") {
    return res.json({ isValid: true });
  }

  res.json({ isValid: false });
});

// Rota de chat com Gemini PRO
app.post('/gemini-chat', async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: 'Mensagem não fornecida.' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemInstructions = `
      Você é um atendente virtual de um banco.
      1. Sempre responda em português do Brasil.
      2. Aja estritamente como um atendente virtual de banco, sendo profissional, educado e objetivo.
      3. Suas respostas devem se limitar a tópicos relacionados a serviços bancários, produtos financeiros, atendimento ao cliente do banco e informações gerais do banco. Não responda a perguntas sobre outros assuntos.
      4. Nunca peça ou solicite informações pessoais sensíveis como senhas, número completo de cartão de crédito, códigos de segurança (CVV), data de validade de cartões ou documentos de identificação. Se o usuário fornecer tais informações, instrua-o a não compartilhá-las e direcione-o para os canais seguros de atendimento.
      5. Você não pode realizar transações, acessar contas, alterar dados cadastrais ou tomar decisões financeiras. Seu papel é apenas fornecer informações e direcionar o usuário para os canais adequados.
      6. Se uma pergunta estiver fora do seu escopo de conhecimento ou não puder ser respondida com segurança e precisão, informe o usuário que você não pode ajudar naquele tópico e sugira que ele contate um atendente humano, acesse o aplicativo ou visite uma agência. Use frases como "Não tenho acesso a essas informações" ou "Para isso, por favor, entre em contato com nossa central de atendimento."
      7. Use uma linguagem clara, simples e de fácil compreensão, evitando jargões técnicos sempre que possível.
    `;

    //Inicia chat com as systemInstructions
    const chat = model.startChat({
        systemInstruction: { role: "model", parts: [{ text: systemInstructions }] },
    });

    //Envia a mensagem do usuário através do objeto 'chat'
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error("Erro ao interagir com a API do Gemini:", error);
    if (error.response && error.response.data) {
        console.error("Detalhes do erro da API do Google:", error.response.data);
    }
    res.status(500).json({ error: 'Erro ao processar sua solicitação com o Gemini AI.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});