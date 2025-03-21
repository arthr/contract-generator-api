import { ContratoService } from '../../src/services/contrato.service';
import { SqlQueryService } from '../../src/services/sqlQuery.service';
import { ModeloModel } from '../../src/models/modelo.model';
import { ContratoGeradoModel } from '../../src/models/contratoGerado.model';
import { Modelo, ContratoGerado } from '../../src/types';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Mock para docx-templates
jest.mock('docx-templates', () => ({
  createReport: jest.fn().mockResolvedValue(Buffer.from('mock document content'))
}));

// Mock do módulo fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue(Buffer.from('template content')),
  writeFileSync: jest.fn()
}));

// Mock do serviço SqlQueryService
jest.mock('../../src/services/sqlQuery.service', () => ({
  SqlQueryService: {
    executarQueryModelo: jest.fn(),
    executarQueriesVariaveis: jest.fn(),
    executeQuery: jest.fn()
  }
}));

// Mock do modelo de dados
jest.mock('../../src/models/modelo.model', () => ({
  ModeloModel: {
    findById: jest.fn()
  }
}));

// Mock do modelo de contratos gerados
jest.mock('../../src/models/contratoGerado.model', () => ({
  ContratoGeradoModel: {
    findOne: jest.fn(),
    updateOne: jest.fn(),
    create: jest.fn()
  }
}));

