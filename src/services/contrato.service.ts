import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { Modelo } from '../types';
import { ModeloModel } from '../models/modelo.model';
import { ContratoGeradoModel } from '../models/contratoGerado.model';
import { SqlQueryService } from './sqlQuery.service';
import { 
  DadosContrato, 
  SqlQueryParams, 
  ContratoGerado,
  ParametrosGeracaoContrato
} from '../types';

export class ContratoService {
  // Diretório onde os contratos gerados serão armazenados
  private static contratoDir = process.env.UPLOAD_DIR 
    ? path.join(process.env.UPLOAD_DIR, 'contratos-gerados')
    : path.join(process.cwd(), 'uploads', 'contratos-gerados');

  // Armazenar os últimos parâmetros recebidos para comparação
  private static ultimosParametrosRecebidos: SqlQueryParams = {};

  /**
   * Busca um modelo de contrato pelo ID
   * @param id ID do modelo
   * @returns Modelo encontrado ou null
   */
  static async buscarModelo(id: string): Promise<Modelo | null> {
    try {
      return await ModeloModel.findById(id);
    } catch (error) {
      console.error('Erro ao buscar modelo:', error);
      throw error;
    }
  }

  /**
   * Obtém dados para geração de contrato a partir de um modelo
   * @param modeloId ID do modelo de contrato
   * @param parametros Parâmetros para as queries
   * @returns Dados para geração do contrato
   */
  static async obterDadosContrato(
    modeloId: string, 
    parametros: SqlQueryParams
  ): Promise<DadosContrato> {
    try {
      // Buscar modelo
      const modelo = await this.buscarModelo(modeloId);
      
      if (!modelo) {
        throw new Error(`Modelo com ID ${modeloId} não encontrado`);
      }
      
      // Executar query principal
      const dadosPrincipais = await SqlQueryService.executarQueryModelo<Record<string, any>>(
        modelo.queryPrincipal,
        parametros
      );
      
      // Preparar queries de variáveis
      const queriesVariaveis: Record<string, string> = {};
      modelo.variaveis.forEach(variavel => {
        if (variavel.query) {
          queriesVariaveis[variavel.nome] = variavel.query;
        }
      });
      
      // Executar queries de variáveis
      const dadosVariaveis = await SqlQueryService.executarQueriesVariaveis<Record<string, any>>(
        queriesVariaveis,
        parametros
      );
      
      return {
        principal: dadosPrincipais,
        variaveis: dadosVariaveis
      };
    } catch (error) {
      console.error('Erro ao obter dados do contrato:', error);
      throw error;
    }
  }

  /**
   * Gera um hash para identificar unicamente um contrato baseado em seu modelo e parâmetros
   * @param modeloId ID do modelo
   * @param parametros Parâmetros usados na geração
   * @returns Hash único para o contrato
   */
  static gerarHashContrato(modeloId: string, parametros: SqlQueryParams): string {
    // Normalizar os parâmetros: remover campos vazios, ordenar as chaves
    // e garantir que o formato seja consistente
    const parametrosNormalizados = Object.entries(parametros || {})
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .reduce((obj, [key, value]) => {
        // Garantir que datas sejam convertidas para strings no mesmo formato
        if (value instanceof Date) {
          obj[key] = value.toISOString();
        } else if (typeof value === 'string' && !isNaN(Date.parse(value))) {
          // Se for uma string que parece uma data, normalizar
          try {
            const data = new Date(value);
            if (!isNaN(data.getTime())) {
              obj[key] = data.toISOString();
            } else {
              obj[key] = value;
            }
          } catch (e) {
            obj[key] = value;
          }
        } else {
          obj[key] = value;
        }
        return obj;
      }, {} as Record<string, any>);
    
    const dadosString = JSON.stringify({ 
      modeloId, 
      parametros: parametrosNormalizados
    });
    
    const hash = crypto.createHash('md5').update(dadosString).digest('hex');
    
    return hash;
  }

  /**
   * Busca um contrato previamente gerado no banco de dados
   * @param modeloId ID do modelo
   * @param hash Hash do contrato
   * @returns Contrato gerado, se existir
   */
  static async buscarContratoGerado(modeloId: string, hash: string): Promise<ContratoGerado | null> {
    try {
      return await ContratoGeradoModel.findOne({ 
        modeloId, 
        hash,
        ativo: true
      });
    } catch (error) {
      console.error('Erro ao buscar contrato gerado:', error);
      return null;
    }
  }

