export interface Variavel {
  nome: string;
  tipo: 'simples' | 'lista' | 'tabela';
  subvariaveis: string[];
  query: string;
}

export interface Modelo {
  titulo: string;
  tipo: string;
  descricao: string;
  caminhoTemplate: string;
  queryPrincipal: string;
  variaveis: Variavel[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ModeloInput {
  titulo: string;
  tipo: string;
  descricao: string;
  queryPrincipal: string;
  variaveis: Variavel[];
  arquivoTemplate?: Express.Multer.File;
}

export interface DadosContrato {
  principal: Record<string, any>[];
  variaveis: Record<string, Record<string, any>[]>;
}

export interface SqlQueryParams {
  [key: string]: string | number | boolean | Date | null;
}

export interface ContratoGerado {
  modeloId: string;
  parametros: SqlQueryParams;
  caminhoArquivo: string;
  dadosContrato?: DadosContrato;
  identificadoresCampos?: {
    primario: string | null;
    secundario: string | null;
  };
  dataGeracao: Date;
  hash: string;
  versao: number;
  ativo: boolean;
}

export interface ParametrosGeracaoContrato {
  modeloId: string;
  parametros: SqlQueryParams;
  forcarRegeneracao?: boolean;
} 