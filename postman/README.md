# Testes das rotas existentes

Importe `portal-contabil.postman_collection.json` e `local.postman_environment.json` no Postman. Selecione o ambiente **Portal Contabil - Local**, ajuste `baseUrl` para a instancia desejada e execute a colecao inteira no Collection Runner, na ordem original, com uma iteracao.

O ambiente usa `http://127.0.0.1:3333`. A validacao desta implementacao usa uma instancia separada na porta 3334, iniciada a partir do build atualizado.

## Preparar a API

Na pasta `back-end`, configure `.env` conforme `.env.example`, apontando para o MySQL local com as migrations existentes aplicadas. As credenciais nao fazem parte da colecao.

```powershell
npm ci
npm run build
npm run start
```

Para usar outra porta no PowerShell:

```powershell
$env:PORT = '3334'
node dist/main.js
```

## Executar pelo Newman

Na pasta `back-end`:

```powershell
npm exec --yes --package=newman -- newman run postman/portal-contabil.postman_collection.json -e postman/local.postman_environment.json --timeout-request 30000
```

Para a instancia na porta 3334 e um relatorio JSON:

```powershell
npm exec --yes --package=newman -- newman run postman/portal-contabil.postman_collection.json -e postman/local.postman_environment.json --env-var baseUrl=http://127.0.0.1:3334 --timeout-request 30000 --reporters cli,json --reporter-json-export postman/resultado-local.json
```

Newman e o executor de colecoes Postman pela linha de comando: [documentacao oficial](https://learning.postman.com/docs/reference/newman-cli/installing-running-newman/). As verificacoes usam [scripts de teste do Postman](https://learning.postman.com/docs/tests-and-scripts/write-scripts/test-examples).

## Cobertura

| Rota | Verificacao |
| --- | --- |
| GET / | Disponibilidade e resposta Hello World! |
| GET /contato | Leitura e confirmacao da atualizacao |
| PUT /contato | Atualizacao parcial, email invalido, campo desconhecido e restauracao |
| POST /disparo | Destinatario atual e status simulado |
| POST /mensagem | Criacao, assunto invalido, campos ausentes e tipo incorreto |
| GET /mensagem | Presenca da mensagem criada no historico |
| POST /clientes | Criacao sem senha na resposta, duplicidade de email/CPF e dados invalidos |

Sao 20 requisicoes. O fluxo guarda e restaura o contato original. Se interromper a execucao, execute a requisicao **Restaurar contato original** na mesma sessao. A mensagem fica no historico em memoria e um cliente de teste fica no banco local; nao existem endpoints de exclusao. O cadastro gera email unico e CPF sintetico por execucao. Os disparos implementados sao simulados e nao enviam emails reais.

## Analise do projeto

- Backend NestJS com Sequelize para cadastro de clientes; projeto separado `database` usa Prisma para schema/migrations do MySQL.
- Contato e historico de mensagens usam armazenamento em memoria.
- Controllers de dashboard, notificacao e recomendacao ainda nao possuem metodos HTTP; nao ha rotas desses recursos para testar.
- O ValidationPipe global usa whitelist e rejeita campos desconhecidos. Os DTOs de contato e mensagem receberam decorators de validacao para aceitar seus campos validos e rejeitar dados incorretos.
- O Observe esta configurado com credenciais de exemplo em `src/app.module.ts`; a instancia local registrou erro de telemetria 401. Isso nao impediu a inicializacao da API.
- O script `test` do projeto `database` e apenas um placeholder que retorna erro; nao representa uma suite de testes de banco.

## Testes do backend

```powershell
npm test -- --maxWorkers=2 --hookTimeout=30000
npm run test:e2e -- --maxWorkers=1 --hookTimeout=60000
npm run build
npm run lint
```

Na primeira execucao, tres testes unitarios e o e2e excederam o timeout dos hooks. A repeticao dos 31 testes existentes com dois workers passou. Os novos testes em `src/modules/contato/dto/validacao.spec.ts` exercitam o mesmo ValidationPipe global utilizado pela API.

## Resultado em 24/09/2026

- Testes existentes: 31/31 aprovados com dois workers.
- Novos testes de validacao: 8/8 aprovados em execucao separada.
- Integracao e2e: 1/1 aprovado com timeout de inicializacao de 60 segundos.
- Compilacao e lint: concluidos sem erros.
- Newman 6.2.2: 20 requisicoes e 29 verificacoes aprovadas, nenhuma falha, contra `http://127.0.0.1:3334` e MySQL local real. Relatorio detalhado em `resultado-local.json` (ignorado pelo Git).

O primeiro teste da colecao revelou que o CPF precisa ser formatado como `000.000.000-00`; o gerador da colecao foi ajustado e a execucao completa passou. Um cliente sintetico foi criado no banco local. O contato original foi restaurado. A instancia temporaria da porta 3334 foi encerrada apos a validacao; inicie/reinicie seu backend para carregar os DTOs atualizados antes de repetir os testes.
