import dotenv from 'dotenv';
import sql from 'mssql';

dotenv.config();

const sqlConfig: sql.config = {
  server: process.env.SQL_SERVER_HOST || 'localhost',
  port: parseInt(process.env.SQL_SERVER_PORT || '1433'),
  user: process.env.SQL_SERVER_USER || 'sa',
  password: process.env.SQL_SERVER_PASSWORD || 'yourStrongPassword',
  database: process.env.SQL_SERVER_DATABASE || 'ContractData',
  options: {
    encrypt: true,
    trustServerCertificate: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool: sql.ConnectionPool;

export const getSqlPool = async (): Promise<sql.ConnectionPool> => {
  if (!pool) {
    try {
      pool = await new sql.ConnectionPool(sqlConfig).connect();
      console.log('Conectado ao SQL Server com sucesso');
    } catch (error) {
      console.error('Erro ao conectar ao SQL Server:', error);
      throw error;
    }
  }
  return pool;
};

export const closeSqlPool = async (): Promise<void> => {
  if (pool) {
    try {
      await pool.close();
      console.log('Conexão com SQL Server fechada com sucesso');
    } catch (error) {
      console.error('Erro ao fechar conexão com SQL Server:', error);
    }
  }
}; 