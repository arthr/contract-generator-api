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