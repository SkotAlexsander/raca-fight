# AQ — Hospedagem: fontes, contas e dúvidas (15/10/2026)

Agente AQ (P13). Entregas: `docs/hospedagem/HOSPEDAGEM.md` (para o dono), `docs/hospedagem/custos.json` (números para o PDF do AR) e este arquivo. Nenhuma conta foi criada em serviço algum. Todas as consultas foram feitas em 15/10/2026.

## 1. Câmbio

| Item | Valor | Fonte |
|---|---|---|
| PTAX venda, 15/10/2026 13:05 | **R$ 5,0521** | Banco Central, API Olinda: <https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@dataInicial='10-01-2026'&@dataFinalCotacao='10-15-2026'&$format=json> |
| Comercial, mesmo dia, 12:09 (conferência) | R$ 5,0412 | <https://economia.awesomeapi.com.br/json/last/USD-BRL> |
| IOF de compra no exterior com cartão | 3,5% (Decreto 12.499/2025, desde jul/2025) | <https://arqfinance.com/articles/?p=2031>. **Não conferido no DOU.** Matérias de 2025 traziam outro cronograma (2,38% em 2026), que foi substituído. |
| **Câmbio usado** | **5,0521 × 1,035 = R$ 5,2289** | conta nossa |

O spread do banco emissor do cartão **não** entra na conta. Na prática, ele soma alguns por cento a mais.

## 2. Fontes de preço

### Supabase
- Preços: <https://supabase.com/pricing>
  - Free: US$ 0, pausa depois de 1 semana sem atividade, **sem backup**, 500 MB de banco, 1 GB de arquivos.
  - Pro: **a partir de US$ 25/mês**, com US$ 10 de crédito de computação (cobre a Micro), 8 GB de disco (o excedente custa US$ 0,125/GB), 100 GB de arquivos (o excedente custa US$ 0,0213/GB), 250 GB de tráfego, 100.000 usuários ativos por mês, backup diário guardado 7 dias, nunca pausa, MFA básico incluso, logs de 7 dias e log de auth de 7 dias.
  - Team: US$ 599/mês. Dá o SOC 2 e o log de auditoria da plataforma.
- Computação: <https://supabase.com/docs/guides/platform/compute-and-disk>. Micro custa ~US$ 10 (1 GB), Small ~US$ 15 (2 GB) e Medium ~US$ 60 (4 GB). A página não diz se o preço muda por região. Supus que não muda, mas isso é **não confirmado**.
- Backup e PITR: <https://supabase.com/docs/guides/platform/backups>
  - Retenção do backup diário: 7 dias no Pro, 14 no Team e até 30 no Enterprise.
  - PITR pede **no mínimo Small** e custa US$ 0,137/h (~US$ 100/mês) para 7 dias, ~US$ 200 para 14 e ~US$ 400 para 28.
  - Com o PITR, a perda máxima é de ~2 min (WAL a cada 2 min). Ligar o PITR desliga o backup diário.
  - **Arquivos do Storage (fotos) não entram no backup.**
  - O projeto fica fora do ar enquanto é restaurado.
  - No Pro, o backup não é baixável pelo painel. A cópia baixável sai do `pg_dump` / `supabase db dump`.
- PITR na página de uso: <https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery>
- Região São Paulo `sa-east-1`: disponível como região específica. <https://supabase.com/docs/guides/platform/regions>
- Segurança: <https://supabase.com/security>
  - SOC 2 Type 2 e HIPAA (com BAA no Team ou Enterprise).
  - "All customer data is encrypted at rest with AES-256 and in transit via TLS".
  - O relatório SOC 2 só sai no Team ou Enterprise.
- DPA: <https://supabase.com/legal/dpa>
  - Contratante: Supabase Pte. Ltd. (Singapura).
  - Usa as SCCs da UE (cláusulas da Europa) e cita GDPR, Suíça e EUA. **Não cita a LGPD.**
  - A página não diz como assinar nem em que plano. Diz que aceitar o acordo equivale a assinar.
- MFA obrigatório na organização (o painel): <https://supabase.com/docs/guides/platform/mfa/org-mfa-enforcement>. Só no Pro, Team e Enterprise.
- Limite de gasto (Spend Cap): <https://supabase.com/docs/guides/platform/cost-control>
  - Cobre disco, tráfego, MAU e Storage.
  - **Não cobre** computação nem PITR, que são previsíveis.
  - A página não diz se vem ligado por padrão.
