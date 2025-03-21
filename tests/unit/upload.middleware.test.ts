import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { upload } from '../../src/middleware/upload.middleware';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn()
}));

describe('Upload Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar o diretório de upload caso não exista', () => {
    // Configurar mock para fingir que o diretório não existe
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // Forçar reimportação do middleware para testar o código no escopo do módulo
    jest.isolateModules(() => {
      require('../../src/middleware/upload.middleware');
    });
    
    // Verificar se o método para criar o diretório foi chamado
    expect(fs.mkdirSync).toHaveBeenCalled();
  });
  
  it('não deve criar o diretório se já existir', () => {
    // Configurar mock para fingir que o diretório já existe
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // Forçar reimportação do middleware
    jest.isolateModules(() => {
      require('../../src/middleware/upload.middleware');
    });
    
    // Verificar que não tentou criar o diretório
    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });
  
  it('deve ter multer configurado corretamente', () => {
    // Verificar se upload é uma instância de multer
    expect(upload).toBeDefined();
    
    // Não podemos acessar diretamente as propriedades internas do multer
    // Verificar se o objeto pode ser usado como middleware
    expect(typeof upload.single).toBe('function');
  });
}); 