describe('ContratoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const modeloMock: Modelo = {
    titulo: 'Modelo de Teste',
    tipo: 'Contrato',
    descricao: 'Descrição do modelo de teste',
    caminhoTemplate: '/uploads/teste.docx',
    queryPrincipal: 'SELECT * FROM clientes WHERE id = :clienteId',
    variaveis: [
      {
        nome: 'produtos',
        tipo: 'lista',
        subvariaveis: ['nome', 'valor'],
        query: 'SELECT * FROM produtos WHERE clienteId = :clienteId'
      },
      {
        nome: 'endereco',
        tipo: 'simples',
        subvariaveis: [],
        query: 'SELECT * FROM enderecos WHERE clienteId = :clienteId'
      }
    ],
    updatedAt: new Date('2023-03-01')
  };

  describe('buscarModelo', () => {
    it('deve retornar um modelo pelo ID', async () => {
      (ModeloModel.findById as jest.Mock).mockResolvedValue(modeloMock);

      const resultado = await ContratoService.buscarModelo('123');

      expect(ModeloModel.findById).toHaveBeenCalledWith('123');
      expect(resultado).toEqual(modeloMock);
    });

    it('deve tratar erros ao buscar modelo', async () => {
      const mockError = new Error('Erro ao buscar modelo');
      jest.spyOn(console, 'error').mockImplementation(() => {});
      (ModeloModel.findById as jest.Mock).mockRejectedValue(mockError);

      await expect(ContratoService.buscarModelo('123')).rejects.toThrow('Erro ao buscar modelo');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('obterDadosContrato', () => {
    it('deve obter os dados para geração do contrato', async () => {
      // Mocks dos retornos
      (ModeloModel.findById as jest.Mock).mockResolvedValue(modeloMock);
      (SqlQueryService.executarQueryModelo as jest.Mock).mockResolvedValue([{ id: 1, nome: 'Cliente Teste' }]);
      (SqlQueryService.executarQueriesVariaveis as jest.Mock).mockResolvedValue({
        produtos: [{ id: 1, nome: 'Produto 1', valor: 100 }],
        endereco: [{ rua: 'Rua Teste', numero: 123 }]
      });

      const parametros = { clienteId: 1 };
      const resultado = await ContratoService.obterDadosContrato('123', parametros);

      expect(ModeloModel.findById).toHaveBeenCalledWith('123');
      expect(SqlQueryService.executarQueryModelo).toHaveBeenCalledWith(
        modeloMock.queryPrincipal,
        parametros
      );
      
      expect(SqlQueryService.executarQueriesVariaveis).toHaveBeenCalledWith(
        {
          produtos: 'SELECT * FROM produtos WHERE clienteId = :clienteId',
          endereco: 'SELECT * FROM enderecos WHERE clienteId = :clienteId'
        },
        parametros
      );

      expect(resultado).toEqual({
        principal: [{ id: 1, nome: 'Cliente Teste' }],
        variaveis: {
          produtos: [{ id: 1, nome: 'Produto 1', valor: 100 }],
          endereco: [{ rua: 'Rua Teste', numero: 123 }]
        }
      });
    });

    it('deve lançar erro quando o modelo não for encontrado', async () => {
      (ModeloModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(ContratoService.obterDadosContrato('123', {}))
        .rejects.toThrow('Modelo com ID 123 não encontrado');
    });

    it('deve tratar erros ao obter dados do contrato', async () => {
      const mockError = new Error('Erro ao executar query');
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      (ModeloModel.findById as jest.Mock).mockResolvedValue(modeloMock);
      (SqlQueryService.executarQueryModelo as jest.Mock).mockRejectedValue(mockError);

      await expect(ContratoService.obterDadosContrato('123', {}))
        .rejects.toThrow('Erro ao executar query');
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('gerarHashContrato', () => {
    it('deve gerar um hash único para um contrato', () => {
      const modeloId = '123';
      const parametros = { clienteId: 1 };
      
      // Mock para crypto.createHash
      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('abcdef1234567890')
      };
      jest.spyOn(crypto, 'createHash').mockReturnValue(mockHash as any);
      
      const resultado = ContratoService.gerarHashContrato(modeloId, parametros);
      
      expect(crypto.createHash).toHaveBeenCalledWith('md5');
      expect(mockHash.update).toHaveBeenCalledWith(JSON.stringify({ modeloId, parametros }));
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
      expect(resultado).toBe('abcdef1234567890');
    });
  });

  describe('gerarContrato', () => {
    const parametros = { clienteId: 1 };
    const modeloId = '123';
    const mockHash = 'abcdef1234567890';
    const mockCaminhoCompleto = '/uploads/contratos-gerados/Modelo_de_Teste_abcdef1234567890.docx';

    beforeEach(() => {
      // Mock do método gerarHashContrato
      jest.spyOn(ContratoService, 'gerarHashContrato').mockReturnValue(mockHash);
      
      // Mock para verificar diretórios
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      // Mock para busca de modelos
      (ModeloModel.findById as jest.Mock).mockResolvedValue(modeloMock);
      
      // Mock para dados do contrato
      jest.spyOn(ContratoService, 'obterDadosContrato').mockResolvedValue({
        principal: [{ id: 1, nome: 'Cliente Teste' }],
        variaveis: {
          produtos: [{ id: 1, nome: 'Produto 1' }],
          endereco: [{ rua: 'Rua Teste', numero: 123 }]
        }
      });
    });

    it('deve reutilizar um contrato existente se não houve alterações', async () => {
      // Mock para contrato existente
      const contratoExistente: ContratoGerado = {
        modeloId,
        parametros,
        caminhoArquivo: mockCaminhoCompleto,
        dataGeracao: new Date('2023-04-01'),
        hash: mockHash
      };
      
      (ContratoGeradoModel.findOne as jest.Mock).mockResolvedValue(contratoExistente);
      
      // Mock para validação de modificação do modelo
      jest.spyOn(ContratoService, 'modeloModificadoAposGeracao').mockReturnValue(false);
      
      const resultado = await ContratoService.gerarContrato({ modeloId, parametros });
      
      expect(ContratoService.gerarHashContrato).toHaveBeenCalledWith(modeloId, parametros);
      expect(ContratoGeradoModel.findOne).toHaveBeenCalledWith({ modeloId, hash: mockHash });
      expect(ContratoService.obterDadosContrato).not.toHaveBeenCalled();
      expect(resultado).toBe(mockCaminhoCompleto);
    });

    it('deve gerar um novo contrato quando forçado mesmo que exista um anterior', async () => {
      // Mock para contrato existente
      const contratoExistente: ContratoGerado = {
        modeloId,
        parametros,
        caminhoArquivo: mockCaminhoCompleto,
        dataGeracao: new Date('2023-04-01'),
        hash: mockHash
      };
      
      (ContratoGeradoModel.findOne as jest.Mock).mockResolvedValue(contratoExistente);
      
      const resultado = await ContratoService.gerarContrato({ 
        modeloId, 
        parametros, 
        forcarRegeneracao: true 
      });
      
      expect(ContratoService.obterDadosContrato).toHaveBeenCalledWith(modeloId, parametros);
      expect(ContratoGeradoModel.updateOne).toHaveBeenCalled();
      expect(resultado).toBe(mockCaminhoCompleto);
    });

    it('deve gerar um novo contrato quando não existir um anterior', async () => {
      (ContratoGeradoModel.findOne as jest.Mock).mockResolvedValue(null);
      
      const resultado = await ContratoService.gerarContrato({ modeloId, parametros });
      
      expect(ContratoService.obterDadosContrato).toHaveBeenCalledWith(modeloId, parametros);
      expect(ContratoGeradoModel.create).toHaveBeenCalled();
      expect(resultado).toBe(mockCaminhoCompleto);
    });

    it('deve gerar um novo contrato quando o modelo foi atualizado', async () => {
      // Mock para contrato existente com data anterior à atualização do modelo
      const contratoExistente: ContratoGerado = {
        modeloId,
        parametros,
        caminhoArquivo: mockCaminhoCompleto,
        dataGeracao: new Date('2023-01-01'), // Anterior à data de atualização do modelo
        hash: mockHash
      };
      
      (ContratoGeradoModel.findOne as jest.Mock).mockResolvedValue(contratoExistente);
      
      // Mock para validação de modificação do modelo
      jest.spyOn(ContratoService, 'modeloModificadoAposGeracao').mockReturnValue(true);
      
      const resultado = await ContratoService.gerarContrato({ modeloId, parametros });
      
      expect(ContratoService.obterDadosContrato).toHaveBeenCalledWith(modeloId, parametros);
      expect(ContratoGeradoModel.updateOne).toHaveBeenCalled();
      expect(resultado).toBe(mockCaminhoCompleto);
    });
  });
}); 