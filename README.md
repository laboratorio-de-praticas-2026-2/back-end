# Portal Contábil

O **Portal Contábil** é uma plataforma digital voltada à gestão contábil, fiscal e tributária de pessoas físicas e jurídicas.

A proposta é reunir, em um único ambiente, a consulta de obrigações, a solicitação de serviços e a comunicação entre clientes e o escritório de contabilidade.

Projeto acadêmico desenvolvido pelas turmas da **FATEC Registro**, no **Laboratório de Práticas 2026/2**.

> **Projeto em desenvolvimento.** Os recursos apresentados abaixo descrevem o escopo da plataforma e estão sendo implementados gradualmente.

---

## Funcionalidades

### Catálogo de serviços

Vitrine pública com informações sobre os serviços oferecidos pelo escritório, como:

* Abertura de empresa;
* Contabilidade mensal;
* Folha de pagamento;
* Declaração de Imposto de Renda.

### Portal do cliente

Cadastro de pessoas físicas e jurídicas, autenticação e acesso às solicitações, aos documentos e ao andamento dos serviços vinculados ao cliente.

### Obrigações fiscais

Consulta de guias, valores, vencimentos e situação das obrigações, incluindo:

* DAS;
* DARF;
* INSS;
* FGTS;
* Imposto de Renda.

As informações são apresentadas conforme os dados disponibilizados no sistema.

### Atendimento

Recursos destinados à comunicação entre clientes e o escritório, incluindo:

* Agendamento de reuniões;
* Informações de contato;
* Chat para atendimento.

### Painel administrativo

Gerenciamento de:

* Serviços;
* Descrições;
* Honorários;
* Anúncios;
* Perfis de usuários.

Os serviços ativos cadastrados no painel administrativo alimentam a vitrine pública da plataforma.

### Indicadores e relatórios

Dashboard com métricas relacionadas à operação, além de recursos como:

* Geração de relatórios;
* Geração de recibos em PDF;
* Simuladores de tributos;
* Simuladores de parcelamentos.

### Conteúdo e notificações

A plataforma também poderá disponibilizar:

* Blog;
* Perguntas frequentes;
* Mapa de parceiros;
* Alertas de vencimentos;
* Recomendações de serviços conforme o perfil do cliente.

---

## Arquitetura

A aplicação é organizada em repositórios separados:

| Componente     | Responsabilidade                             | Repositório |
| -------------- | -------------------------------------------- | ----------- |
| Frontend       | Interface web, navegação e consumo da API.   | `front-end` |
| Backend        | API, regras de negócio e controle de acesso. | `back-end`  |
| Banco de dados | Estrutura e configuração da persistência.    | `database`  |

O frontend se comunica com a API, que processa as requisições e realiza as operações no banco de dados.

A aplicação é dividida em três áreas principais:

* **Vitrine pública:** apresenta o catálogo de serviços;
* **Portal do cliente:** reúne informações individuais de cada cliente;
* **Painel administrativo:** permite gerenciar os dados e recursos da plataforma.

---

## Tecnologias

### Frontend

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

