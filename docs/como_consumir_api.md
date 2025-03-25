# Documentação da API de Geração de Contratos

Esta documentação descreve como consumir a API de geração de contratos, incluindo todos os endpoints disponíveis, parâmetros necessários e exemplos de uso.

## Tipos de Variáveis

A API suporta três tipos de variáveis para preenchimento de templates:

1. **Simples**
   - Tipo: `simples`
   - Não possui subvariáveis
   - Exemplo: `{{variavel}}`

2. **Lista**
   - Tipo: `lista`
   - Possui subvariáveis que serão repetidas para cada item
   - Exemplo: 
     ```
     {{#variavel}}
       {{subvariavel1}} - {{subvariavel2}}
     {{/variavel}}
     ```

3. **Tabela**
   - Tipo: `tabela`
   - Possui subvariáveis que serão usadas como colunas
   - Exemplo:
     ```
     <table>
       <tr>
         {{#variavel}}
           <th>{{subvariavel1}}</th>
           <th>{{subvariavel2}}</th>
         {{/variavel}}
       </tr>
       <tr>
         {{#variavel}}
           <td>{{subvariavel1}}</td>
           <td>{{subvariavel2}}</td>
         {{/variavel}}
       </tr>
     </table>
     ```

## Endpoints de Gerenciamento de Modelos

### 1. Upload de Template

**Endpoint:** `POST /api/modelos/upload`

Este endpoint permite fazer upload de um arquivo de template DOCX/DOTX.

#### Parâmetros

- **Body (FormData):**
  - `file`: Arquivo DOCX ou DOTX do template

#### Resposta de Sucesso (200)

```json
{
  "mensagem": "Template enviado com sucesso",
  "arquivo": {
    "nome": "template.docx",
    "caminho": "/uploads/templates/template.docx"
  }
}
```

### 2. Criar Modelo

**Endpoint:** `POST /api/modelos`

Este endpoint cria um novo modelo de contrato.

#### Parâmetros

- **Body (FormData):**
  - `file`: Arquivo DOCX ou DOTX do template
  - `titulo`: Título do modelo
  - `tipo`: Tipo do modelo
  - `descricao`: Descrição do modelo
  - `queryPrincipal`: Query SQL principal
  - `variaveis`: Array de variáveis (JSON string)
    ```json
    [
      {
        "nome": "CLIENTE",
        "tipo": "simples",
        "subvariaveis": [],
        "query": "SELECT nome, cnpj FROM clientes WHERE id = :id_cliente"
      },
      {
        "nome": "PRODUTOS",
        "tipo": "lista",
        "subvariaveis": ["nome", "valor", "quantidade"],
        "query": "SELECT nome, valor, quantidade FROM produtos WHERE id_cliente = :id_cliente"
      },
      {
        "nome": "PAGAMENTOS",
        "tipo": "tabela",
        "subvariaveis": ["parcela", "valor", "data"],
        "query": "SELECT parcela, valor, data FROM pagamentos WHERE id_cliente = :id_cliente"
      }
    ]
    ```

#### Resposta de Sucesso (201)

```json
{
  "mensagem": "Modelo criado com sucesso",
  "modelo": {
    "id": "64e7a1b2f3c25e9876543210",
    "titulo": "Contrato de Prestação de Serviços",
    "tipo": "servico",
    "descricao": "Modelo padrão de contrato",
    "caminhoTemplate": "/uploads/templates/template.docx",
    "queryPrincipal": "SELECT * FROM clientes WHERE id = :id_cliente",
    "variaveis": [
      {
        "nome": "CLIENTE",
        "tipo": "simples",
        "subvariaveis": [],
        "query": "SELECT nome, cnpj FROM clientes WHERE id = :id_cliente"
      },
      {
        "nome": "PRODUTOS",
        "tipo": "lista",
        "subvariaveis": ["nome", "valor", "quantidade"],
        "query": "SELECT nome, valor, quantidade FROM produtos WHERE id_cliente = :id_cliente"
      }
    ]
  }
}
```

### 3. Listar Modelos

**Endpoint:** `GET /api/modelos`

