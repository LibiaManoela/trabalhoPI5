import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // Carrega variáveis do .env

const app = express();
const port = 3000;

app.use(express.json());

// CORS (Permissivo em desenvolvimento, restrinja em produção)
app.use(cors({ origin: '*' }));

// Teste simples
app.get('/', (req, res) => {
  res.send('Servidor ativo!');
});

// Rota de chat com IA de triagem médica
app.post('/chat', async (req, res) => {
    const { message } = req.body;

    try {
        // O Back-end Node.js chama o motor de IA em Python
        const aiResponse = await fetch('http://host.docker.internal:8000/triagem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sintomas: message })
        });

        const data = await aiResponse.json();
        res.json({ response: data.resposta_final }); // Devolve para o front-end
    } catch (error) {
        res.status(500).json({ error: "Erro ao conectar com o motor de IA" });
    }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});