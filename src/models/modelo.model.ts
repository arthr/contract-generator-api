import mongoose, { Schema, Document } from 'mongoose';
import { Modelo, Variavel } from '../types';

interface ModeloDocument extends Modelo, Document {}

const VariavelSchema = new Schema<Variavel>({
  nome: { type: String, required: true },
  tipo: { type: String, required: true, enum: ['simples', 'lista', 'tabela'] },
  subvariaveis: [{ type: String }],
  query: { type: String, default: '' }
});

const ModeloSchema = new Schema<ModeloDocument>({
  titulo: { type: String, required: true },
  tipo: { type: String, required: true },
  descricao: { type: String, required: true },
  caminhoTemplate: { type: String, required: true },
  queryPrincipal: { type: String, required: true },
  variaveis: [VariavelSchema]
}, { timestamps: true });

export const ModeloModel = mongoose.model<ModeloDocument>('Modelo', ModeloSchema); 