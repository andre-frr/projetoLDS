-- =========================
--   Tipos e tabelas lookup
-- =========================

-- Tipo de curso
DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'curso_tipo') THEN
            CREATE TYPE curso_tipo AS ENUM ('T', 'LIC', 'MEST', 'DOUT');
        END IF;
    END
$$;

-- Tipo de hora de contacto
DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_hora') THEN
            CREATE TYPE tipo_hora AS ENUM ('PL', 'T', 'TP', 'OT');
        END IF;
    END
$$;

-- (Opcional) lista de graus académicos
CREATE TABLE IF NOT EXISTS grau
(
    id_grau SMALLSERIAL PRIMARY KEY,
    nome    TEXT NOT NULL UNIQUE -- e.g., 'Licenciatura', 'Mestrado', 'Doutoramento', 'Agregação'
);

-- ===============
--   Entidades
-- ===============

CREATE TABLE IF NOT EXISTS departamento
(
    id_dep SERIAL PRIMARY KEY,
    nome   TEXT    NOT NULL,
    sigla  TEXT    NOT NULL,
    ativo  BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_departamento_sigla UNIQUE (sigla),
    CONSTRAINT uq_departamento_nome UNIQUE (nome)
);

CREATE TABLE IF NOT EXISTS area_cientifica
(
    id_area SERIAL PRIMARY KEY,
    nome    TEXT    NOT NULL,
    sigla   TEXT    NOT NULL,
    id_dep  INTEGER NOT NULL REFERENCES departamento (id_dep)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    ativo   BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_area_sigla UNIQUE (sigla)
);

CREATE TABLE IF NOT EXISTS docente
(
    id_doc    SERIAL PRIMARY KEY,
    nome      TEXT    NOT NULL,
    id_area   INTEGER NOT NULL REFERENCES area_cientifica (id_area)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    email     TEXT    NOT NULL,
    ativo     BOOLEAN NOT NULL DEFAULT TRUE,
    convidado BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_docente_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS curso
(
    id_curso SERIAL PRIMARY KEY,
    nome     TEXT       NOT NULL,
    sigla    TEXT       NOT NULL,
    tipo     curso_tipo NOT NULL, -- T, LIC, MEST, DOUT
    ativo    BOOLEAN    NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_curso_sigla UNIQUE (sigla)
);

CREATE TABLE IF NOT EXISTS uc
(
    id_uc     SERIAL PRIMARY KEY,
    nome      TEXT          NOT NULL,
    id_curso  INTEGER       NOT NULL REFERENCES curso (id_curso)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    id_area   INTEGER       NOT NULL REFERENCES area_cientifica (id_area)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    ano_curso SMALLINT      NOT NULL CHECK (ano_curso BETWEEN 1 AND 10),
    sem_curso SMALLINT      NOT NULL CHECK (sem_curso IN (1, 2)),
    ects      NUMERIC(4, 1) NOT NULL CHECK (ects >= 0),
    ativo     BOOLEAN       NOT NULL DEFAULT TRUE
);

-- Tabela associativa para horas por tipo numa UC
CREATE TABLE IF NOT EXISTS uc_horas_contacto
(
    id_uc INTEGER   NOT NULL REFERENCES uc (id_uc)
        ON UPDATE CASCADE ON DELETE CASCADE,
    tipo  tipo_hora NOT NULL, -- PL, T, TP, OT
    horas INTEGER   NOT NULL CHECK (horas >= 0),
    PRIMARY KEY (id_uc, tipo)
);

-- Graus académicos do docente (histórico)
CREATE TABLE IF NOT EXISTS docente_grau
(
    id_dg       SERIAL PRIMARY KEY,
    id_doc      INTEGER  NOT NULL REFERENCES docente (id_doc)
        ON UPDATE CASCADE ON DELETE CASCADE,
    id_grau     SMALLINT REFERENCES grau (id_grau)
                             ON UPDATE CASCADE ON DELETE SET NULL,
    grau_nome   TEXT, -- alternativa quando não quiser usar a tabela grau
    data        DATE     NOT NULL,
    link_certif TEXT,
    -- pelo menos um dos dois (id_grau, grau_nome) deve estar preenchido
    CONSTRAINT ck_dg_grau_informado CHECK (
        id_grau IS NOT NULL OR (grau_nome IS NOT NULL AND btrim(grau_nome) <> '')
        )
);

-- Histórico de CVs do docente
CREATE TABLE IF NOT EXISTS historico_cv_docente
(
    id_hcd  SERIAL PRIMARY KEY,
    id_doc  INTEGER NOT NULL REFERENCES docente (id_doc)
        ON UPDATE CASCADE ON DELETE CASCADE,
    data    DATE    NOT NULL,
    link_cv TEXT    NOT NULL
);

-- =========================
--   Índices adicionais
-- =========================
CREATE INDEX IF NOT EXISTS idx_area_dep ON area_cientifica (id_dep);
CREATE INDEX IF NOT EXISTS idx_doc_area ON docente (id_area);
CREATE INDEX IF NOT EXISTS idx_uc_curso ON uc (id_curso);
CREATE INDEX IF NOT EXISTS idx_uc_area ON uc (id_area);
CREATE INDEX IF NOT EXISTS idx_uc_horas_tipo ON uc_horas_contacto (tipo);
CREATE INDEX IF NOT EXISTS idx_dg_doc ON docente_grau (id_doc);
CREATE INDEX IF NOT EXISTS idx_hcv_doc ON historico_cv_docente (id_doc);

-- ==================================
--   Autenticação e Autorização
-- ==================================

DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
            CREATE TYPE user_role AS ENUM ('Administrador', 'Coordenador', 'Docente', 'Convidado');
        END IF;
    END
$$;

CREATE TABLE IF NOT EXISTS users
(
    id            SERIAL PRIMARY KEY,
    email         TEXT      NOT NULL UNIQUE,
    password_hash TEXT      NOT NULL,
    role          user_role NOT NULL,
    token_version INTEGER   NOT NULL DEFAULT 1,
    ativo         BOOLEAN   NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS sessions
(
    id         UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    user_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    family_id  UUID        NOT NULL,
    revoked_at TIMESTAMPTZ NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens
(
    id         UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    session_id UUID        NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
    token_hash TEXT        NOT NULL,
    is_revoked BOOLEAN     NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para otimização de queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_session_id ON refresh_tokens (session_id);

-- Adicionar coluna para API Key
CREATE TABLE IF NOT EXISTS api_keys
(
    id          SERIAL PRIMARY KEY,
    api_key     TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN     DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de auditoria para rastrear ações dos usuários
CREATE TABLE IF NOT EXISTS audit_logs
(
    id         SERIAL PRIMARY KEY,
    action     TEXT        NOT NULL,
    user_id    INTEGER REFERENCES users (id) ON DELETE SET NULL,
    details    JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para otimização de queries de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
