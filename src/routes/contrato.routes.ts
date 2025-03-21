import { Router } from 'express';
import * as contratoController from '../controllers/contrato.controller';

const router = Router();

// Rota para obter dados para geração de contrato
router.post('/dados/:id', contratoController.obterDadosContrato);

// Rota para gerar contrato a partir de um modelo
router.post('/gerar/:id', contratoController.gerarContrato);

// Rota para testes de queries SQL (deve ser protegida em ambiente de produção)
router.post('/testar-query', contratoController.testarQuery);

export default router; 