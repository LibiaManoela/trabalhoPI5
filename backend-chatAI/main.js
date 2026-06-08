import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
const port = process.env.PORT ?? 3000;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "postgres",
  max: 10,
});

app.use(express.json());
app.use(cors({ origin: '*' }));

function isBcryptHash(value) {
  return typeof value === 'string' && value.startsWith('$2');
}

app.get('/', (_req, res) => {
  res.send('Servidor ativo!');
});

app.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, nome, username, senha_hash, perfil, registro_profissional FROM usuarios WHERE username = $1 OR registro_profissional = $1 LIMIT 1',
      [usuario]
    );

    if (result.rowCount === 0) {
      return res.json({ isValid: false });
    }

    const user = result.rows[0];
    const passwordMatches = isBcryptHash(user.senha_hash)
      ? bcrypt.compareSync(senha, user.senha_hash)
      : senha === user.senha_hash;

    if (!passwordMatches) {
      return res.json({ isValid: false });
    }

    return res.json({
      isValid: true,
      usuario: {
        id: user.id,
        nome: user.nome,
        username: user.username,
        perfil: user.perfil,
        registro_profissional: user.registro_profissional,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erro ao consultar o banco de dados.' });
  }
});

app.post('/triagem', async (req, res) => {
  const {
    usuario_id,
    nome_paciente,
    idade_paciente,
    dados_anamnese,
    diagnostico_ia,
    classificacao_risco,
    status,
  } = req.body;

  if (!dados_anamnese) {
    return res.status(400).json({ error: 'Dados de anamnese são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO triagens (usuario_id, nome_paciente, idade_paciente, dados_anamnese, diagnostico_ia, classificacao_risco, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        usuario_id || null,
        nome_paciente || 'Paciente não informado',
        idade_paciente ?? null,
        dados_anamnese,
        diagnostico_ia || 'Aguardando validação médica',
        classificacao_risco || 'PENDENTE',
        status || 'PENDENTE',
      ]
    );

    return res.status(201).json({ triagem: result.rows[0] });
  } catch (error) {
    console.error('Erro ao inserir triagem:', error);
    return res.status(500).json({ error: 'Erro ao salvar triagem no banco de dados.' });
  }
});

app.post('/gemini-chat', async (req, res) => {
  const { message, usuario_id, nome_paciente, idade_paciente } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Texto da triagem é obrigatório.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO triagens (usuario_id, nome_paciente, idade_paciente, dados_anamnese, diagnostico_ia, classificacao_risco, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        usuario_id || null,
        nome_paciente || 'Paciente não informado',
        idade_paciente ?? null,
        message,
        'Aguardando validação médica',
        'PENDENTE',
        'PENDENTE',
      ]
    );

    return res.json({
      reply: 'Triagem registrada com sucesso. A validação médica ficará disponível no histórico.',
      triagem: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao gravar triagem via gemini-chat:', error);
    return res.status(500).json({ error: 'Erro ao salvar a triagem.' });
  }
});

app.get('/triagens', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.nome AS usuario_nome, u.perfil AS usuario_perfil
       FROM triagens t
       LEFT JOIN usuarios u ON t.usuario_id = u.id
       ORDER BY t.criado_em DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar triagens:', error);
    return res.status(500).json({ error: 'Erro ao buscar triagens.' });
  }
});

app.get('/triagens/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.nome AS usuario_nome, u.perfil AS usuario_perfil
       FROM triagens t
       LEFT JOIN usuarios u ON t.usuario_id = u.id
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Triagem não encontrada.' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar triagem por ID:', error);
    return res.status(500).json({ error: 'Erro ao buscar triagem.' });
  }
});

app.post('/triagens/:id/validacao', async (req, res) => {
  const { medico_id, aprovado, diagnostico_correto, observacoes_clinicas } = req.body;

  if (typeof aprovado !== 'boolean' || !medico_id) {
    return res.status(400).json({ error: 'Campos médico e aprovado são obrigatórios.' });
  }

  try {
    const status = aprovado ? 'APROVADO' : 'REPROVADO_CORRIGIDO';
    const triagemId = Number(req.params.id);

    await pool.query('BEGIN');
    const validation = await pool.query(
      `INSERT INTO retroalimentacao_medica (triagem_id, medico_id, aprovado, diagnostico_correto, observacoes_clinicas)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [triagemId, medico_id, aprovado, diagnostico_correto || null, observacoes_clinicas || null]
    );

    await pool.query('UPDATE triagens SET status = $1 WHERE id = $2', [status, triagemId]);
    await pool.query('COMMIT');

    return res.status(201).json({ validation: validation.rows[0] });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Erro ao salvar validação médica:', error);
    return res.status(500).json({ error: 'Erro ao salvar validação médica.' });
  }
});

app.get('/usuarios', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, username, perfil, registro_profissional, ativo FROM usuarios ORDER BY nome');
    return res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

app.post('/usuarios', async (req, res) => {
  const { nome, username, senha, perfil, registro_profissional } = req.body;

  if (!nome || !username || !senha || !perfil) {
    return res.status(400).json({ error: 'Nome, usuário, senha e perfil são obrigatórios.' });
  }

  try {
    const senhaHash = bcrypt.hashSync(senha, 10);
    
    const result = await pool.query(
      `INSERT INTO usuarios (nome, username, senha_hash, perfil, registro_profissional, ativo)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, nome, username, perfil, registro_profissional, ativo`,
      [nome, username, senhaHash, perfil, registro_profissional || null]
    );

    return res.status(201).json({ usuario: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Usuário ou registro profissional já existe.' });
    }
    return res.status(500).json({ error: 'Erro ao criar usuário no banco de dados.' });
  }
});

app.put('/usuarios/:id', async (req, res) => {
  const { nome, senha, perfil, registro_profissional } = req.body;
  const usuarioId = Number(req.params.id);

  if (!nome && !senha && !perfil && !registro_profissional) {
    return res.status(400).json({ error: 'Pelo menos um campo deve ser informado para atualização.' });
  }

  try {
    let query = 'UPDATE usuarios SET ';
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (nome) {
      updates.push(`nome = $${paramCount}`);
      values.push(nome);
      paramCount++;
    }

    if (senha) {
      const senhaHash = bcrypt.hashSync(senha, 10);
      updates.push(`senha_hash = $${paramCount}`);
      values.push(senhaHash);
      paramCount++;
    }

    if (perfil) {
      updates.push(`perfil = $${paramCount}`);
      values.push(perfil);
      paramCount++;
    }

    if (registro_profissional) {
      updates.push(`registro_profissional = $${paramCount}`);
      values.push(registro_profissional);
      paramCount++;
    }

    query += updates.join(', ');
    query += ` WHERE id = $${paramCount} RETURNING id, nome, username, perfil, registro_profissional, ativo`;
    values.push(usuarioId);

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.json({ usuario: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Registro profissional já existe.' });
    }
    return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

app.get('/usuarios/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, username, perfil, registro_profissional, ativo, criado_em FROM usuarios WHERE id = $1',
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
