import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createReport } from 'docx-templates';
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
    const dadosString = JSON.stringify({ modeloId, parametros });
    return crypto.createHash('md5').update(dadosString).digest('hex');
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
        hash
      });
    } catch (error) {
      console.error('Erro ao buscar contrato gerado:', error);
      return null;
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
      
      // Se o contrato já existe, verificamos se precisamos regenerá-lo
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
        principal: dadosContrato.principal[0] || {}, // Assume-se que a query principal retorna um único registro
        ...dadosContrato.variaveis
      };

      console.log(templateData);
      
      // 3. Verificar se o template existe
      if (!fs.existsSync(modelo.caminhoTemplate)) {
        throw new Error(`Template não encontrado: ${modelo.caminhoTemplate}`);
      }
      
      // 4. Ler o template e gerar o relatório
      const template = fs.readFileSync(modelo.caminhoTemplate);
      
      // 5. Gerar nome de arquivo baseado no hash
      const nomeArquivo = `${modelo.titulo.replace(/\s+/g, '_')}_${hash}.docx`;
      const caminhoCompleto = path.join(this.contratoDir, nomeArquivo);
      
      // 6. Gerar o contrato usando docx-templates
      const buffer = await createReport({
        template,
        data: templateData,
        cmdDelimiter: ['{{', '}}']
      });
      
      // 7. Salvar o arquivo gerado
      fs.writeFileSync(caminhoCompleto, buffer);
      
      // 8. Salvar ou atualizar no banco de dados
      if (contratoExistente) {
        // Atualizar registro existente
        await ContratoGeradoModel.updateOne(
          { modeloId, hash },
          {
            caminhoArquivo: caminhoCompleto,
            dadosContrato,
            dataGeracao: new Date()
          }
        );
      } else {
        // Criar novo registro
        await ContratoGeradoModel.create({
          modeloId,
          parametros,
          caminhoArquivo: caminhoCompleto,
          dadosContrato,
          dataGeracao: new Date(),
          hash
        });
      }
      
      return caminhoCompleto;
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      throw error;
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
} 