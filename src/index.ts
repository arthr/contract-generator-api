import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase } from './config/database';
import modeloRoutes from './routes/modelo.routes';
import { errorHandler } from './middleware/error.middleware';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar aplicação Express
const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta de uploads
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

// Rotas
app.use('/api/modelos', modeloRoutes);

// Middleware de tratamento de erros
app.use(errorHandler);

// Rota padrão para verificar se a API está funcionando
app.get('/', (_req, res) => {
  res.json({ mensagem: 'API de geração de contratos está funcionando' });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Iniciar o servidor
    app.listen(PORT, () => {
      console.log(`Servidor iniciado na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer(); 