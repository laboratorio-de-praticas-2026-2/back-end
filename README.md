<p align="center">
  <a href="http://nestjs.com/" target="blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

<p align="center">
  A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.
</p>

<p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
<a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
<a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS.

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observer](https://observer.nestjs.com).
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow NestJS on X and LinkedIn.
- Looking for a job, or have a job to offer? Check out the official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - https://nestjs.com
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

---

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