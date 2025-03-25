-- Criar tabela de profissionais
CREATE TABLE IF NOT EXISTS profissionais (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    ocupacao VARCHAR(255) NOT NULL,
    descricao TEXT,
    foto TEXT,
    endereco TEXT,
    telefone VARCHAR(50),
    estado VARCHAR(2) NOT NULL,
    cidade VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    website VARCHAR(255),
    redes_sociais JSONB,
    disponibilidade JSONB,
    is_featured BOOLEAN DEFAULT FALSE,
    avaliacao DECIMAL(3, 1),
    status VARCHAR(20) DEFAULT 'PENDING',
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_profissionais_ocupacao ON profissionais (ocupacao);
CREATE INDEX IF NOT EXISTS idx_profissionais_estado ON profissionais (estado);
CREATE INDEX IF NOT EXISTS idx_profissionais_cidade ON profissionais (cidade);
CREATE INDEX IF NOT EXISTS idx_profissionais_status ON profissionais (status);
CREATE INDEX IF NOT EXISTS idx_profissionais_featured ON profissionais (is_featured);
CREATE INDEX IF NOT EXISTS idx_profissionais_user_id ON profissionais (user_id);

-- Comentários da tabela
COMMENT ON TABLE profissionais IS 'Tabela para armazenar informações de profissionais';
COMMENT ON COLUMN profissionais.id IS 'Identificador único do profissional';
COMMENT ON COLUMN profissionais.name IS 'Nome do profissional';
COMMENT ON COLUMN profissionais.slug IS 'Versão formatada do nome para URLs';
COMMENT ON COLUMN profissionais.ocupacao IS 'Ocupação ou profissão';
COMMENT ON COLUMN profissionais.descricao IS 'Descrição do profissional e seus serviços';
COMMENT ON COLUMN profissionais.foto IS 'URL da foto de perfil';
COMMENT ON COLUMN profissionais.endereco IS 'Endereço do local de trabalho';
COMMENT ON COLUMN profissionais.telefone IS 'Telefone para contato';
COMMENT ON COLUMN profissionais.estado IS 'Estado (UF) onde atua';
COMMENT ON COLUMN profissionais.cidade IS 'Cidade onde atua';
COMMENT ON COLUMN profissionais.email IS 'Email para contato';
COMMENT ON COLUMN profissionais.website IS 'Website do profissional';
COMMENT ON COLUMN profissionais.redes_sociais IS 'Links para redes sociais em formato JSON';
COMMENT ON COLUMN profissionais.disponibilidade IS 'Horários de disponibilidade em formato JSON';
COMMENT ON COLUMN profissionais.is_featured IS 'Indica se o profissional está em destaque';
COMMENT ON COLUMN profissionais.avaliacao IS 'Avaliação média (de 0 a 5)';
COMMENT ON COLUMN profissionais.status IS 'Status do profissional (APPROVED, REJECTED, PENDING)';
COMMENT ON COLUMN profissionais.user_id IS 'ID do usuário vinculado ao perfil profissional';
COMMENT ON COLUMN profissionais.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN profissionais.updated_at IS 'Data da última atualização do registro'; 