Este endpoint retorna a lista de todos os modelos disponíveis.

#### Resposta de Sucesso (200)

```json
{
  "modelos": [
    {
      "id": "64e7a1b2f3c25e9876543210",
      "titulo": "Contrato de Prestação de Serviços",
      "tipo": "servico",
      "descricao": "Modelo padrão de contrato",
      "caminhoTemplate": "/uploads/templates/template.docx",
      "queryPrincipal": "SELECT * FROM clientes WHERE id = :id_cliente",
      "variaveis": [
        {
          "nome": "CLIENTE",
          "tipo": "simples",
          "subvariaveis": [],
          "query": "SELECT nome, cnpj FROM clientes WHERE id = :id_cliente"
        }
      ]
    }
  ]
}
```

### 4. Buscar Modelo por ID

**Endpoint:** `GET /api/modelos/:id`

Este endpoint retorna os detalhes de um modelo específico.

#### Parâmetros

- **URL:**
  - `id`: ID do modelo no MongoDB

#### Resposta de Sucesso (200)

```json
{
  "modelo": {
    "id": "64e7a1b2f3c25e9876543210",
    "titulo": "Contrato de Prestação de Serviços",
    "tipo": "servico",
    "descricao": "Modelo padrão de contrato",
    "caminhoTemplate": "/uploads/templates/template.docx",
    "queryPrincipal": "SELECT * FROM clientes WHERE id = :id_cliente",
    "variaveis": [
      {
        "nome": "CLIENTE",
        "tipo": "simples",
        "subvariaveis": [],
        "query": "SELECT nome, cnpj FROM clientes WHERE id = :id_cliente"
      }
    ]
  }
}
```

### 5. Atualizar Modelo

**Endpoint:** `PUT /api/modelos/:id`

Este endpoint atualiza um modelo existente.

#### Parâmetros

- **URL:**
  - `id`: ID do modelo no MongoDB

- **Body (FormData):**
  - `file`: (opcional) Novo arquivo de template
  - `titulo`: Novo título do modelo
  - `tipo`: Novo tipo do modelo
  - `descricao`: Nova descrição do modelo
  - `queryPrincipal`: Nova query SQL principal
  - `variaveis`: Novo array de variáveis (JSON string)

#### Resposta de Sucesso (200)

```json
{
  "mensagem": "Modelo atualizado com sucesso",
  "modelo": {
    "id": "64e7a1b2f3c25e9876543210",
    "titulo": "Contrato de Prestação de Serviços - Atualizado",
    "tipo": "servico",
    "descricao": "Modelo padrão de contrato atualizado",
    "caminhoTemplate": "/uploads/templates/template_atualizado.docx",
    "queryPrincipal": "SELECT * FROM clientes WHERE id = :id_cliente",
    "variaveis": [
      {
        "nome": "CLIENTE",
        "tipo": "simples",
        "subvariaveis": [],
        "query": "SELECT nome, cnpj FROM clientes WHERE id = :id_cliente"
      }
    ]
  }
}
```

### 6. Excluir Modelo

**Endpoint:** `DELETE /api/modelos/:id`

Este endpoint exclui um modelo existente.

#### Parâmetros

- **URL:**
  - `id`: ID do modelo no MongoDB

#### Resposta de Sucesso (200)

```json
{
  "mensagem": "Modelo excluído com sucesso"
}
```

### 6. Download de Modelo

**Endpoint:** `GET /api/contratos/modelo/:id/download`

Este endpoint permite fazer o download do arquivo de template de um modelo específico.

#### Parâmetros

- **URL:**
  - `id`: ID do modelo no MongoDB

#### Resposta de Sucesso (200)
- Retorna o arquivo DOCX do modelo para download
- O arquivo será baixado com o nome original do template

#### Resposta de Erro (404)
```json
{
  "mensagem": "Modelo não encontrado"
}
```

### 7. Download de Contrato Gerado

**Endpoint:** `GET /api/contratos/:id/:hash/download`

Este endpoint permite fazer o download de um contrato gerado específico.

#### Parâmetros

