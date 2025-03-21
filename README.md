# API de Geração de Contratos

API para gerenciamento de modelos de contratos com suporte a upload de templates, definição de variáveis, consultas SQL e geração de contratos no formato DOCX.

## Requisitos

- Node.js (v14+)
- MongoDB
- SQL Server (para consultas das variáveis)
- npm ou pnpm

## Configuração

1. Clone o repositório
2. Instale as dependências:
   ```bash
   pnpm install
   ```
3. Configure as variáveis de ambiente criando um arquivo `.env` na raiz do projeto:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/contract-generator
   UPLOAD_DIR=./uploads
   SQL_SERVER_HOST=localhost
   SQL_SERVER_PORT=1433
   SQL_SERVER_USER=sa
   SQL_SERVER_PASSWORD=yourStrongPassword
   SQL_SERVER_DATABASE=ContractData
   ```
4. Compile o TypeScript:
   ```bash
   pnpm build
   ```
5. Inicie o servidor:
   ```bash
   pnpm start
   ```

Para desenvolvimento, você pode usar:
```bash
pnpm dev
```

## Estrutura do Projeto

```
src/
├── config/         # Configurações da aplicação
├── controllers/    # Controladores com lógica de negócios
├── middleware/     # Middlewares Express
├── models/         # Modelos do MongoDB
├── routes/         # Definições de rotas
├── services/       # Serviços de negócios
├── types/          # Definições de tipos TypeScript
└── index.ts        # Ponto de entrada da aplicação

uploads/
└── contratos-gerados/  # Diretório onde são armazenados os contratos gerados
```

## Endpoints

### Upload de Arquivo de Template
- **POST** `/api/modelos/upload`
  - Recebe um arquivo via FormData (campo `arquivoTemplate`)
  - Retorna o caminho do arquivo salvo

### Gerenciamento de Modelos

- **POST** `/api/modelos`
  - Cria um novo modelo de contrato
  - Pode receber o arquivo de template diretamente ou o caminho do template previamente carregado

- **GET** `/api/modelos`
  - Lista todos os modelos cadastrados

- **GET** `/api/modelos/:id`
  - Busca um modelo específico pelo ID

- **PUT** `/api/modelos/:id`
  - Atualiza um modelo existente
  - Pode incluir um novo arquivo de template

- **DELETE** `/api/modelos/:id`
  - Remove um modelo e seu arquivo de template

### Contratos e Consultas SQL

- **POST** `/api/contratos/dados/:id`
  - Obtém os dados para geração de um contrato, executando as consultas SQL
  - Recebe os parâmetros para as consultas no corpo da requisição
  - Exemplo de uso:
    ```json
    {
      "parametros": {
        "id_contrato": 123,
        "id_cliente": 456
      }
    }
    ```

- **POST** `/api/contratos/gerar/:id`
  - Gera um contrato DOCX a partir de um modelo, usando os dados do SQL Server
  - Armazena o contrato gerado para reutilização futura (sistema de cache)
  - Exemplo de uso:
    ```json
    {
      "parametros": {
        "id_contrato": 123,
        "id_cliente": 456,
        "data_inicio": "2023-01-01"
      },
      "forcarRegeneracao": false
    }
    ```
  - Retorna um objeto com a URL para o arquivo gerado:
    ```json
    {
      "mensagem": "Contrato gerado com sucesso",
      "arquivo": {
        "nome": "Contrato_123_456.docx",
        "url": "/uploads/contratos-gerados/Contrato_123_456.docx",
        "caminho": "/path/to/uploads/contratos-gerados/Contrato_123_456.docx"
      }
    }
    ```

- **POST** `/api/contratos/testar-query`
  - Endpoint para testar consultas SQL durante o desenvolvimento
  - Exemplo de uso:
    ```json
    {
      "query": "SELECT * FROM clientes WHERE id_cliente = :id_cliente",
      "parametros": {
        "id_cliente": 456
      }
    }
    ```

## Formato de Dados

### Modelo de Contrato

```json
{
  "titulo": "Nome do Modelo de Contrato",
  "tipo": "parceria",
  "descricao": "Descrição do contrato",
  "arquivoTemplate": "/caminho/para/arquivo.docx",
  "queryPrincipal": "SELECT * FROM contratos WHERE id_contrato = :id_contrato",
  "variaveis": [
    {
      "nome": "NOME_VARIAVEL",
      "tipo": "simples|lista|tabela",
      "subvariaveis": ["SUBVAR1", "SUBVAR2"],
      "query": "Consulta SQL (opcional)"
    }
  ]
}
```

### Parâmetros para Geração de Contrato

```json
{
  "parametros": {
    "id_contrato": 123,
    "id_cliente": 456,
    "data_inicio": "2023-01-01"
  },
  "forcarRegeneracao": false
}
```

## Tecnologias Utilizadas

- Node.js com Express
- TypeScript
- MongoDB/Mongoose
- SQL Server para consultas de dados
- Multer para upload de arquivos
- docx-templates para geração de contratos DOCX
- Jest para testes automatizados

## Testes

Execute os testes com:

```bash
pnpm test
```

Para testes específicos:

```bash
pnpm test:unit      # Testes unitários
pnpm test:integration  # Testes de integração
```

## Cache de Contratos

A API implementa um mecanismo de cache para contratos gerados, identificando-os por um hash baseado no modelo e nos parâmetros. Um contrato só é gerado novamente se:

1. For solicitado explicitamente (forçar regeneração)
2. O arquivo não existir mais no sistema
3. O modelo tiver sido atualizado após a geração anterior

## Documentação para o Frontend

Uma documentação detalhada para uso da API pelo frontend está disponível no arquivo [docs/guia-frontend-contratos.md](docs/guia-frontend-contratos.md). 