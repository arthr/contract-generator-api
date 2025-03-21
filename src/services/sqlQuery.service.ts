import sql from 'mssql';
import { getSqlPool } from '../config/sqlServer';

export class SqlQueryService {
  /**
   * Executa uma query SQL
   * @param query String com a query SQL
   * @param params Parâmetros para a query (opcional)
   * @returns Resultado da query
   */
  static async executeQuery<T>(query: string, params?: any): Promise<T[]> {
    try {
      const pool = await getSqlPool();
      const request = pool.request();
      
      // Preparar a query e os parâmetros
      const { preparedQuery, preparedParams } = this.prepareQueryAndParams(query, params);
      
      if (preparedParams) {
        Object.entries(preparedParams).forEach(([key, value]) => {
          request.input(key, value);
        });
      }
      
      const result = await request.query(preparedQuery);
      return result.recordset as T[];
    } catch (error) {
      console.error('Erro ao executar query SQL:', error);
      throw error;
    }
  }

  /**
   * Prepara a query convertendo parâmetros no formato :param para @param
   * @param query Query original com parâmetros no formato :param
   * @param params Objeto com os valores dos parâmetros
   * @returns Objeto com query preparada e parâmetros no formato correto
   */
  private static prepareQueryAndParams(query: string, params?: any): { preparedQuery: string, preparedParams: any } {
    if (!params) {
      return { preparedQuery: query, preparedParams: undefined };
    }
    
    let preparedQuery = query;
    const preparedParams: Record<string, any> = {};
    
    // Converter parâmetros no formato :param para @param na query
    Object.keys(params).forEach(key => {
      const colonParam = `:${key}`;
      const atParam = `@${key}`;
      
      // Substituir todos os parâmetros :param por @param na query
      if (preparedQuery.includes(colonParam)) {
        preparedQuery = preparedQuery.split(colonParam).join(atParam);
      }
      
      // Armazenar o valor do parâmetro
      preparedParams[key] = params[key];
    });
    
    return { preparedQuery, preparedParams };
  }

  /**
   * Executa múltiplas queries SQL em uma transação
   * @param queries Array de objetos com query e parâmetros
   * @returns Array com resultados de cada query
   */
  static async executeTransaction<T>(
    queries: Array<{ query: string; params?: any }>
  ): Promise<T[][]> {
    const pool = await getSqlPool();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      const results: T[][] = [];
      
      for (const { query, params } of queries) {
        const request = new sql.Request(transaction);
        
        // Preparar a query e os parâmetros
        const { preparedQuery, preparedParams } = this.prepareQueryAndParams(query, params);
        
        if (preparedParams) {
          Object.entries(preparedParams).forEach(([key, value]) => {
            request.input(key, value);
          });
        }
        
        const result = await request.query(preparedQuery);
        results.push(result.recordset as T[]);
      }
      
      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao executar transação SQL:', error);
      throw error;
    }
  }

  /**
   * Executa a query principal de um modelo e retorna os dados
   * @param queryPrincipal Query principal do modelo
   * @param params Parâmetros para substituir na query
   * @returns Dados resultantes da query
   */
  static async executarQueryModelo<T>(
    queryPrincipal: string, 
    params?: Record<string, any>
  ): Promise<T[]> {
    return await this.executeQuery<T>(queryPrincipal, params);
  }

  /**
   * Executa as queries das variáveis de um modelo
   * @param queries Objeto com nome da variável e sua query
   * @param params Parâmetros para substituir nas queries
   * @returns Objeto com nome da variável e seus dados
   */
  static async executarQueriesVariaveis<T>(
    queries: Record<string, string>,
    params?: Record<string, any>
  ): Promise<Record<string, T[]>> {
    const resultado: Record<string, T[]> = {};
    
    for (const [variavel, query] of Object.entries(queries)) {
      if (query && query.trim()) {
        resultado[variavel] = await this.executeQuery<T>(query, params);
      } else {
        resultado[variavel] = [];
      }
    }
    
    return resultado;
  }
} 