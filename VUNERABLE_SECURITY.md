1. [HIGH] Import de backup permite DoS por ZIP bomb (ajustado)  


- Risco: o backend aceita ZIP de até 25 MB e descompacta entradas inteiras em memória com inflateRawSync, sem limite de tamanho expandido, quantidade de entradas ou tamanho total pós- descompressão.
- Local afetado: /A:/Projetos/Mohamed/apps/api/src/backups/backups.controller.ts:51, /A:/Projetos/Mohamed/apps/api/src/backups/services/functional-backup-import.service.ts:665, /A:/  
  Projetos/Mohamed/apps/api/src/backups/utils/zip-reader.util.ts:47
- Como atacar: um usuário autenticado envia um ZIP altamente comprimido em POST /backups/import/preview; o processo expande o conteúdo síncrona e integralmente no request thread.
- Impacto: exaustão de memória/CPU, travamento do processo e indisponibilidade para outros usuários.
- Criticidade: alta.
- Correção prática: trocar por leitura/extração com streaming e cotas rígidas de bytes expandidos, número de arquivos e tamanho por JSON; adicionar rate limit dedicado para import/  
  preview e import/execute; rejeitar razão de compressão anômala.  


2. [MEDIUM] Atualização de corrida permite burlar a lógica de quitação/dívida


- Risco: ao alterar clientId ou value, a regra reaproveita paymentStatus anterior. Se a corrida já era PAID, o servidor mantém PAID mesmo quando paidWithBalance cai para 0, zerando a
  dívida indevidamente.
- Local afetado: /A:/Projetos/Mohamed/apps/api/src/rides/services/ride-status.service.ts:17, /A:/Projetos/Mohamed/apps/api/src/rides/services/ride-status.service.ts:34, /A:/Projetos/
  Mohamed/apps/api/src/rides/services/ride-status.service.ts:47, /A:/Projetos/Mohamed/apps/api/src/rides/rides.service.ts:196, /A:/Projetos/Mohamed/apps/api/src/rides/dto/  
  rides.dto.ts:13
- Como atacar: criar uma corrida paga com saldo, depois fazer PATCH /rides/:id trocando o cliente; o saldo do cliente antigo é devolvido, paidWithBalance vira 0, mas a corrida  
  continua PAID. O mesmo raciocínio vale para aumentar o valor de uma corrida já paga.
- Impacto: fraude/integridade quebrada no financeiro, ocultação de dívida e relatórios incorretos.
- Criticidade: média.
- Correção prática: em mudança de cliente/valor, recalcular o estado financeiro do zero no backend; se faltar pagamento real, forçar PENDING; nunca herdar PAID quando houver valor em
  aberto.  


3. [MEDIUM] Consumo e estorno de saldo têm race condition  


- Risco: o código lê balance, calcula um novo valor e grava esse valor absoluto, sem lock de linha nem update atômico condicional.
- Local afetado: /A:/Projetos/Mohamed/apps/api/src/rides/services/ride-accounting.service.ts:65, /A:/Projetos/Mohamed/apps/api/src/rides/services/ride-accounting.service.ts:104, /A:/
  Projetos/Mohamed/apps/api/src/rides/rides.service.ts:131, /A:/Projetos/Mohamed/apps/api/src/clients/clients.service.ts:174
- Como atacar: disparar várias requisições concorrentes de criação/edição/exclusão de corrida usando o mesmo saldo de cliente.
- Impacto: gasto duplicado do mesmo crédito, transações inconsistentes e reconciliação financeira incorreta.
- Criticidade: média.
- Correção prática: usar SELECT ... FOR UPDATE ou UPDATE ... SET balance = balance - :x WHERE id = :id AND balance >= :x RETURNING ...; aplicar o mesmo padrão para estorno e overflow;
  adicionar testes concorrentes.  


4. [MEDIUM] Proteção contra brute force é só por IP e senhas são fracas  


- Risco: login/register têm throttle, mas o tracker padrão do Nest usa req.ip; não há lockout por conta, backoff por usuário nem exigência forte de senha.
- Local afetado: /A:/Projetos/Mohamed/apps/api/src/app.module.ts:92, /A:/Projetos/Mohamed/apps/api/src/auth/auth.controller.ts:187, /A:/Projetos/Mohamed/apps/api/src/auth/dto/  
  auth.dto.ts:3, /A:/Projetos/Mohamed/node*modules/.pnpm/@nestjs+throttler@6.5.0*@ne_75ac97f7a258f9688ded775aa76af505/node_modules/@nestjs/throttler/dist/throttler.guard.js:141
- Como atacar: password spraying distribuído em muitos IPs contorna limite por IP; com senha mínima de 6 caracteres, a margem de adivinhação cai.
- Impacto: takeover de contas.
- Criticidade: média.
- Correção prática: limitar por IP e por conta, adicionar atraso progressivo/lock temporário/CAPTCHA em abuso, e elevar política de senha para passphrases mais longas.  


5. [LOW] Health endpoint expõe versão e uptime publicamente(ajustado)


