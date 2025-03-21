import { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as modeloController from '../../src/controllers/modelo.controller';
import { ModeloModel } from '../../src/models/modelo.model';

// Mock do mongoose
jest.mock('../../src/models/modelo.model');

describe('Modelo Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any = {};

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Configurar mock do response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation(result => {
        responseObject = result;
        return mockResponse;
      })
    };
    
    // Configurar mock do request
    mockRequest = {};
  });

  describe('listarModelos', () => {
    it('deve retornar lista de modelos', async () => {
      const modelos = [
        { _id: 'id1', titulo: 'Modelo 1' },
        { _id: 'id2', titulo: 'Modelo 2' }
      ];
      
      // Mock do método find do mongoose
      (ModeloModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(modelos)
      });
      
      await modeloController.listarModelos(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(modelos);
    });
    
    it('deve lidar com erro ao buscar modelos', async () => {
      // Mock do método find do mongoose para lançar erro
      (ModeloModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Erro ao listar'))
      });
      
      await modeloController.listarModelos(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ mensagem: 'Erro ao listar modelos' });
    });
  });
  
  describe('buscarModeloPorId', () => {
    it('deve retornar modelo quando ID existe', async () => {
      const modelo = { _id: 'id1', titulo: 'Modelo 1' };
      
      mockRequest.params = { id: 'id1' };
      
      // Mock do método findById do mongoose
      (ModeloModel.findById as jest.Mock).mockResolvedValue(modelo);
      
      await modeloController.buscarModeloPorId(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(modelo);
    });
    
    it('deve retornar 404 quando ID não existe', async () => {
      mockRequest.params = { id: 'idInexistente' };
      
      // Mock do método findById do mongoose
      (ModeloModel.findById as jest.Mock).mockResolvedValue(null);
      
      await modeloController.buscarModeloPorId(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ mensagem: 'Modelo não encontrado' });
    });
  });
}); 