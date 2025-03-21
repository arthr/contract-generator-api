import { SqlQueryService } from '../../src/services/sqlQuery.service';
import sql from 'mssql';
import { getSqlPool } from '../../src/config/sqlServer';

// Mock do módulo mssql
jest.mock('mssql', () => {
  const mockRecordset = [{ id: 1, nome: 'Teste' }];
  const mockQuery = jest.fn().mockResolvedValue({ recordset: mockRecordset });
  const mockInput = jest.fn();
  const mockRequest = { query: mockQuery, input: mockInput };
  const mockTransaction = {
    begin: jest.fn().mockResolvedValue(true),
    commit: jest.fn().mockResolvedValue(true),
    rollback: jest.fn().mockResolvedValue(true)
  };
  
  return {
    Transaction: jest.fn().mockImplementation(() => mockTransaction),
    Request: jest.fn().mockImplementation(() => mockRequest),
    ConnectionPool: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue({
        request: jest.fn().mockReturnValue(mockRequest)
      })
    }))
  };
});

// Mock do módulo de configuração do SQL Server
jest.mock('../../src/config/sqlServer', () => ({
  getSqlPool: jest.fn().mockResolvedValue({
    request: jest.fn().mockReturnValue({
      input: jest.fn(),
      query: jest.fn().mockResolvedValue({
        recordset: [{ id: 1, nome: 'Teste' }]
      })
    })
  })
}));

describe('SqlQueryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('executeQuery', () => {
    it('deve executar uma query e retornar o resultado', async () => {
      const resultado = await SqlQueryService.executeQuery('SELECT * FROM teste');
      
      expect(getSqlPool).toHaveBeenCalled();
      expect(resultado).toEqual([{ id: 1, nome: 'Teste' }]);
    });
    
    it('deve adicionar parâmetros à query quando fornecidos', async () => {
      const mockPool = await getSqlPool();
      const mockInput = mockPool.request().input;
      
      await SqlQueryService.executeQuery('SELECT * FROM teste WHERE id = :id', { id: 1 });
      
      expect(mockInput).toHaveBeenCalledWith('id', 1);
    });
    
    it('deve converter parâmetros do formato :param para @param', async () => {
      const mockPool = await getSqlPool();
      const mockQuery = mockPool.request().query;
      
      await SqlQueryService.executeQuery(
        'SELECT * FROM teste WHERE id = :id AND nome = :nome', 
        { id: 1, nome: 'Teste' }
      );
      
      // Verifica se a query foi convertida corretamente
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM teste WHERE id = @id AND nome = @nome'
      );
    });
    
    it('deve tratar erros ao executar a query', async () => {
      const mockError = new Error('Erro de teste');
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Sobrescrever a implementação do getSqlPool para lançar um erro
      (getSqlPool as jest.Mock).mockRejectedValueOnce(mockError);
      
      await expect(SqlQueryService.executeQuery('SELECT * FROM teste'))
        .rejects.toThrow('Erro de teste');
      
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('executeTransaction', () => {
    it('deve executar múltiplas queries em uma transação', async () => {
      const queries = [
        { query: 'SELECT * FROM tabela1' },
        { query: 'SELECT * FROM tabela2 WHERE id = :id', params: { id: 1 } }
      ];
      
      const resultado = await SqlQueryService.executeTransaction(queries);
      
      expect(resultado).toHaveLength(2);
      expect(resultado[0]).toEqual([{ id: 1, nome: 'Teste' }]);
      expect(resultado[1]).toEqual([{ id: 1, nome: 'Teste' }]);
    });
  });
  
  describe('executarQueryModelo', () => {
    it('deve executar a query principal do modelo', async () => {
      const spy = jest.spyOn(SqlQueryService, 'executeQuery');
      
      await SqlQueryService.executarQueryModelo('SELECT * FROM clientes WHERE id = :clienteId', { clienteId: 1 });
      
      expect(spy).toHaveBeenCalledWith(
        'SELECT * FROM clientes WHERE id = :clienteId', 
        { clienteId: 1 }
      );
    });
  });
  
  describe('executarQueriesVariaveis', () => {
    it('deve executar as queries de variáveis', async () => {
      const spy = jest.spyOn(SqlQueryService, 'executeQuery');
      
      const queries = {
        'cliente': 'SELECT * FROM clientes WHERE id = :clienteId',
        'produtos': 'SELECT * FROM produtos WHERE cliente_id = :clienteId'
      };
      
      const resultado = await SqlQueryService.executarQueriesVariaveis(queries, { clienteId: 1 });
      
      expect(spy).toHaveBeenCalledTimes(2);
      expect(resultado).toHaveProperty('cliente');
      expect(resultado).toHaveProperty('produtos');
    });
    
    it('deve ignorar queries vazias', async () => {
      const spy = jest.spyOn(SqlQueryService, 'executeQuery');
      
      const queries = {
        'cliente': 'SELECT * FROM clientes WHERE id = :clienteId',
        'produtos': '',
        'vazia': '   '
      };
      
      const resultado = await SqlQueryService.executarQueriesVariaveis(queries, { clienteId: 1 });
      
      expect(spy).toHaveBeenCalledTimes(1);
      expect(resultado.produtos).toEqual([]);
      expect(resultado.vazia).toEqual([]);
    });
  });
}); 