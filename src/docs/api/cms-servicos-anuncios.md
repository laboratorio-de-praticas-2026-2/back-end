# API CMS --- Serviços e Anúncios

> **Contrato parcial de integração Front-end ↔ Back-end**\
> **Versão:** 0.1.0\
> **Status:** Em desenvolvimento --- Serviços implementado; testes
> integrados ainda pendentes\
> **Atualização:** 24/09/2026

------------------------------------------------------------------------

## Sumário

1.  [Objetivo](#1-objetivo)
2.  [Status atual](#2-status-atual)
3.  [Referência rápida](#3-referência-rápida)
4.  [Contrato de Serviço](#4-contrato-de-serviço)
5.  [Endpoints](#5-endpoints)
6.  [Fluxos funcionais](#6-fluxos-funcionais)
7.  [Erros](#7-erros)
8.  [Referências no código](#8-referências-no-código)
9.  [Exemplos para o Front](#9-exemplos-para-o-front)
10. [Pendências](#10-pendências)
11. [Publicidade](#11-publicidade)
12. [Histórico](#12-histórico)

------------------------------------------------------------------------

## 1. Objetivo

Este documento apresenta o contrato parcial da API do **CMS de Serviços
e Anúncios**, focado no que o Front-end precisa para iniciar a
integração.

Nesta versão, o módulo de **Serviços** possui as operações principais
implementadas. **Publicidade/Anúncios ainda está em desenvolvimento.**

O Front já pode iniciar a integração de:

-   Vitrine de Serviços;
-   listagem administrativa;
-   detalhe de serviço;
-   cadastro;
-   edição;
-   pausa e reativação;
-   remoção.

> **Importante:** as rotas foram implementadas no Back-end, mas o ciclo
> completo de testes com banco e Front ainda está em andamento.
> Divergências encontradas durante a integração devem ser reportadas ao
> Back-end antes de o Front criar tratamentos definitivos.

------------------------------------------------------------------------

## 2. Status atual

  Funcionalidade                      Status
  ----------------------------------- ----------------------------------------------
  Serviços ativos para a Vitrine      ✅ Implementado
  Serviços ativos + pausados no CMS   ✅ Implementado
  Buscar por ID                       ✅ Implementado
  Cadastrar                           ✅ Implementado
  Editar                              ✅ Implementado
  Pausar / reativar                   ✅ Implementado
  Remover                             ⚠️ Implementado; vínculos ainda em validação
  Publicidade/Anúncios                🚧 Em desenvolvimento
  Testes integrados completos         🚧 Pendente

------------------------------------------------------------------------

## 3. Referência rápida

> A URL base depende do ambiente. Localmente, a aplicação usa a porta
> `3333` quando `PORT` não está definida.

  Método     Endpoint                       Função
  ---------- ------------------------------ -------------------------------
  `GET`      `/servicos`                    Vitrine: lista somente ativos
  `GET`      `/servicos/admin`              CMS: lista ativos e pausados
  `GET`      `/servicos/admin/:id`          CMS: busca um serviço
  `POST`     `/servicos/admin`              Cadastra serviço
  `PATCH`    `/servicos/admin/:id`          Edita dados
  `PATCH`    `/servicos/admin/:id/status`   Pausa ou reativa
  `DELETE`   `/servicos/admin/:id`          Remove serviço

### Regra central

``` text
ativo = true
→ aparece em GET /servicos
→ pode ser exibido na Vitrine

ativo = false
→ NÃO aparece em GET /servicos
→ continua em GET /servicos/admin
→ pode ser reativado no CMS
```

------------------------------------------------------------------------

## 4. Contrato de Serviço

Representação esperada na resposta:

``` ts
interface Servico {
  id: number;
  nome: string;
  descricao: string | null;
  valorBase: string | null;
  prazoEstimadoDias: number | null;
  ativo: boolean;
}
```

Exemplo:

``` json
{
  "id": 5,
  "nome": "Declaração IRPF",
  "descricao": "Elaboração e transmissão da declaração",
  "valorBase": "499.90",
  "prazoEstimadoDias": 7,
  "ativo": true
}
```

### Atenção: `valorBase`

Na entrada de cadastro/edição, enviar como número:

``` json
{ "valorBase": 499.90 }
```

Na resposta, por ser um campo decimal no Back-end, ele pode chegar como
string:

``` json
{ "valorBase": "499.90" }
```

O Front não deve depender de `valorBase` ser retornado como `number` até
o contrato final ser validado.

------------------------------------------------------------------------

# 5. Endpoints

## 5.1 `GET /servicos`

Lista somente serviços ativos. É a rota indicada para a **Vitrine**.

### Resposta esperada

``` json
[
  {
    "id": 1,
    "nome": "Contabilidade Mensal",
    "descricao": "Serviço de acompanhamento contábil",
    "valorBase": "350.00",
    "prazoEstimadoDias": 30,
    "ativo": true
  }
]
```

**Regra:** serviço pausado não deve aparecer.

------------------------------------------------------------------------

## 5.2 `GET /servicos/admin`

Lista todos os serviços para o CMS, incluindo ativos e pausados.

``` json
[
  {
    "id": 1,
    "nome": "Contabilidade Mensal",
    "descricao": "Serviço de acompanhamento contábil",
    "valorBase": "350.00",
    "prazoEstimadoDias": 30,
    "ativo": true
  },
  {
    "id": 2,
    "nome": "Abertura de Empresa",
    "descricao": "Serviço de abertura empresarial",
    "valorBase": "890.00",
    "prazoEstimadoDias": 15,
    "ativo": false
  }
]
```

Sugestão de interface:

``` text
ativo = true  → "Ativo"   → ação "Pausar"
ativo = false → "Pausado" → ação "Reativar"
```

------------------------------------------------------------------------

## 5.3 `GET /servicos/admin/:id`

Busca um serviço específico.

``` http
GET /servicos/admin/5
```

### Resposta esperada

``` json
{
  "id": 5,
  "nome": "Declaração IRPF",
  "descricao": "Elaboração e transmissão da declaração",
  "valorBase": "499.90",
  "prazoEstimadoDias": 7,
  "ativo": true
}
```

Se não existir, a API está preparada para responder `404`.

------------------------------------------------------------------------

## 5.4 `POST /servicos/admin`

Cadastra um serviço.

### Body

``` json
{
  "nome": "Consultoria Tributária",
  "descricao": "Análise e orientação tributária",
  "valorBase": 450.00,
  "prazoEstimadoDias": 5
}
```

  Campo                 Tipo         Obrigatório Observação
  --------------------- ---------- ------------- --------------------------
  `nome`                `string`             Sim Nome do serviço
  `descricao`           `string`             Não Descrição
  `valorBase`           `number`             Não \>= 0
  `prazoEstimadoDias`   `number`             Não \>= 0
  `ativo`               ---           Não enviar Novo serviço nasce ativo

Fluxo:

``` text
Cadastrar
   ↓
ativo = true
   ↓
GET /servicos passa a retorná-lo
   ↓
Vitrine pode exibir
```

------------------------------------------------------------------------

## 5.5 `PATCH /servicos/admin/:id`

Edita parcialmente um serviço. **Não é necessário reenviar todos os
campos.**

Exemplo:

``` http
PATCH /servicos/admin/5
```

``` json
{
  "valorBase": 550.00
}
```

Campos aceitos:

  Campo                 Tipo         Obrigatório
  --------------------- ---------- -------------
  `nome`                `string`             Não
  `descricao`           `string`             Não
  `valorBase`           `number`             Não
  `prazoEstimadoDias`   `number`             Não

O campo `ativo` não deve ser alterado aqui. Use a rota de status.

------------------------------------------------------------------------

## 5.6 `PATCH /servicos/admin/:id/status`

Altera exclusivamente a disponibilidade.

### Pausar

``` json
{ "ativo": false }
```

### Reativar

``` json
{ "ativo": true }
```

  Valor     Resultado
  --------- -----------------------------
  `true`    disponível para a Vitrine
  `false`   pausado e oculto da Vitrine

------------------------------------------------------------------------

## 5.7 `DELETE /servicos/admin/:id`

Solicita a remoção.

``` http
DELETE /servicos/admin/5
```

Resposta prevista:

``` json
{
  "message": "Serviço removido com sucesso."
}
```

### Atenção

A regra final para serviços que já possuem registros relacionados ainda
está em validação.

``` text
sem vínculos → expectativa: remover

com vínculos → comportamento final ainda será consolidado
```

O Front não deve assumir ainda que todo serviço poderá ser removido
definitivamente.

------------------------------------------------------------------------

# 6. Fluxos funcionais

## Vitrine

``` mermaid
flowchart LR
    A[Front - Vitrine] -->|GET /servicos| B[API]
    B --> C{Ativo?}
    C -->|Sim| D[Retorna]
    C -->|Não| E[Não retorna]
    D --> F[Front exibe]
```

## CMS

``` mermaid
flowchart LR
    A[Front - CMS] -->|GET /servicos/admin| B[API]
    B --> C[Ativos + pausados]
    C --> D[Front monta gerenciamento]
```

## Cadastro → Vitrine

``` mermaid
flowchart LR
    A[CMS] -->|POST| B[API]
    B --> C[Novo serviço ativo]
    C --> D[Persistido]
    D --> E[GET /servicos]
    E --> F[Vitrine pode exibir]
```

## Pausar

``` mermaid
flowchart LR
    A[CMS] -->|ativo false| B[PATCH status]
    B --> C[Registro pausado]
    C --> D[GET /servicos]
    D --> E[Não é retornado]
    E --> F[Vitrine deixa de exibir]
```

## Reativar

``` mermaid
flowchart LR
    A[CMS] -->|ativo true| B[PATCH status]
    B --> C[Registro ativo]
    C --> D[GET /servicos]
    D --> E[Volta a ser retornado]
```

## Editar

``` mermaid
flowchart LR
    A[CMS] -->|PATCH dados| B[API]
    B --> C[Atualiza campos enviados]
    C --> D[Persiste]
    D --> E[Próxima consulta recebe atualização]
```

------------------------------------------------------------------------

# 7. Erros

O Front deve priorizar o **status HTTP**, e não depender do texto exato
da mensagem.

  Status   Uso esperado
  -------- ------------------------------------------------------
  `200`    Consulta/alteração concluída
  `201`    Cadastro concluído
  `400`    Dados/parâmetros inválidos
  `404`    Serviço não encontrado
  `409`    Possível tratamento futuro para conflito de exclusão
  `500`    Erro interno não tratado

Sugestão:

``` text
400 → manter formulário e informar dados inválidos
404 → informar registro inexistente / atualizar tela
2xx → atualizar estado da interface
```

------------------------------------------------------------------------

# 8. Referências no código

Os pontos de integração estão comentados diretamente no código.

### Rotas

``` text
src/modules/cms/servicos/servicos.controller.ts
```

Referência principal para localizar todas as rotas. Procurar comentários
com **FRONT**, **FRONT ADMINISTRATIVO** e **CMS**.

### Cadastro

``` text
src/modules/cms/servicos/dto/create-servico.dto.ts
```

Campos aceitos e validações do cadastro.

### Edição

``` text
src/modules/cms/servicos/dto/update-servico.dto.ts
```

Campos aceitos na edição.

### Status

``` text
src/modules/cms/servicos/dto/update-status-servico.dto.ts
```

Contrato de pausa/reativação.

### Comportamento

``` text
src/modules/cms/servicos/servicos.service.ts
```

Referência complementar para listagem, busca, cadastro, edição, status e
remoção.

### Modelo

``` text
src/modules/cms/servicos/servico.model.ts
```

Estrutura persistida do serviço.

### Validação global

``` text
src/main.ts
```

Configuração global de validação dos DTOs. Este ponto ainda precisa ser
validado após a consolidação das alterações da `develop`.

> Para o Front, as referências principais são: **este documento +
> Controller + DTOs**.

------------------------------------------------------------------------

# 9. Exemplos para o Front

> Exemplos genéricos com `fetch`. Adaptar ao cliente HTTP utilizado no
> projeto.

## Vitrine

``` ts
const response = await fetch(`${API_URL}/servicos`);
const servicos = await response.json();
```

## CMS

``` ts
const response = await fetch(`${API_URL}/servicos/admin`);
const servicos = await response.json();
```

## Cadastro

``` ts
await fetch(`${API_URL}/servicos/admin`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'Consultoria Tributária',
    descricao: 'Análise e orientação tributária',
    valorBase: 450,
    prazoEstimadoDias: 5
  })
});
```

## Edição

``` ts
await fetch(`${API_URL}/servicos/admin/5`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ valorBase: 550 })
});
```

## Pausar

``` ts
await fetch(`${API_URL}/servicos/admin/5/status`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ativo: false })
});
```

## Reativar

``` ts
await fetch(`${API_URL}/servicos/admin/5/status`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ativo: true })
});
```

## Remover

``` ts
await fetch(`${API_URL}/servicos/admin/5`, {
  method: 'DELETE'
});
```

> Autenticação/autorização não está descrita nesta versão porque esse
> contrato não foi definido no escopo documentado até aqui.

------------------------------------------------------------------------

# 10. Pendências

## Back-end

-   [ ] Testar o ciclo completo contra o banco.
-   [ ] Validar `DELETE` com relacionamentos.
-   [ ] Definir tratamento amigável de conflito de exclusão, se
    necessário.
-   [ ] Consolidar `ValidationPipe` com a `develop`.
-   [ ] Confirmar contrato final de `valorBase`.
-   [ ] Validar autenticação/autorização das rotas administrativas.
-   [ ] Implementar Publicidade/Anúncios.
-   [ ] Atualizar este contrato após os testes.

## Front-end --- validação antecipada

-   [ ] Conferir formato de `GET /servicos`.
-   [ ] Conferir formato de `GET /servicos/admin`.
-   [ ] Testar cadastro.
-   [ ] Testar edição parcial.
-   [ ] Testar pausa e reativação.
-   [ ] Confirmar que pausado some da Vitrine.
-   [ ] Confirmar que reativado volta à Vitrine.
-   [ ] Testar `404`.
-   [ ] Reportar comportamento do `DELETE`.

Ao reportar divergência, enviar:

``` text
Endpoint:
Método:
Body enviado:
Status recebido:
Resposta recebida:
Comportamento esperado:
```

------------------------------------------------------------------------

# 11. Publicidade

Publicidade/Anúncios pertence à mesma issue, mas **não deve ser
integrado ainda com base apenas nesta previsão**.

Estrutura prevista no banco:

``` text
Publicidade
├── id
├── titulo
├── conteudo
├── url_imagem
└── ativo
```

A intenção é seguir fluxo semelhante:

``` text
CMS
├── listar
├── cadastrar
├── editar
├── pausar
├── reativar
└── remover

Área de Publicidade
└── consumir somente anúncios disponíveis
```

Aguardar a próxima versão deste documento com os endpoints efetivamente
implementados.

------------------------------------------------------------------------

# 12. Histórico

  -----------------------------------------------------------------------
  Versão                  Data                    Alteração
  ----------------------- ----------------------- -----------------------
  `0.1.0`                 24/09/2026              Contrato parcial de
                                                  Serviços para início da
                                                  integração Front-end

  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Atalho para começar agora

``` text
VITRINE
GET /servicos
→ renderizar o retorno
```

``` text
CMS
GET /servicos/admin
→ renderizar ativos + pausados
→ usar "ativo" para definir estado e ações
```

``` text
FORMULÁRIO
POST  /servicos/admin
PATCH /servicos/admin/:id
```

``` text
STATUS
PATCH /servicos/admin/:id/status

{ "ativo": false } → pausar
{ "ativo": true }  → reativar
```

Referências rápidas no código:

``` text
src/modules/cms/servicos/servicos.controller.ts
src/modules/cms/servicos/dto/
src/modules/cms/servicos/servicos.service.ts
```
