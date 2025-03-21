import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { ModeloModel } from '../../src/models/modelo.model';
import modeloRoutes from '../../src/routes/modelo.routes';
import { criarArquivoTemporario, limparArquivoTemporario, criarModeloTeste } from '../utils/test-helpers';

// Arquivo temporário para teste
let arquivoTemporario: string;

// Configurar aplicação express para testes
const app = express();
app.use(express.json());
app.use('/api/modelos', modeloRoutes);

describe('Rotas de Modelo - Testes de Integração', () => {
  
  beforeAll(() => {
    arquivoTemporario = criarArquivoTemporario();
  });
  
  afterAll(() => {
    limparArquivoTemporario(arquivoTemporario);
  });
  
  describe('GET /api/modelos', () => {
    it('deve retornar lista vazia quando não há modelos', async () => {
      const response = await request(app).get('/api/modelos');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
    
    it('deve retornar lista com modelos cadastrados', async () => {
      // Criar um modelo de teste
      await criarModeloTeste();
      
      const response = await request(app).get('/api/modelos');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].titulo).toBe('Modelo de Teste');
    });
  });
  
  describe('GET /api/modelos/:id', () => {
    it('deve retornar 404 para ID inexistente', async () => {
      const idInexistente = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/modelos/${idInexistente}`);
      
      expect(response.status).toBe(404);
    });
    
    it('deve retornar o modelo quando ID existe', async () => {
      const modelo = await criarModeloTeste();
      
      const response = await request(app).get(`/api/modelos/${modelo._id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.titulo).toBe(modelo.titulo);
    });
  });
  
  describe('POST /api/modelos', () => {
    it('deve criar um novo modelo', async () => {
      const modeloData = {
        titulo: 'Novo Modelo',
        tipo: 'contrato',
        descricao: 'Descrição do novo modelo',
        queryPrincipal: 'SELECT * FROM tabela',
        variaveis: JSON.stringify([
          {
            nome: 'TESTE',
            tipo: 'simples',
            subvariaveis: [],
            query: ''
          }
        ]),
        caminhoTemplate: arquivoTemporario
      };
      
      const response = await request(app)
        .post('/api/modelos')
        .field('titulo', modeloData.titulo)
        .field('tipo', modeloData.tipo)
        .field('descricao', modeloData.descricao)
        .field('queryPrincipal', modeloData.queryPrincipal)
        .field('variaveis', modeloData.variaveis)
        .field('caminhoTemplate', modeloData.caminhoTemplate);
      
      expect(response.status).toBe(201);
      expect(response.body.titulo).toBe(modeloData.titulo);
    });
  });
  
  describe('DELETE /api/modelos/:id', () => {
    it('deve excluir um modelo existente', async () => {
      const modelo = await criarModeloTeste();
      
      const response = await request(app).delete(`/api/modelos/${modelo._id}`);
      
      expect(response.status).toBe(200);
      
      // Verificar se foi excluído
      const modeloAposDeletar = await ModeloModel.findById(modelo._id);
      expect(modeloAposDeletar).toBeNull();
    });
  });
}); 