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

const ALLOWED_SEXOS = ['FEMININO', 'MASCULINO', 'OUTRO', 'PREFIRO_NAO_INFORMAR'];
const ALLOWED_PERFIS = ['RECEPCIONISTA','ENFERMEIRO','MEDICO','ADMINISTRADOR'];

app.use(express.json());
app.use(cors({ origin: '*' }));

function isBcryptHash(value) {
  return typeof value === 'string' && value.startsWith('$2');
}

function parseRequesterUserId(req) {
  const raw = req.headers['x-usuario-id'] || req.body.usuario_id || req.query.usuario_id;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function getUserById(userId) {
  const result = await pool.query('SELECT id, perfil, ativo FROM usuarios WHERE id = $1', [userId]);
  return result.rows[0] || null;
}

async function requireAdmin(req, res, next) {
  const requesterId = parseRequesterUserId(req);
  if (!requesterId) {
    return res.status(401).json({ error: 'ID do usuário solicitante obrigatório.' });
  }

  const usuario = await getUserById(requesterId);
  if (!usuario || !usuario.ativo) {
    return res.status(403).json({ error: 'Usuário não encontrado ou inativo.' });
  }

  if (usuario.perfil !== 'ADMINISTRADOR') {
    return res.status(403).json({ error: 'Acesso negado: administrador requerido.' });
  }

  req.requesterUser = usuario;
  next();
}

async function requireSelfOrAdmin(req, res, next) {
  const requesterId = parseRequesterUserId(req);
  if (!requesterId) {
    return res.status(401).json({ error: 'ID do usuário solicitante obrigatório.' });
  }

  const usuario = await getUserById(requesterId);
  if (!usuario || !usuario.ativo) {
    return res.status(403).json({ error: 'Usuário não encontrado ou inativo.' });
  }

  const targetId = Number(req.params.id);
  if (usuario.perfil === 'ADMINISTRADOR' || requesterId === targetId) {
    req.requesterUser = usuario;
    next();
  } else {
    return res.status(403).json({ error: 'Acesso negado: apenas administrador ou usuário dono do recurso.' });
  }
}

async function requireMedicoOrAdmin(req, res, next) {
  const requesterId = parseRequesterUserId(req);
  if (!requesterId) {
    return res.status(401).json({ error: 'ID do usuário solicitante obrigatório.' });
  }

  const usuario = await getUserById(requesterId);
  if (!usuario || !usuario.ativo) {
    return res.status(403).json({ error: 'Usuário não encontrado ou inativo.' });
  }

  if (usuario.perfil !== 'MEDICO' && usuario.perfil !== 'ADMINISTRADOR') {
    return res.status(403).json({ error: 'Acesso negado: apenas médico ou administrador.' });
  }

  req.requesterUser = usuario;
  next();
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
      'SELECT id, nome, username, senha_hash, perfil, registro_profissional, sexo FROM usuarios WHERE username = $1 OR registro_profissional = $1 LIMIT 1',
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
      console.warn(`Login falhou para usuário ${usuario}: senha incorreta.`);
      return res.json({ isValid: false });
    }

    console.log(`Login bem-sucedido: ${user.username} (id=${user.id}, perfil=${user.perfil})`);
    return res.json({
      isValid: true,
      usuario: {
        id: user.id,
        nome: user.nome,
        username: user.username,
        perfil: user.perfil,
        registro_profissional: user.registro_profissional,
        sexo: user.sexo || null,
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
    cpf,
    sexo_paciente,
    idade_paciente,
    dados_anamnese,
    diagnostico_ia,
    classificacao_risco,
  } = req.body;

  if (!dados_anamnese || !nome_paciente || !cpf || !idade_paciente || !sexo_paciente) {
    return res.status(400).json({ error: 'CPF, nome, sexo, idade e dados de anamnese são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO triagens (usuario_id, nome_paciente, cpf, sexo_paciente, idade_paciente, dados_anamnese, diagnostico_ia, classificacao_risco)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        usuario_id || null,
        nome_paciente,
        cpf,
        sexo_paciente,
        idade_paciente ?? null,
        dados_anamnese,
        diagnostico_ia || 'Aguardando validação médica',
        classificacao_risco || 'PENDENTE',
      ]
    );

    return res.status(201).json({ triagem: result.rows[0] });
  } catch (error) {
    console.error('Erro ao inserir triagem:', error);
    return res.status(500).json({ error: 'Erro ao salvar triagem no banco de dados.' });
  }
});

app.post('/minhaIA-chat', async (req, res) => {
  const { message, usuario_id, nome_paciente, sexo_paciente, idade_paciente, cpf } = req.body;

  if (!message || !nome_paciente || !sexo_paciente || !idade_paciente || !cpf) {
    return res.status(400).json({ error: 'CPF, nome, sexo, idade e sintomas são obrigatórios para a triagem.' });
  }

  try {
    const iaReq = await fetch('http://ia_engine:5000/triagem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sintomas: message })
    });

    const iaData = await iaReq.json();
    const diagnostico_ia = iaData.resposta_final || 'Erro ao gerar diagnóstico.';
    const risco_ia = iaData.classificacao_risco || 'PENDENTE';
    
    const result = await pool.query(
      `INSERT INTO triagens (usuario_id, nome_paciente, cpf, sexo_paciente, idade_paciente, dados_anamnese, diagnostico_ia, classificacao_risco)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        usuario_id || null,
        nome_paciente,
        cpf,
        sexo_paciente,
        idade_paciente ?? null,
        message,
        diagnostico_ia,
        risco_ia // classificacao_risco
      ]
    );

    return res.json({
      reply: diagnostico_ia,
      triagem: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao gravar triagem via minhaIA-chat:', error);
    return res.status(500).json({ error: 'Erro ao processar a triagem com a IA.' });
  }
});

app.get('/triagens', requireMedicoOrAdmin, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.nome AS usuario_nome, u.perfil AS usuario_perfil
       FROM triagens t
       LEFT JOIN usuarios u ON t.usuario_id = u.id
       ORDER BY t.criado_em DESC
       LIMIT 150`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar triagens:', error);
    return res.status(500).json({ error: 'Erro ao buscar triagens.' });
  }
});

app.get('/triagens/:id', requireMedicoOrAdmin, async (req, res) => {
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

app.post('/triagens/:id/validacao', requireMedicoOrAdmin, async (req, res) => {
  const { medico_id, aprovado, diagnostico_correto, observacoes_clinicas } = req.body;

  if (typeof aprovado !== 'boolean' || !medico_id) {
    return res.status(400).json({ error: 'Campos médico e aprovado são obrigatórios.' });
  }

  try {
    const triagemId = Number(req.params.id);

    // Graças ao Trigger no PostgreSQL, só precisamos fazer o INSERT da retroalimentação médica. O Trigger vai atualizar a triagem e criar o histórico automaticamente.
    // O banco atualiza a tabela triagens sozinho.
    const validation = await pool.query(
      `INSERT INTO retroalimentacao_medica (triagem_id, medico_id, aprovado, diagnostico_correto, observacoes_clinicas)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [triagemId, medico_id, aprovado, diagnostico_correto || null, observacoes_clinicas || null]
    );

    return res.status(201).json({ validation: validation.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar validação médica:', error);
    return res.status(500).json({ error: 'Erro ao salvar validação médica.' });
  }
});

app.get('/usuarios', requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, sexo, username, perfil, registro_profissional, ativo FROM usuarios ORDER BY nome');
    return res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

app.post('/usuarios', requireAdmin, async (req, res) => {
  const { nome, username, senha, perfil, registro_profissional, sexo } = req.body;

  if (!nome || !username || !senha || !perfil || !sexo) {
    return res.status(400).json({ error: 'Nome, usuário, senha, perfil e sexo são obrigatórios.' });
  }

  if (!ALLOWED_PERFIS.includes(perfil)) {
    return res.status(400).json({ error: 'Perfil inválido.' });
  }

  if (!ALLOWED_SEXOS.includes(sexo)) {
    return res.status(400).json({ error: 'Sexo inválido.' });
  }

  try {
    const senhaHash = bcrypt.hashSync(senha, 10);
    
    const result = await pool.query(
      `INSERT INTO usuarios (nome, sexo, username, senha_hash, perfil, registro_profissional, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING id, nome, sexo, username, perfil, registro_profissional, ativo`,
      [nome, sexo, username, senhaHash, perfil, registro_profissional || null]
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

app.put('/usuarios/:id', requireSelfOrAdmin, async (req, res) => {
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
    query += ` WHERE id = $${paramCount} RETURNING id, nome, sexo, username, perfil, registro_profissional, ativo`;
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

app.get('/usuarios/:id', requireSelfOrAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, sexo, username, perfil, registro_profissional, ativo, criado_em FROM usuarios WHERE id = $1',
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

app.delete('/usuarios/:id', requireAdmin, async (req, res) => {
  const usuarioId = Number(req.params.id);
  const requesterId = parseRequesterUserId(req);

  if (usuarioId === requesterId) {
    return res.status(400).json({ error: 'Administrador não pode excluir sua própria conta.' });
  }

  try {
    const result = await pool.query(
      'UPDATE usuarios SET ativo = FALSE WHERE id = $1 RETURNING id, nome, sexo, username, perfil, registro_profissional, ativo',
      [usuarioId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.json({ usuario: result.rows[0] });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
