import { Request, Response } from 'express';
import { ContratoService } from '../../src/services/contrato.service';
import { obterDadosContrato, testarQuery, gerarContrato } from '../../src/controllers/contrato.controller';
import { DadosContrato } from '../../src/types';

// Mock do serviço de contrato
jest.mock('../../src/services/contrato.service', () => ({
  ContratoService: {
    obterDadosContrato: jest.fn(),
    testarQuery: jest.fn(),
    gerarContrato: jest.fn()
  }
}));

describe('ContratoController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObj: any = {};
  
  beforeEach(() => {
    responseObj = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    
    mockRequest = {};
    mockResponse = responseObj;
    
    jest.clearAllMocks();
  });
  
  describe('obterDadosContrato', () => {
    const mockDadosContrato: DadosContrato = {
      principal: [{ id: 1, nome: 'Cliente Teste' }],
      variaveis: {
        produtos: [{ id: 1, nome: 'Produto 1' }],
        enderecos: [{ rua: 'Rua Teste', numero: 123 }]
      }
    };
    
    it('deve retornar dados do contrato com sucesso', async () => {
      mockRequest = {
        params: { id: '123' },
        body: { clienteId: 1 }
      };
      
      (ContratoService.obterDadosContrato as jest.Mock).mockResolvedValue(mockDadosContrato);
      
      await obterDadosContrato(mockRequest as Request, mockResponse as Response);
      
      expect(ContratoService.obterDadosContrato).toHaveBeenCalledWith('123', { clienteId: 1 });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        mensagem: 'Dados para geração de contrato obtidos com sucesso',
        dados: mockDadosContrato
      });
    });
    
    it('deve retornar erro 400 se ID não for informado', async () => {
      mockRequest = {
        params: {},
        body: { clienteId: 1 }
      };
      
      await obterDadosContrato(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        mensagem: 'ID do modelo não informado'
      });
    });
    
    it('deve retornar erro 404 se modelo não for encontrado', async () => {
      mockRequest = {
        params: { id: '999' },
        body: { clienteId: 1 }
      };
      
      const erro = new Error('Modelo com ID 999 não encontrado');
      (ContratoService.obterDadosContrato as jest.Mock).mockRejectedValue(erro);
      
      await obterDadosContrato(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        mensagem: 'Modelo com ID 999 não encontrado'
      });
    });
    
    it('deve retornar erro 500 para outros erros', async () => {
      mockRequest = {
        params: { id: '123' },
        body: { clienteId: 1 }
      };
      
      const erro = new Error('Erro interno');
      (ContratoService.obterDadosContrato as jest.Mock).mockRejectedValue(erro);
      
      await obterDadosContrato(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        mensagem: 'Erro ao obter dados para geração de contrato',
        erro: 'Erro interno'
      });
    });
  });
  
  describe('gerarContrato', () => {
    const mockCaminhoContrato = '/uploads/contratos-gerados/Contrato_123_abc.docx';
    
    it('deve gerar contrato com sucesso', async () => {
      mockRequest = {
        params: { id: '123' },
        body: { 
          parametros: { clienteId: 1 },
          forcarRegeneracao: false
        }
      };
      
      (ContratoService.gerarContrato as jest.Mock).mockResolvedValue(mockCaminhoContrato);
      
      await gerarContrato(mockRequest as Request, mockResponse as Response);
      
      expect(ContratoService.gerarContrato).toHaveBeenCalledWith({
        modeloId: '123',
        parametros: { clienteId: 1 },
        forcarRegeneracao: false
      });
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        mensagem: 'Contrato gerado com sucesso',
        arquivo: {
          nome: 'Contrato_123_abc.docx',
          url: '/uploads/contratos-gerados/Contrato_123_abc.docx',
          caminho: mockCaminhoContrato
        }
      });
    });
    
    it('deve retornar erro 400 se ID não for informado', async () => {
      mockRequest = {
        params: {},
        body: { 
          parametros: { clienteId: 1 }
        }
      };
      
      await gerarContrato(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        mensagem: 'ID do modelo não informado'
      });
    });
    
    it('deve retornar erro 400 se parâmetros não forem informados', async () => {
      mockRequest = {
        params: { id: '123' },
        body: {}
      };
      
      await gerarContrato(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        mensagem: 'Parâmetros inválidos'
      });
    });
    
    it('deve retornar erro 404 se modelo não for encontrado', async () => {
      mockRequest = {
        params: { id: '999' },
        body: { 
          parametros: { clienteId: 1 }
        }
      };
      
      const erro = new Error('Modelo com ID 999 não encontrado');
      (ContratoService.gerarContrato as jest.Mock).mockRejectedValue(erro);
      
      await gerarContrato(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        mensagem: 'Modelo com ID 999 não encontrado'
      });
    });
    
    it('deve retornar erro 500 para outros erros', async () => {
      mockRequest = {
        params: { id: '123' },
        body: { 
          parametros: { clienteId: 1 }
        }
      };
      
      const erro = new Error('Erro interno');
      (ContratoService.gerarContrato as jest.Mock).mockRejectedValue(erro);
      
      await gerarContrato(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        mensagem: 'Erro ao gerar contrato',
        erro: 'Erro interno'
      });
    });
  });
  
  describe('testarQuery', () => {
    const mockResultadoQuery = [
      { id: 1, nome: 'Teste 1' },
      { id: 2, nome: 'Teste 2' }
    ];
    
    it('deve executar query com sucesso', async () => {
      mockRequest = {
        body: {
          query: 'SELECT * FROM testes',
          parametros: { id: 1 }
        }
      };
      
      (ContratoService.testarQuery as jest.Mock).mockResolvedValue(mockResultadoQuery);
      
      await testarQuery(mockRequest as Request, mockResponse as Response);
      
      expect(ContratoService.testarQuery).toHaveBeenCalledWith(
        'SELECT * FROM testes',
        { id: 1 }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        mensagem: 'Query executada com sucesso',
        resultado: mockResultadoQuery
      });
    });
    
    it('deve retornar erro 400 se query não for informada', async () => {
      mockRequest = {
        body: {
          parametros: { id: 1 }
        }
      };
      
      await testarQuery(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        mensagem: 'Query SQL não informada ou inválida'
      });
    });
    
    it('deve retornar erro 500 em caso de falha na execução da query', async () => {
      mockRequest = {
        body: {
          query: 'SELECT * FROM testes',
          parametros: { id: 1 }
        }
      };
      
      const erro = new Error('Erro ao executar query');
      (ContratoService.testarQuery as jest.Mock).mockRejectedValue(erro);
      
      await testarQuery(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        mensagem: 'Erro ao executar query de teste',
        erro: 'Erro ao executar query'
      });
    });
  });
}); 