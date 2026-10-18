// As páginas do PDF do admin (agente AR, 15/10/2026). Cada página é um objeto; o montar.mjs põe o rodapé, numera e imprime.
// TODO número vem de `d` (o _dados/dados.json que o dados.mjs calcula com o domínio financeiro) ou de `x.custos`
// (docs/hospedagem/custos.json, do AQ). Nada de valor digitado aqui.
//
// Os quadros de tela são esboços em HTML (o AK ainda está desenhando as telas). A função `tela()` troca o esboço pela
// captura do AK quando ela existe em _capturas/telas/<id>.png|jpg (ver capturar.mjs).

const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const neg = (t) => (String(t).startsWith('−') ? `<span class="neg">${esc(t)}</span>` : esc(t))
const lista = (xs, cls = '') => `<ul class="lista ${cls}">${xs.map((x) => `<li>${x}</li>`).join('')}</ul>`
const bloco = (titulo, xs, cls = '', lcls = '') => `<div class="bloco ${cls}"><h3>${titulo}</h3>${Array.isArray(xs) ? lista(xs, lcls) : xs}</div>`
const verFazer = (ver, fazer, extra = '') => `<div class="duas" style="margin-top:12px">${bloco('O que você vê', ver)}${bloco('O que você consegue fazer', fazer)}</div>${extra}`
const SIT = { Paga: 'selo--ok', Atrasada: 'selo--vermelho', 'Vence hoje': 'selo--atencao', 'A vencer': '', Trancado: 'selo--atencao', Matriculado: 'selo--ok', Inativo: '' }
const selo = (t) => `<span class="selo ${SIT[t] ?? ''}">${esc(t)}</span>`
const primeiro = (n) => String(n).split(' ')[0]
const MESN = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
/** "Boxe 2× — 2026-10" (como o domínio descreve a mensalidade) → "Boxe 2× · outubro" para a tela */
const descr = (t) => String(t).replace(/ — (\d{4})-(\d{2})$/, (_, a, m) => ` · ${MESN[Number(m) - 1]}`)