- Risco: o endpoint público divulga version e uptime, úteis para fingerprinting e correlação com janelas de deploy/restart.
- Local afetado: /A:/Projetos/Mohamed/apps/api/src/app.controller.ts:15
- Como atacar: usar /health para mapear versão exposta e comportamento operacional antes de explorar outra falha.
- Impacto: ajuda reconhecimento.
- Criticidade: baixa.
- Correção prática: deixar público só status: ok; mover detalhes para endpoint interno/autenticado.  


Riscos condicionais / parciais

- Webhook: há evidência de proteção parcial com x-signature, rawBody e janela anti-replay (/A:/Projetos/Mohamed/apps/api/src/payments/payments.controller.ts:46, /A:/Projetos/Mohamed/
  apps/api/src/payments/payments.service.ts:114), mas a validação criptográfica real depende de um provider de pagamento que não está no repositório. Então o item do SECURITY.md está
  parcialmente aplicado, mas não verificável ponta a ponta.
- Debug endpoint: o endpoint só sobe com chave interna e IP allowlist, mas a segurança depende de TRUST_PROXY estar correto; se o deploy confiar em proxy errado, a origem pode ser  
  interpretada via IP encaminhado.
- Segredos: não encontrei segredos hardcoded em apps/api/src, e há validação/env redaction (/A:/Projetos/Mohamed/apps/api/src/common/config/env.validation.ts:69, /A:/Projetos/Mohamed/
  apps/api/src/common/config/env.validation.ts:154, /A:/Projetos/Mohamed/apps/api/src/app.module.ts:55). Ainda assim, a força mínima de JWT_SECRET não é validada, só sua presença.  


Aderência ao SECURITY.md

- Trusting the Frontend: aplicado em checkout porque o preço/plano vem do backend e o userId vem do token, não do body (/A:/Projetos/Mohamed/apps/api/src/payments/dto/  
  payments.dto.ts:3, /A:/Projetos/Mohamed/apps/api/src/payments/payments.controller.ts:33). Parcial no domínio de corridas, onde a lógica financeira ainda pode ser manipulada por  
  atualizações.
- IDOR: bem aplicado nos repositórios revisados; clients, rides, settings e backups escopam consultas por userId (/A:/Projetos/Mohamed/apps/api/src/clients/repositories/drizzle-  
  clients.repository.ts:195, /A:/Projetos/Mohamed/apps/api/src/rides/repositories/drizzle-rides.repository.ts:61, /A:/Projetos/Mohamed/apps/api/src/settings/repositories/drizzle-  
  settings.repository.ts:30, /A:/Projetos/Mohamed/apps/api/src/backups/backups.repository.ts:150). Não achei IDOR de alta confiança.
- Mass Assignment: majoritariamente aplicado; DTOs/Zod restringem os campos públicos e não encontrei rota pública fazendo update direto com body arbitrário. Sem achado forte aqui.
- Race Condition / TOCTOU: parcial. Refresh token foi tratado corretamente com getDel atômico (/A:/Projetos/Mohamed/apps/api/src/auth/refresh-token/refresh-token.service.ts:47);  
  saldo/dívida não.
- Data Exposure: parcial. Há sanitização global e DTO de perfil (/A:/Projetos/Mohamed/apps/api/src/common/interceptors/output-sanitizer.interceptor.ts:17, /A:/Projetos/Mohamed/apps/  
  api/src/auth/auth-profile.service.ts:26), mas ainda existe vazamento informacional em /health.
- Webhooks mal configurados: parcial / não verificável ponta a ponta, pelo motivo acima.
- Rate limit e limitação de input: parcial. Existe throttling global/sensível (/A:/Projetos/Mohamed/apps/api/src/app.module.ts:92, /A:/Projetos/Mohamed/apps/api/src/auth/  
  auth.controller.ts:187) e limite de upload (/A:/Projetos/Mohamed/apps/api/src/backups/backups.controller.ts:53), mas faltam controles por conta e limites de descompressão.
- Vazamento de segredos no código: bem aplicado no source revisado; não encontrei chaves hardcoded em produção.  


Resumo

    incompleta contra brute force e exposição informacional em /health.

- O que um atacante conseguiria explorar: um usuário autenticado consegue derrubar a API via import malicioso e adulterar a contabilidade própria; um atacante distribuído consegue  
  fazer password spraying com chance maior do que o aceitável; qualquer observador consegue usar /health para fingerprinting.
- O que corrigir primeiro: 1. limitar descompressão e endurecer backups/import/\*; 2. corrigir recálculo financeiro de rides.update; 3. tornar saldo/estorno atômicos; 4. fortalecer  
  auth rate limiting e política de senha.
- No estado atual, eu não consideraria apps/api seguro. Ele tem boas bases defensivas (JWT global, CORS restritivo, output sanitization, scoping por userId, env validation), mas ainda
  há falhas materiais em lógica de negócio, concorrência e disponibilidade.

Análise estática. Não validei exploração em runtime contra um ambiente implantado, e a verificação final de webhook ficou limitada porque o provider real de pagamento não está no  
 repositório.
