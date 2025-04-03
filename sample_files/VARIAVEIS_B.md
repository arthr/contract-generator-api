### 🔹 **Variáveis simples (`{variavel}`)**

- `{principal.cedente}`
- `{principal.data_contrato | dateToExtenso}`
- `{principal.logradouro}`
- `{principal.ender}`
- `{principal.numero}`
- `{principal.compl}`
- `{principal.bairro}`
- `{principal.cidade}`
- `{principal.estado}`
- `{principal.cep}`
- `{principal.cgc}`
- `{principal.telefone}`
- `{principal.email}`
- `{principal.hoje | dateToExtenso}`

---

### 🔹 **Blocos de repetição (`{#lista}` e `{/lista}`)**

- `{#devedores}` ... `{/devedores}`
- `{#representantes}` ... `{/representantes}`

---

### 🔹 **Condicionais (`{#cond}` ... `{/cond}`)**

- `{#hasCompl}` ... `{/hasCompl}`
- `{#hasEmail}` ... `{/hasEmail}`
- `{#isFisica}` ... `{/isFisica}`
- `{#isJuridica}` ... `{/isJuridica}`
- `{#principal.hasCompl}` ... `{/principal.hasCompl}`

---

### 🔹 **Variáveis internas a blocos (dentro de `{#devedores}`, `{#representantes}`, etc.)**

- `{nome}`
- `{nacionalidade}`
- `{estadocivil}`
- `{rg}`
- `{cgc}`
- `{logradouro}`
- `{ender}`
- `{numero}`
- `{compl}`
- `{bairro}`
- `{cidade}`
- `{estado}`
- `{cep}`
- `{email}`