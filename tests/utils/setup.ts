import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

let mongoServer: MongoMemoryServer;

// Configurar timeout global para testes
jest.setTimeout(30000);

// Configurar banco de dados em memória antes dos testes
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Limpar todos os dados após cada teste
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Fechar a conexão com o banco após todos os testes
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
}); 