  /**
   * Busca o histórico de contratos gerados para um modelo e hash específicos
   * @param modeloId ID do modelo
   * @param hash Hash do contrato
   * @returns Lista de contratos gerados em ordem decrescente de versão
   */
  static async buscarHistoricoContratos(modeloId: string, hash: string): Promise<ContratoGerado[]> {
    try {
      
      // Buscar diretamente com o hash fornecido
      const resultados = await ContratoGeradoModel.find({ 
        modeloId, 
        hash
      }).sort({ versao: -1 });
      
      if (resultados.length > 0) {
        return resultados;
      }
      
      const contratosDoModelo = await ContratoGeradoModel.find({ modeloId }).sort({ dataGeracao: -1 });
      
      if (contratosDoModelo.length === 0) {
        return [];
      }
      
      // Verificar cada contrato para similaridade nos parâmetros
      const contratosRelacionados = contratosDoModelo.filter(contrato => {
        try {
          // Verificar se os parâmetros têm as mesmas chaves e valores,
          // independentemente da ordem ou format específico
          const parametrosOriginais = Object.entries(contrato.parametros || {})
            .filter(([_, value]) => value !== null && value !== undefined && value !== '');
            
          const parametrosAtuais = Object.entries(this.ultimosParametrosRecebidos || {})
            .filter(([_, value]) => value !== null && value !== undefined && value !== '');
          
          if (parametrosOriginais.length !== parametrosAtuais.length) {
            return false;
          }
          
          // Verificar se todas as chaves importantes estão presentes com valores similares
          const chaves = Object.keys(contrato.parametros || {});
          return chaves.every(chave => {
            const valorOriginal = String(contrato.parametros[chave] || '');
            const valorAtual = String(this.ultimosParametrosRecebidos[chave] || '');
            
            // Tratamento especial para datas
            if (!isNaN(Date.parse(valorOriginal)) && !isNaN(Date.parse(valorAtual))) {
              return new Date(valorOriginal).toISOString().split('T')[0] === 
                     new Date(valorAtual).toISOString().split('T')[0];
            }
            
            // Para outros valores, comparar como string
            return valorOriginal === valorAtual;
          });
        } catch (error) {
          console.error('Erro ao comparar parâmetros:', error);
          return false;
        }
      });
      
      return contratosRelacionados.sort((a, b) => {
        if (!a.versao || !b.versao) return 0;
        return b.versao - a.versao;
      });
    } catch (error) {
      console.error('Erro ao buscar histórico de contratos:', error);
      return [];
    }
  }

  /**
   * Verifica se o modelo foi modificado após a geração do contrato
   * @param modelo Modelo do contrato
   * @param contratoGerado Contrato gerado
   * @returns true se o modelo foi modificado após a geração
   */
  static modeloModificadoAposGeracao(modelo: Modelo, contratoGerado: ContratoGerado): boolean {
    // Se o modelo tem timestamp de atualização e é posterior à geração do contrato
    if (modelo.updatedAt && contratoGerado.dataGeracao) {
      return modelo.updatedAt > contratoGerado.dataGeracao;
    }
    return false;
  }

