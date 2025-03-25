/**
 * Controlador responsável por gerenciar operações relacionadas à geração e manipulação de contratos
 */

import { Request, Response } from 'express';
import path from 'path';
import { ContratoService } from '../services/contrato.service';
import { SqlQueryParams, ParametrosGeracaoContrato } from '../types';
import fs from 'fs';

/**
 * Obtém os dados necessários para a geração de um contrato
 * @param req - Requisição HTTP contendo o ID do modelo e parâmetros da query
 * @param res - Resposta HTTP com os dados obtidos ou mensagem de erro
 * @returns Promise<void>
 * 
 * @description
 * Esta função executa as queries SQL necessárias para obter os dados que serão
 * utilizados na geração do contrato. Os dados são obtidos com base no modelo
 * selecionado e nos parâmetros fornecidos.
 * 
 * O resultado inclui todos os dados necessários para preencher as variáveis
 * do template do contrato.
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
 * Gera um novo contrato a partir de um modelo
 * @param req - Requisição HTTP contendo o ID do modelo e parâmetros de geração
 * @param res - Resposta HTTP com informações do contrato gerado ou mensagem de erro
 * @returns Promise<void>
 * 
 * @description
 * Gera um novo contrato utilizando um modelo existente. O processo inclui:
 * 1. Validação dos parâmetros fornecidos
 * 2. Execução das queries para obter os dados
 * 3. Preenchimento do template com os dados obtidos
 * 4. Geração do arquivo final do contrato
 * 
 * O parâmetro forcarRegeneracao permite gerar uma nova versão mesmo que já
 * exista um contrato com os mesmos parâmetros.
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
    
    const contratoGerado = await ContratoService.gerarContrato(params);
    
    // Formatar o caminho para acesso via URL
    const nomeArquivo = path.basename(contratoGerado.caminhoArquivo);
    const urlContrato = `/uploads/contratos-gerados/${nomeArquivo}`;
    
    res.status(200).json({
      mensagem: 'Contrato gerado com sucesso',
      contrato: {
        modeloId: contratoGerado.modeloId,
        versao: contratoGerado.versao,
        dataGeracao: contratoGerado.dataGeracao,
        parametros: contratoGerado.parametros,
        identificadoresCampos: contratoGerado.identificadoresCampos,
        hash: contratoGerado.hash,
        ativo: contratoGerado.ativo
      },
      arquivo: {
        nome: nomeArquivo,
        url: urlContrato,
        caminho: contratoGerado.caminhoArquivo
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
 * Testa a execução de uma query SQL
 * @param req - Requisição HTTP contendo a query e parâmetros para teste
 * @param res - Resposta HTTP com o resultado da query ou mensagem de erro
 * @returns Promise<void>
 * 
 * @description
 * Endpoint específico para testes de queries SQL durante o desenvolvimento.
 * Permite executar queries diretamente para verificar sua sintaxe e resultados
 * sem gerar um contrato.
 * 
 * Útil para debug e validação de queries antes de associá-las a um modelo.
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
 * Obtém o histórico de contratos gerados para um modelo específico
 * @param req - Requisição HTTP contendo o ID do modelo e parâmetros de busca
 * @param res - Resposta HTTP com o histórico de contratos ou mensagem de erro
 * @returns Promise<void>
 * 
 * @description
 * Retorna o histórico completo de contratos gerados para um modelo específico,
 * incluindo todas as versões e seus respectivos parâmetros. O histórico é
 * filtrado com base nos parâmetros fornecidos para mostrar apenas contratos
 * relacionados.
 * 
 * Cada entrada do histórico inclui:
 * - Versão do contrato
 * - Data de geração
 * - Status (ativo/inativo)
 * - Informações do arquivo
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
 * Lista todos os contratos vigentes no sistema
 * @param req - Requisição HTTP contendo filtros opcionais (ex: modeloId)
 * @param res - Resposta HTTP com a lista de contratos vigentes ou mensagem de erro
 * @returns Promise<void>
 * 
 * @description
 * Retorna uma lista de todos os contratos atualmente vigentes no sistema.
 * Por padrão, retorna apenas a última versão ativa de cada contrato.
 * 
 * Pode ser filtrado por modelo específico através do parâmetro modeloId.
 * Cada contrato inclui informações detalhadas sobre sua geração e
 * localização do arquivo.
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
        identificadoresCampos: contrato.identificadoresCampos,
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
 * Realiza o download do arquivo de um modelo
 * @param req - Requisição HTTP contendo o ID do modelo
 * @param res - Resposta HTTP com o arquivo para download ou mensagem de erro
 * @returns Promise<void>
 * 
 * @description
 * Permite o download do arquivo de template de um modelo específico.
 * O arquivo é enviado com os headers apropriados para download no navegador.
 * 
 * Se o arquivo não for encontrado, retorna um erro 404.
 * O tipo de conteúdo é definido como documento Word para garantir
 * o download correto do arquivo.
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
 * Realiza o download do arquivo de um contrato gerado
 * @param req - Requisição HTTP contendo o ID do modelo e hash do contrato
 * @param res - Resposta HTTP com o arquivo para download ou mensagem de erro
 * @returns Promise<void>
 * 
 * @description
 * Permite o download do arquivo de um contrato específico usando seu hash único.
 * O arquivo é enviado com os headers apropriados para download no navegador.
 * 
 * Requer tanto o ID do modelo quanto o hash do contrato para localizar
 * o arquivo correto. Se o arquivo não for encontrado, retorna um erro 404.
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