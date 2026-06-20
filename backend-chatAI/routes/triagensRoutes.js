import express from 'express';
// Importamos a ligação à base de dados e os bloqueios de segurança diretamente do main.js
import { pool, requireEnfermeiroMedicoOrAdmin, requireMedicoOrAdmin } from '../main.js';

const router = express.Router();

// 1. ROTA: GET /triagens (Busca todas as triagens)
router.get('/', requireEnfermeiroMedicoOrAdmin, async (_req, res) => {
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

// 2. ROTA: GET /triagens/:id (Busca uma triagem específica pelo ID)
router.get('/:id', requireMedicoOrAdmin, async (req, res) => {
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

// 3. ROTA: POST /triagens/:id/validacao (Grava a aprovação/rejeição do médico)
router.post('/:id/validacao', requireMedicoOrAdmin, async (req, res) => {
  const { medico_id, aprovado, diagnostico_correto, observacoes_clinicas } = req.body;

  if (typeof aprovado !== 'boolean' || !medico_id) {
    return res.status(400).json({ error: 'Campos médico e aprovado são obrigatórios.' });
  }

  try {
    const triagemId = Number(req.params.id);

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

export default router;