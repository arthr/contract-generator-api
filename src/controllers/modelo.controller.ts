/**
 * Controlador responsável por gerenciar operações relacionadas aos modelos de contratos
 */

import { Request, Response } from 'express';
import { ModeloModel } from '../models/modelo.model';
import { ModeloInput } from '../types';
import path from 'path';
import fs from 'fs';

/**
 * Realiza o upload de um arquivo de template
 * @param req - Requisição HTTP contendo o arquivo a ser enviado
 * @param res - Resposta HTTP com o status e dados do upload
 * @returns Promise<void>
 * 
 * @description
 * Esta função processa o upload de um arquivo de template para o servidor.
 * O arquivo deve ser enviado como parte de uma requisição multipart/form-data.
 * Retorna o caminho do arquivo salvo no servidor.
 */
export const uploadTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ mensagem: 'Nenhum arquivo enviado' });
      return;
    }

    const filePath = path.join(req.file.destination, req.file.filename);
    
    res.status(200).json({
      mensagem: 'Arquivo enviado com sucesso',
      caminhoTemplate: filePath
    });
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    res.status(500).json({ mensagem: 'Erro ao fazer upload do arquivo' });
  }
};

/**
 * Cria um novo modelo de contrato no sistema
 * @param req - Requisição HTTP contendo os dados do modelo
 * @param res - Resposta HTTP com o modelo criado ou mensagem de erro
 * @returns Promise<void>
 * 
 * @description
 * Cria um novo modelo de contrato com as seguintes informações:
 * - Título do modelo
 * - Tipo do modelo
 * - Descrição
 * - Query principal para busca de dados
 * - Lista de variáveis do template
 * - Caminho do arquivo de template
 * 
 * O arquivo de template pode ser enviado diretamente na requisição ou
 * um caminho previamente salvo pode ser fornecido.
 */
export const criarModelo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { titulo, tipo, descricao, queryPrincipal, variaveis } = req.body as ModeloInput;
    let caminhoTemplate = '';

    // Verifica se um arquivo foi enviado na requisição
    if (req.file) {
      caminhoTemplate = path.join(req.file.destination, req.file.filename);
    } else if (req.body.caminhoTemplate) {
      // Se não foi enviado arquivo, mas foi enviado um caminho
      caminhoTemplate = req.body.caminhoTemplate;
    } else {
      res.status(400).json({ mensagem: 'É necessário fornecer um arquivo de template' });
      return;
    }

    const novoModelo = await ModeloModel.create({
      titulo,
      tipo,
      descricao,
      caminhoTemplate,
      queryPrincipal,
      variaveis: Array.isArray(variaveis) ? variaveis : JSON.parse(variaveis as unknown as string)
    });

    res.status(201).json(novoModelo);
  } catch (error) {
    console.error('Erro ao criar modelo:', error);
    res.status(500).json({ mensagem: 'Erro ao criar modelo' });
  }
};

/**
 * Lista todos os modelos de contratos cadastrados no sistema
 * @param _req - Requisição HTTP (não utilizada)
 * @param res - Resposta HTTP com a lista de modelos
 * @returns Promise<void>
 * 
 * @description
 * Retorna todos os modelos cadastrados, ordenados por data de criação
 * (mais recentes primeiro). Cada modelo inclui todas as suas informações
 * e metadados.
 */
export const listarModelos = async (_req: Request, res: Response): Promise<void> => {
  try {
    const modelos = await ModeloModel.find().sort({ createdAt: -1 });
    res.status(200).json(modelos);
  } catch (error) {
    console.error('Erro ao listar modelos:', error);
    res.status(500).json({ mensagem: 'Erro ao listar modelos' });
  }
};

/**
 * Busca um modelo específico pelo seu ID
 * @param req - Requisição HTTP contendo o ID do modelo
 * @param res - Resposta HTTP com os dados do modelo ou mensagem de erro
 * @returns Promise<void>
 * 
 * @description
 * Localiza e retorna um modelo específico usando seu ID único.
 * Se o modelo não for encontrado, retorna um erro 404.
 */
