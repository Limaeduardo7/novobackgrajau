/**
 * Arquivo de teste para o serviço de profissionais
 * 
 * Este arquivo contém testes para validar o comportamento de criação
 * de profissionais, especialmente considerando o campo 'estado' como opcional.
 */

import ProfissionalService from './profissional.factory';
import { Profissional } from '../types/profissional';

// Função auxiliar para testar a criação de profissionais
async function testarCriacaoProfissional() {
  try {
    // Dados mínimos obrigatórios para criar um profissional
    const profissionalData: Partial<Profissional> = {
      nome: 'Profissional Teste',
      ocupacao: 'Desenvolvedor',
      cidade: 'São Paulo',
      email: 'teste@exemplo.com',
      especialidades: ['JavaScript', 'TypeScript'],
      experiencia: '5 anos',
      educacao: ['Graduação em Ciência da Computação'],
      disponibilidade: 'Segunda a Sexta',
      sobre: 'Descrição do profissional',
      telefone: '11999999999',
      featured: false,
      status: 'PENDING'
    };

    console.log('[TESTE] Tentando criar profissional sem estado');
    const resultado = await ProfissionalService.createProfissional(profissionalData as any);
    
    console.log('[TESTE] Profissional criado com sucesso:', resultado.data.id);
    console.log('[TESTE] Estado do profissional:', resultado.data.estado || 'Não definido');
    
    return {
      sucesso: true,
      mensagem: 'Profissional criado com sucesso sem o campo estado',
      id: resultado.data.id
    };
  } catch (error: any) {
    console.error('[TESTE] Erro ao criar profissional:', error);
    return {
      sucesso: false,
      mensagem: error.message,
      erro: error
    };
  }
}

// Exportar função para uso externo (via API de testes ou linha de comando)
export { testarCriacaoProfissional }; 