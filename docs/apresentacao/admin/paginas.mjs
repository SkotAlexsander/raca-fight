// As páginas do PDF do admin (agente AR, 15/10/2026). Cada página é um objeto; o montar.mjs põe o rodapé, numera e imprime.
// TODO número vem de `d` (o _dados/dados.json que o dados.mjs calcula com o domínio financeiro) ou de `x.custos`
// (docs/hospedagem/custos.json, do AQ). Nada de valor digitado aqui.
//
// Agente AV, 16/10/2026: as telas agora são o Admin CONSTRUÍDO (admin/), capturado por capturar-admin.mjs em
// _capturas/admin/<id>.jpg (2040 × 790, escala 1,5; celular 390 × 844, escala 2). A versão com as telas desenhadas
// pelo AK ficou em paginas-telas-ak.mjs. Os números das telas são os do exemplo do Admin (admin/src/dados/local/exemplo.ts),
// calculados pelo domínio; os de `d` (dados.mjs) só aparecem nas edições da p. "colar" e na conta de multa e juros.

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
  /** Quadro de tela: recortes da captura do Admin (_capturas/admin/<id>.jpg, 2040 × 790 em CSS).
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
    return `<figure class="quadro"><div class="recortes ${pilha ? 'recortes--pilha' : ''}">${rs}</div>${legenda ? `<figcaption class="legenda"><b>Tela do Admin, rodando com dados de exemplo.</b> ${legenda}</figcaption>` : ''}</figure>`
  }
  /** Tela inteira do celular (captura de 390 × 844), com a legenda curta embaixo. */
  const cel = (id, legenda, largura = 196) => {
    const cap = x.captura(id)
    if (!cap) { x.faltou(id); return `<div class="caixa caixa--atencao"><b class="rot">Falta a captura</b>${esc(id)}</div>` }
    return `<figure class="quadro" style="width:${largura}px"><div class="recorte" style="width:${largura}px;height:${Math.round(largura * 844 / 390)}px;border-radius:14px"><img src="${cap}" alt="" style="width:${largura}px;left:0;top:0"></div><figcaption class="legenda" style="text-align:center"><b>${esc(legenda)}</b></figcaption></figure>`
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
      <p class="capa__olho">Proposta · ${x.data.slice(0, 2)} de outubro de 2026</p>
      <h1 class="capa__titulo">O painel<br>do <em>dono</em></h1>
      <p class="capa__sub">Tudo o que a planilha faz hoje, e o que ela não faz: a mensalidade que se gera sozinha, quem está devendo, quanto cada modalidade rende e o mês fechado sem conta à mão.</p>
      <div class="capa__ficha">
        <div><b>Para</b>Raça Fight Gravataí</div>
        <div><b>O quê</b>O app do dono (Admin)</div>
        <div><b>Junto com</b>o app do aluno e o do professor</div>
        <div><b>Situação</b>construído, com dados de exemplo; falta o servidor</div>
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
          `<b>A mensalidade sai pronta.</b> Um botão gera as do mês, com o desconto de cada um. Você só marca quem pagou.`,
          `<b>Quem deve, na hora.</b> A lista de quem está atrasado, do maior atraso para o menor, com a mensagem de WhatsApp pronta.`,
          `<b>O mês fechado sem calculadora.</b> Quanto entrou, quanto saiu, o resultado, a previsão e a comissão de cada professor.`,
          `<b>A planilha cabe aqui dentro.</b> Ele lê a planilha que vocês já usam e devolve para o Excel quando você quiser.`,
          `<b>Nada some.</b> Toda mudança fica registrada: quem fez, quando e de quanto para quanto.`,
        ].map((t) => t), 'lista--16')}
        <div class="caixa caixa--vermelha"><b class="rot">Sobre as telas e os números</b>As telas são o Admin construído, com uma academia de exemplo: nomes, preços e regras inventados. O servidor dos dados reais ainda não existe (p. {{p:motor}}).</div>
      </div>
      <div class="bloco bloco--cinza"><h3>O que tem aqui</h3>
        <ol class="sumario" style="columns:1">
          ${[['tres-apps', 'Os três apps e o que cada um vê'], ['painel', 'Painel: a academia numa tela'], ['alunos', 'Alunos, responsáveis e a família'], ['funcionarios', 'Equipe e o pagamento dela'],
            ['grade', 'Financeiro: a planilha, colar e os atalhos do Excel'], ['mensalidades', 'As mensalidades do mês'], ['despesas', 'Despesa fixa e fechar o mês'], ['inadimplencia', 'Cobrança e inadimplência'], ['importar', 'Importar a planilha (até a de três colunas) e exportar'],
            ['relatorio-ano', 'Relatórios'], ['filtro', 'Filtro total'], ['funil', 'Funil da aula experimental'], ['turmas', 'Turmas e horários'], ['agenda', 'Agenda, notas e lembretes'], ['historico', 'Histórico de quem mexeu'], ['motor', 'O que já roda e o que falta'], ['permissoes', 'Quem vê o quê'],
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
          <tr><th>2</th><td>01/10</td><td>Mensal Breno</td><td class="n">150,00</td><td></td></tr>
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
    corpo: `${tela('painel', [[[600, 62, 1400, 700], 1009]], 'À esquerda, fora do recorte: alunos por modalidade e a equipe.')}
    <p class="texto16" style="margin-top:8px">O resultado até hoje vem com a <b>previsão do fechamento ao lado</b>. A comparação é sempre <b>no mesmo trecho</b> do mês anterior (1 a 15/09 contra 1 a 15/10), e setembro inteiro aparece à parte. Embaixo, os 12 meses; à direita, quem deve e o que fazer hoje.</p>` })

  // ───────────────────────────────────────────── 6. alunos
  add({ id: 'alunos', olho: 'Parte 2 · Pessoas', titulo: 'Alunos e responsáveis do Kids', exemplo: true,
    lide: 'Todo mundo que treina está aqui, mesmo quem nunca instalou o app. Criança entra com o responsável, que é quem paga e quem recebe a cobrança.',
    corpo: `${tela('pessoas', [[[535, 70, 1450, 525], 1009]], 'A frase do filtro fica em cima da tabela; os filtros salvos e as caixas de marcar ficam à esquerda, fora do recorte.')}
    ${verFazer(['Nome, plano, modalidades, responsável, dia de vencimento e se a cobrança está em dia', 'A ficha da pessoa: contato, matrículas, descontos, cobranças, notas e histórico'],
      ['Cadastrar aluno, criança com responsável, e matricular num plano com o dia de vencimento', 'Trancar por um período (viagem, lesão): no trancamento não sai cobrança. O desconto de família é <b>sugerido</b>; quem aplica é você'])}` })

  // ───────────────────────────────────────────── 7. família
  add({ id: 'familia', olho: 'Parte 2 · Pessoas', titulo: 'A família paga tudo de uma vez', exemplo: true,
    lide: 'Na ficha do responsável ficam os filhos e todas as cobranças da família. Com duas ou mais em aberto, um botão marca todas como pagas.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 92mm;height:auto">
      <div>${tela('ficha-kids', [[[245, 70, 1222, 400], 640]], 'Antes: duas mensalidades do Miguel em atraso, R$ 220,00 em aberto e o botão "Marcar as 2 como pagas".')}
        ${tela('ficha-kids-paga', [[[762, 70, 705, 340], 400], [[830, 615, 340, 52], 230]], 'Depois: as duas pagas, no mesmo clique, e o aviso.', false)}</div>
      <div class="pilha">
        ${bloco('Tudo ou nada', ['As duas cobranças ficam pagas juntas. Se uma falhar, nenhuma fica paga: não existe família "meio paga"', 'O mesmo vale para matricular quem veio do funil: a pessoa, a matrícula e as cobranças entram juntas ou não entram'], '', 'lista--16')}
        <div class="caixa"><b class="rot">Clique duplo não paga duas vezes</b>Enquanto grava, o botão fica desligado. O segundo clique é ignorado.</div>
        <div class="caixa caixa--vermelha"><b class="rot">Hoje</b>O pagamento vai como Pix, com a data de hoje. Para outra forma, marque uma por uma.</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 8. funcionários
  add({ id: 'funcionarios', olho: 'Parte 2 · Pessoas', titulo: 'A equipe e o pagamento dela', exemplo: true,
    lide: 'Cada pessoa da equipe tem a função, as modalidades que dá e a regra de pagamento. O Admin calcula quanto cada um ganhou no mês.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 72mm;height:auto">
      <div>${tela('funcionarios', [[[245, 70, 1035, 410], 712], [[1295, 290, 690, 290], 470]], 'Em cima, a equipe com o ganho de outubro calculado; embaixo, a conta de uma professora com fixo + comissão.', true)}</div>
      <div class="pilha">
        ${bloco('O que você vê', ['Quem é da equipe, a função e desde quando', 'A regra de cada um: fixo, comissão, por aula ou fixo + comissão', 'Quanto cada um ganhou no mês, já calculado'])}
        ${bloco('O que você consegue fazer', ['Cadastrar, mudar a regra e desligar alguém', 'Conferir a conta e lançar como saída com um clique: o Admin calcula, quem paga é você'])}
        <div class="caixa"><b class="rot">Comissão justa no combo</b>O aluno do combo conta metade para cada modalidade.</div>
        <div class="caixa caixa--vermelha"><b class="rot">A decidir</b>Como a equipe é paga hoje (pergunta A19). As regras da tela são de exemplo. O Admin não faz folha de pagamento.</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 9. a grade
  add({ id: 'grade', olho: 'Parte 3 · Financeiro', titulo: 'A planilha, agora dentro do app', exemplo: true,
    lide: 'Cada entrada e cada saída é uma linha, como no Excel, editada direto na célula. Os totais embaixo se refazem na hora.',
    corpo: `${tela('lancamentos', [[[245, 70, 1745, 655], 1009]], 'Uma linha marcada (a faixa vermelha em cima mostra a soma e as ações em lote) e a célula ativa de borda vermelha. As mensalidades em aberto têm o botão "Marcar como paga".')}
    ${verFazer(['As linhas do mês, com os totais sempre à vista: entrou, saiu, resultado e o que falta receber e pagar', 'As mensalidades geradas entram sozinhas, prontas para marcar como pagas'],
      ['Lançar e editar só pelo teclado (Enter, Tab, setas); marcar várias linhas e mudar todas de uma vez', '"Apagar" é arquivar: a linha sai da conta, mas não some do histórico'])}` })

  // ───────────────────────────────────────────── 10. colar do Excel
  add({ id: 'colar', olho: 'Parte 3 · Financeiro', titulo: 'Colar linhas do Excel, sem nada entrar errado', exemplo: true,
    lide: 'Cole linhas copiadas do Excel: antes de gravar, o Admin mostra a prévia e marca a célula com erro. Só grava quando você confirma.',
    corpo: `${tela('colar', [[[245, 70, 1745, 375], 1009]], 'Oito linhas coladas: seis prontas e duas com erro (31/09 não existe; "12,345" não é valor). Nada foi gravado ainda.')}
    <div class="tres" style="margin-top:12px;grid-template-columns:1.1fr 1fr 1fr">
      ${bloco('Você digita, o app entende', `<p class="pequeno">${d.edicoes.map((e) => `<code style="font:600 13px var(--mono)">${esc(e.digitou)}</code> → ${e.vira.startsWith('não grava') ? '<span class="neg">não grava</span>' : esc(e.vira)}`).join(' · ')}</p><p class="pequeno ter" style="margin-top:4px">Conferido no motor do financeiro, com estas mesmas entradas.</p>`)}
      ${bloco('Desfazer e refazer', ['Ctrl+Z desfaz e Ctrl+Y refaz', 'Colar 8 linhas conta como uma ação só'], '', 'lista--16')}
      ${bloco('Errar sem medo', ['Célula com erro fica vermelha e não grava', 'Mês fechado não muda sem reabrir, e reabrir pede o motivo'], '', 'lista--16')}
    </div>` })

  // ───────────────────────────────────────────── 11. como no Excel: coluna e Ctrl+D
  add({ id: 'excel', olho: 'Parte 3 · Financeiro', titulo: 'Os atalhos do Excel funcionam aqui', exemplo: true,
    lide: 'Quem vem da planilha não precisa reaprender. Colar uma coluna, preencher para baixo, apagar com Delete: cada um é uma ação só, e um Ctrl+Z desfaz tudo.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 78mm;height:auto">
      <div class="pilha">
        ${tela('colar-coluna', [[[245, 120, 1290, 185], 690], [[755, 616, 490, 50], 300]], '<b>Colar uma coluna.</b> Quatro formas de pagamento copiadas do Excel, coladas na coluna Forma: preenchem as linhas de baixo, como no Excel.', true)}
        ${tela('ctrl-d', [[[245, 120, 1290, 185], 690], [[805, 618, 390, 50], 240]], '<b>Ctrl+D.</b> Marcou da linha 1 até a 4 na coluna Forma: o "Pix" de cima desceu para as outras três.', true)}
      </div>
      <div class="pilha">
        ${bloco('O que mais funciona como no Excel', ['<b>Delete</b> limpa a célula; com linhas marcadas, arquiva', '<b>Ctrl+C</b> copia com a saída negativa: a SOMA no Excel dá o resultado', '<b>Ctrl+A</b> marca a grade inteira', 'Um valor colado num intervalo vai para todas as células dele', 'Clicar noutra célula grava a edição e vai para ela'], '', 'lista--16')}
        <div class="caixa caixa--vermelha"><b class="rot">Ainda não tem</b>Fórmula na célula ("=150*2"), ordenar clicando no cabeçalho e imprimir o mês. Estão na lista de sugestões.</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 12. filtro por pessoa e valor, busca
  add({ id: 'achar', olho: 'Parte 3 · Financeiro', titulo: 'Achar qualquer linha: por pessoa, por valor', exemplo: true,
    lide: 'Na planilha, o filtro aceita a pessoa e uma faixa de valor, além de tipo, situação, categoria e forma. Cada filtro ligado vira uma etiqueta em cima da grade, que sai com um clique.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 98mm;height:auto">
      <div>${tela('filtro-lanc-aplicado', [[[245, 70, 1100, 200], 610]], 'Entradas da Talita Sá entre R$ 100 e R$ 200: sobra uma linha, a mensalidade de MMA. As etiquetas em cima dizem o filtro inteiro.')}
        ${tela('filtro-lanc', [[[1572, 0, 428, 290], 330]], 'A gaveta do filtro: pessoa e valor "de / até".')}</div>
      <div class="pilha">
        ${tela('busca', [[[1020, 0, 555, 400], 370]], '<b>Ctrl+K</b>, em qualquer tela: pessoas, cobranças, lançamentos e notas numa busca só.')}
        <p class="pequeno sec">A pessoa se escreve pelo nome inteiro ou pelo começo dele em palavras inteiras ("Talita", "Talita Sá"). Com dois nomes que batem, o Admin pede mais e não adivinha.</p>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 13. mensalidades
  add({ id: 'mensalidades', olho: 'Parte 3 · Financeiro', titulo: 'A mensalidade se gera sozinha', exemplo: true,
    lide: 'O Admin olha cada matrícula e cria a cobrança do mês, com o desconto e o dia de vencimento de cada aluno. Quando alguém paga, você marca, e a entrada aparece na planilha.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 62mm;height:auto">
      <div>${tela('cobrancas-lista', [[[245, 75, 1325, 485], 760]], 'As cobranças de outubro, por situação. Na Kids, quem paga é o responsável.')}</div>
      <div>${tela('cobrancas', [[[1572, 15, 425, 470], 222]], 'A gaveta "Marcar como paga".')}</div>
    </div>
    ${verFazer(['Cada cobrança com a situação calculada: a vencer, vence hoje, atrasada ou paga', 'O desconto ao lado (família, funcionário); no combo, o valor já vem dividido entre as modalidades'],
      ['Gerar o mês no botão (gerar duas vezes não duplica nada)', 'Marcar como paga com a data e a forma, e desfazer se marcou errado. Data futura é recusada; valor maior que o esperado pede confirmação'])}` })

  // ───────────────────────────────────────────── 14. despesa fixa
  add({ id: 'despesas', olho: 'Parte 3 · Financeiro', titulo: 'A despesa fixa entra sozinha', exemplo: true,
    lide: 'Aluguel, salários, luz, internet e contador viram linhas a pagar todo mês, no dia do vencimento, sem ninguém lembrar.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 70mm;height:auto">
      <div>${tela('despesas-fixas', [[[245, 70, 1218, 530], 715]], 'Luz e água variam: entram pela média dos últimos 3 meses, marcadas "estimado" até alguém conferir a conta.')}</div>
      <div class="pilha">
        ${bloco('O que você vê', ['Cada despesa com o valor, o dia, a forma e se já foi paga no mês', 'O total que se repete todo mês'])}
        ${bloco('O que você consegue fazer', ['Cadastrar uma vez e esquecer', '"Conferir a conta": troca o valor estimado do mês pelo da conta, sem mexer nos meses seguintes', '"Lembrar todo mês": vira lembrete na agenda'])}
        <div class="caixa caixa--vermelha"><b class="rot">A decidir</b>Gerar sozinho no dia 1 está desligado até a resposta da pergunta A6.</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 15. fechar o mês
  add({ id: 'fechar', olho: 'Parte 3 · Financeiro', titulo: 'Mês fechado, números congelados', exemplo: true,
    lide: 'Quando o mês acaba, você fecha: os números ficam guardados como foram para o contador, e ninguém muda uma linha sem reabrir o mês.',
    corpo: `${tela('fechamento', [[[245, 70, 1745, 360], 1009]], 'Os 13 meses: outubro aberto, os outros fechados, com quem fechou e quando.')}
    ${tela('fechado', [[[245, 70, 1745, 135], 1009]], 'Setembro na planilha: só leitura. Ao tentar editar, o aviso "nada foi mudado" e o caminho para reabrir com motivo.')}
    <p class="texto16" style="margin-top:8px">Antes de fechar, o Admin mostra o que está pendurado (linhas a pagar, cobranças em aberto). Reabrir pede o motivo, e o motivo fica no histórico.</p>` })

  // ───────────────────────────────────────────── 16. inadimplência
  const e = d.encargos
  add({ id: 'inadimplencia', olho: 'Parte 4 · Cobrança', titulo: 'Quem deve, quanto e há quantos dias', exemplo: true,
    lide: 'A lista de quem está devendo sai pronta, do maior atraso para o menor. Cobrar é um clique: abre a conversa no WhatsApp com a mensagem escrita.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 84mm;height:auto">
      <div>${tela('inadimplencia', [[[245, 120, 1150, 560], 662]], 'Em cada linha, o botão Cobrar. Família aparece numa linha só ("Miguel (Kids)", setembro e outubro).')}</div>
      <div class="pilha">
        ${tela('inadimplencia', [[[1410, 120, 575, 395], 318]], '')}
        <p class="pequeno sec">A mensagem sai pronta, sem dado de saúde. Quem envia é você: o Admin não manda nada sozinho. Atraso não bloqueia o treino nem aparece para o professor.</p>
        <div class="caixa caixa--vermelha"><b class="rot">Se vocês decidirem cobrar multa e juros</b>Pergunta A3. Hoje está desligado. Com 2 % de multa e 1 % ao mês (o limite da lei) e 5 dias de tolerância, uma mensalidade de ${e.valor} paga ${e.dias} dias depois do vencimento fica em <b>${e.total}</b> (conta do motor do financeiro).</div>
      </div>
    </div>` })

  // ───────────────────────────────────────────── 17. importar
  add({ id: 'importar', olho: 'Parte 5 · Importar e exportar', titulo: 'A planilha de vocês entra no Admin', exemplo: true,
    lide: 'Ninguém começa do zero. Você manda o arquivo (Excel ou CSV), confere como cada coluna foi lida e só então grava. Se entrou errado, desfaz a importação inteira.',
    corpo: `${tela('importar', [[[245, 70, 1740, 240], 1009], [[245, 332, 1185, 385], 690], [[1447, 332, 538, 385], 309]], 'Em cima, o que cada coluna da planilha vira (dá para trocar); embaixo, a prévia em grupos e as categorias novas para criar. A linha com 31/09 fica de fora, com o motivo.')}
    <div class="caixa caixa--vermelha" style="margin-top:8px"><b class="rot">O que falta para ficar perfeito</b>A planilha que vocês usam hoje (pergunta A13), mesmo de um mês só. A importação foi testada com planilhas montadas por nós.</div>` })

  // ───────────────────────────────────────────── 18. a planilha curta
  add({ id: 'importar-curta', olho: 'Parte 5 · Importar e exportar', titulo: 'Até a planilha de três colunas entra', exemplo: true,
    lide: 'Muita academia anota só "Data · Aluno · Valor". O Admin entende: pergunta se as linhas são entradas ou saídas, acha o aluno no cadastro e escreve a descrição.',
    corpo: `${tela('importar-curta', [[[245, 130, 1740, 250], 1009]], 'Seis linhas coladas do Excel, sem tipo e sem descrição. A pergunta em cima responde por todas: "Entradas (o que recebi)".')}
    <div class="duas" style="margin-top:10px;grid-template-columns:minmax(0,1fr) 78mm;gap:18px">
      ${tela('importar-curta', [[[245, 410, 1185, 300], 700]], 'Cada linha vira uma entrada com o nome do aluno. Quem não está no cadastro ("Marcos Antunes") não trava: o nome vai na observação.')}
      <div class="pilha">${bloco('E o que mais ela aceita', ['"+150,00" e "150,00 D" do extrato do banco', 'Data com hora, da maquininha ("05/10/2026 14:30")', 'A linha "TOTAL" no fim da planilha, que sai sozinha'], '', 'lista--16')}</div>
    </div>` })

  // ───────────────────────────────────────────── 19. exportar
  add({ id: 'exportar', olho: 'Parte 5 · Importar e exportar', titulo: 'Tudo sai para o Excel quando você quiser', exemplo: true,
    lide: 'Qualquer lista do Admin vira um arquivo que abre direto no Excel, com acento certo e valor como número. É o que você leva ao contador.',
    corpo: `${tela('exportar', [[[835, 72, 1150, 260], 1009]], 'Como o Excel vai abrir: "Valor" sempre positivo, com o tipo ao lado, e "Valor (±)" com a saída negativa.')}
    <div class="tres" style="margin-top:14px">
      ${bloco('O que sai', ['O mês ou o ano inteiro', 'A planilha do jeito que estiver filtrada, a lista de alunos, de devedores ou de qualquer relatório'], '', 'lista--16')}
      ${bloco('Como sai', ['Acentos certos e vírgula nos centavos', 'A SOMA da coluna "Valor (±)" dá o resultado', 'Protegido contra fórmula escondida em texto'], '', 'lista--16')}
      ${bloco('E depois', ['O arquivo que sai volta igual pela importação', 'Arquivo .xlsx nativo fica para depois'], '', 'lista--16')}
    </div>` })

  // ───────────────────────────────────────────── 20. relatórios: o ano
  add({ id: 'relatorio-ano', olho: 'Parte 6 · Relatórios', titulo: 'O ano inteiro, mês a mês', exemplo: true,
    lide: 'Quanto entrou, quanto saiu e o resultado de cada mês, com quantos alunos estavam matriculados e se o mês já está fechado.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 66mm;height:auto">
      <div>${tela('relatorio-ano', [[[978, 120, 1006, 545], 735]], 'A tabela do relatório do ano. Ao lado dela, na tela, o mesmo ano em barras.')}</div>
      <div class="pilha">
        ${bloco('Os relatórios', ['Mês, ano, categoria, modalidade, forma de pagamento, professor, evento, inadimplência e funil', 'Todo relatório sai para o Excel'])}
        ${bloco('O que dá para ver aqui', ['O mês no vermelho (no exemplo, julho)', 'Se o número de alunos acompanha o resultado'])}
      </div>
    </div>` })

  // ───────────────────────────────────────────── 21. relatórios: modalidade, professor
  add({ id: 'relatorio-modalidade', olho: 'Parte 6 · Relatórios', titulo: 'Onde está o dinheiro', exemplo: true,
    lide: 'Qual modalidade paga o aluguel, quanto cada professor recebe e se o evento compensou. No combo, cada modalidade conta a sua metade.',
    corpo: `<div class="lado" style="grid-template-columns:minmax(0,1fr) 78mm;height:auto">
      <div>${tela('relatorio-modalidade', [[[1200, 120, 785, 335], 700]], 'Quanto entrou de cada modalidade no período, por aluno, e contra o mesmo trecho do período anterior.')}</div>
      <div class="pilha">${bloco('O que dá para ver aqui', ['Qual modalidade paga o aluguel', 'Quanto rende cada aluno de cada modalidade', 'Se a modalidade cresceu ou caiu'], '', 'lista--16')}</div>
    </div>
    <div style="margin-top:10px">${tela('relatorio-modalidade', [[[245, 470, 862, 265], 496], [[1122, 470, 862, 265], 496]], 'À esquerda, quanto cada professor recebe no mês pela regra dele; à direita, cada evento com o que entrou e saiu.')}</div>` })

  // ───────────────────────────────────────────── 22. filtro total
  add({ id: 'filtro', olho: 'Parte 7 · Filtro total', titulo: 'Pergunte, e o Admin responde', exemplo: true,
    lide: 'Os filtros se cruzam: modalidade, plano, situação, atraso, desconto, data de entrada. A pergunta aparece escrita em cima da resposta, e o filtro pode ser salvo com um nome.',
    corpo: `${tela('filtro', [[[535, 140, 1035, 400], 690, 'brightness(2.2)'], [[1572, 15, 425, 512], 300]], '"Matriculados com mais de 30 dias de atraso": a resposta à esquerda (clareada aqui; na tela ela fica escurecida atrás do filtro) e o filtro aberto à direita, pronto para salvar com um nome.')}
    <div class="duas" style="margin-top:12px;grid-template-columns:1fr 1fr">
      ${bloco('Outras perguntas que ele responde', ['Quantas crianças estão no Kids?', 'Quem entrou este mês?', 'Quantos alunos tem cada modalidade?'], '', 'lista--16')}
      ${bloco('Filtros salvos', ['Ficam à esquerda da lista de alunos, com a contagem ao lado: "Inadimplentes há mais de 30 dias · 9"', 'Toda lista filtrada sai para o Excel'], '', 'lista--16')}
    </div>` })

  // ───────────────────────────────────────────── 23. funil
  add({ id: 'funil', olho: 'Parte 8 · Funil', titulo: 'Da mensagem no WhatsApp até a matrícula', exemplo: true,
    lide: 'A aula experimental é a porta da academia. O funil mostra quem chamou, quem marcou, quem fez a aula e quem se matriculou, e de onde veio cada um.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 84mm;height:auto">
      <div>${tela('funil', [[[245, 70, 1290, 520], 680]], 'As quatro colunas do funil, com os botões de cada etapa (marcar aula, compareceu, matricular).')}
        ${verFazer(['Cada interessado na etapa em que está, com a modalidade e de onde veio', 'A conversão por origem: Instagram, WhatsApp, indicação, porta'],
          ['Marcar a aula escolhendo um horário da grade de verdade; matricular direto do funil', 'Lembrar de chamar de volta quem fez a aula e sumiu (o prazo é seu, pergunta A15)'])}</div>
      <div>${tela('funil', [[[1555, 118, 430, 580], 316]], '"Chamar de volta", com lembrete pronto.')}</div>
    </div>` })

  // ───────────────────────────────────────────── 24. turmas e horários
  add({ id: 'turmas', olho: 'Parte 9 · Turmas', titulo: 'Turmas e horários, a grade do cartaz', exemplo: true,
    lide: 'A grade da academia mora no Admin. O que você muda aqui aparece nos horários do app do aluno e nas aulas do professor.',
    corpo: `<div class="lado lado--largo" style="grid-template-columns:minmax(0,1fr) 70mm;height:auto">
      <div>${tela('turmas', [[[245, 170, 1000, 290], 690]], 'A semana, dia a dia, de segunda a quinta (sexta e sábado ficam à direita, fora do recorte): as 11 turmas do cartaz atual da Raça Fight.')}
        ${tela('turmas', [[[245, 485, 1240, 220], 690]], 'A lista, com modalidade, público e professor (de exemplo).')}</div>
      <div>${tela('turmas-gaveta', [[[1572, 0, 428, 720], 262]], 'Editar a turma: modalidades, público, professor, horários.')}</div>
    </div>
    <div class="caixa caixa--vermelha" style="margin-top:8px"><b class="rot">A decidir</b>A duração das aulas (pergunta L1: o exemplo usa 60 minutos) e quem é o professor de cada turma. Os nomes da tela são inventados.</div>` })

  // ───────────────────────────────────────────── 25. agenda
  add({ id: 'agenda', olho: 'Parte 10 · Anotar e lembrar', titulo: 'Agenda, notas e lembretes', exemplo: true,
    lide: 'O caderno do dono dentro do app. Lembrete com data e repetição ("todo dia 10"), tarefa com prazo e responsável, e nota ligada a uma pessoa ou a um valor.',
    corpo: `${tela('agenda', [[[245, 70, 1740, 480], 1009]], 'Hoje (atrasados, hoje, em breve), o calendário do mês com os vencimentos e as tarefas abertas.')}
    <div class="tres" style="margin-top:10px">
      ${bloco('O que você consegue fazer', ['Criar lembrete e nota num atalho (L e N no teclado)', 'Escrever a data como se fala: "amanhã", "20", "20/10"'])}
      ${bloco('Atalhos prontos', ['A despesa fixa vira lembrete mensal', 'Quem deve vira "Cobrar fulano"; quem fez a aula vira "Chamar de volta"'])}
      ${bloco('O aviso no celular', ['Às 8h: "Você tem 3 lembretes hoje", <b>sem o texto e sem valor</b>. Ainda não está ligado: depende do servidor'])}
    </div>` })

  // ───────────────────────────────────────────── 26. histórico
  add({ id: 'historico', olho: 'Parte 11 · Histórico', titulo: 'Quem mexeu, no quê, e quando', exemplo: true,
    lide: 'Toda criação, mudança e arquivamento fica registrado, em frase. Quem grava é o próprio banco de dados, não a tela: ninguém pula o registro, e ninguém apaga, nem o dono.',
    corpo: `${tela('historico-cheio', [[[535, 70, 1450, 68], 1009], [[535, 352, 1450, 212], 1009]], 'O mais novo primeiro. Em cima, um valor mudado agora ("Contador": R$ 450,00 → R$ 480,00); embaixo, lançamentos criados e meses fechados.', true)}
    <div class="duas" style="margin-top:10px">
      ${bloco('Por que isso importa', ['Um pagamento não some sem deixar rastro', 'Se o valor de alguém mudou, você sabe quem mudou e quando'])}
      <div class="caixa caixa--vermelha"><b class="rot">A decidir</b>Guardar o histórico para sempre ou por 5 anos, o prazo comum para documento fiscal (pergunta A14, confirmar com o contador).</div>
    </div>` })

  // ───────────────────────────────────────────── 27. no celular
  add({ id: 'celular', olho: 'No celular', titulo: 'O mesmo Admin, no bolso', exemplo: true,
    lide: 'No celular, a planilha vira uma lista por dia e cada linha abre numa folha para editar. A barra de baixo leva ao painel, às pessoas, às finanças e à agenda.',
    corpo: `<div style="display:flex;gap:18px;justify-content:center;align-items:flex-start">
      ${['cel-painel', 'cel-lancamentos', 'cel-folha', 'cel-pessoas'].map((id, i) => cel(id, ['Painel', 'Lançamentos do mês', 'Editar uma linha', 'Alunos'][i])).join('')}
    </div>
    <p class="texto16" style="margin-top:10px;text-align:center">Abre no navegador e se instala como app, com ícone na tela inicial, sem passar pela loja (pergunta A23).</p>` })

  // ───────────────────────────────────────────── 28. o que já existe e o que não
  add({ id: 'motor', olho: 'Onde estamos', titulo: 'O Admin já roda. O servidor ainda não existe.',
    lide: 'As telas deste documento são o Admin construído, rodando no computador com uma academia de exemplo. Os dados ficam só naquele navegador. Para a academia usar de verdade, falta pôr o banco de dados no ar.',
    corpo: `<table class="tabela-16"><thead><tr><th>O quê</th><th>Situação</th></tr></thead><tbody>
          <tr><td>As telas do Admin, no PC e no celular</td><td><span class="selo selo--ok">prontas</span></td></tr>
          <tr><td>O motor do financeiro (mensalidade, comissão, fechamento, importar)</td><td><span class="selo selo--ok">pronto · 500 testes</span></td></tr>
          <tr><td>Os testes das telas e dos fluxos (lançar, colar, pagar, fechar, exportar, importar)</td><td><span class="selo selo--ok">passam · 40 + 5</span></td></tr>
          <tr><td>As regras de quem vê o quê, dentro do banco</td><td><span class="selo selo--atencao">escritas · testadas num banco de teste</span></td></tr>
          <tr><td>O servidor (Supabase em São Paulo) com os dados reais</td><td><span class="selo selo--vermelho">não existe · a conta não foi criada</span></td></tr>
          <tr><td>Login com senha e código no celular</td><td><span class="selo selo--atencao">escrito · espera o servidor</span></td></tr>
          <tr><td>Mensalidade gerada sozinha no dia 1 e o aviso das 8h</td><td><span class="selo selo--vermelho">não feito · espera o servidor</span></td></tr>
        </tbody></table>
    <div class="duas" style="margin-top:14px;grid-template-columns:minmax(0,1fr) 650px;gap:20px;align-items:start">
      <div class="caixa caixa--vermelha texto16"><b class="rot">O que é de exemplo</b>Os nomes, os preços, os planos, as regras de pagamento da equipe e as regras de cobrança. O logo também é provisório.</div>
      ${tela('ajustes', [[[258, 135, 975, 62], 650]], 'Em Ajustes, as regras de cobrança ficam marcadas "PROVISÓRIOS" até vocês responderem.')}
    </div>` })

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
  add({ id: 'decidir', olho: 'O que a academia precisa decidir', titulo: 'Sete respostas que trocam o exemplo pelo real',
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
    lide: 'O Admin é a primeira entrega. O prazo de cada etapa se combina com o Alex quando as respostas das páginas anteriores chegarem: elas é que destravam o resto.',
    corpo: `<div class="passos">
      ${[['Vocês respondem', 'As sete perguntas, a planilha atual e os preços reais.', 'Academia', true],
        ['Admin construído', 'Feito: as telas deste documento, rodando com dados de exemplo. Faltam os ajustes que vocês pedirem.', 'Alex', false],
        ['Servidor no ar', 'Criar a conta do banco em São Paulo, ligar o login e importar a sua planilha com os seus planos e preços.', 'Alex', false],
        ['Um mês em paralelo', 'Vocês usam o Admin e a planilha juntos por um mês, para conferir que os números batem.', 'Academia e Alex', false],
        ['No ar', 'A planilha se aposenta. Depois vêm o app do aluno e o do professor, ligados ao mesmo banco.', 'Todos', false]]
        .map(([t, txt, quem, agora], i) => `<div class="passo ${agora ? 'passo--agora' : ''}"><div class="passo__n">${i + 1}</div><h4>${t}</h4><p>${txt}</p><p class="quem">${quem}</p></div>`).join('')}
    </div>
    <div class="duas" style="margin-top:22px;grid-template-columns:1fr 92mm;gap:20px;align-items:stretch">
      <div class="pilha">
        ${bloco('O que já está pronto', ['O Admin inteiro, no computador e no celular, com a academia de exemplo', 'O motor do financeiro, testado: gera mensalidade, calcula comissão, fecha o mês, lê a planilha', 'O banco de dados escrito, com as regras de quem vê o quê, e a escolha da hospedagem com o custo de cada degrau'], '', 'lista--16')}
        <div class="caixa caixa--vermelha"><b class="rot">O pedido de hoje</b>Se a proposta faz sentido, o primeiro passo é mandar a planilha atual e a lista de planos e preços. Com isso, a próxima versão deste documento já sai com os números de vocês.</div>
      </div>
      <div style="border-radius:12px;background:#000 50% 30% / cover no-repeat url('${x.fotoAcademia}');min-height:250px"></div>
    </div>` })

  return pgs
}
