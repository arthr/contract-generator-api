import mongoose, { Schema, Document } from 'mongoose';
import { ContratoGerado } from '../types';

interface ContratoGeradoDocument extends ContratoGerado, Document {}

const ContratoGeradoSchema = new Schema<ContratoGeradoDocument>({
  modeloId: { 
    type: String, 
    ref: 'Modelo', 
    required: true 
  },
  parametros: { 
    type: Schema.Types.Mixed, 
    required: true 
  },
  caminhoArquivo: { 
    type: String, 
    required: true 
  },
  dadosContrato: {
    type: Schema.Types.Mixed,
    required: false
  },
  dataGeracao: { 
    type: Date, 
    default: Date.now 
  },
  hash: { 
    type: String, 
    required: true,
    index: true
  }
}, { timestamps: true });

// Índice composto para buscar contratos por modelo e hash
ContratoGeradoSchema.index({ modeloId: 1, hash: 1 }, { unique: true });

export const ContratoGeradoModel = mongoose.model<ContratoGeradoDocument>('ContratoGerado', ContratoGeradoSchema); 