- **URL:**
  - `id`: ID do modelo de contrato no MongoDB
  - `hash`: Hash do contrato gerado

#### Resposta de Sucesso (200)
- Retorna o arquivo DOCX do contrato para download
- O arquivo será baixado com o nome original do contrato gerado

#### Resposta de Erro (404)
```json
{
  "mensagem": "Contrato não encontrado"
}
```

## Endpoints de Contratos

### 1. Obter Dados para Contrato

**Endpoint:** `POST /api/contratos/dados/:id`

Este endpoint retorna os dados necessários para preencher um contrato, executando as consultas SQL definidas no modelo.

#### Parâmetros

- **URL:**
  - `id`: ID do modelo de contrato no MongoDB

- **Body (JSON):**
  ```json
  {
    "parametros": {
      "id_cliente": 12345,
      "id_contrato": 5678,
      "tipo": "servico"
    }
  }
  ```

#### Resposta de Sucesso (200)

```json
{
  "mensagem": "Dados para geração de contrato obtidos com sucesso",
  "dados": {
    "principal": [
      {
        "id_contrato": 5678,
        "cliente": "Empresa XYZ",
        "valor": 1500.00,
        "data_inicio": "2023-01-01"
      }
    ],
    "variaveis": {
      "CLIENTE": [
        {
          "nome": "Empresa XYZ",
          "cnpj": "12.345.678/0001-90"
        }
      ],
      "PRODUTOS": [
        { "nome": "Produto A", "valor": 500.00, "quantidade": 2 },
        { "nome": "Produto B", "valor": 1000.00, "quantidade": 1 }
      ],
      "PAGAMENTOS": [
        { "parcela": 1, "valor": 750.00, "data": "2023-02-01" },
        { "parcela": 2, "valor": 750.00, "data": "2023-03-01" }
      ]
    }
  }
}
```

### 2. Gerar Contrato

**Endpoint:** `POST /api/contratos/gerar/:id`

Este endpoint gera um contrato em formato DOCX a partir de um modelo e parâmetros específicos.

#### Parâmetros

- **URL:**
  - `id`: ID do modelo de contrato no MongoDB

- **Body (JSON):**
  ```json
  {
    "parametros": {
      "id_cliente": 12345,
      "id_contrato": 5678,
      "data_inicio": "2023-01-01",
      "valor": 1500.00,
      "tipo": "servico"
    },
    "forcarRegeneracao": false
  }
  ```

#### Resposta de Sucesso (200)

```json
{
  "mensagem": "Contrato gerado com sucesso",
  "arquivo": {
    "nome": "Contrato_Servico_abcdef1234.docx",
    "url": "/uploads/contratos-gerados/Contrato_Servico_abcdef1234.docx",
    "caminho": "/path/to/uploads/contratos-gerados/Contrato_Servico_abcdef1234.docx"
  }
}
```

### 3. Testar Query SQL

**Endpoint:** `POST /api/contratos/testar-query`

Este endpoint permite testar consultas SQL diretamente, útil durante o desenvolvimento.

⚠️ **Atenção**: Esta rota deve ser usada apenas em ambiente de desenvolvimento.

#### Parâmetros

- **Body (JSON):**
  ```json
  {
    "query": "SELECT * FROM clientes WHERE id_cliente = :id_cliente",
    "parametros": {
      "id_cliente": 12345
    }
  }
  ```

#### Resposta de Sucesso (200)

```json
{
  "mensagem": "Query executada com sucesso",
  "resultado": [
    {
      "id_cliente": 12345,
      "nome": "Empresa XYZ",
      "endereco": "Rua ABC, 123",
      "telefone": "11 99999-9999"
    }
  ]
}
```

### 4. Obter Histórico de Contratos

**Endpoint:** `POST /api/contratos/historico/:id`

Este endpoint retorna o histórico de versões de contratos gerados para um modelo e conjunto de parâmetros específicos.

#### Parâmetros

- **URL:**
  - `id`: ID do modelo de contrato no MongoDB

- **Body (JSON):**
  ```json
  {
    "parametros": {
      "id_cliente": 12345,
      "id_contrato": 5678,
      "tipo": "servico"
    }
  }
  ```

