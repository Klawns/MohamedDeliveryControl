# Coupling & Dependency Analysis Report

Esta análise aprofundada foi focada na descoberta de acoplamento excessivo (tight coupling), vazamento de abstração (leaky abstractions) e falhas no fluxo de responsabilidades dos módulos do NestJS. Abaixo estão as descobertas e propostas de solução.

## 1. Falsas Dependências Circulares (`forwardRef` Abuse)

**Problema:** Foi identificado um abuso prático do padrão `forwardRef()` na importação de módulos, criando uma falsa sensação de acoplamentos complexos no grafo de dependências do NestJS.
Isso geralmente esconde a real arquitetura do projeto.

- **AuthModule** utiliza `forwardRef(() => UsersModule)`, [SubscriptionsModule](file:///a:/Projetos/Mohamed/apps/api/src/subscriptions/subscriptions.module.ts#7-19) e [RidesModule](file:///a:/Projetos/Mohamed/apps/api/src/rides/rides.module.ts#8-21). No entanto, **nenhum** desses módulos tenta importar o [AuthModule](file:///a:/Projetos/Mohamed/apps/api/src/auth/auth.module.ts#14-33) de volta (não há ciclo).
- **PaymentsModule** utiliza `forwardRef(() => SubscriptionsModule)` e [UsersModule](file:///a:/Projetos/Mohamed/apps/api/src/users/users.module.ts#7-19), quando também não há um ciclo.
- **SettingsModule** utiliza `forwardRef(() => AuthModule)`.

**Impacto:**
- Prejudica a legibilidade: um desenvolvedor novo assume que esses módulos dependem fortemente um do outro, aumentando o medo de refatorar.
- Pequeno delay sintático na compilação e bootstraping do framework.

**Solução Aplicável:**
- Remover todos os wrappers `forwardRef(() => ...)` pendentes desses arrays e transformá-los em imports brutos (e.g., `Imports: [UsersModule]`).

## 2. Acoplamento de Domínio no PaymentsModule (Leaky Abstraction)

**Problema:** O módulo de pagamentos ([PaymentsModule](file:///a:/Projetos/Mohamed/apps/api/src/payments/payments.module.ts#19-51)) tenta reger o que acontece após um pagamento. Ele não apenas lida com o Webhook e enfileiramento (BullMQ), mas dentro do seu worker ([WebhookWorker](file:///a:/Projetos/Mohamed/apps/api/src/payments/queue/webhook.worker.ts#14-52)), injeta o [SubscriptionsService](file:///a:/Projetos/Mohamed/apps/api/src/subscriptions/subscriptions.service.ts#4-50) e ativa a assinatura do usuário diretamente utilizando [updateOrCreate()](file:///a:/Projetos/Mohamed/apps/api/src/subscriptions/subscriptions.service.ts#23-45).

**Por que isso quebra Acoplamento e Coesão:**
- O [PaymentsService](file:///a:/Projetos/Mohamed/apps/api/src/payments/payments.service.ts#25-181) já implementa emitters (via `@nestjs/event-emitter`) disparando eventos genéricos do tipo `PaymentEvents.WEBHOOK_RECEIVED`.
- Essa atitude seria a arquitetura Event-Driven (EDA) perfeita para desacoplamento! Porém, o Listener desse evento ([PaymentEventsListener](file:///a:/Projetos/Mohamed/apps/api/src/payments/listeners/payment-events.listener.ts#11-44)) está **dentro do próprio [PaymentsModule](file:///a:/Projetos/Mohamed/apps/api/src/payments/payments.module.ts#19-51)**. E o Listener insere a rotina no worker local. Depois, o Worker usa [SubscriptionsService](file:///a:/Projetos/Mohamed/apps/api/src/subscriptions/subscriptions.service.ts#4-50).
- Ou seja, o PaymentsModule tem responsabilidades demais, acoplando as entidades do Domínio de Assinatura. Se o aplicativo começar a enviar "Notificações de Email" no pagamento ou "Disparar Notas Fiscais", o PaymentsModule precisará importar esses Módulos e injetar todos esses Services no seu Worker, correndo risco de se tornar uma *"God Class Object"*.

**Solução Proposta (Event-Driven Integration):**
1. O [PaymentsModule](file:///a:/Projetos/Mohamed/apps/api/src/payments/payments.module.ts#19-51) **deve parar ali**: Ao receber o pagamento, verifica no Gatway/Webhook e dispara um evento (ex: `PaymentCompletedEvent`).
2. Mova o Listener para dentro do [SubscriptionsModule](file:///a:/Projetos/Mohamed/apps/api/src/subscriptions/subscriptions.module.ts#7-19). O *Subscriptions* sabe o que fazer quando encontra o evento *Pagamento Confirmado*, ou seja, invocar o Worker e o seu [updateOrCreate](file:///a:/Projetos/Mohamed/apps/api/src/subscriptions/subscriptions.service.ts#23-45).
3. Dessa maneira, [PaymentsModule](file:///a:/Projetos/Mohamed/apps/api/src/payments/payments.module.ts#19-51) perde qualquer rastreio do [SubscriptionsModule](file:///a:/Projetos/Mohamed/apps/api/src/subscriptions/subscriptions.module.ts#7-19) e a string de imports do módulo Payments pode limar essa dependência por completo — alcançando baixo acoplamento e altíssima coesão em eventos.

## 3. Coesão via Interfaces (Repositories vs Services)

**Problema e Solução Atual:** 
Anteriormente, detectamos o anti-pattern no [ClientsModule](file:///a:/Projetos/Mohamed/apps/api/src/clients/clients.module.ts#10-27) que injetava o serviço [RidesService](file:///a:/Projetos/Mohamed/apps/api/src/rides/rides.service.ts#6-135). Tivemos que injetar via interface o [IRidesRepository](file:///a:/Projetos/Mohamed/apps/api/src/rides/interfaces/rides-repository.interface.ts#26-73).

Isto evidencia que se precisarmos cruzar limites de módulo apelas para leitura/alterações de banco, devemos seguir favorecendo injeção de Repositórios de Data e não de Serviços que disparam lógicas de negócio paralelas, mantendo CQRS (Command/Query Separation) enxuto.

O resto da base (como [UsersModule](file:///a:/Projetos/Mohamed/apps/api/src/users/users.module.ts#7-19) e [SubscriptionsModule](file:///a:/Projetos/Mohamed/apps/api/src/subscriptions/subscriptions.module.ts#7-19)) adere perfeitamente aos princípios de Repository Pattern do SOLID, usando interfaces puras limitadas às diretrizes do Drizzle ORM.
