# API de Geração de Contratos

API para gerenciamento de modelos de contratos com suporte a upload de templates e definição de variáveis.

## Requisitos

- Node.js (v14+)
- MongoDB
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

## Formato de Dados

O modelo de contrato possui a seguinte estrutura:

```json
{
  "titulo": "Nome do Modelo de Contrato",
  "tipo": "parceria",
  "descricao": "Descrição do contrato",
  "arquivoTemplate": [Arquivo Binário],
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

## Tecnologias Utilizadas

- Node.js com Express
- TypeScript
- MongoDB/Mongoose
- Multer para upload de arquivos 