-- Remover a chave estrangeira
ALTER TABLE profissionais DROP CONSTRAINT IF EXISTS profissionais_user_id_fkey;

-- Alterar o tipo da coluna user_id para TEXT
ALTER TABLE profissionais ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT; 