#!/bin/bash

echo "Iniciando implantação do backend Anunciar Grajaú..."

# Atualizar código a partir do repositório
echo "Atualizando código do repositório..."
git pull origin master

# Instalar dependências
echo "Instalando dependências..."
npm install

# Copiar arquivo de ambiente de produção
echo "Configurando ambiente de produção..."
cp .env.production .env

# Gerar cliente Prisma
echo "Gerando cliente Prisma..."
npx prisma generate

# Compilar aplicação
echo "Compilando aplicação..."
npm run build

# Verificar se o PM2 está instalado
if ! command -v pm2 &> /dev/null
then
    echo "PM2 não encontrado, instalando..."
    npm install -g pm2
fi

# Reiniciar aplicação com PM2
echo "Reiniciando aplicação com PM2..."
pm2 restart novobackgrajau || pm2 start dist/src/server.js --name novobackgrajau

echo "Implantação concluída com sucesso!" 