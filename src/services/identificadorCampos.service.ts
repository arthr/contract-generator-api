import { DadosContrato } from '../types';

export interface IdentificadoresCampos {
  primario: string | null;
  secundario: string | null;
}

export class IdentificadorCamposService {
  private static readonly regexDocumento = /(^\d{3}\.\d{3}\.\d{3}-\d{2}$)|(^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$)|(^\d{2}\d{3}\d{3}\d{4}\d{2}$)/;
  private static readonly palavrasChavePrimarias = ['nome', 'razao', 'razaosocial', 'empresa', 'cedente', 'fantasia'];

  /**
   * Identifica os campos primário (nome/razão social) e secundário (documento) nos dados principais do contrato
   * @param dadosContrato Dados do contrato contendo os dados principais
   * @returns Objeto com os identificadores dos campos primário e secundário
   */
  static identificarCampos(dadosContrato: DadosContrato): IdentificadoresCampos {
    if (!dadosContrato.principal || dadosContrato.principal.length === 0) {
      return { primario: null, secundario: null };
    }

    const dados = dadosContrato.principal[0];
    const chaves = Object.keys(dados);
    let primario: string | null = null;
    let secundario: string | null = null;
    let scoreMax = 0;

    for (const chave of chaves) {
      const valor = dados[chave];

      if (typeof valor !== 'string') continue;

      const valorLower = valor.toLowerCase();

      // documento (secundário)
      if (!secundario && this.regexDocumento.test(valor.replace(/\s/g, ''))) {
        secundario = valorLower;
      }

      // heurística para nome/razão social (primário)
      let score = 0;

      if (this.palavrasChavePrimarias.some(p => chave.toLowerCase().includes(p))) {
        score += 3;
      }

      if (valor.match(/\b(ltda|me|eireli|s\/a|ss|ei|empresa)\b/i)) {
        score += 2;
      }

      if (valor.split(' ').length >= 2) {
        score += 1;
      }

      if (valor.length > 5 && valor.length < 100) {
        score += 1;
      }

      if (score > scoreMax) {
        scoreMax = score;
        primario = valorLower;
      }
    }

    return { primario, secundario };
  }
} 