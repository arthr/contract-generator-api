import { Request, Response } from 'express';
import { ModeloModel } from '../models/modelo.model';
import { ModeloInput } from '../types';
import path from 'path';
import fs from 'fs';

// Upload de arquivo de template
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

// Criar um novo modelo
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

// Listar todos os modelos
export const listarModelos = async (_req: Request, res: Response): Promise<void> => {
  try {
    const modelos = await ModeloModel.find().sort({ createdAt: -1 });
    res.status(200).json(modelos);
  } catch (error) {
    console.error('Erro ao listar modelos:', error);
    res.status(500).json({ mensagem: 'Erro ao listar modelos' });
  }
};

// Buscar um modelo por ID
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

// Atualizar um modelo
export const atualizarModelo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { titulo, tipo, descricao, queryPrincipal, variaveis } = req.body;
    
    let dadosAtualizados: any = {
      titulo,
      tipo,
      descricao,
      queryPrincipal,
      variaveis: Array.isArray(variaveis) ? variaveis : JSON.parse(variaveis as unknown as string)
    };

    // Se um novo arquivo foi enviado
    if (req.file) {
      // Buscar o modelo atual para obter o caminho do arquivo atual
      const modeloAtual = await ModeloModel.findById(id);
      if (modeloAtual && modeloAtual.caminhoTemplate) {
        // Tentar excluir o arquivo antigo
        try {
          fs.unlinkSync(modeloAtual.caminhoTemplate);
        } catch (err) {
          console.error('Erro ao excluir arquivo antigo:', err);
        }
      }
      dadosAtualizados.caminhoTemplate = path.join(req.file.destination, req.file.filename);
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

// Excluir um modelo
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