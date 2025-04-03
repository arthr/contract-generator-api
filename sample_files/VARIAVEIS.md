# Documentação de Variáveis

## Variáveis Simples

Substituições diretas, com dados únicos:
- `{principal.nome_cedente}`
- `{principal.cnpj_cedente}`
- `{principal.endereco_cedente}`
- `{principal.nome_cessionario}`
- `{principal.cnpj_cessionario}`
- `{principal.endereco_cessionario}`
- `{principal.data_assinatura}`
- `{principal.valor_total}`
- `{principal.data_pagamento}`
- `{principal.data_vigencia}`

---

## Variáveis de Lista

### Itens com Estrutura Simples

- `{#titulos} … {/}`
  - `{cedente}`
  - `{sacado}`
  - `{valor}`
  - `{vencimento}`
  - `{documento}`
  - `{modalidade}`
  - `{situação}`

### Lista com Estrutura Textual

- `{#declaracoes} … {/declaracoes}`
  - `{descricao}`

---

## Consultas SQL

### Principal

```sql
SELECT
    'ACME S.A.' AS [nome_cedente],
    '12.345.678/0001-99' AS [cnpj_cedente],
    'Rua das Laranjeiras, 123, São Paulo/SP' AS [endereco_cedente],
    'Empresa XYZ Ltda.' AS [nome_cessionario],
    '98.765.432/0001-00' AS [cnpj_cessionario],
    'Av. Brasil, 456, Rio de Janeiro/RJ' AS [endereco_cessionario],
    '2025-04-02' AS [data_assinatura],
    '50000.00' AS [valor_total],
    '2025-04-10' AS [data_pagamento],
    '2025-04-03' AS [data_vigencia];
```

### Títulos (Duplicatas e Notas Promissórias)

```sql
SELECT
    'ACME S.A.' AS cedente,
    'Cliente A' AS sacado,
    '15000.00' AS valor,
    '2025-05-01' AS vencimento,
    'NF12345' AS documento,
    'Duplicata' AS modalidade,
    'Em aberto' AS situação
UNION ALL
SELECT
    'ACME S.A.', 'Cliente B', '35000.00', '2025-06-10', 'NF54321', 'Nota Promissória', 'Quitado';
```

### Declarações

```sql
SELECT 'Os créditos são legítimos e livres de ônus.' AS descricao
UNION ALL
SELECT 'O Cedente está autorizado a realizar esta cessão.';
```