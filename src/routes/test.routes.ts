/**
 * Rotas de teste para validação de funcionalidades
 * ATENÇÃO: Use apenas em ambiente de desenvolvimento/teste
 */

import { Router } from 'express';
import { testarCriacaoProfissional } from '../services/profissional.test';

const router = Router();

/**
 * @route   GET /api/test/profissional/criar-sem-campos-opcionais
 * @desc    Testa a criação de um profissional sem os campos opcionais (estado e endereço)
 * @access  Apenas desenvolvimento
 */
router.get('/profissional/criar-sem-campos-opcionais', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Rota de teste não disponível em ambiente de produção'
      });
    }

    const resultado = await testarCriacaoProfissional();
    
    if (resultado.sucesso) {
      return res.status(200).json(resultado);
    } else {
      return res.status(400).json(resultado);
    }
  } catch (error: any) {
    console.error('Erro no endpoint de teste:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno no servidor durante teste',
      erro: error.message
    });
  }
});

export { router as testRoutes }; 