![Tailwind_CSS](https://img.shields.io/badge/Tailwind_CSS-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=06B6D4)
\

### Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

API desenvolvida em NestJS, utilizando o adaptador Express.

### Banco de dados e design

![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

![Figma](https://img.shields.io/badge/Figma-000000?style=for-the-badge&logo=figma&logoColor=F24E1E)

MySQL é o banco previsto no projeto. As instruções de configuração estão no repositório de banco de dados.


Qualidade de código

**Frontend**

* ESLint.

**Backend**

* Oxlint;
* Prettier;
* Vitest;
* Supertest.

---

## Requisitos

Para executar o projeto, é necessário possuir:

* Git;
* Node.js;
* npm;
* Banco de dados configurado para os recursos que dependem de persistência;
* Docker e Docker Compose, caso a configuração de ambiente utilizada exija containers.

Consulte as configurações de cada repositório para verificar a versão do Node.js adotada e os requisitos específicos de cada ambiente.

---

## Como executar

### 1. Clonar os repositórios

Em uma pasta de sua preferência, execute:

```bash
git clone https://github.com/laboratorio-de-praticas-2026-2/back-end.git
git clone https://github.com/laboratorio-de-praticas-2026-2/front-end.git
git clone https://github.com/laboratorio-de-praticas-2026-2/database.git
```

### 2. Configurar o ambiente

Configure o banco de dados conforme as instruções disponíveis no repositório `database`.

Nos repositórios da aplicação, utilize o arquivo `.env.example`, quando disponível, como referência para criar os arquivos de ambiente esperados pelo código.

A execução de funcionalidades integradas depende da configuração correta:

* Da API;
* Do banco de dados;
* Dos serviços externos utilizados por cada módulo.

### 3. Iniciar o backend

Em um terminal, acesse o repositório do backend:

```bash
cd back-end
npm install
npm run start:dev
```

### 4. Iniciar o frontend

Em outro terminal, acesse o repositório do frontend:

```bash
cd front-end
npm install
npm run dev
```

Acesse no navegador o endereço informado pelo servidor do frontend no terminal.

> Configure o frontend e o backend para utilizarem portas diferentes e ajuste o endereço da API consumida pelo frontend.
>
> Os comandos apresentados iniciam os servidores de desenvolvimento. A configuração do banco de dados e das integrações deve estar concluída para que os respectivos recursos funcionem corretamente.

---

## Variáveis de ambiente

As variáveis de ambiente devem seguir os nomes definidos no código e nos arquivos de exemplo de cada repositório.

Conforme as integrações implementadas, elas podem incluir:

* Conexão com o banco de dados;
* Porta do servidor;
* Endereço da API;
* Credenciais de serviços externos;
* Configurações de autenticação.

### Boas práticas

* Não versione senhas, tokens ou arquivos de ambiente que contenham segredos;
* Mantenha credenciais de banco de dados e autenticação no servidor;
* Utilize arquivos como `.env.example` apenas para documentar os nomes das variáveis necessárias;
* No Next.js, variáveis com o prefixo `NEXT_PUBLIC_` ficam disponíveis no navegador e devem ser utilizadas apenas para informações públicas.

---

## Testes e verificação

### Backend

Dentro do repositório `back-end`:

```bash
npm run lint
npm test
npm run build
```

Para executar os testes ponta a ponta, com o ambiente e a configuração de testes preparados:

```bash
npm run test:e2e
```

### Frontend

Dentro do repositório `front-end`:

```bash
npm run lint
npm run build
```

O frontend ainda não possui um script `test` definido no `package.json` consultado.

A validação da interface deve contemplar:

* Navegação;
* Responsividade;
* Integração com a API;
* Comportamento dos componentes;
* Tratamento de erros nas requisições.

---

## Links

* [Organização do projeto no GitHub](#)
* [Protótipo no Figma](#)
* [Código do frontend](https://github.com/laboratorio-de-praticas-2026-2/front-end)
* [Código do backend](https://github.com/laboratorio-de-praticas-2026-2/back-end)
* [Banco de dados](https://github.com/laboratorio-de-praticas-2026-2/database)

---

## Licença

A licença de distribuição do projeto ainda precisa ser formalizada.

Atualmente, o backend está identificado como `UNLICENSED` em seu arquivo `package.json`.


## Integração das configurações de contato aos fluxos de disparo

Esta implementação integra as configurações de contato ao fluxo de disparo de e-mail.

O fluxo de disparo consulta as informações atuais disponibilizadas pelo `ContatoService` antes de executar o disparo, evitando que o endereço de e-mail do destinatário fique definido de forma estática no serviço de disparo.

### Implementação atual

Como o projeto ainda não possui persistência das configurações de contato em banco de dados nem serviço de envio de e-mail integrado, a funcionalidade foi implementada utilizando dados mockados.

O `ContatoService` mantém temporariamente as informações de contato em memória. O `DisparoService` consulta essas informações no momento de cada disparo e utiliza o e-mail atualmente configurado como destinatário.

Dessa forma, caso o endereço de e-mail seja alterado através da rota de contato, os próximos disparos passam a utilizar automaticamente o novo endereço, sem necessidade de reiniciar a aplicação.

### Rotas utilizadas

#### Atualizar configurações de contato

**Método:** `PUT`

**Rota:**

```text
/contato
```

Exemplo de corpo da requisição:

```json
{
  "email": "novoemail@teste.com"
}
```

A atualização modifica temporariamente os dados de contato mantidos em memória pelo `ContatoService`.

#### Simular disparo de e-mail

**Método:** `POST`

**Rota:**

```text
/disparo
```

O fluxo consulta as configurações de contato no momento da execução e utiliza o e-mail atual como destinatário.

Exemplo de resposta:

```json
{
  "destinatario": "novoemail@teste.com",
  "status": "simulado",
  "mensagem": "Disparo de e-mail simulado com sucesso."
}
```

### Fluxo da implementação

1. As configurações de contato são mantidas temporariamente pelo `ContatoService`.
2. O endereço de e-mail pode ser atualizado através de `PUT /contato`.
3. Ao executar `POST /disparo`, o `DisparoService` consulta o `ContatoService`.
4. O e-mail atualmente configurado é obtido.
5. O endereço obtido é utilizado como destinatário do disparo mockado.

O fluxo pode ser representado da seguinte maneira:

```text
PUT /contato
     ↓
ContatoService
     ↓
configuração atualizada em memória
     ↓
DisparoService
     ↓
POST /disparo
     ↓
disparo mockado utilizando o e-mail atual
```

### Teste do comportamento

A implementação pode ser validada atualizando primeiro o endereço de e-mail:

```text
PUT /contato
```

```json
{
  "email": "novoemail@teste.com"
}
```

Em seguida, ao executar:

```text
POST /disparo
```

o fluxo passa a utilizar:

```text
novoemail@teste.com
```

como destinatário, sem necessidade de reiniciar a aplicação.

Isso demonstra que o destinatário não está definido de forma estática no `DisparoService`. A configuração de contato é consultada novamente no momento da execução do fluxo.

> **Observação:** a persistência em banco de dados e o envio real de e-mails deverão substituir os dados e o disparo mockados quando essas funcionalidades estiverem disponíveis no projeto.
