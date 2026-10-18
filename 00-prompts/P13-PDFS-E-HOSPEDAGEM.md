# P13 — Os três PDFs de apresentação e a hospedagem (15/10/2026)

Pedido do Alex: "a parte do PDF eu gostaria que fossem três… uma para o funcionário, uma para os clientes, uma do admin… a parte do admin tem que vir primeiro… assim que tiver pronto a parte do admin já pede para um subagente fazer que eu preciso apresentar… bem construído explicando todas as mecânicas, o que ele pode fazer e o controle que ele tem… vai ser passado para cima, especificamente para o dono da academia… bem detalhado e bem direto… e uma parte onde você indica alguns valores de hospedagem… como envolve dados, tem que ser uma hospedagem no mínimo boa."

Todos leem antes: `00-prompts/P00-CONTEXTO.md`, `docs/decisoes.md` (entradas de 15/10), `02-design/referencias/raca-fight/01-DADOS-REAIS.md` e `docs/coordenacao.md`. Português do Brasil. Ninguém resolve [decidir]; o que estiver em aberto aparece no PDF como "a decidir com a academia".

## Ordem

| Ordem | Agente | Faz | Começa quando | Escreve em |
|---|---|---|---|---|
| 1 | **AQ** — Hospedagem | pesquisa de custo e segurança da hospedagem | já (corre ao lado do AI e do AJ) | `docs/hospedagem/` + `docs/revisao/AQ-HOSPEDAGEM.md` |
| 2 | **AR** — PDF do admin | o PDF do dono, completo | o AI terminar (especificação do admin) e o AQ terminar | `docs/apresentacao/admin/` |
| 3 | **AS** — PDF do professor | o PDF da equipe | o AJ terminar e o AL ter a cara de luta | `docs/apresentacao/professor/` |
| 4 | **AT** — PDF do aluno | o PDF do aluno | junto com o AS | `docs/apresentacao/aluno/` |

O PDF antigo (Academia Plus, musculação, 54 p.) fica como histórico; não é refeito.

## Para quem é cada PDF

- **Admin** → o **dono da Raça Fight**, que não é técnico e vai decidir se compra. Direto, sem jargão, cada tela com "o que você vê" e "o que você consegue fazer". Mostra o controle total: quantos alunos, quantos funcionários, quanto entra e sai, quem está devendo, a planilha substituída. Termina com a hospedagem e o custo mensal.
- **Professor** e **aluno** → a mesma pessoa (o dono) entendendo o que a equipe e os alunos recebem.

## O que o PDF do admin tem (AR)

1. Capa na marca Raça Fight (vermelho `#C42024`, preto, branco; fotos reais de `02-design/referencias/raca-fight/fotos/`, sem rosto de menor).
2. O problema de hoje em uma página: a planilha.
3. Os três apps conectados (aluno, professor, admin) num desenho só.
4. Cada parte do admin, uma ou duas páginas cada: painel, alunos, funcionários, financeiro "tipo planilha" (lançar, colar, desfazer, mensalidade gerada sozinha, despesa fixa, fechar o mês), cobrança e inadimplência, importar a planilha atual e exportar para o Excel, relatórios, filtros, notas e lembretes, permissões (quem vê o quê).
5. Exemplos com números fictícios mas plausíveis para uma academia de luta em Gravataí, calculados pelo domínio financeiro (`app/dominio/financeiro/`), não inventados à mão.
6. Segurança e LGPD em linguagem de dono: onde o dado fica, quem vê, cópia de segurança.
7. **Hospedagem e custo** (do AQ): a tabela de custo mensal e anual, em reais.
8. O que está em aberto para a academia decidir.
9. Próximos passos e prazo.

Telas: enquanto o AK não desenhar as telas do admin, use quadros de tela simples na marca (wireframe limpo). Quando o AK terminar, o AR troca pelas capturas (deixe o script pronto para isso).

Ferramenta: a mesma do PDF antigo (`docs/apresentacao/`: capturar → montar → folhear), em pasta própria. Formato A4 deitado ou retrato, a escolher pelo que lê melhor; tamanho final abaixo de 20 MB. Confira cada página como imagem antes de entregar (texto cortado, contraste, número errado). Copie o PDF final para `A:\Projetos\Academia Plus\` com o nome `Raça Fight — Admin.pdf`.

## Hospedagem (AQ)

Pesquise **com fontes e data** (preços mudam): o app usa Supabase (Postgres com regra de acesso por linha), fotos e arquivos, login, avisos no celular.

- **Opções**, no mínimo: Supabase Pro (região São Paulo `sa-east-1`) com a cópia de segurança diária e o PITR; um Postgres gerenciado alternativo (por exemplo, AWS RDS São Paulo, Neon, ou um provedor brasileiro); e um servidor próprio (VPS) só como comparação, dizendo por que é pior para dado sensível.
- **Custos que somam**: banco e servidor, armazenamento de fotos, envio de aviso (Expo push é grátis até um limite), domínio, e-mail transacional (confirmação de cadastro), conta Apple Developer (US$ 99/ano), Google Play (US$ 25 uma vez), e o serviço de build (EAS grátis ou pago).
- **Segurança mínima** para dado financeiro e de menor: dado no Brasil ou com cláusula LGPD, criptografia, cópia de segurança com retenção, 2 fatores no acesso do dono, registro de quem mexeu.
- **Tabela final** em reais (cotação do dia, com a fonte) em três degraus: começar (1 academia, ~150 alunos), crescer (~500), e o recomendado. Diga qual recomenda e por quê.
- Entrega: `docs/hospedagem/HOSPEDAGEM.md` (para o dono ler) e `docs/revisao/AQ-HOSPEDAGEM.md` (fontes, contas, dúvidas).
