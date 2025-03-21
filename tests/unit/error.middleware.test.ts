import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/middleware/error.middleware';

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('deve retornar status 500 e mensagem padrão para erro sem detalhes', () => {
    const error = new Error();
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 500,
      mensagem: 'Erro interno do servidor'
    });
  });
  
  it('deve retornar status personalizado e mensagem do erro quando fornecidos', () => {
    const error = new Error('Erro personalizado');
    (error as any).status = 400;
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 400,
      mensagem: 'Erro personalizado'
    });
  });
}); 