export function paginas(d, x) {
  const p = d.painel
  const LOGO_C = x.logoCompacto ? `<img class="logo" src="${x.logoCompacto}" alt="Raça Fight">` : '<span class="logo-texto">RAÇA FIGHT</span>'
  const barra = (onde, dir = '') => `<div class="tela__barra">${LOGO_C}<span class="onde">${onde}</span><span class="dir">${dir || '<span class="busca">Buscar…  /</span>'}<span class="avatar">D</span></span></div>`
  /** Quadro de tela: recortes da captura do AK (_capturas/telas/<id>.png, 2040 × 790).
   *  Cada recorte é [[x, y, largura, altura], larguraNaPagina], em pixels da prévia de 2000 px de largura (× 1,02 = pixel da captura).
   *  O recorte serve para a letra não ficar minúscula: nunca se reduz a tela inteira para caber no A4. */
  const F = 2040 / 2000
  const tela = (id, recortes, legenda = '', pilha = false) => {
    const cap = x.captura(id)
    if (!cap) { x.faltou(id); return `<div class="caixa caixa--atencao"><b class="rot">Falta a captura</b>${esc(id)}: rode node capturar.mjs</div>` }
    const rs = recortes.map(([[rx, ry, rw, rh], dw, filtro]) => {
      const s = dw / (rw * F)
      return `<div class="recorte" style="width:${dw}px;height:${Math.round(rh * F * s)}px"><img src="${cap}" alt="" style="width:${Math.round(2040 * s)}px;left:${-Math.round(rx * F * s)}px;top:${-Math.round(ry * F * s)}px${filtro ? `;filter:${filtro}` : ''}"></div>`
    }).join('')
    return `<figure class="quadro"><div class="recortes ${pilha ? 'recortes--pilha' : ''}">${rs}</div>${legenda ? `<figcaption class="legenda"><b>Tela do Admin (protótipo).</b> Nomes e valores de exemplo. ${legenda}</figcaption>` : ''}</figure>`
  }
  const tabela = (cab, linhas, { cls = '', rodape = '' } = {}) =>
    `<div class="tabela-cx"><table class="grade-t ${cls}"><thead><tr>${cab.map(([t, c]) => `<th class="${c ?? ''}">${t}</th>`).join('')}</tr></thead><tbody>${linhas.join('')}</tbody>${rodape}</table></div>`
  const tr = (cels, cls = '') => `<tr class="${cls}">${cels.map(([t, c]) => `<td class="${c ?? ''}">${t}</td>`).join('')}</tr>`

  const out = d.outubro
  const ev = d.evolucao
  const maxAbs = Math.max(...ev.map((e) => Math.abs(e.resultado)))
  const ger = d.geracaoOut
  const pul = ger.puladas
  const deFora = Object.values(pul).reduce((s, n) => s + n, 0)
  const cs = d.cobrancasOut
  const inad = d.inadimplentes
  const imp = d.importacao
  const ROT_PAPEL = { data: 'Data', descricao: 'Descrição', entrada: 'Entrada', saida: 'Saída', categoria: 'Categoria', situacao: 'Pago ou pendente', valor: 'Valor', ignorar: 'Ignorar' }
  const custos = x.custos
  const degrau = (id) => custos.degraus.find((g) => g.id === id)
  const brl = (n) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const brl0 = (n) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`

  const pgs = []
  const add = (o) => pgs.push(o)

  // ───────────────────────────────────────────── 1. capa
  add({ id: 'capa', capa: true, html: `
    <div class="capa__texto">
      ${x.logoCompleto ? `<img class="capa__logo" src="${x.logoCompleto}" alt="Centro de Treinamento Raça Fight Gravataí">` : '<div class="capa__titulo">RAÇA FIGHT</div>'}
      <p class="capa__olho">Proposta · ${d.hojeBR.slice(0, 2)} de outubro de 2026</p>
      <h1 class="capa__titulo">O painel<br>do <em>dono</em></h1>
      <p class="capa__sub">Tudo o que a planilha faz hoje, e o que ela não faz: a mensalidade que se gera sozinha, quem está devendo, quanto cada modalidade rende e o mês fechado sem conta à mão.</p>
      <div class="capa__ficha">
        <div><b>Para</b>Raça Fight Gravataí</div>
        <div><b>O quê</b>O app do dono (Admin)</div>
        <div><b>Junto com</b>o app do aluno e o do professor</div>
        <div><b>Situação</b>proposta para decidir</div>
      </div>
      <p class="capa__nota">Logo provisório, redesenhado a partir das fotos da academia: entra o arquivo original assim que chegar.</p>
    </div>
    <div class="capa__foto" style="background-image:url('${x.fotoCapa}')"></div>` })

  // ───────────────────────────────────────────── 2. em uma página
  add({ id: 'resumo', olho: 'Em uma página', titulo: 'O app do dono, ligado aos outros dois',
    lide: 'O Admin é o terceiro aplicativo da Raça Fight, ao lado do app do aluno e do app do professor. Ele substitui a planilha e mostra numa tela só o que hoje leva horas de conta.',
    corpo: `<div class="duas" style="grid-template-columns:1.05fr 1fr;gap:28px">
      <div class="pilha">
        ${bloco('O que muda no seu dia', [
          `<b>A mensalidade sai sozinha.</b> No dia 1, as mensalidades do mês ficam prontas. Você só marca quem pagou.`,
          `<b>Quem deve, na hora.</b> A lista de quem está atrasado, do maior atraso para o menor, com a mensagem de WhatsApp pronta.`,
          `<b>O mês fechado sem calculadora.</b> Quanto entrou, quanto saiu, o resultado, a previsão e a comissão de cada professor.`,
          `<b>A planilha cabe aqui dentro.</b> Ele lê a planilha que vocês já usam e devolve para o Excel quando você quiser.`,
          `<b>Nada some.</b> Toda mudança fica registrada: quem fez, quando e de quanto para quanto.`,
        ].map((t) => t), 'lista--16')}
        <div class="caixa caixa--vermelha"><b class="rot">Sobre os números deste documento</b>Todos são de exemplo, com nomes e preços inventados. As telas são o protótipo do desenho, com o exemplo dele. A página {{p:motor}} mostra o motor do financeiro, que já existe e fez as contas de outro exemplo.</div>
      </div>
      <div class="bloco bloco--cinza"><h3>O que tem aqui</h3>
        <ol class="sumario" style="columns:1">
          ${[['tres-apps', 'Os três apps e o que cada um vê'], ['problema', 'Hoje a planilha, amanhã o painel'], ['painel', 'Painel: a academia numa tela'], ['alunos', 'Alunos e responsáveis do Kids'], ['funcionarios', 'Equipe e o pagamento dela'],
            ['grade', 'Financeiro: a planilha dentro do app'], ['mensalidades', 'Mensalidade gerada sozinha'], ['despesas', 'Despesa fixa e fechar o mês'], ['inadimplencia', 'Cobrança e inadimplência'], ['importar', 'Importar a planilha e exportar para o Excel'],
            ['relatorio-ano', 'Relatórios'], ['filtro', 'Filtro total'], ['funil', 'Funil da aula experimental'], ['agenda', 'Agenda, notas e lembretes'], ['historico', 'Histórico de quem mexeu'], ['motor', 'O motor que faz as contas'], ['permissoes', 'Quem vê o quê'],
            ['seguranca', 'Segurança e LGPD'], ['custo', 'Hospedagem e custo'], ['decidir', 'O que a academia precisa decidir'], ['passos', 'Próximos passos']]
            .map(([id, t]) => `<li><b>${t}</b><span class="p">{{p:${id}}}</span></li>`).join('')}
        </ol>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 3. os três apps
  const icone = (t) => `<span class="app__icone"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${t}</svg></span>`
  const CEL = '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>'
  const PC = '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>'
  add({ id: 'tres-apps', olho: 'Como tudo se liga', titulo: 'Três apps, um banco de dados só',
    lide: 'O aluno, o professor e você usam apps diferentes, mas todos leem e escrevem no mesmo lugar. O check-in do aluno aparece na chamada do professor; a matrícula que você faz libera o check-in do aluno.',
    corpo: `
    <div class="apps">
      <div class="app">${'<div class="app__topo">' + icone(CEL) + '<div><div class="app__nome">Aluno</div><div class="app__quem">no celular · o aluno e o responsável pelo Kids</div></div></div>'}
        ${lista(['Horários, turmas e avisos da academia', 'Check-in na aula e a própria presença', 'A própria graduação (faixa, cordão)', 'Pedir a aula experimental pelo WhatsApp', 'As próprias mensalidades, <b>se você quiser</b> (pergunta A2)'], 'lista--16')}</div>
      <div class="app">${'<div class="app__topo">' + icone(CEL) + '<div><div class="app__nome">Professor e recepção</div><div class="app__quem">no celular · a equipe</div></div></div>'}
        ${lista(['A aula do dia e a chamada', 'Presença e graduação dos alunos dele', 'Registrar quem quer fazer a aula experimental', '<b>Nunca vê valor:</b> nem mensalidade, nem atraso, nem salário', 'Aluno em atraso treina normal: quem decide é você'], 'lista--16')}</div>
      <div class="app app--admin">${'<div class="app__topo">' + icone(PC) + '<div><div class="app__nome">Admin (o seu)</div><div class="app__quem">no computador e no celular · só o dono</div></div></div>'}
        ${lista(['Todos os alunos, responsáveis e a equipe', 'Mensalidades, pagamentos e quem deve', 'Entradas, saídas, resultado e previsão', 'Comissão e salário de cada um', 'Relatórios, funil, lembretes e o histórico de tudo'], 'lista--16')}</div>
    </div>
    <div class="fios"><svg viewBox="0 0 1000 34" preserveAspectRatio="none"><path d="M166 0 V16 H834 V0 M500 16 V34" fill="none" stroke="#CFCFCF" stroke-width="2"/></svg></div>
    <div class="banco"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>
      <div><b>Um banco de dados, em São Paulo</b><div class="pequeno" style="color:#D6D6D6">Guardado no Brasil, trancado (criptografado), com cópia de segurança todo dia. A regra de quem vê o quê fica dentro dele, não só na tela.</div></div></div>
    <p class="legenda" style="text-align:center;margin-top:10px">O painel do dono sai do app da equipe e vem para o Admin. Se você também dá aula, entra no app do professor como professor.</p>` })

  // ───────────────────────────────────────────── 4. o problema
  // Sem número aqui: as telas (protótipo do AK) e o motor (dados.mjs) usam exemplos diferentes; os números ficam nas telas e na página "o motor".
  add({ id: 'problema', olho: 'O problema', titulo: 'Hoje, a planilha. Amanhã, o painel.',
    lide: 'A planilha guarda o que foi digitado. Ela não avisa quem esqueceu de pagar, não sabe quanto o mês ainda vai render e não mostra quem mudou um valor.',
    corpo: `<div class="antes-depois">
      <div class="lado-ad lado-ad--hoje">
        <h2>Hoje: a planilha</h2>
        <table class="xls"><tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th></tr>
          <tr class="cab"><th>1</th><td>Data</td><td>Descrição</td><td>Entrada</td><td>Saída</td></tr>
          <tr><th>2</th><td>01/10</td><td>Mensal Bruno</td><td class="n">150,00</td><td></td></tr>
          <tr><th>3</th><td>01/10</td><td>Mensal Juliana</td><td class="n">120,00</td><td></td></tr>
          <tr><th>4</th><td>05/10</td><td>Salário Igor</td><td></td><td class="n">1.600,00</td></tr>
          <tr><th>5</th><td>10/10</td><td>Aluguel</td><td></td><td class="n">3.500,00</td></tr>
          <tr><th>6</th><td>…</td><td class="rabisco">quem falta pagar?</td><td></td><td></td></tr>
          <tr><th>7</th><td></td><td><b>TOTAL</b></td><td class="n rabisco">?</td><td class="n rabisco">?</td></tr></table>
        ${lista(['Cada mensalidade do mês é digitada à mão, uma por uma.', 'Para saber quem deve, é preciso cruzar a lista de alunos com os pagamentos.', 'A comissão de cada professor sai na calculadora.', 'No meio do mês, com o aluguel e os salários já pagos, não dá para saber como o mês vai fechar.', 'Se alguém apaga ou muda uma linha, ninguém fica sabendo.'], 'lista--16')}
      </div>
      <div class="seta-grande"><svg width="34" height="34" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="#C42024" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div class="lado-ad lado-ad--amanha">
        <h2>Amanhã: <em>o painel</em></h2>
        ${lista(['<b>No dia 1, as mensalidades do mês ficam prontas sozinhas</b>, cada uma com o desconto certo. Você só marca quem pagou.', '<b>Quem deve sai numa lista pronta</b>, do maior atraso para o menor, com a mensagem de WhatsApp escrita.', '<b>A comissão de cada professor vem calculada</b> pela regra de cada um; você confere e lança.', '<b>Ao lado do resultado do mês, a previsão do fechamento</b>: o dia 15 deixa de assustar.', '<b>Tudo o que alguém muda fica registrado</b>: quem mudou, quando e de quanto para quanto.'], 'lista--16')}
      </div>
    </div>` })

  // ───────────────────────────────────────────── 5. painel
  add({ id: 'painel', olho: 'Parte 1 · Painel', titulo: 'A academia inteira numa tela', exemplo: true,
    lide: 'É a primeira coisa que abre. Cada número é um atalho: clicou, abre a lista que forma aquele número.',
    corpo: `${tela('painel', [[[600, 62, 1400, 698], 1009]], 'À esquerda, fora do recorte: alunos e equipe.')}
    <p class="texto16" style="margin-top:8px">O resultado do mês vem com a <b>previsão do fechamento ao lado</b>, e a comparação é sempre <b>no mesmo período</b> do mês anterior (1 a 15/09 contra 1 a 15/10), mais setembro inteiro. Embaixo, os 12 meses; à direita, quem deve, o funil e o que fazer hoje.</p>` })

  // ───────────────────────────────────────────── 6. alunos
  add({ id: 'alunos', olho: 'Parte 2 · Pessoas', titulo: 'Alunos e responsáveis do Kids', exemplo: true,
    lide: 'Todo mundo que treina está aqui, mesmo quem nunca instalou o app. Criança entra com o responsável, que é quem paga e quem recebe a cobrança.',
    corpo: `${tela('alunos', [[[535, 70, 1300, 496], 1009]], 'A frase do filtro fica em cima da tabela; os filtros salvos e as caixas de marcar ficam à esquerda, fora do recorte.')}
    ${verFazer(['Nome, plano, situação, responsável, dia de vencimento e se a cobrança está em dia', 'A ficha da pessoa: contato, matrículas, descontos, cobranças, notas e histórico', 'Presença em números ("aulas em 30 dias"), vinda do app do professor'],
      ['Cadastrar aluno, criança com responsável, e matricular num plano com o dia de vencimento', 'Trancar por um período (viagem, lesão): no trancamento não sai cobrança', 'Dar desconto de família, de atleta ou de indicação. O sistema <b>sugere</b> o de família; quem aplica é você'])}` })

  // ───────────────────────────────────────────── 7. funcionários
  add({ id: 'funcionarios', olho: 'Parte 2 · Pessoas', titulo: 'A equipe e o pagamento dela', exemplo: true,
    lide: 'Cada pessoa da equipe tem a função, as modalidades que dá e a regra de pagamento. O Admin calcula quanto cada um ganhou no mês.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 72mm;height:auto">
      <div>${tela('funcionarios', [[[245, 70, 1035, 410], 712], [[1300, 272, 685, 272], 470]], 'Em cima, a equipe com o ganho do mês calculado; embaixo, a conta de uma professora com fixo + comissão.', true)}</div>
      <div class="pilha">
        ${bloco('O que você vê', ['Quem é da equipe, a função e desde quando', 'A regra de cada um: fixo, comissão, por aula ou fixo + comissão', 'Quanto cada um ganhou no mês, já calculado'])}
        ${bloco('O que você consegue fazer', ['Cadastrar, mudar a regra e desligar alguém', 'Conferir a conta e lançar como saída com um clique: o Admin calcula, quem paga é você', 'Manter no cadastro quem não usa o app'])}
        <div class="caixa"><b class="rot">Comissão justa no combo</b>O aluno do combo conta metade para cada professor.</div>
        <div class="caixa caixa--vermelha"><b class="rot">A decidir</b>Como a equipe é paga hoje (pergunta A19). O Admin não faz folha de pagamento.</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 8. a grade
  add({ id: 'grade', olho: 'Parte 3 · Financeiro', titulo: 'A planilha, agora dentro do app', exemplo: true,
    lide: 'Cada entrada e cada saída é uma linha, como no Excel, editada direto na célula. Os totais embaixo se refazem na hora.',
    corpo: `${tela('lancamentos', [[[245, 70, 1565, 655], 1009]], 'A célula de borda vermelha está em edição; as linhas marcadas mostram a soma da seleção.')}
    ${verFazer(['As linhas do mês, com os totais sempre à vista: entrou, saiu, resultado e o que falta receber e pagar', 'As mensalidades geradas entram sozinhas, prontas para marcar como pagas'],
      ['Lançar e editar pelo teclado (Enter, Tab, setas); selecionar várias linhas e mudar todas de uma vez', '"Apagar" é arquivar: a linha sai da conta, mas não some do histórico'])}` })

  // ───────────────────────────────────────────── 9. escrever, colar, desfazer
  add({ id: 'colar', olho: 'Parte 3 · Financeiro', titulo: 'Escrever como se fala, colar do Excel, desfazer', exemplo: true,
    lide: 'Cole linhas copiadas do Excel: antes de gravar, o Admin mostra a prévia e marca a célula com erro. Nada entra errado.',
    corpo: `${tela('colar', [[[245, 70, 1180, 375], 1009]], 'Vinte linhas coladas: 18 prontas e 2 com erro (uma data que não existe e um valor ambíguo). Nada foi gravado ainda.')}
    <div class="tres" style="margin-top:12px;grid-template-columns:1.1fr 1fr 1fr">
      ${bloco('Você digita, o app entende', `<p class="pequeno">${d.edicoes.map((e) => `<code style="font:600 13px var(--mono)">${esc(e.digitou)}</code> → ${e.vira.startsWith('não grava') ? '<span class="neg">não grava</span>' : esc(e.vira)}`).join(' · ')}</p><p class="pequeno ter" style="margin-top:4px">Conferido no motor do financeiro, com estas mesmas entradas.</p>`)}
      ${bloco('Desfazer e refazer', ['Ctrl+Z desfaz e Ctrl+Y refaz, até as últimas 100 ações', 'Colar 20 linhas conta como uma ação só'], '', 'lista--16')}
      ${bloco('Errar sem medo', ['Célula com erro fica vermelha e não grava', 'Mês fechado não muda sem reabrir, e reabrir pede o motivo'], '', 'lista--16')}
    </div>` })

  // ───────────────────────────────────────────── 10. mensalidades
  add({ id: 'mensalidades', olho: 'Parte 3 · Financeiro', titulo: 'A mensalidade se gera sozinha', exemplo: true,
    lide: 'No dia 1, o Admin olha cada matrícula e cria a cobrança do mês, com o desconto e o dia de vencimento de cada aluno. Quando alguém paga, você marca, e a entrada aparece na planilha.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 62mm;height:auto">
      <div>${tela('cobrancas', [[[245, 75, 1325, 485], 760, 'brightness(2.4) contrast(1.05)']], 'As cobranças de outubro, por situação (clareada aqui: na tela ela fica escurecida atrás da gaveta). Na Kids, quem paga é o responsável.')}</div>
      <div>${tela('cobrancas', [[[1572, 15, 425, 470], 222]], 'A gaveta "Marcar como paga".')}</div>
    </div>
    ${verFazer(['Cada cobrança com a situação calculada: a vencer, vence hoje, atrasada, paga ou isenta', 'O desconto ao lado (família, funcionário); no combo, o valor já vem dividido entre as modalidades'],
      ['Gerar o mês no botão, ou deixar no automático do dia 1 (gerar duas vezes não duplica nada)', 'Marcar como paga com a data e a forma, e desfazer se marcou errado; criar cobrança avulsa (exame, evento, produto)'])}` })

  // ───────────────────────────────────────────── 11a. despesa fixa
  add({ id: 'despesas', olho: 'Parte 3 · Financeiro', titulo: 'A despesa fixa entra sozinha', exemplo: true,
    lide: 'Aluguel, salários, luz, internet e contador viram linhas a pagar todo mês, no dia do vencimento, sem ninguém lembrar.',
    corpo: `${tela('despesas-fixas', [[[245, 70, 1218, 495], 1009]], 'Luz e água variam: entram pela média dos últimos 3 meses, marcadas "estimado" até alguém conferir a conta.')}
    ${verFazer(['Cada despesa com o valor, o dia, a forma e se já foi paga no mês', 'O total que se repete todo mês'],
      ['Cadastrar uma vez e esquecer; transformar em lembrete ("vence o aluguel dia 10")', 'Encerrar a despesa quando ela acabar'])}` })

  // ───────────────────────────────────────────── 11b. fechar o mês
  add({ id: 'fechar', olho: 'Parte 3 · Financeiro', titulo: 'Mês fechado, números congelados', exemplo: true,
    lide: 'Quando o mês acaba, você fecha: os números ficam guardados como foram para o contador, e ninguém muda uma linha sem reabrir o mês.',
    corpo: `${tela('fechamento', [[[245, 70, 1565, 640], 1009]], 'Setembro fechado: só leitura. Ao tentar editar, o aviso "nada foi mudado" e o caminho para reabrir com motivo.')}
    ${verFazer(['O cadeado no mês fechado, quem fechou e quando', 'Os totais congelados no rodapé'],
      ['Antes de fechar, ver o que está pendurado (linhas a pagar, cobranças em aberto) e decidir', 'Reabrir, se precisar: pede o motivo, e o motivo fica no histórico'])}` })

  // ───────────────────────────────────────────── 12. inadimplência
  const e = d.encargos
  add({ id: 'inadimplencia', olho: 'Parte 4 · Cobrança', titulo: 'Quem deve, quanto e há quantos dias', exemplo: true,
    lide: 'A lista de quem está devendo sai pronta, do maior atraso para o menor. Cobrar é um clique: abre a conversa no WhatsApp com a mensagem escrita.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 74mm;height:auto">
      <div>${tela('inadimplencia', [[[245, 85, 1005, 575], 700]], 'Em cada linha, o botão Cobrar; ao lado, a mensagem pronta, "Lembrar de cobrar" e "Anotar".')}</div>
      <div class="pilha">
        ${tela('inadimplencia', [[[1412, 74, 572, 252], 280]], '')}
        <p class="pequeno sec">A mensagem sai pronta, sem nenhum dado de saúde. Quem envia é você: o Admin não manda nada sozinho. Atraso não bloqueia o treino nem aparece para o professor.</p>
        <div class="caixa caixa--vermelha"><b class="rot">Se vocês decidirem cobrar multa e juros</b>Pergunta A3. Com 2 % de multa e 1 % ao mês (o limite da lei) e 5 dias de tolerância, uma mensalidade de ${e.valor} paga ${e.dias} dias depois do vencimento fica em <b>${e.total}</b> (multa ${e.multa}, juros ${e.juros}; conta do motor do financeiro). Acima do limite, o sistema recusa.</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 13. importar
  add({ id: 'importar', olho: 'Parte 5 · Importar e exportar', titulo: 'A planilha de vocês entra no Admin', exemplo: true,
    lide: 'Ninguém começa do zero. Você manda o arquivo (Excel ou CSV), confere como cada coluna foi lida e só então grava. Se entrou errado, desfaz a importação inteira.',
    corpo: `${tela('importar', [[[245, 70, 1735, 285], 1009], [[245, 368, 1190, 335], 690], [[1447, 368, 538, 335], 309]], 'Em cima, o que cada coluna da planilha vira (dá para trocar); embaixo, a prévia em grupos e as categorias novas para criar.')}
    <div class="caixa caixa--vermelha" style="margin-top:8px"><b class="rot">O que falta para ficar perfeito</b>A planilha que vocês usam hoje (pergunta A13), mesmo de um mês só. Com ela, o teste passa a usar o arquivo real.</div>` })

  // ───────────────────────────────────────────── 14. exportar
  add({ id: 'exportar', olho: 'Parte 5 · Importar e exportar', titulo: 'Tudo sai para o Excel quando você quiser', exemplo: true,
    lide: 'Qualquer lista do Admin vira um arquivo que abre direto no Excel, com acento certo e valor como número. É o que você leva ao contador.',
    corpo: `${tela('exportar', [[[835, 72, 1150, 260], 1009]], 'Como o Excel vai abrir: "Valor" sempre positivo, com o tipo ao lado, e "Valor (±)" com a saída negativa.')}
    <div class="tres" style="margin-top:14px">
      ${bloco('O que sai', ['A planilha do jeito que estiver filtrada, o ano inteiro ou só as linhas selecionadas', 'A lista de alunos, de devedores ou de qualquer filtro'], '', 'lista--16')}
      ${bloco('Como sai', ['Acentos certos e vírgula nos centavos', 'A SOMA da coluna "Valor (±)" dá o resultado', 'Protegido contra fórmula escondida em texto'], '', 'lista--16')}
      ${bloco('E depois', ['O arquivo que sai volta igual pela importação (isso é testado no motor)', 'Arquivo .xlsx nativo fica para depois'], '', 'lista--16')}
    </div>` })

  // ───────────────────────────────────────────── 15. relatórios: o ano
  add({ id: 'relatorio-ano', olho: 'Parte 6 · Relatórios', titulo: 'O ano inteiro, mês a mês', exemplo: true,
    lide: 'Quanto entrou, quanto saiu e o resultado de cada mês, com quantos alunos estavam matriculados e se o mês já está fechado.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 66mm;height:auto">
      <div>${tela('relatorio-ano', [[[978, 120, 1006, 545], 735]], 'A tabela do relatório do ano. Ao lado dela, na tela, o mesmo ano em gráfico de barras.')}</div>
      <div class="pilha">
        ${bloco('Os relatórios', ['Mês, ano, categoria, modalidade, forma de pagamento, professor, evento, inadimplência e funil', 'Todo relatório escolhe o período e sai para o Excel'])}
        ${bloco('O que dá para ver aqui', ['O mês no vermelho e por quê (no exemplo, a viagem do campeonato)', 'Se o número de alunos acompanha o resultado'])}
      </div>
    </div>` })

  // ───────────────────────────────────────────── 16. relatórios: modalidade, professor
  add({ id: 'relatorio-modalidade', olho: 'Parte 6 · Relatórios', titulo: 'Onde está o dinheiro', exemplo: true,
    lide: 'Qual modalidade paga o aluguel, quanto cada professor recebeu e se o evento compensou. No combo, cada modalidade conta a sua metade.',
    corpo: `<div class="lado" style="grid-template-columns:minmax(0,1fr) 78mm;height:auto">
      <div>${tela('relatorio-modalidade', [[[1200, 120, 785, 335], 700]], 'Quanto entrou de cada modalidade no trimestre, por aluno e contra o trimestre anterior. Na tela, ao lado, o mesmo em barras.')}</div>
      <div class="pilha">${bloco('O que dá para ver aqui', ['Qual modalidade paga o aluguel', 'Quanto rende cada aluno de cada modalidade', 'Se a modalidade cresceu ou caiu desde o trimestre anterior'], '', 'lista--16')}</div>
    </div>
    <div style="margin-top:10px">${tela('relatorio-modalidade', [[[245, 470, 862, 260], 496], [[1122, 470, 862, 260], 496]], 'À esquerda, quanto cada professor recebe no mês pela regra dele; à direita, se cada evento deu lucro ou prejuízo.')}</div>` })

  // ───────────────────────────────────────────── 17. filtro total
  const fz = d.filtros
  add({ id: 'filtro', olho: 'Parte 7 · Filtro total', titulo: 'Pergunte, e o Admin responde', exemplo: true,
    lide: 'Os filtros se cruzam: modalidade, plano, situação, atraso, período, categoria, professor, forma de pagamento. A pergunta aparece escrita em cima da resposta, e o filtro pode ser salvo com um nome.',
    corpo: `${tela('filtro', [[[245, 70, 1000, 255], 690], [[1572, 15, 425, 512], 300]], '"Alunos de Muay Thai com mais de 30 dias de atraso": a resposta à esquerda e o filtro aberto à direita, pronto para salvar com um nome.')}
    <div class="duas" style="margin-top:12px;grid-template-columns:1fr 1fr">
      ${bloco('Outras perguntas que ele responde', ['Quanto entrou do Jiu-Jitsu no trimestre?', 'Quantas crianças estão no Kids?', 'Quanto gastei com equipamento este ano?'], '', 'lista--16')}
      <div class="pilha">${bloco('&nbsp;', ['Quem entrou este mês?', 'Quantos alunos tem cada modalidade?'], 'bloco--sem', 'lista--16')}<p class="pequeno sec">As respostas dessas perguntas, calculadas pelo motor do financeiro, estão na página {{p:motor}}.</p></div>
    </div>` })

  // ───────────────────────────────────────────── 18. funil
  add({ id: 'funil', olho: 'Parte 8 · Funil', titulo: 'Da mensagem no WhatsApp até a matrícula', exemplo: true,
    lide: 'A aula experimental é a porta da academia. O funil mostra quem chamou, quem marcou, quem fez a aula e quem se matriculou, e de onde veio cada um.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 84mm;height:auto">
      <div>${tela('funil', [[[245, 70, 1290, 520], 680]], 'As quatro colunas do funil, com os botões de cada etapa (marcar aula, lembrar, matricular).')}
        ${verFazer(['Cada interessado na etapa em que está, com a modalidade e de onde veio', 'A conversão por origem: Instagram, WhatsApp, indicação, porta'],
          ['Matricular direto do funil, com o desconto do "Traga um amiguinho" para os dois', 'Lembrar de chamar de volta quem fez a aula e sumiu (o prazo é seu, pergunta A15)'])}</div>
      <div>${tela('funil', [[[1555, 70, 430, 672], 316]], '"Chamar de volta" e de onde vem aluno.')}</div>
    </div>` })

  // ───────────────────────────────────────────── 19. agenda
  add({ id: 'agenda', olho: 'Parte 9 · Anotar e lembrar', titulo: 'Agenda, notas e lembretes', exemplo: true,
    lide: 'O caderno do dono dentro do app. Lembrete com data e repetição ("todo dia 10"), tarefa com prazo e responsável, e nota ligada a uma pessoa ou a um valor.',
    corpo: `${tela('agenda', [[[245, 70, 1740, 565], 1009]], 'Hoje (atrasados, hoje, em breve), o calendário do mês com os vencimentos e as tarefas abertas.')}
    <div class="tres" style="margin-top:10px">
      ${bloco('O que você consegue fazer', ['Criar lembrete e tarefa num atalho (L e N no teclado)', 'Concluir: o que repete anda para a próxima data'])}
      ${bloco('Atalhos prontos', ['A despesa fixa vira lembrete mensal', 'Quem deve vira "Cobrar fulano"; quem fez a aula vira "Chamar de volta"'])}
      ${bloco('O aviso no celular', ['Às 8h: "Você tem 3 lembretes hoje", <b>sem o texto e sem valor</b>'])}
    </div>` })

  // ───────────────────────────────────────────── 20. histórico
  add({ id: 'historico', olho: 'Parte 10 · Histórico', titulo: 'Quem mexeu, no quê, e quando', exemplo: true,
    lide: 'Toda criação, mudança e arquivamento fica registrado, em frase. Quem grava é o próprio banco de dados, não a tela: ninguém pula o registro, e ninguém apaga, nem o dono.',
    corpo: `${tela('historico', [[[535, 70, 1450, 495], 1009]], 'O mais novo primeiro: valores mudados, pagamentos, importação, mês fechado e reaberto com o motivo.')}
    <div class="duas" style="margin-top:10px">
      ${bloco('Por que isso importa', ['Um pagamento não some sem deixar rastro', 'Se o valor de alguém mudou, você sabe quem mudou e quando'])}
      <div class="caixa caixa--vermelha"><b class="rot">A decidir</b>Guardar o histórico para sempre ou por 5 anos, o prazo comum para documento fiscal (pergunta A14, confirmar com o contador).</div>
    </div>` })

  // ───────────────────────────────────────────── 20b. o motor
  const pr = d.painel
  add({ id: 'motor', olho: 'Por trás das telas', titulo: 'O motor que faz as contas já existe', exemplo: true, calculado: true,
    lide: 'As telas acima são o desenho. As contas são de um motor do financeiro que já está escrito e testado. Para conferir, ele simulou um ano inteiro de outra academia de exemplo, com outros nomes e outros números, e respondeu:',
    corpo: `<div class="duas" style="grid-template-columns:1fr 1fr;gap:22px">
      <table class="tabela-16"><thead><tr><th>Em outubro, até o dia 15</th><th class="n">O motor calculou</th></tr></thead><tbody>
        <tr><td>Alunos matriculados</td><td class="n"><b>${pr.alunos.matriculados}</b></td></tr>
        <tr><td>Mensalidades geradas sozinhas em 01/10</td><td class="n"><b>${d.geracaoOut.mensalidades}</b></td></tr>
        <tr><td>Pessoas devendo, e quanto</td><td class="n"><b>${pr.inadimplentes.pessoas} · ${pr.inadimplentesTexto}</b></td></tr>
        <tr><td>Resultado até o dia 15</td><td class="n"><b>${neg(pr.mesTexto.resultado)}</b></td></tr>
        <tr><td>Previsão do fechamento de outubro</td><td class="n"><b>${pr.previsaoTexto.resultadoPrevisto}</b></td></tr>
        <tr><td>Setembro fechado</td><td class="n"><b>${d.setembro.resultadoTexto}</b></td></tr>
        <tr><td>Professores em setembro, pela regra de cada um</td><td class="n"><b>${d.professoresSetTotal}</b></td></tr>
      </tbody></table>
      <table class="tabela-16"><thead><tr><th>Você pergunta</th><th class="n">O motor responde</th></tr></thead><tbody>
        <tr><td>Alunos de Muay Thai com mais de 30 dias de atraso</td><td class="n"><b>${fz.mt30.n} · ${fz.mt30.total}</b></td></tr>
        <tr><td>Quanto entrou do Jiu-Jitsu de julho a setembro</td><td class="n"><b>${fz.jjTri}</b></td></tr>
        <tr><td>E do Boxe, no mesmo trimestre</td><td class="n"><b>${fz.boxeTri}</b></td></tr>
        <tr><td>Crianças matriculadas no Kids</td><td class="n"><b>${fz.kids}</b></td></tr>
        <tr><td>Gasto com equipamento no ano</td><td class="n"><b>${fz.equipAno.total}</b></td></tr>
        <tr><td>Quem chegou indicado e virou aluno (ago a out)</td><td class="n"><b>${d.funil3.porOrigem.find((o) => o.origem === 'Indicação')?.contMat}</b></td></tr>
        <tr><td>Planilha de exemplo importada: prontas · com erro</td><td class="n"><b>${d.importacao.resumo.prontas} · ${d.importacao.resumo.comErro}</b></td></tr>
      </tbody></table>
    </div>
    <div class="duas" style="margin-top:14px;gap:22px"><div class="caixa caixa--vermelha texto16"><b class="rot">Por que os números não são os das telas</b>As telas e o motor usam dois exemplos inventados, feitos em paralelo. Com a planilha e os preços de vocês, o painel passa a mostrar só os números de verdade, calculados por este motor.</div><div class="caixa texto16"><b class="rot">Por que o resultado até o dia 15 é negativo</b>Neste exemplo, aluguel, salários e comissões saem no começo do mês e muitas mensalidades vencem depois. Por isso o painel mostra a previsão do fechamento ao lado do resultado.</div></div>` })

  // ───────────────────────────────────────────── 21. permissões
  const S = '<span class="selo selo--ok">vê</span>', N = '<span class="ter">—</span>', D = '<span class="selo">só o dele</span>', Q = '<span class="selo selo--atencao">se você decidir</span>'
  const linhasPerm = [
    ['Horários, turmas, avisos', S, S, S, S],
    ['Presença e graduação', D, S, S, S],
    ['Cadastro e telefone do aluno', D, '<span class="selo">só da turma dele</span>', S, S],
    ['Registrar quem quer a aula experimental', N, S, S, S],
    ['Mensalidade de um aluno e se está paga', `${D} ${Q}`, N, Q, S],
    ['Quem está devendo', N, N, Q, S],
    ['Entradas, saídas e resultado do mês', N, N, N, S],
    ['Salário e comissão da equipe', N, N, N, S],
    ['Notas, lembretes e relatórios do dono', N, N, N, S],
    ['Histórico de quem mexeu', N, N, N, S],
  ]
  add({ id: 'permissoes', olho: 'Parte 11 · Permissões', titulo: 'Quem vê o quê',
    lide: 'Cada pessoa vê só o que precisa para o trabalho dela. A regra fica dentro do banco de dados: mesmo que alguém tente abrir pelo caminho errado, o banco não entrega.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 80mm;height:auto">
      <table class="tabela-16"><thead><tr><th style="width:38%"></th><th>Aluno</th><th>Professor</th><th>Recepção</th><th>Dono (Admin)</th></tr></thead>
        <tbody>${linhasPerm.map((l) => `<tr><td><b>${l[0]}</b></td>${l.slice(1).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <div class="pilha">
        <div class="caixa caixa--preta"><b class="rot" style="color:#FF8A8C">A regra principal</b>O professor nunca vê valor: nem mensalidade, nem atraso, nem salário de ninguém. O aluno em atraso treina normalmente; se a academia quiser bloquear, a decisão é sua.</div>
        <div class="caixa caixa--vermelha"><b class="rot">A decidir: a recepção lança pagamento?</b>Pergunta A1. Se sim, a recepção marca a mensalidade como paga e cadastra aluno, mas <b>não vê</b> o resultado do mês, salários, despesas, relatórios nem as suas notas. Nossa recomendação: só o dono na primeira entrega.</div>
        <div class="caixa"><b class="rot">Sócio</b>Se houver mais de um dono, os dois entram com a mesma visão, e o histórico separa o que cada um fez (pergunta A22).</div>
        <div class="caixa"><b class="rot">O aluno vê a própria mensalidade?</b>Recomendamos que sim: só as dele (ou dos filhos), sem multa e sem histórico de cobrança. Diminui o "quanto eu devo?" no balcão (pergunta A2).</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 22. segurança e LGPD
  add({ id: 'seguranca', olho: 'Segurança e LGPD', titulo: 'O dado da academia, bem guardado',
    lide: 'Dinheiro e dado de criança pedem cuidado de banco. Em linguagem simples: onde fica, quem vê, o que acontece se der problema e o que a lei pede da academia.',
    corpo: `<div class="quatro lista--16" style="grid-template-columns:repeat(3,1fr);gap:14px 18px">
      ${bloco('Onde fica', ['No Brasil: banco de dados em São Paulo, e a cópia extra também', 'Trancado: guardado criptografado e viajando criptografado entre o celular e o servidor. Quem roubasse o disco não leria nada'])}
      ${bloco('Quem vê', ['Cada um só o que é dele (página anterior), com a regra dentro do banco', 'Para entrar no Admin, duas chaves: a senha e um código de 6 números que muda a cada 30 segundos, no seu celular'])}
      ${bloco('Se der problema', ['Cópia de segurança automática todo dia', 'No plano recomendado, mais uma cópia nossa, guardada 30 dias: um erro descoberto duas semanas depois ainda tem volta', 'O histórico mostra o que foi mudado e por quem'])}
      ${bloco('Dinheiro não fica pela metade', ['Sem internet, o Admin não grava pagamento: avisa "Sem conexão: nada foi gravado" e guarda o que você digitou na tela', 'Assim dois aparelhos não marcam o mesmo pagamento duas vezes'])}
      ${bloco('Nada vaza pelo aviso', ['Aviso no celular nunca leva nome nem valor: "Você tem 3 lembretes hoje", "2 pessoas com mensalidade atrasada"', 'O sistema não grava valor em nenhum registro técnico'])}
      ${bloco('O que a LGPD pede da academia', ['A academia é a dona dos dados; o fornecedor só guarda', 'Ter uma pessoa de contato para privacidade (o "encarregado")', 'Criança só com o responsável, e foto de menor só com autorização escrita', 'Pedir só o necessário: o CPF fica de fora até uma cobrança exigir'])}
    </div>
    <div class="caixa caixa--vermelha" style="margin-top:14px"><b class="rot">Um cuidado antes de pôr os dados reais</b>O contrato de dados do fornecedor (Supabase) foi escrito para a lei europeia e não cita a LGPD. O dado fica em São Paulo, mas a empresa é de fora. Vale um advogado olhar antes.</div>` })

  // ───────────────────────────────────────────── 23. custo (os três degraus)
  const dg = ['comecar', 'recomendado', 'crescer'].map(degrau)
  const COPIA = { comecar: '1 por dia, guardada 7 dias', recomendado: '1 por dia (7 dias) + cópia nossa de 30 dias', crescer: 'volta a qualquer minuto dos últimos 7 dias + cópia de 30 dias' }
  const PERDE = { comecar: 'até 1 dia de lançamentos', recomendado: 'até 1 dia de lançamentos', crescer: 'uns 2 minutos' }
  const MAQ = { comecar: 'básica (1 GB)', recomendado: 'o dobro (2 GB)', crescer: 'o dobro (2 GB)' }
  add({ id: 'custo', olho: 'Hospedagem e custo', titulo: 'Quanto custa manter no ar',
    lide: `O que a academia paga aos fornecedores para os três apps funcionarem: o banco de dados, as lojas do iPhone e do Android e o endereço próprio. Preços de ${custos.moeda.data.split('-').reverse().join('/')}, com o dólar a ${brl(custos.moeda.cambio_usado).replace('R$ ', 'R$ ')} (já com o IOF do cartão).`,
    corpo: `<div class="degraus">
      ${dg.map((g) => `<div class="degrau ${g.recomendado ? 'degrau--rec' : ''}">
        <div class="degrau__nome">${esc(g.nome)}${g.recomendado ? '<span class="selo selo--vermelho" style="font-family:var(--texto);text-transform:none">o que recomendamos</span>' : ''}</div>
        <div class="degrau__para">${esc(g.publico)}</div>
        <div class="degrau__preco">${brl0(g.totais.mensal_brl)}<small> por mês</small></div>
        <div class="lin"><span>Por ano, com Apple e domínio</span><b>${brl0(g.totais.ano_corrente_brl)}</b></div>
        <div class="lin"><span>No primeiro ano (+ Google, uma vez)</span><b>${brl0(g.totais.primeiro_ano_brl)}</b></div>
        <div class="lin"><span>Média por mês no ano</span><b>${brl0(g.totais.media_mensal_no_ano_brl)}</b></div>
        <div class="lin"><span>Cópia de segurança</span><span style="text-align:right">${COPIA[g.id]}</span></div>
        <div class="lin"><span>Se der problema, perde</span><span style="text-align:right">${PERDE[g.id]}</span></div>
        <div class="lin"><span>Folga de máquina</span><span>${MAQ[g.id]}</span></div>
      </div>`).join('')}
    </div>
    <div class="duas" style="margin-top:12px;gap:18px">
      <div class="caixa"><b class="rot">Por que o do meio</b>Custa ${brl0(dg[1].totais.mensal_brl - dg[0].totais.mensal_brl)} a mais por mês que o Começar e resolve o ponto fraco dele: se alguém apaga um lançamento e você só percebe 15 dias depois, a cópia de 30 dias traz de volta. O Crescer custa cinco vezes mais pela "volta no tempo", que só compensa com duas unidades, e pode ser ligado depois.</div>
      <div class="caixa"><b class="rot">Por que não o plano grátis</b>O plano gratuito do banco <b>pausa depois de uma semana sem uso</b> e <b>não faz cópia de segurança nenhuma</b>. Serve para teste, não para o financeiro de uma academia. Um servidor próprio barato (R$ 30 a R$ 60) parece economia, mas alguém tem de cuidar dele toda semana.</div>
    </div>` })

  // ───────────────────────────────────────────── 24. o que se paga e para quem
  const rec = degrau('recomendado')
  const REC_NOME = { supabase_pro: 'Banco de dados, login e fotos (Supabase Pro, em São Paulo)', supabase_small: 'Máquina um tamanho acima (folga e base para a "volta no tempo")', copia_externa: 'Cópia de segurança extra, guardada 30 dias, em São Paulo', apple: 'Conta Apple, para o app estar na loja do iPhone', google: 'Conta Google Play, para a loja do Android', dominio: 'Endereço próprio .com.br (Registro.br)', eas: 'Montar o app para as lojas', push: 'Avisos no celular', email: 'E-mail de cadastro e de troca de senha', homologacao: 'Banco de testes, sem dado real' }
  const QUANDO = { mensal: 'todo mês', anual: 'todo ano', unico: 'uma vez só' }
  add({ id: 'custo-itens', olho: 'Hospedagem e custo', titulo: 'O que se paga, e para quem',
    lide: 'O plano recomendado, item por item. Quase tudo é cobrado em dólar no cartão; se o dólar muda, a conta muda junto.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 84mm;height:auto">
      <table class="tabela-16"><thead><tr><th>O quê</th><th class="n">Em dólar</th><th class="n">Em reais</th><th>Quando</th></tr></thead><tbody>
        ${rec.itens.map((i) => `<tr><td>${esc(REC_NOME[i.id] ?? i.nome)}</td><td class="n">${i.usd == null ? '—' : `US$ ${i.usd}`}</td><td class="n"><b>${i.brl ? brl(i.brl) : 'grátis'}</b></td><td>${i.brl ? QUANDO[i.recorrencia] : '—'}</td></tr>`).join('')}
      </tbody><tfoot><tr><td>Total por mês</td><td class="n">US$ ${rec.totais.mensal_usd}</td><td class="n">${brl(rec.totais.mensal_brl)}</td><td></td></tr>
        <tr><td style="font-weight:400">Por ano (12 meses + Apple + domínio)</td><td></td><td class="n">${brl(rec.totais.ano_corrente_brl)}</td><td></td></tr></tfoot></table>
      <div class="pilha">
        <div class="caixa caixa--preta"><b class="rot" style="color:#FF8A8C">Duas contas diferentes</b><b>Infraestrutura</b> é o que está nesta página: o que a academia paga todo mês e todo ano aos fornecedores.<br><br><b>Desenvolvimento e manutenção</b> (construir, corrigir, atualizar, acompanhar o sistema) <b>é outra conta, a combinar com o Alex</b>. Ela não está em nenhum número deste documento.</div>
        <div class="caixa"><b class="rot">Os grátis têm limite</b>E-mail: até 3.000 por mês. Avisos no celular: sem custo. Montar o app: 15 vezes por mês para cada loja. Folgado para uma academia.</div>
        <p class="pequeno ter">Preços pesquisados nos sites dos fornecedores em ${custos.moeda.data.split('-').reverse().join('/')}. O valor da Apple em reais só aparece na hora da inscrição.</p>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 25. decidir (travam)
  const q = (cod, pergunta, rec) => `<div class="pergunta"><div class="pergunta__q"><span class="cod">${cod}</span>${pergunta}</div><div class="pergunta__r">${rec}</div></div>`
  add({ id: 'decidir', olho: 'O que a academia precisa decidir', titulo: 'Sete respostas que destravam a construção',
    lide: 'Sem elas, o Admin anda com valores de exemplo. Cada uma tem a nossa sugestão; a decisão é de vocês.',
    corpo: `<div class="perguntas">
      ${q('A13', 'Podem mandar a planilha que vocês usam hoje?', 'Pode ser de um mês só, em Excel, ou até uma foto se for de papel. <b>É a mais útil de todas:</b> com ela, a importação é testada com o arquivo de verdade.')}
      ${q('A18', 'Quais planos vocês vendem, e por quanto?', 'Por modalidade, vezes na semana, combo, Kids, trimestral, e se existe taxa de matrícula. <b>Os preços deste documento são inventados.</b>')}
      ${q('A19', 'Como a equipe é paga hoje?', 'Fixo, comissão sobre a modalidade, por aula, ou uma mistura? Quem é CLT, MEI ou autônomo? <b>O Admin calcula; não faz folha de pagamento.</b>')}
      ${q('A7', 'Quem entra no dia 21 paga o mês cheio?', 'Ou só a parte do mês, ou começa a pagar no mês seguinte? <b>Sugestão:</b> mês cheio, e o vencimento passa a ser o dia da matrícula. É o mais fácil de explicar no balcão.')}
      ${q('A3', 'Vocês cobram multa e juros de quem atrasa?', 'Se sim, quanto e com quantos dias de tolerância? <b>Sugestão:</b> 2 % de multa e 1 % ao mês, o limite da lei, com 5 dias de tolerância, confirmado com o contador.')}
      ${q('A1', 'A recepção pode marcar mensalidade como paga?', 'Se sim, ela não vê resultado, salários nem despesas. <b>Sugestão:</b> só o dono na primeira entrega; a porta fica pronta para depois.')}
      ${q('A23', 'O Admin pode ser um app que abre no navegador?', 'Abre no computador e no celular, com ícone na tela inicial, <b>sem passar pela loja</b>. É o melhor jeito de ter uma planilha de verdade dentro dele. <b>Sugestão:</b> sim.')}
      <div class="pergunta" style="background:var(--fundo)"><div class="pergunta__q">E outras, sem pressa</div><div class="pergunta__r">Desconto de família e do "Traga um amiguinho", reajuste de preço, pagamento parcial, Pix e boleto automáticos (sugestão: depois), guardar CPF (sugestão: não). São 24 ao todo, todas com sugestão.</div></div>
    </div>` })

  // ───────────────────────────────────────────── 26. decidir (hospedagem e dados)
  add({ id: 'decidir-2', olho: 'O que a academia precisa decidir', titulo: 'Contas, contrato e privacidade',
    lide: 'Antes de pôr os dados reais no ar: em nome de quem ficam as contas, quem olha o contrato e quem responde pela privacidade.',
    corpo: `<div class="perguntas">
      ${q('1', 'Em nome de quem ficam as contas?', 'Banco de dados, Apple, Google e o endereço .com.br: da academia, com CNPJ, ou do Alex? A Apple pede um número de cadastro da empresa (D-U-N-S) para conta de empresa.')}
      ${q('2', 'Um advogado pode olhar o contrato de dados?', 'O contrato do fornecedor do banco foi escrito para a lei europeia e não cita a LGPD. O dado fica em São Paulo, mas a empresa é de fora do país.')}
      ${q('3', 'Quem será o encarregado de privacidade?', 'Pode ser o dono ou alguém da recepção, com um e-mail público para os alunos. Empresa pequena às vezes é dispensada, mas dado de criança costuma tirar a dispensa.')}
      ${q('4', 'Quando ligar a "volta no tempo"?', 'Só faz sentido com duas unidades ou muita gente lançando ao mesmo tempo. Liga pelo painel, sem mudar o app.')}
      ${q('A24', 'Professores e atletas aceitam aparecer com o nome real?', 'Até cada um autorizar, os exemplos usam nomes inventados. Foto de criança só com autorização escrita do responsável.')}
      ${q('Marca', 'Podem mandar o logo em alta resolução?', 'O logo deste documento foi redesenhado a partir das fotos do Instagram e é provisório. O arquivo original da academia entra no lugar.')}
    </div>` })

  // ───────────────────────────────────────────── 27. próximos passos
  add({ id: 'passos', olho: 'Próximos passos', titulo: 'Do sim até o Admin no ar',
    lide: 'O Admin é a primeira entrega. O prazo de cada etapa se combina com o Alex quando as respostas das páginas anteriores chegarem: elas é que destravam a construção.',
    corpo: `<div class="passos">
      ${[['Vocês respondem', 'As sete perguntas, a planilha atual e os preços reais.', 'Academia', true],
        ['Telas desenhadas', 'Feito: as telas deste documento, na marca da Raça Fight. Faltam os ajustes que vocês pedirem.', 'Alex', false],
        ['Admin construído', 'Com a sua planilha importada e os seus planos e preços.', 'Alex', false],
        ['Um mês em paralelo', 'Vocês usam o Admin e a planilha juntos por um mês, para conferir que os números batem.', 'Academia e Alex', false],
        ['No ar', 'A planilha se aposenta. Depois vêm o app do aluno e o do professor, ligados ao mesmo banco.', 'Todos', false]]
        .map(([t, txt, quem, agora], i) => `<div class="passo ${agora ? 'passo--agora' : ''}"><div class="passo__n">${i + 1}</div><h4>${t}</h4><p>${txt}</p><p class="quem">${quem}</p></div>`).join('')}
    </div>
    <div class="duas" style="margin-top:22px;grid-template-columns:1fr 92mm;gap:20px;align-items:stretch">
      <div class="pilha">
        ${bloco('O que já está pronto', ['A especificação completa do Admin e o desenho das telas, no computador e no celular', 'O motor do financeiro, testado: gera mensalidade, calcula comissão, fecha o mês, lê a planilha. Foi ele que calculou os números da página {{p:motor}}', 'A escolha da hospedagem, com o custo de cada degrau'], '', 'lista--16')}
        <div class="caixa caixa--vermelha"><b class="rot">O pedido de hoje</b>Se a proposta faz sentido, o primeiro passo é mandar a planilha atual e a lista de planos e preços. Com isso, a próxima versão deste documento já sai com os números de vocês.</div>
      </div>
      <div style="border-radius:12px;background:#000 50% 30% / cover no-repeat url('${x.fotoAcademia}');min-height:250px"></div>
    </div>` })

  return pgs
}