export const buscarModeloPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const modelo = await ModeloModel.findById(id);

    if (!modelo) {
      res.status(404).json({ mensagem: 'Modelo não encontrado' });
      return;
    }

    res.status(200).json(modelo);
  } catch (error) {
    console.error('Erro ao buscar modelo:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar modelo' });
  }
};

/**
 * Atualiza um modelo de contrato existente
 * @param req - Requisição HTTP contendo os novos dados do modelo
 * @param res - Resposta HTTP com o modelo atualizado ou mensagem de erro
 * @returns Promise<void>
 * 
 * @description
 * Atualiza um modelo existente com novas informações. Pode atualizar:
 * - Título
 * - Tipo
 * - Descrição
 * - Query principal
 * - Lista de variáveis
 * - Arquivo de template
 * 
 * Se um novo arquivo de template for fornecido, o arquivo antigo é excluído
 * automaticamente do servidor.
 */
export const atualizarModelo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { titulo, tipo, descricao, queryPrincipal, variaveis, caminhoTemplate } = req.body;
    
    let dadosAtualizados: any = {
      titulo,
      tipo,
      descricao,
      queryPrincipal,
      variaveis: Array.isArray(variaveis) ? variaveis : JSON.parse(variaveis as unknown as string),
      caminhoTemplate
    };

    // Se um novo arquivo foi enviado
    if (req.file || caminhoTemplate) {
      // Buscar o modelo atual para obter o caminho do arquivo atual
      const modeloAtual = await ModeloModel.findById(id);
      if (modeloAtual && modeloAtual.caminhoTemplate != caminhoTemplate) {
        // Tentar excluir o arquivo antigo
        try {
          fs.unlinkSync(modeloAtual.caminhoTemplate);
        } catch (err) {
          console.error('Erro ao excluir arquivo antigo:', err);
        }
      }
      dadosAtualizados.caminhoTemplate = req.file ? path.join(req.file.destination, req.file.filename) : caminhoTemplate;
    }

    const modeloAtualizado = await ModeloModel.findByIdAndUpdate(
      id, 
      dadosAtualizados,
      { new: true }
    );

    if (!modeloAtualizado) {
      res.status(404).json({ mensagem: 'Modelo não encontrado' });
      return;
    }

    res.status(200).json(modeloAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar modelo:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar modelo' });
  }
};

/**
 * Exclui um modelo de contrato e seus arquivos associados
 * @param req - Requisição HTTP contendo o ID do modelo a ser excluído
 * @param res - Resposta HTTP com mensagem de sucesso ou erro
 * @returns Promise<void>
 * 
 * @description
 * Remove completamente um modelo do sistema, incluindo:
 * - Registro no banco de dados
 * - Arquivo de template associado
 * 
 * Se o modelo não for encontrado, retorna um erro 404.
 * Se houver erro ao excluir o arquivo físico, o erro é registrado mas
 * o modelo ainda é removido do banco de dados.
 */
export const excluirModelo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Buscar o modelo para obter o caminho do arquivo
    const modelo = await ModeloModel.findById(id);
    
    if (!modelo) {
      res.status(404).json({ mensagem: 'Modelo não encontrado' });
      return;
    }

    // Excluir o arquivo do template, se existir
    if (modelo.caminhoTemplate) {
      try {
        fs.unlinkSync(modelo.caminhoTemplate);
      } catch (err) {
        console.error('Erro ao excluir arquivo do template:', err);
      }
    }

    // Excluir o modelo do banco de dados
    await ModeloModel.findByIdAndDelete(id);
    
    res.status(200).json({ mensagem: 'Modelo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir modelo:', error);
    res.status(500).json({ mensagem: 'Erro ao excluir modelo' });
  }
}; 