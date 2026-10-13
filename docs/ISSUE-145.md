# Issue #145 — Integração com Relatórios e Simulador

## 1. Achados da análise (antes de implementar)

1. **O repositório recebido é somente back-end.** Não existe frontend, layout, barra lateral nem cabeçalho de CMS
   para reaproveitar (o módulo `header` serve o cabeçalho do site público e não tem dados de usuário).
2. **Fluxo de relatórios dividido em duas persistências incompatíveis:**
   - `POST /relatorios`, `GET /relatorios`, `GET /relatorios/categorias` → Sequelize, tabela `reports`
     (ID **UUID**, status `PENDENTE|GERADO|FALHA`, coluna `arquivo_url`).
   - `POST /relatorios/generate`, `GET /:id`, `GET /:id/pdf`, `DELETE /:id` e o worker → Prisma, tabela `relatorio`
     (ID **inteiro**, status minúsculo `pendente|gerado|falha`).
   Resultado: um relatório criado pela API nunca podia ser gerado, consultado ou excluído (ID UUID × inteiro).
3. O worker gerava um PDF fixo "Relatório de teste", marcava `pendente` no início e não usava os dados do relatório.
4. `RelatoriosPdfService` não usava `PUPPETEER_EXECUTABLE_PATH` (quebra no Chromium do Dockerfile).
5. `docker-compose.yml` não definia `REDIS_HOST` (a fila apontava para `localhost` dentro do container).
6. Simulador: `parcelas`/`taxaJurosMensal` sem limite superior → `Math.pow` podia gerar `Infinity` (serializado como `null`).

## 2. Decisões

- **Unificação no Sequelize (`reports`)**: é a persistência que já atende criação, listagem, filtros, paginação e os
  status exatos da issue (`PENDENTE/GERADO/FALHA`). Controller, worker e service passaram a usar apenas ela. A tabela
  Prisma `relatorio` deixa de ser usada por este fluxo (nada foi removido do schema Prisma).
  Consequência: `relatorioId` em `POST /relatorios/generate` e os `:id` das rotas agora são **UUID** (validados).
- **PDF com dados reais**: o worker renderiza capa (identidade, período analisado, data de emissão — conforme as telas
  de PDF do Figma) e uma página com nome, categoria, período e descrição cadastrados. Só marca `GERADO` depois de gerar
  **e** enviar ao Cloudinary; qualquer erro marca `FALHA` e relança. Métricas/gráficos das páginas 2–3 do Figma
  não existem no cadastro do relatório e **não foram inventados**.
- **`GET /relatorios/:id/pdf`** devolve 404 enquanto o status não for `GERADO`; o frontend não exibe link nesses casos.
- **Simulador**: fórmula preservada (confirmada pelos testes existentes: `total = subtotal·(1+taxa/100)^(parcelas−1)`).
  Adicionados limites `parcelas ≤ 360` e `taxaJurosMensal ≤ 100` para evitar overflow; o frontend valida os mesmos limites.
- **Frontend**: JavaScript ES modules sem build/dependências (`web/`), publicado pelo Nest em `/portal/`; roteamento por hash.
  Chamadas HTTP centralizadas em `web/js/http.js` + `web/js/api/relatorios.js`; URL base via `PORTAL_API_BASE_URL`.
- **Categorias do formulário**: a API aceita qualquer texto; a lista sugerida vem do enum `RelatorioCategoria` do projeto,
  mesclada com `GET /relatorios/categorias`.
- **Autenticação**: os endpoints não têm `AuthGuard` hoje; nada foi criado/alterado. O cliente HTTP já aceita `getToken`
  (Bearer) caso a equipe passe a proteger as rotas.

## 3. Arquivos alterados

Back-end: `src/main.ts` (publicação de `web/` e `/portal/config.js`);
`src/modules/relatorios/`: `relatorios.controller.ts`, `relatorios.service.ts`, `relatorios.worker.ts`,
`relatorios.producer.ts`, `relatorios.pdf.service.ts`, `relatorio-template.service.ts`, `dto/simulacao.dto.ts`,
novo `dto/generate-report.dto.ts`.
Testes: reescritos `relatorios.controller.spec.ts`, `relatorios.worker.spec.ts`, `relatorios.producer.spec.ts`
(testavam o fluxo Prisma/ID inteiro); estendidos `relatorios.service.spec.ts`, `relatorio-template.service.spec.ts`;
novo `dto/simulacao.dto.spec.ts`; **removido** `relatorios.worker.integration.spec.ts` (mesmo cenário mockado do worker,
coberto pelo novo `relatorios.worker.spec.ts`, que usa o template real).
Config: `package.json` (`test:web`), `Dockerfile` (fonte para o Chromium), `docker-compose.yml` (Redis), `.env.example`, `README.md`.
Novo frontend: `web/index.html`, `web/css/portal.css`, `web/js/**` (+ `*.test.js`).