#### Resposta de Sucesso (200)

```json
{
  "mensagem": "Histórico de contratos obtido com sucesso",
  "historico": [
    {
      "versao": 3,
      "dataGeracao": "2023-06-15T14:30:45.123Z",
      "ativo": true,
      "arquivo": {
        "nome": "Contrato_Servico_abcdef1234_v3.docx",
        "url": "/uploads/contratos-gerados/Contrato_Servico_abcdef1234_v3.docx",
        "caminho": "/path/to/uploads/contratos-gerados/Contrato_Servico_abcdef1234_v3.docx"
      }
    },
    {
      "versao": 2,
      "dataGeracao": "2023-05-20T10:15:30.456Z",
      "ativo": false,
      "arquivo": {
        "nome": "Contrato_Servico_abcdef1234_v2.docx",
        "url": "/uploads/contratos-gerados/Contrato_Servico_abcdef1234_v2.docx",
        "caminho": "/path/to/uploads/contratos-gerados/Contrato_Servico_abcdef1234_v2.docx"
      }
    },
    {
      "versao": 1,
      "dataGeracao": "2023-04-10T09:00:15.789Z",
      "ativo": false,
      "arquivo": {
        "nome": "Contrato_Servico_abcdef1234_v1.docx",
        "url": "/uploads/contratos-gerados/Contrato_Servico_abcdef1234_v1.docx",
        "caminho": "/path/to/uploads/contratos-gerados/Contrato_Servico_abcdef1234_v1.docx"
      }
    }
  ]
}
```

### 5. Listar Contratos Vigentes

**Endpoint:** `GET /api/contratos/vigentes`

Este endpoint retorna a lista de todos os contratos vigentes (ativos) no sistema. Cada contrato representa a versão mais recente gerada para um determinado modelo e conjunto de parâmetros.

#### Parâmetros

- **Query (opcional):**
  - `modeloId`: ID do modelo para filtrar apenas contratos de um modelo específico

#### Resposta de Sucesso (200)

```json
{
  "mensagem": "Contratos vigentes obtidos com sucesso",
  "contratos": [
    {
      "modeloId": "64e7a1b2f3c25e9876543210",
      "versao": 3,
      "dataGeracao": "2023-06-15T14:30:45.123Z",
      "parametros": {
        "id_cliente": 12345,
        "id_contrato": 5678,
        "tipo": "servico"
      },
      "arquivo": {
        "nome": "Contrato_Servico_abcdef1234_v3.docx",
        "url": "/uploads/contratos-gerados/Contrato_Servico_abcdef1234_v3.docx",
        "caminho": "/path/to/uploads/contratos-gerados/Contrato_Servico_abcdef1234_v3.docx"
      }
    },
    {
      "modeloId": "64e7a1b2f3c25e9876543211",
      "versao": 2,
      "dataGeracao": "2023-07-05T10:12:30.789Z",
      "parametros": {
        "id_cliente": 54321,
        "id_contrato": 8765,
        "tipo": "venda"
      },
      "arquivo": {
        "nome": "Contrato_Venda_def456789_v2.docx",
        "url": "/uploads/contratos-gerados/Contrato_Venda_def456789_v2.docx",
        "caminho": "/path/to/uploads/contratos-gerados/Contrato_Venda_def456789_v2.docx"
      }
    }
  ]
}
```

## Exemplos de Uso

### Exemplo 1: Upload de Template

```typescript
async function uploadTemplate(arquivo: File) {
  try {
    const formData = new FormData();
    formData.append('file', arquivo);

    const response = await fetch('/api/modelos/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.mensagem || 'Erro ao fazer upload do template');
    }

    const resultado = await response.json();
    return resultado.arquivo;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

### Exemplo 2: Criar Modelo

```typescript
interface Variavel {
  nome: string;
  tipo: 'simples' | 'lista' | 'tabela';
  subvariaveis: string[];
  query: string;
}

