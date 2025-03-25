-- Extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de profissionais
CREATE TABLE IF NOT EXISTS profissionais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    nome VARCHAR(255) NOT NULL,
    ocupacao VARCHAR(100) NOT NULL,
    especialidades TEXT[] NOT NULL,
    experiencia TEXT NOT NULL,
    educacao TEXT[] NOT NULL,
    certificacoes TEXT[],
    portfolio TEXT[],
    disponibilidade VARCHAR(100) NOT NULL,
    valor_hora NUMERIC(10,2),
    sobre TEXT NOT NULL,
    foto VARCHAR(500),
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    endereco VARCHAR(255),
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    social_media JSONB,
    status VARCHAR(20) DEFAULT 'PENDING',
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_profissionais_ocupacao ON profissionais (ocupacao);
CREATE INDEX IF NOT EXISTS idx_profissionais_cidade_estado ON profissionais (cidade, estado);
CREATE INDEX IF NOT EXISTS idx_profissionais_status ON profissionais (status);
CREATE INDEX IF NOT EXISTS idx_profissionais_featured ON profissionais (featured);
CREATE INDEX IF NOT EXISTS idx_profissionais_user_id ON profissionais (user_id);

-- Comentários da tabela
COMMENT ON TABLE profissionais IS 'Tabela para armazenar informações de profissionais';
COMMENT ON COLUMN profissionais.id IS 'Identificador único do profissional';
COMMENT ON COLUMN profissionais.user_id IS 'Referência ao usuário associado ao perfil';
COMMENT ON COLUMN profissionais.nome IS 'Nome completo do profissional';
COMMENT ON COLUMN profissionais.ocupacao IS 'Ocupação ou profissão principal';
COMMENT ON COLUMN profissionais.especialidades IS 'Lista de especialidades ou áreas de atuação';
COMMENT ON COLUMN profissionais.experiencia IS 'Descrição da experiência profissional';
COMMENT ON COLUMN profissionais.educacao IS 'Lista de formação educacional (instituições, cursos)';
COMMENT ON COLUMN profissionais.certificacoes IS 'Lista de certificações profissionais';
COMMENT ON COLUMN profissionais.portfolio IS 'Links ou referências a trabalhos realizados';
COMMENT ON COLUMN profissionais.disponibilidade IS 'Descrição de disponibilidade para trabalho';
COMMENT ON COLUMN profissionais.valor_hora IS 'Valor cobrado por hora de serviço';
COMMENT ON COLUMN profissionais.sobre IS 'Texto de apresentação do profissional';
COMMENT ON COLUMN profissionais.foto IS 'URL da foto de perfil';
COMMENT ON COLUMN profissionais.telefone IS 'Telefone para contato';
COMMENT ON COLUMN profissionais.email IS 'Email para contato';
COMMENT ON COLUMN profissionais.website IS 'Website profissional';
COMMENT ON COLUMN profissionais.endereco IS 'Endereço de trabalho ou atendimento';
COMMENT ON COLUMN profissionais.cidade IS 'Cidade onde atua';
COMMENT ON COLUMN profissionais.estado IS 'Estado (UF) onde atua';
COMMENT ON COLUMN profissionais.social_media IS 'Links para redes sociais em formato JSON';
COMMENT ON COLUMN profissionais.status IS 'Status do profissional (APPROVED, REJECTED, PENDING)';
COMMENT ON COLUMN profissionais.featured IS 'Indica se o profissional está em destaque';
COMMENT ON COLUMN profissionais.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN profissionais.updated_at IS 'Data da última atualização do registro';

-- Políticas de segurança (RLS)
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ver profissionais aprovados
CREATE POLICY "Usuários autenticados podem ver profissionais aprovados"
ON profissionais
FOR SELECT
TO authenticated
USING (status = 'APPROVED');

-- Usuários podem ver seus próprios perfis
CREATE POLICY "Usuários podem ver seus próprios perfis"
ON profissionais
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Usuários podem atualizar seus próprios perfis
CREATE POLICY "Usuários podem atualizar seus próprios perfis"
ON profissionais
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Administradores têm acesso completo
CREATE POLICY "Administradores têm acesso completo"
ON profissionais
FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE users.id = auth.uid() 
    AND users.email = 'anunciargrajau@gmail.com'
)); 