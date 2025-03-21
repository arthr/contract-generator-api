import { Request, Response } from 'express';
import path from 'path';
import { ContratoService } from '../services/contrato.service';
import { SqlQueryParams, ParametrosGeracaoContrato } from '../types';

/**
 * Obter dados para geração de contrato
 * Recebe o ID do modelo e parâmetros para executar as queries
 */
export const obterDadosContrato = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parametros = req.body as SqlQueryParams;
    
    if (!id) {
      res.status(400).json({ mensagem: 'ID do modelo não informado' });
      return;
    }

    const dadosContrato = await ContratoService.obterDadosContrato(id, parametros);
    
    res.status(200).json({
      mensagem: 'Dados para geração de contrato obtidos com sucesso',
      dados: dadosContrato
    });
  } catch (error) {
    console.error('Erro ao obter dados para geração de contrato:', error);
    
    if (error instanceof Error && error.message.includes('não encontrado')) {
      res.status(404).json({ mensagem: error.message });
      return;
    }
    
    res.status(500).json({ 
      mensagem: 'Erro ao obter dados para geração de contrato',
      erro: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

/**
 * Gerar contrato a partir de um modelo
 * Recebe o ID do modelo e os parâmetros necessários para gerar o contrato
 */
export const gerarContrato = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { parametros, forcarRegeneracao } = req.body;
    
    if (!id) {
      res.status(400).json({ mensagem: 'ID do modelo não informado' });
      return;
    }
    
    if (!parametros || typeof parametros !== 'object') {
      res.status(400).json({ mensagem: 'Parâmetros inválidos' });
      return;
    }
    
    const params: ParametrosGeracaoContrato = {
      modeloId: id,
      parametros,
      forcarRegeneracao: !!forcarRegeneracao
    };
    
    const caminhoContrato = await ContratoService.gerarContrato(params);
    
    // Formatar o caminho para acesso via URL
    const nomeArquivo = path.basename(caminhoContrato);
    const urlContrato = `/uploads/contratos-gerados/${nomeArquivo}`;
    
    res.status(200).json({
      mensagem: 'Contrato gerado com sucesso',
      arquivo: {
        nome: nomeArquivo,
        url: urlContrato,
        caminho: caminhoContrato
      }
    });
  } catch (error) {
    console.error('Erro ao gerar contrato:', error);
    
    if (error instanceof Error && error.message.includes('não encontrado')) {
      res.status(404).json({ mensagem: error.message });
      return;
    }
    
    res.status(500).json({ 
      mensagem: 'Erro ao gerar contrato',
      erro: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

/**
 * Testar execução de query SQL
 * Endpoint para testes de queries SQL - útil durante o desenvolvimento
 */
export const testarQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, parametros } = req.body;
    
    if (!query || typeof query !== 'string') {
      res.status(400).json({ mensagem: 'Query SQL não informada ou inválida' });
      return;
    }
    
    // Aqui iremos implementar a lógica para testar a query com o serviço SQL
    const resultado = await ContratoService.testarQuery(query, parametros);
    
    res.status(200).json({
      mensagem: 'Query executada com sucesso',
      resultado
    });
  } catch (error) {
    console.error('Erro ao executar query de teste:', error);
    res.status(500).json({ 
      mensagem: 'Erro ao executar query de teste',
      erro: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}; 