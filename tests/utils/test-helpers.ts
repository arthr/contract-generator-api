import { Express } from 'express';
import path from 'path';
import fs from 'fs';
import { ModeloModel } from '../../src/models/modelo.model';

// Cria um arquivo de teste para o upload
export const criarArquivoTemporario = (conteudo = 'Conteúdo de teste') => {
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const filePath = path.join(uploadDir, 'teste.docx');
  fs.writeFileSync(filePath, conteudo);
  return filePath;
};

// Limpa arquivo temporário
export const limparArquivoTemporario = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Cria um modelo no banco para testes
export const criarModeloTeste = async () => {
  const modelo = new ModeloModel({
    titulo: 'Modelo de Teste',
    tipo: 'contrato',
    descricao: 'Descrição do modelo de teste',
    caminhoTemplate: './uploads/teste.docx',
    queryPrincipal: 'SELECT * FROM contratos WHERE id = :id',
    variaveis: [
      {
        nome: 'VARIAVEL_TESTE',
        tipo: 'simples',
        subvariaveis: [],
        query: ''
      }
    ]
  });

  return await modelo.save();
}; 