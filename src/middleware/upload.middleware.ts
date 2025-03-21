import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Garantir que o diretório de upload exista
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configurar o armazenamento do Multer
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

// Filtrar para permitir apenas certos tipos de arquivo
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.doc', '.docx', '.dotx', '.txt', '.rtf'];
  const extension = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Permitidos: .doc, .docx, .dotx, .txt, .rtf'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
}); 