- Cobrança: <https://supabase.com/docs/guides/platform/billing-on-supabase>
  - "two free projects" por dono.
  - **Não dá para misturar Free e Pro na mesma organização.**
  - Cada projeto a mais no Pro paga a própria computação.
- SMTP embutido: <https://supabase.com/docs/guides/auth/auth-smtp>. Só envia para a equipe, 2 e-mails por hora, "not meant for production use".

### Alternativas
- **AWS RDS PostgreSQL, sa-east-1** (lista oficial de preços da AWS, publicada em 06/10/2026: <https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonRDS/current/sa-east-1/index.json>):
  - db.t4g.micro Single-AZ: US$ 0,034/h.
  - db.t4g.small Single-AZ: US$ 0,069/h, ou ~US$ 50,37/mês em 730 h.
  - db.t4g.small Multi-AZ: US$ 0,137/h.
  - Disco gp3: US$ 0,219/GB-mês.
  - Backup além da cota grátis: US$ 0,095/GB-mês.
  - Conta: Small + 20 GB de gp3 (o mínimo do gp3, pelo que sei; **não confirmado** nesta pesquisa) = 50,37 + 4,38 = **~US$ 54,75/mês**.
  - Retenção do backup automático com PITR de até 35 dias: conhecimento geral do RDS, **não conferido** nesta pesquisa.
- **Neon**: <https://neon.com/pricing> e <https://neon.com/docs/introduction/regions>
  - Tem `aws-sa-east-1` para Postgres. Object Storage, Functions e Realtime **não** existem em São Paulo.
  - Launch: US$ 0,106 por CU-hora e US$ 0,35 por GB-mês, histórico de até 7 dias.
  - Scale: US$ 0,222 por CU-hora, até 30 dias, SOC 2.
  - Não há valor mensal fixo. Não estimei um, porque depende do uso medido. Fica **não confirmado** para a academia.
- **Magalu Cloud**: <https://magalu.cloud/precos/>. A página de preços é uma calculadora em JavaScript e não entregou números. Há notícia de DBaaS PostgreSQL com dado no Brasil (<https://itforum.com.br/?p=9615863>). Preço **não confirmado**.
- **VPS (comparação)**: Hostinger, <https://www.hostinger.com/br/servidor-vps>
  - KVM 1 (1 vCPU, 4 GB, 50 GB): R$ 29,99/mês promocional e **R$ 59,99 na renovação**.
  - KVM 2: R$ 43,99 promocional e R$ 77,99 na renovação.
  - Pagamento integral e renovação a cada 2 anos.
  - Backup **semanal**. A página não cita data center no Brasil.

### Fora do banco
- Apple Developer: **US$ 99/ano**, "em moeda local, onde disponível". A organização precisa de **D-U-N-S**. <https://developer.apple.com/br/support/enrollment/>. O valor exato em R$ só aparece na inscrição: **não confirmado**. Uma matéria antiga (2021) falava em R$ 550 e não foi usada.
- Google Play: **US$ 25, uma vez**. <https://support.google.com/googleplay/android-developer/answer/6112435>
- EAS: <https://expo.dev/pricing>
  - Free: 15 builds Android e 15 iOS por mês, fila de baixa prioridade, 1.000 MAU de EAS Update.
  - Starter: US$ 19/mês com US$ 45 de crédito.
  - Avulso: iOS a US$ 2 e Android a US$ 1 por build.
- Expo push: grátis, com limite de **600 notificações por segundo por projeto**. <https://docs.expo.dev/push-notifications/faq/>
- Registro.br: **R$ 40,00 por ano** (texto da própria página). <https://registro.br/ajuda/valores/>
- Resend: <https://resend.com/pricing>
  - Free: 3.000 e-mails por mês, 100 por dia, 3 domínios.
  - Pro: US$ 20/mês com 50.000 e-mails.
