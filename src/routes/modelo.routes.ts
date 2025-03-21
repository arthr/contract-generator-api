import { Router } from 'express';
import * as modeloController from '../controllers/modelo.controller';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Rota para upload de arquivo de template
router.post('/upload', upload.single('arquivoTemplate'), modeloController.uploadTemplate);

// Rotas CRUD para modelos
router.post('/', upload.single('arquivoTemplate'), modeloController.criarModelo);
router.get('/', modeloController.listarModelos);
router.get('/:id', modeloController.buscarModeloPorId);
router.put('/:id', upload.single('arquivoTemplate'), modeloController.atualizarModelo);
router.delete('/:id', modeloController.excluirModelo);

export default router; 