## 4. Comandos executados e resultados

| Comando | Resultado |
| --- | --- |
| `npm ping` | **403** — sem acesso à rede neste ambiente; `npm install` não foi possível |
| `node --test "web/js/**/*.test.js"` | **25 testes, 25 aprovados** |
| `node --check` em todos os `web/js/**/*.js` | sem erros de sintaxe |
| Verificação de sintaxe (TypeScript `transpileModule`) dos `.ts` alterados | sem erros de sintaxe |
| Teste de fumaça em Chromium real (Playwright) com a API **interceptada apenas no script de teste** | ver 4.1 |

### 4.1 Fluxos verificados no navegador (API simulada no harness)
Listagem com os 3 status (download só para `GERADO`; "Gerar novamente" só para `FALHA`); busca (`nome=DAS`, página volta a 1);
busca + categoria combinadas; modal com consulta por ID e iframe do PDF real; modal `PENDENTE` com ações desabilitadas;
exclusão (cancelar não envia nada; confirmar envia `DELETE` e a lista é recarregada); formulário (5 erros obrigatórios,
erro de intervalo de datas, `POST /relatorios` seguido de `POST /relatorios/generate`, toast de sucesso);
Simulador (erros de validação, resultado `R$ 1.815,00 / 3x de R$ 605,00` igual ao teste do backend, resultado anterior
removido após falha 500 com mensagem amigável); rota desconhecida; falha de rede com estado de erro e "Tentar novamente".

### 4.2 NÃO executado (precisa ser rodado pela equipe)
`npm ci`, `npm run build`, `npm run lint`, `npm test` (vitest), `npm run test:e2e`, `docker compose up --build`.
Sem `node_modules`/rede, o back-end **não foi compilado nem testado** aqui; as alterações em TypeScript foram escritas
com cuidado e só tiveram a sintaxe verificada. Os specs reescritos/novos do back-end ainda não rodaram.

## 5. Pendências e pontos de atenção

1. Rodar build, lint e testes do back-end; os specs `relatorios.pdf.service.spec.ts` e `pdf-generator.service.spec.ts`
   (pré-existentes) abrem um Chromium real.
2. **Credenciais do Cloudinary, Redis e MySQL** não estavam disponíveis: geração → upload → pré-visualização → exclusão
   de ponta a ponta **não foi validada**.
3. **Pré-existente, verificar:** `PrismaService` usa `process.env.DB_HOST` como connection string do adapter MariaDB
   (com `DB_HOST=127.0.0.1` isso pode impedir o boot). Não foi alterado por estar fora do escopo.
4. **Barra lateral/cabeçalho**: não existiam no repositório. Foram reproduzidos do Figma apenas como moldura de layout:
   itens fora de Relatórios são estáticos (sem rotas), "Sair" não tem ação, e o bloco do usuário mostra "Usuário" porque
   não há fonte de dados de usuário (o "Ryan Davies" do Figma é placeholder). Relatórios foi expandido com o submenu
   **Simulador** para dar acesso à tela. Se existir um layout oficial em outro repositório, basta trocar `web/js/layout.js`.
5. **Simulador**: o Figma enviado não contém tela do Simulador; o formulário segue a linguagem visual das demais telas.
6. Os cards de KPI e o gráfico de rosca da tela "CMS Relatório" do Figma são do dashboard (fora do escopo da issue) e não
   foram criados; as colunas "Tamanho/Débitos" da tabela do Figma não existem na API, então a tabela mostra
   Nome, Categoria, Período, Status e Ações.
7. Datas usam `input type=date` nativo (o Figma mostra calendário em popover).
8. Registros eventualmente existentes na tabela Prisma `relatorio` não são migrados para `reports`.
9. Filtro por período: usa a data de início do relatório entre _De_ e _Até_ (regra já existente em `RelatoriosService.findAll`).
10. `Dockerfile` usa `npm install` mas o repositório tem `package-lock.json` e `pnpm-lock.yaml` (pré-existente); `src/cloudinary`
    e `src/infra/cloudinary` coexistem (pré-existente).
