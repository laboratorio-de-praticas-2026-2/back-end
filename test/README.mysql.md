# Regressão da issue #50: cadastro PF e login

O cadastro PF e o login usam a tabela `usuario`, definida em
`database/prisma/schema.prisma`. O repositório do login também utiliza essa
tabela ao buscar o perfil por ID. Não é necessária migration.

## Executar

1. Inicie o MySQL local e aplique as migrations oficiais pelo repositório
   `database` (`docker compose -f compose.dba.yml up -d`).
2. Configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` no
   `.env` do backend para esse banco local.
3. Execute `npm run test:integration:mysql` na pasta `back-end`.

O teste compila o backend para preservar os metadados de injeção do Nest e
inicia os módulos reais de cadastro e autenticação. Usa HTTP e MySQL sem mocks,
sem `sync` e sem alterar a estrutura do banco. Só aceita host local.

Verifica cadastro PF (201), persistência em `usuario`, hash bcrypt, login (200),
normalização do e-mail, token válido em `/auth/me`, senha incorreta (401),
duplicidade (409), logout e rejeição do token revogado. Usa e-mail exclusivo e
remove o registro criado ao terminar, inclusive se uma asserção falhar.

## Validação desta correção

- Compilação do backend concluída sem erros.
- Dois testes novos do repositório de autenticação passaram.
- Suíte geral: 94 testes passaram e um excedeu o tempo limite no Cloudinary.
  Na repetição isolada, os dois testes do Cloudinary passaram.
- Lint dos arquivos alterados e `git diff --check` passaram.
- Na retomada, a suíte com um processo teve 75 testes aprovados e 22 não
  executados por timeout de 10 segundos no `beforeAll` da autenticação HTTP.
  Os 22 passaram na repetição isolada com
  `node node_modules/vitest/vitest.mjs run src/modules/auth/auth.controller.spec.ts --maxWorkers=1 --hookTimeout=60000 --testTimeout=30000`.

### Validação em banco real — 27/09/2026

O teste de integração passou (1 teste, 0 falhas) em MariaDB 10.4.32, com o
dialeto MySQL do Sequelize, usando uma instância temporária em
`127.0.0.1:3307` e o banco isolado `issue50_integration`. As cinco migrations
SQL oficiais de `database/prisma/migrations` foram aplicadas integralmente,
em ordem, sem alterações. O `.env` do projeto foi preservado; a conexão foi
sobrescrita apenas no processo de teste.

Resultados confirmados:

- `POST /clientes`: 201; usuário persistido em `usuario`, com hash bcrypt.
- `POST /auth/login`: 200; o mesmo usuário recebeu um token Bearer válido.
- `GET /auth/me`: 200; retornou o ID e o e-mail cadastrados.
- Senha incorreta: 401; cadastro duplicado: 409.
- Logout: 204; reutilização do token revogado: 401.
- Ao final, `SELECT COUNT(*) FROM usuario` retornou 0, confirmando a limpeza.

A instância temporária foi encerrada e seus arquivos removidos após o teste.
A validação específica em
MySQL 8 via Docker não foi executada: o Docker Desktop continua falhando ao
iniciar o WSL (`Wsl/Service/CreateInstance/CreateVm/0x800705b4`). O resultado
acima comprova o fluxo em MariaDB real, sem mocks; não representa uma execução
em MySQL 8. A #50 permanece para conferência do arquiteto antes do fechamento.