- Brevo: a página oficial não carregou o texto. Resenhas de 2026 falam em 300 e-mails por dia no plano grátis, com a marca Brevo no rodapé (<https://dreamlit.ai/blog/brevo-review>). **Não confirmado na fonte oficial.** Não entrou na conta.
- Armazenamento de fotos: está dentro dos 100 GB do Supabase Pro. Uma foto de perfil tem ~200 a 300 KB, então 300 fotos ≈ 90 MB. Custo extra zero no horizonte da academia.
- S3 São Paulo, para a cópia externa: **US$ 0,0405 por GB-mês** (lista oficial, publicada em 14/10/2026). <https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonS3/current/sa-east-1/index.json>

### LGPD
- Agente de pequeno porte dispensado de encarregado, desde que mantenha um canal com o titular: Resolução CD/ANPD nº 2/2022. Quem faz tratamento de **alto risco** (art. 3º e 4º) perde a dispensa. Pelo que sei, os critérios específicos do art. 4º incluem dado de criança e adolescente. Isso **não foi conferido** no texto oficial. Fontes: <https://www.mattosfilho.com.br/unico/resolucao-lgpd-agentes/> e <https://lefosse.com/noticias/alerta/anpd-publica-regulamento-que-flexibiliza-a-aplicacao-da-lgpd-a-microempresas-empresas-de-pequeno-porte-startups-e-associacoes-sem-fins-lucrativos/>
- Transferência internacional: as cláusulas-padrão da ANPD (Resolução CD/ANPD nº 19/2024) são obrigatórias desde 23/08/2025 para quem usa cláusula contratual como base. As SCCs europeias não valem sozinhas. <https://lefosse.com/noticias/alerta/transferencia-internacional-de-dados-prazo-para-adocao-das-clausulas-padrao-da-anpd-se-encerra-em-23-de-agosto/> e <https://www.mayerbrown.com/pt/insights/publications/2025/08/end-of-grace-period-implementation-of-brazils-standard-contractual-clauses-in-international-transfers-of-personal-data>
- Dado de criança: LGPD, art. 14. É preciso o consentimento específico de pelo menos um dos pais ou do responsável legal.

## 3. As contas

Câmbio C = 5,2289. O script que gera o `custos.json` aplica `R$ = US$ × C`, arredondado a centavos.

| Item | US$ | R$ |
|---|---|---|
| Supabase Pro | 25/mês | 130,72 |
| Small (15 − 10 de crédito) | 5/mês | 26,14 |
| Cópia externa no S3 (teto) | 1/mês | 5,23 |
| PITR de 7 dias | 100/mês | 522,89 |
| Apple | 99/ano | 517,66 |
| Google Play | 25 uma vez | 130,72 |
| Domínio | — | 40,00/ano |

Cópia externa: 30 cópias diárias de ~50 MB comprimidos = ~1,5 GB × US$ 0,0405 = ~US$ 0,06/mês. **O tamanho do banco não foi medido** (ainda não existe), então pus US$ 1 como teto.

| Degrau | Mensal | Anual (12 × mensal + Apple + domínio) | 1º ano (+ Google) |
|---|---|---|---|
| Começar (Pro + Micro) | US$ 25 = **R$ 130,72** | **R$ 2.126,30** | R$ 2.257,02 |
| Recomendado (Pro + Small + cópia de 30 dias) | US$ 31 = **R$ 162,09** | **R$ 2.502,74** | R$ 2.633,46 |
| Crescer (Recomendado + PITR de 7 dias) | US$ 131 = **R$ 684,98** | **R$ 8.777,42** | R$ 8.908,14 |

Ordem no `custos.json`: começar, recomendado, crescer, por preço. O pedido listava "Começar, Crescer, Recomendado". O AR pode reordenar sem problema, porque cada degrau tem `id`.

## 4. Raciocínio da recomendação

- **Free fora**: pausa e não tem backup. Fica só para o projeto de **homologação**, numa **organização separada** (não dá para misturar Free e Pro), sem dado real. Assim o 2º projeto não paga computação. A arquitetura (`03-DECISOES-TECNICAS.md`) prevê homologação e produção como dois projetos.
- **Recomendado = Pro + Small + cópia externa de 30 dias.** O ponto fraco do Pro puro é a retenção de 7 dias: um erro notado depois de duas semanas não tem volta. A cópia externa custa centavos e resolve isso. A Small dá folga de RAM e é o pré-requisito para ligar o PITR depois sem migrar nada.
- **PITR só no Crescer.** Custa US$ 100/mês, o que é desproporcional para ~150 alunos. Exemplo de ordem de grandeza: com mensalidade de R$ 150, a receita fica em ~R$ 22 mil/mês, e o PITR seria ~2,4% dela. É um **exemplo nosso, não um dado da academia**. Para a academia de hoje, perder no máximo um dia de lançamentos é tolerável, porque dá para relançar pelo comprovante.
- **RDS** fica fora porque é só o banco. Auth, Storage e Realtime teriam de ser construídos à parte, e a mensalidade da máquina sozinha já passa do Pro. **Neon** fica fora pelo mesmo motivo: em São Paulo, ele não tem Storage nem Realtime. **VPS** fica fora pelo custo humano: patch, backup testado, monitoramento, disco. Para dado financeiro e de criança, uma pessoa só operando servidor é o maior risco.

## 5. Pontos técnicos para quem construir (AM e Alex)

1. **MFA TOTP no app do dono**: o Supabase Auth tem MFA básico incluso. É preciso exigir `aal2` nas políticas RLS das tabelas do financeiro. Isso **não está implementado ainda**. É requisito para o admin.
2. **MFA obrigatório na organização Supabase** (painel), que só existe no Pro. Ligar no dia 1.
3. **Registro de quem mexeu**: o log de auditoria da plataforma só existe no Team. O "histórico de tudo" do admin tem de ser uma **tabela própria preenchida por trigger** (quem, quando, antes e depois), sem `delete` permitido pela RLS. Isso conversa com o modelo de dados do AI.
4. **Cópia externa**: `pg_dump` diário agendado (por exemplo, GitHub Actions num repositório privado) para um bucket S3 em `sa-east-1`, com criptografia e regra de ciclo de vida de 30 dias. Precisa de uma conta AWS, que é mais uma conta a decidir em nome de quem fica. Testar a restauração uma vez por trimestre.
5. **Fotos fora do backup**: o backup do Supabase não leva o Storage. Se a foto importar (documento, atestado), incluí-la na cópia externa.
6. **Push sem dado sensível**: o aviso passa pelos servidores da Expo, da Apple e do Google, fora do Brasil. O texto do aviso não pode levar valor, dívida nem dado de criança. Algo como "Você tem uma mensalidade em aberto. Abra o app." basta.
7. **E-mail**: o SMTP próprio do Supabase não serve. Configurar o Resend com o domínio da academia (SPF/DKIM). O plano Free (100 por dia) basta para cadastro e senha. A cobrança por e-mail em massa pede o Pro (US$ 20).
8. **Spend Cap**: deixar ligado. Ele protege contra conta surpresa de tráfego e disco. Computação e PITR são fixos e não entram nele.

## 6. Dúvidas e [decidir]

| # | Pergunta | Opções | Quem |
|---|---|---|---|
| 1 | **Em nome de quem ficam as contas** (Supabase, Apple, Google, AWS, domínio, Resend) e quem paga o cartão | Academia, com CNPJ (recomendado: ela é a controladora, e a Apple pede pessoa jurídica para dado sensível, diretriz 5.1.1(ix)) · Alex, repassando · Misto | Alex com a academia |
| 2 | **Conta Apple de organização** precisa de D-U-N-S do CNPJ da academia (grátis, demora alguns dias) | — | Academia |
| 3 | **Encarregado de privacidade** | Dono · Recepção · Terceiro | Academia |
| 4 | **DPA do Supabase e a LGPD**: o DPA usa SCCs europeias e não as cláusulas-padrão da ANPD. Há transferência internacional mesmo com o banco em São Paulo (empresa em Singapura, suporte e subprocessadores fora)? | Advogado avalia · Aceitar com a mitigação "dado em São Paulo + criptografia" | Advogado da academia |
| 5 | **Quando ligar o PITR** | Desde o início · Ao passar de ~500 alunos ou abrir a 2ª unidade (recomendado) | Academia |
| 6 | **Quem opera a cópia externa e o teste de restauração** | Entra na conta de manutenção do Alex | Alex |
| 7 | **Domínio**: qual nome (`racafight.com.br`, `racafightgravatai.com.br`…) e se a academia já tem um | — | Academia |
| 8 | **O app vai ser só desta academia ou SaaS?** (P00) Se for SaaS, os custos passam a ser do Alex e se dividem entre academias | — | Alex |

## 7. Não confirmado

- O preço da Apple em R$ (só aparece na inscrição).
- Se a computação do Supabase custa o mesmo em `sa-east-1` que nos EUA.
- Os preços do Magalu Cloud.
- O plano grátis do Brevo na fonte oficial.
- O gp3 mínimo de 20 GB e a retenção de 35 dias no RDS.
- O IOF de 3,5% no DOU.
- O texto do art. 4º da Resolução ANPD 2/2022 sobre dado de criança.
- Se o Spend Cap vem ligado por padrão.
- Se o DPA do Supabase pode ser assinado no plano Pro.
