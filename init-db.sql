-- ==============================================================
-- SCRIPT DE INICIALIZAÇÃO DO BANCO DE DADOS - HCI VITTA
-- ==============================================================
-- Data: 2026-06-20
-- Descrição: Cria a estrutura completa do banco com tipos, tabelas e dados iniciais
-- ==============================================================

-- 1. Definição dos perfis de usuários do sistema
CREATE TYPE perfil_usuario AS ENUM ('RECEPCIONISTA', 'ENFERMEIRO', 'MEDICO', 'ADMINISTRADOR');

-- 2. Definição do ciclo de vida da triagem e retroalimentação
CREATE TYPE status_triagem AS ENUM ('PENDENTE', 'APROVADO', 'REPROVADO');

-- 3. Definição das opções de sexo alinhadas ao formulário
CREATE TYPE sexo_opcoes AS ENUM ('FEMININO', 'MASCULINO', 'OUTRO', 'PREFIRO_NAO_INFORMAR');

-- 4. Tabela de Funcionários (Autenticação e Permissões)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    sexo sexo_opcoes NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil perfil_usuario NOT NULL,
    registro_profissional VARCHAR(30) UNIQUE,
    criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE
);

-- 5. Tabela de Sessões de Triagem (Histórico do Chat da IA)
-- Os dados do paciente (nome, cpf, sexo e idade) são gravados diretamente aqui por sessão para agilizar o atendimento.
CREATE TABLE triagens (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL, -- Operador que realizou a triagem
    nome_paciente VARCHAR(150) NOT NULL, -- Capturado do formulário
    cpf CHAR(11) NOT NULL, -- Sem restrição UNIQUE para permitir múltiplos atendimentos do mesmo paciente
    sexo_paciente sexo_opcoes NOT NULL, -- Capturado do select do formulário
    idade_paciente INT, -- Capturado do formulário
    dados_anamnese TEXT NOT NULL, -- Queixas digitadas
    diagnostico_ia TEXT NOT NULL, -- Retorno do motor RAG
    classificacao_risco VARCHAR(50), -- Protocolo aplicado
    status status_triagem DEFAULT 'PENDENTE',
    criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabela de Validações Clínicas (Retroalimentação da IA)
CREATE TABLE retroalimentacao_medica (
    id SERIAL PRIMARY KEY,
    triagem_id INT UNIQUE REFERENCES triagens(id) ON DELETE CASCADE,
    medico_id INT REFERENCES usuarios(id) ON DELETE RESTRICT,
    aprovado BOOLEAN NOT NULL,
    diagnostico_correto TEXT,
    observacoes_clinicas TEXT,
    avaliado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Índices para otimização de buscas locais no painel
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_triagens_status ON triagens(status);
CREATE INDEX idx_triagens_cpf ON triagens(cpf); -- Essencial para buscar o histórico de um paciente pelo CPF rapidamente

-- 8. Trigger de Atualização Automática de Status
CREATE OR REPLACE FUNCTION fn_atualizar_status_triagem()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.aprovado = TRUE THEN
        UPDATE triagens SET status = 'APROVADO' WHERE id = NEW.triagem_id;
    ELSIF NEW.aprovado = FALSE THEN
        UPDATE triagens SET status = 'REPROVADO' WHERE id = NEW.triagem_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_apos_inserir_retroalimentacao
AFTER INSERT ON retroalimentacao_medica
FOR EACH ROW
EXECUTE FUNCTION fn_atualizar_status_triagem();

-- 9. Inserir usuários de teste com hashes bcrypt válidos
INSERT INTO usuarios (nome, sexo, username, senha_hash, perfil, registro_profissional, ativo)
VALUES ('Administrador do Sistema', 'MASCULINO', 'admin', '$2a$10$W2nDQrrsKniMPYOCsyEYP..3jFytGUSfxWwiM5QRnU4l3ve43.K9W', 'ADMINISTRADOR', 'ADM-001', TRUE);

INSERT INTO usuarios (nome, sexo, username, senha_hash, perfil, registro_profissional, ativo)
VALUES ('Enfermeira Maria Silva', 'FEMININO', 'maria.enfermeira', '$2a$10$rVPOqqTV.Z6yB4IrfqProuxyFZ6d5Aa4Lqr.1LXoLBu21Gtb1RHKe', 'ENFERMEIRO', 'COREN-123456', TRUE);

INSERT INTO usuarios (nome, sexo, username, senha_hash, perfil, registro_profissional, ativo)
VALUES ('Dr. Carlos Andrade', 'MASCULINO', 'carlos.medico', '$2a$10$AJ3L1KlCeRsGwQvxgkcTReCLJzfsQhyKVoUZbjkANosNjJLeInYye', 'MEDICO', 'CRM-789012', TRUE);

-- ==============================================================
-- FIM DO SCRIPT DE INICIALIZAÇÃO
-- ==============================================================