  /**
   * Gera um contrato a partir de um modelo e seus parâmetros
   * @param params Parâmetros para geração do contrato
   * @returns Caminho do arquivo de contrato gerado
   */
  static async gerarContrato(params: ParametrosGeracaoContrato): Promise<string> {
    const { modeloId, parametros, forcarRegeneracao } = params;
    
    try {
      // Verificar se o diretório de contratos existe, se não, criar
      if (!fs.existsSync(this.contratoDir)) {
        fs.mkdirSync(this.contratoDir, { recursive: true });
      }
      
      // Buscar o modelo
      const modelo = await this.buscarModelo(modeloId);
      if (!modelo) {
        throw new Error(`Modelo com ID ${modeloId} não encontrado`);
      }
      
      // Gerar hash único para o contrato
      const hash = this.gerarHashContrato(modeloId, parametros);
      
      // Verificar se já existe um contrato gerado com este hash
      const contratoExistente = await this.buscarContratoGerado(modeloId, hash);
      
      // Se o contrato já existe e não queremos forçar regeneração, retornamos o contrato existente
      if (contratoExistente && !forcarRegeneracao) {
        // Verificar se o arquivo ainda existe
        if (fs.existsSync(contratoExistente.caminhoArquivo)) {
          
          // Verificar se o modelo foi modificado após a geração do contrato
          if (!this.modeloModificadoAposGeracao(modelo, contratoExistente)) {
            // Se o arquivo existe e o modelo não foi modificado, retornar o caminho existente
            return contratoExistente.caminhoArquivo;
          }
        }
      }
      
      // Caso contrário, gerar o contrato
      
      // 1. Obter os dados para o contrato
      const dadosContrato = await this.obterDadosContrato(modeloId, parametros);
      
      // 2. Preparar os dados para o template
      const templateData = {
        principal: {
          ...dadosContrato.principal[0] || {},
          hoje: new Date()
        },
        ...dadosContrato.variaveis
      };

      // 3. Verificar se o template existe
      if (!fs.existsSync(modelo.caminhoTemplate)) {
        throw new Error(`Template não encontrado: ${modelo.caminhoTemplate}`);
      }
      
      // 4. Ler o template e gerar o relatório
      const template = fs.readFileSync(modelo.caminhoTemplate);
      
      // 5. Determinar a versão do contrato
      let versao = 1;
      if (contratoExistente) {
        // Buscar contratos anteriores para determinar a próxima versão
        const contratosAnteriores = await this.buscarHistoricoContratos(modeloId, hash);
        if (contratosAnteriores.length > 0) {
          versao = contratosAnteriores[0].versao + 1;
        }
      }
      
      // 6. Gerar nome de arquivo baseado no hash e versão
      const nomeArquivo = `${modelo.titulo.replace(/\s+/g, '_')}_${hash}_v${versao}.docx`;
      const caminhoCompleto = path.join(this.contratoDir, nomeArquivo);
      
      // 7. Verificar extensão do template
      const extensao = path.extname(modelo.caminhoTemplate).toLowerCase();
      if (extensao !== '.docx') {
        throw new Error(`Formato de arquivo não suportado: ${extensao}. Use apenas .docx`);
      }
      
      // 8. Gerar o contrato usando docxtemplater
      const expressionParser = require('docxtemplater/expressions.js');
      expressionParser.filters.dateToExtenso = function (input: any) {
        if (!input) return '';
      
        const data = new Date(input);
        if (isNaN(data.getTime())) return '';
      
        const meses = [
          'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
          'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ];
      
        const dia = data.getDate();
        const mes = meses[data.getMonth()];
        const ano = data.getFullYear();
      
        return `${dia} de ${mes} de ${ano}`;
      };
      
      const zip = new PizZip(template);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: false,
        linebreaks: true,
        parser: expressionParser
      });
      
      doc.render(templateData);
      
      const buffer = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE'
      });
      
      // 9. Salvar o arquivo gerado
      fs.writeFileSync(caminhoCompleto, buffer);
      
      // 10. Se existir contrato anterior, desativar (mas manter no histórico)
      if (contratoExistente) {
        await ContratoGeradoModel.updateOne(
          { modeloId, hash, ativo: true },
          { ativo: false }
        );
      }
      
      // 11. Criar novo registro de contrato
      await ContratoGeradoModel.create({
        modeloId,
        parametros,
        caminhoArquivo: caminhoCompleto,
        dadosContrato,
        dataGeracao: new Date(),
        hash,
        versao,
        ativo: true
      });
      
      return caminhoCompleto;
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      throw error;
    }
  }

  /**
   * Busca todos os contratos vigentes (ativos)
   * @param filtros Filtros opcionais (como modelo específico)
   * @returns Lista de todos os contratos ativos
   */
  static async listarContratosVigentes(filtros?: { modeloId?: string }): Promise<ContratoGerado[]> {
    try {
      const consulta: Record<string, any> = { ativo: true };
      
      // Adicionar filtro de modelo, se especificado
      if (filtros?.modeloId) {
        consulta.modeloId = filtros.modeloId;
      }
      
      // Buscar todos os contratos ativos
      const contratosAtivos = await ContratoGeradoModel.find(consulta)
        .sort({ dataGeracao: -1 });
      
      return contratosAtivos;
    } catch (error) {
      console.error('Erro ao listar contratos vigentes:', error);
      return [];
    }
  }

  /**
   * Executa uma query SQL diretamente para testes
   * @param query Query SQL a ser executada
   * @param parametros Parâmetros da query
   * @returns Resultado da query
   */
  static async testarQuery<T = Record<string, any>>(
    query: string,
    parametros?: SqlQueryParams
  ): Promise<T[]> {
    try {
      return await SqlQueryService.executeQuery<T>(query, parametros);
    } catch (error) {
      console.error('Erro ao executar query de teste:', error);
      throw error;
    }
  }

  /**
   * Define os últimos parâmetros recebidos para uso na busca
   * @param parametros Parâmetros recebidos
   */
  static definirUltimosParametros(parametros: SqlQueryParams): void {
    this.ultimosParametrosRecebidos = parametros || {};
  }

  /**
   * Obtém o caminho do arquivo de um modelo
   * @param modeloId ID do modelo
   * @returns Caminho do arquivo do modelo
   */
  static async obterCaminhoModelo(modeloId: string): Promise<string> {
    try {
      const modelo = await this.buscarModelo(modeloId);
      if (!modelo) {
        throw new Error(`Modelo com ID ${modeloId} não encontrado`);
      }
      return path.resolve(modelo.caminhoTemplate);
    } catch (error) {
      console.error('Erro ao obter caminho do modelo:', error);
      throw error;
    }
  }

  /**
   * Obtém o caminho do arquivo de um contrato gerado
   * @param modeloId ID do modelo
   * @param hash Hash do contrato
   * @returns Caminho do arquivo do contrato
   */
  static async obterCaminhoContrato(modeloId: string, hash: string): Promise<string> {
    try {
      const contrato = await this.buscarContratoGerado(modeloId, hash);
      if (!contrato) {
        throw new Error(`Contrato não encontrado para o modelo ${modeloId} e hash ${hash}`);
      }
      return path.resolve(contrato.caminhoArquivo);
    } catch (error) {
      console.error('Erro ao obter caminho do contrato:', error);
      throw error;
    }
  }
} 