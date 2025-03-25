import { Router } from 'express';
import * as modeloController from '../controllers/modelo.controller';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Rota para upload de arquivo de template (aceita arquivo único via multipart/form-data)
router.post('/upload', upload.single('file'), modeloController.uploadTemplate);

// Rota para criar um novo modelo de contrato (aceita arquivo único via multipart/form-data)
router.post('/', upload.single('file'), modeloController.criarModelo);

// Rota para listar todos os modelos de contratos disponíveis
router.get('/', modeloController.listarModelos);

// Rota para buscar um modelo específico pelo seu ID
router.get('/:id', modeloController.buscarModeloPorId);

// Rota para atualizar um modelo existente (aceita arquivo único via multipart/form-data)
router.put('/:id', upload.single('file'), modeloController.atualizarModelo);

// Rota para excluir um modelo específico pelo seu ID
router.delete('/:id', modeloController.excluirModelo);

export default router; 