async function criarModelo(dados: {
  arquivo: File;
  titulo: string;
  tipo: string;
  descricao: string;
  queryPrincipal: string;
  variaveis: Variavel[];
}) {
  try {
    const formData = new FormData();
    formData.append('file', dados.arquivo);
    formData.append('titulo', dados.titulo);
    formData.append('tipo', dados.tipo);
    formData.append('descricao', dados.descricao);
    formData.append('queryPrincipal', dados.queryPrincipal);
    formData.append('variaveis', JSON.stringify(dados.variaveis));

    const response = await fetch('/api/modelos', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.mensagem || 'Erro ao criar modelo');
    }

    const resultado = await response.json();
    return resultado.modelo;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

### Exemplo 3: Listar Modelos

```typescript
async function listarModelos() {
  try {
    const response = await fetch('/api/modelos');

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.mensagem || 'Erro ao listar modelos');
    }

    const resultado = await response.json();
    return resultado.modelos;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

### Exemplo 4: Buscar Modelo por ID

```typescript
async function buscarModeloPorId(id: string) {
  try {
    const response = await fetch(`/api/modelos/${id}`);

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.mensagem || 'Erro ao buscar modelo');
    }

    const resultado = await response.json();
    return resultado.modelo;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

### Exemplo 5: Atualizar Modelo

```typescript
interface Variavel {
  nome: string;
  tipo: 'simples' | 'lista' | 'tabela';
  subvariaveis: string[];
  query: string;
}

async function atualizarModelo(id: string, dados: {
  arquivo?: File;
  titulo?: string;
  tipo?: string;
  descricao?: string;
  queryPrincipal?: string;
  variaveis?: Variavel[];
}) {
  try {
    const formData = new FormData();
    
    if (dados.arquivo) formData.append('file', dados.arquivo);
    if (dados.titulo) formData.append('titulo', dados.titulo);
    if (dados.tipo) formData.append('tipo', dados.tipo);
    if (dados.descricao) formData.append('descricao', dados.descricao);
    if (dados.queryPrincipal) formData.append('queryPrincipal', dados.queryPrincipal);
    if (dados.variaveis) formData.append('variaveis', JSON.stringify(dados.variaveis));

    const response = await fetch(`/api/modelos/${id}`, {
      method: 'PUT',
      body: formData
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.mensagem || 'Erro ao atualizar modelo');
    }

    const resultado = await response.json();
    return resultado.modelo;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

### Exemplo 6: Excluir Modelo

```typescript
async function excluirModelo(id: string) {
  try {
    const response = await fetch(`/api/modelos/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.mensagem || 'Erro ao excluir modelo');
    }

    const resultado = await response.json();
    return resultado.mensagem;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

### Exemplo 7: Obter Dados do Contrato

```typescript
async function obterDadosContrato(modeloId: string, parametros: Record<string, any>) {
  try {
    const response = await fetch(`/api/contratos/dados/${modeloId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ parametros })
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.mensagem || 'Erro ao obter dados do contrato');
    }

    const resultado = await response.json();
    return resultado.dados;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

### Exemplo 8: Gerar Contrato

```typescript
async function gerarContrato(modeloId: string, parametros: Record<string, any>, forcarRegeneracao = false) {
  try {
    const response = await fetch(`/api/contratos/gerar/${modeloId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parametros,
        forcarRegeneracao
      })
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.mensagem || 'Erro ao gerar contrato');
    }

    const resultado = await response.json();
    return resultado.arquivo.url;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

### Exemplo 9: Testar Query SQL

```typescript
async function testarQuery(query: string, parametros: Record<string, any>) {
  try {
    const response = await fetch('/api/contratos/testar-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        parametros
      })
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.mensagem || 'Erro ao executar query');
    }

    const resultado = await response.json();
    return resultado.resultado;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

### Exemplo 10: Obter Histórico de Contratos

```typescript
async function obterHistoricoContratos(modeloId: string, parametros: Record<string, any>) {
  try {
    const response = await fetch(`/api/contratos/historico/${modeloId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ parametros })
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.mensagem || 'Erro ao obter histórico de contratos');
    }

    const resultado = await response.json();
    return resultado.historico;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

### Exemplo 11: Listar Contratos Vigentes

```typescript
async function listarContratosVigentes(modeloId?: string) {
  try {
    // Construir URL com parâmetros de consulta opcionais
    let url = '/api/contratos/vigentes';
    if (modeloId) {
      url += `?modeloId=${modeloId}`;
    }
    
    const response = await fetch(url);

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.mensagem || 'Erro ao listar contratos vigentes');
    }

    const resultado = await response.json();
    return resultado.contratos;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

### Exemplo 12: Download de Modelo

```typescript
async function downloadModelo(modeloId: string) {
  try {
    const response = await fetch(`/api/contratos/modelo/${modeloId}/download`);

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.mensagem || 'Erro ao fazer download do modelo');
    }

    // O arquivo será baixado automaticamente pelo navegador
    // O nome do arquivo será definido pelo header Content-Disposition
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

### Exemplo 13: Download de Contrato

```typescript
async function downloadContrato(modeloId: string, hash: string) {
  try {
    const response = await fetch(`/api/contratos/${modeloId}/${hash}/download`);

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.mensagem || 'Erro ao fazer download do contrato');
    }

    // O arquivo será baixado automaticamente pelo navegador
    // O nome do arquivo será definido pelo header Content-Disposition
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

## Fluxo de Uso

1. **Upload e Criação de Modelo**:
   - Primeiro, faça upload do template usando `uploadTemplate()`
   - Em seguida, crie um novo modelo usando `criarModelo()`
   - Você pode listar todos os modelos usando `listarModelos()`
   - Para ver detalhes de um modelo específico, use `buscarModeloPorId()`

2. **Geração de Contrato**:
   - Obtenha os dados necessários usando `obterDadosContrato()`
   - Gere o contrato usando `gerarContrato()`
   - O contrato gerado estará disponível na URL retornada
   - Consulte o histórico de versões usando `obterHistoricoContratos()`

3. **Gestão de Contratos**:
   - Liste todos os contratos vigentes usando `listarContratosVigentes()`
   - Filtre por modelo específico passando o ID do modelo
   - Acesse o histórico de versões de um contrato específico usando `obterHistoricoContratos()`

4. **Teste de Queries**:
   - Use `testarQuery()` para testar suas queries SQL antes de criar o modelo
   - Isso ajuda a garantir que as queries retornem os dados esperados

## Observações Importantes

1. **Formato de Parâmetros**:
   - Use `:parametro` nas queries SQL
   - Envie os parâmetros como um objeto com as chaves correspondentes
   - Exemplo: `{ id_cliente: 12345 }` para `:id_cliente`

2. **Versionamento de Contratos**:
   - O sistema mantém automaticamente um histórico de todas as versões geradas para um contrato
   - Cada nova versão gerada recebe um número incremental (v1, v2, v3...)
   - Apenas a versão mais recente é marcada como "ativa"
   - Os nomes dos arquivos incluem o número da versão: `Contrato_Tipo_hash_v1.docx`
   - Você pode obter todo o histórico usando o endpoint `/api/contratos/historico/:id`

3. **Cache de Contratos**:
   - Os contratos são cacheados para evitar regeneração desnecessária
   - Use `forcarRegeneracao: true` para forçar uma nova geração
   - Ao forçar regeneração, uma nova versão será criada no histórico

4. **Tratamento de Erros**:
   - Todos os exemplos incluem tratamento de erros básico
   - Verifique o status da resposta e o corpo do erro para mais detalhes

5. **Tipos TypeScript**:
   - Os exemplos incluem tipos TypeScript para melhor integração
   - Ajuste os tipos conforme necessário para seu projeto

6. **Segurança**:
   - O endpoint de teste de queries deve ser usado apenas em ambiente de desenvolvimento
   - Valide todos os dados de entrada antes de enviar para a API

7. **Tamanho de Arquivo**:
   - Considere o tamanho do arquivo ao fazer upload de templates
   - O contrato gerado pode ter tamanho variável dependendo dos dados

8. **Visualização**:
   - Os contratos gerados podem ser visualizados diretamente no navegador
   - Considere implementar um visualizador de PDF para melhor experiência do usuário
