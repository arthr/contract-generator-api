import { Request, Response } from 'express';
import path from 'path';
import { ContratoService } from '../services/contrato.service';
import { SqlQueryParams, ParametrosGeracaoContrato } from '../types';
import fs from 'fs';

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

/**
 * Obter histórico de contratos gerados para um modelo e parâmetros específicos
 * Recebe o ID do modelo e os parâmetros usados na geração
 */
export const obterHistoricoContratos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // Verificar se os parâmetros estão estruturados corretamente
    const { parametros } = req.body;
    
    if (!id) {
      res.status(400).json({ mensagem: 'ID do modelo não informado' });
      return;
    }
    
    if (!parametros || typeof parametros !== 'object') {
      res.status(400).json({ 
        mensagem: 'Parâmetros inválidos. Estrutura esperada: { "parametros": { ... } }',
        estruturaRecebida: req.body
      });
      return;
    }
    
    // Armazenar os parâmetros atuais para comparação
    ContratoService.definirUltimosParametros(parametros);
    
    // Gerar o hash para buscar o histórico
    const hash = ContratoService.gerarHashContrato(id, parametros);
    
    // Buscar histórico de contratos
    const historico = await ContratoService.buscarHistoricoContratos(id, hash);
    
    // Formatar o resultado para retornar URLs acessíveis
    const historicoFormatado = historico.map(contrato => {
      const nomeArquivo = path.basename(contrato.caminhoArquivo);
      const urlContrato = `/uploads/contratos-gerados/${nomeArquivo}`;
      
      return {
        versao: contrato.versao,
        dataGeracao: contrato.dataGeracao,
        ativo: contrato.ativo,
        arquivo: {
          nome: nomeArquivo,
          url: urlContrato,
          caminho: contrato.caminhoArquivo
        }
      };
    });
    
    res.status(200).json({
      mensagem: historico.length > 0 
        ? 'Histórico de contratos obtido com sucesso' 
        : 'Nenhum contrato encontrado no histórico',
      historico: historicoFormatado
    });
  } catch (error) {
    console.error('Erro ao obter histórico de contratos:', error);
    
    res.status(500).json({ 
      mensagem: 'Erro ao obter histórico de contratos',
      erro: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

/**
 * Listar todos os contratos vigentes (ativos)
 * Lista apenas a última versão ativa de cada contrato
 */
export const listarContratosVigentes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { modeloId } = req.query;
    
    // Filtrar por modelo se o parâmetro for fornecido
    const filtros = modeloId ? { modeloId: modeloId as string } : undefined;
    
    // Buscar todos os contratos ativos
    const contratosVigentes = await ContratoService.listarContratosVigentes(filtros);
    
    // Formatar o resultado para retornar URLs acessíveis
    const contratosFormatados = contratosVigentes.map(contrato => {
      const nomeArquivo = path.basename(contrato.caminhoArquivo);
      const urlContrato = `/uploads/contratos-gerados/${nomeArquivo}`;
      
      return {
        modeloId: contrato.modeloId,
        versao: contrato.versao,
        dataGeracao: contrato.dataGeracao,
        parametros: contrato.parametros,
        hash: contrato.hash,
        arquivo: {
          nome: nomeArquivo,
          url: urlContrato,
          caminho: contrato.caminhoArquivo
        }
      };
    });
    
    res.status(200).json({
      mensagem: contratosVigentes.length > 0 
        ? 'Contratos vigentes obtidos com sucesso' 
        : 'Nenhum contrato vigente encontrado',
      contratos: contratosFormatados
    });
  } catch (error) {
    console.error('Erro ao listar contratos vigentes:', error);
    
    res.status(500).json({ 
      mensagem: 'Erro ao listar contratos vigentes',
      erro: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

/**
 * Download do arquivo de um modelo
 * Recebe o ID do modelo e retorna o arquivo para download
 */
export const downloadModelo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ mensagem: 'ID do modelo não informado' });
      return;
    }

    const caminhoArquivo = await ContratoService.obterCaminhoModelo(id);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(caminhoArquivo)) {
      res.status(404).json({ mensagem: 'Arquivo do modelo não encontrado' });
      return;
    }

    // Obter o nome do arquivo
    const nomeArquivo = path.basename(caminhoArquivo);
    
    // Configurar headers para download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    
    // Enviar o arquivo
    res.sendFile(caminhoArquivo);
  } catch (error) {
    console.error('Erro ao fazer download do modelo:', error);
    
    if (error instanceof Error && error.message.includes('não encontrado')) {
      res.status(404).json({ mensagem: error.message });
      return;
    }
    
    res.status(500).json({ 
      mensagem: 'Erro ao fazer download do modelo',
      erro: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

/**
 * Download do arquivo de um contrato gerado
 * Recebe o ID do modelo e o hash do contrato e retorna o arquivo para download
 */
export const downloadContrato = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, hash } = req.params;
    
    if (!id) {
      res.status(400).json({ mensagem: 'ID do modelo não informado' });
      return;
    }
    
    if (!hash) {
      res.status(400).json({ mensagem: 'Hash do contrato não informado' });
      return;
    }

    const caminhoArquivo = await ContratoService.obterCaminhoContrato(id, hash);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(caminhoArquivo)) {
      res.status(404).json({ mensagem: 'Arquivo do contrato não encontrado' });
      return;
    }

    // Obter o nome do arquivo
    const nomeArquivo = path.basename(caminhoArquivo);
    
    // Configurar headers para download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    
    // Enviar o arquivo
    res.sendFile(caminhoArquivo);
  } catch (error) {
    console.error('Erro ao fazer download do contrato:', error);
    
    if (error instanceof Error && error.message.includes('não encontrado')) {
      res.status(404).json({ mensagem: error.message });
      return;
    }
    
    res.status(500).json({ 
      mensagem: 'Erro ao fazer download do contrato',
      erro: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}; 