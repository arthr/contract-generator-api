import { ModeloModel } from '../../src/models/modelo.model';
import mongoose from 'mongoose';

describe('Modelo Model', () => {
  const modeloMock = {
    titulo: 'Contrato de Teste',
    tipo: 'parceria',
    descricao: 'Descrição teste',
    caminhoTemplate: './uploads/teste.docx',
    queryPrincipal: 'SELECT * FROM contratos WHERE id = :id',
    variaveis: [
      {
        nome: 'CLIENTE',
        tipo: 'simples',
        subvariaveis: [],
        query: ''
      }
    ]
  };

  it('deve criar um novo modelo com sucesso', async () => {
    const novoModelo = new ModeloModel(modeloMock);
    const modeloSalvo = await novoModelo.save();
    
    expect(modeloSalvo._id).toBeDefined();
    expect(modeloSalvo.titulo).toBe(modeloMock.titulo);
    expect(modeloSalvo.tipo).toBe(modeloMock.tipo);
    expect(modeloSalvo.variaveis.length).toBe(1);
    expect(modeloSalvo.createdAt).toBeDefined();
  });

  it('deve falhar ao criar modelo sem campos obrigatórios', async () => {
    const modeloIncompleto = new ModeloModel({
      titulo: 'Modelo Incompleto'
    });
    
    let erro;
    try {
      await modeloIncompleto.save();
    } catch (error) {
      erro = error;
    }
    
    expect(erro).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('deve validar o tipo de variável', async () => {
    const modeloComVariavelInvalida = new ModeloModel({
      ...modeloMock,
      variaveis: [
        {
          nome: 'TESTE',
          tipo: 'tipoInvalido', // tipo inválido
          subvariaveis: [],
          query: ''
        }
      ]
    });
    
    let erro;
    try {
      await modeloComVariavelInvalida.save();
    } catch (error) {
      erro = error;
    }
    
    expect(erro).toBeInstanceOf(mongoose.Error.ValidationError);
  });
}); 