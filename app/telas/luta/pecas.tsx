/**
 * Peças das telas de luta (o `luta.css` do agente AL em React Native), feitas
 * só com os componentes e os tokens que existem: nenhum tamanho novo, tipo na
 * escala fechada (13 · 16 · 20 · 25 · 31 · 39 · 49 · 61), toque invisível de 48.
 *
 * - `FaixaDesenhada`: a faixa (ou o kruang) com até 3 cores e os graus (R16.2);
 * - `Selo`: Kids, OPEN, Competição, "Sua turma", "Cancelada";
 * - `ListaDeAulas` e `LinhaDeAula`: a grade do dia (`.l-aulas`, `.l-aula`);
 * - `TopoDaTela`: o sobretítulo e o título grande (`.p-saudacao`);
 * - `CartaoDeAviso`: o aviso da academia ou da turma, dispensável;
 * - `GradeDeAtalhos`: os atalhos de 2 colunas (`.p-atalhos`);
 * - `SemanaEmBolinhas` e `MesEmQuadrados`: a presença (`.p-dias`, `.l-mes`).
 */
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Avatar, Botao, Cartao, Icone, Texto, type NomeDoIcone } from '@/componentes';
import { borda, espaco, estiloDeTexto, layout, raio, tokens, useTema } from '@/tema';

const NUMERO = estiloDeTexto('numeroMedio').estilo.fontFamily;

// ---------------------------------------------------------------------------
// A faixa desenhada (R16.2: de 1 a 3 cores, com os graus)
// ---------------------------------------------------------------------------

export function FaixaDesenhada({ cores, graus = 0, comPonteira = true, pequena, rotuloAcessivel }: { cores: readonly string[]; graus?: number; comPonteira?: boolean; pequena?: boolean; rotuloAcessivel?: string }) {
  const { cores: tema } = useTema();
  const largura = pequena ? 32 : 88;
  const altura = pequena ? 10 : 24;
  const corpo = cores.length ? cores : [tema.mapaVazio];
  const faixas = corpo.length === 1 ? [{ y: 0, h: altura, c: corpo[0]! }] : corpo.length === 2 ? [{ y: 0, h: altura, c: corpo[0]! }, { y: altura / 3, h: altura / 3, c: corpo[1]! }] : corpo.map((c, i) => ({ y: (i * altura) / 3, h: altura / 3, c }));
  const ponteira = pequena ? 9 : 22;
  const xPonteira = largura - ponteira - (pequena ? 3 : 8);
  const marcas = Math.min(graus, pequena ? 4 : 6);
  return (
    <View accessible={!!rotuloAcessivel} accessibilityRole={rotuloAcessivel ? 'image' : undefined} accessibilityLabel={rotuloAcessivel} style={{ width: largura, height: altura }}>
      <Svg width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`}>
        {faixas.map((f, i) => (
          <Rect key={i} x={0} y={f.y} width={largura} height={f.h} fill={f.c} />
        ))}
        {comPonteira ? <Rect x={xPonteira} y={0} width={ponteira} height={altura} fill="#1C1C1C" /> : null}
        {comPonteira
          ? Array.from({ length: marcas }, (_, i) => <Rect key={`g${i}`} x={xPonteira + (pequena ? 1 : 4) + i * (pequena ? 2 : 3.4)} y={0} width={pequena ? 1 : 2} height={altura} fill="#FFFFFF" />)
          : null}
        <Rect x={0.5} y={0.5} width={largura - 1} height={altura - 1} rx={pequena ? 2 : 3} fill="none" stroke={tema.borda} strokeWidth={1} />
      </Svg>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Selo
// ---------------------------------------------------------------------------

export function Selo({ texto, marca }: { texto: string; marca?: boolean }) {
  const { cores } = useTema();
  return (
    <View
      style={{
        minHeight: 24,
        paddingHorizontal: espaco[2],
        borderRadius: raio.pilula,
        justifyContent: 'center',
        alignSelf: 'flex-start',
        backgroundColor: marca ? cores.marcaSuave : 'transparent',
        borderWidth: marca ? 0 : borda.fina,
        borderColor: cores.textoSecundario,
      }}
    >
      <Texto variante="legenda" numberOfLines={1}>
        {texto}
      </Texto>
    </View>
  );
}

// ---------------------------------------------------------------------------
// A lista de aulas
// ---------------------------------------------------------------------------

export function ListaDeAulas({ children, rotulo }: { children: ReactNode; rotulo?: string }) {
  const { cores, sombras } = useTema();
  return (
    <View accessibilityRole="list" accessibilityLabel={rotulo} style={{ backgroundColor: cores.superficie, borderRadius: raio.cartao, boxShadow: sombras.sombra2, overflow: 'hidden' }}>
      {children}
    </View>
  );
}

export function LinhaDeAula({ hora, titulo, apoio, selo, seloMarca, minha, cancelada, primeira, aoTocar, rotuloAcessivel, testID }: { hora: string; titulo: string; apoio?: string; selo?: string; seloMarca?: boolean; minha?: boolean; cancelada?: boolean; primeira?: boolean; aoTocar?: () => void; rotuloAcessivel?: string; testID?: string }) {
  const { cores } = useTema();
  const conteudo = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3], minHeight: layout.alturaLinhaPadrao, paddingVertical: espaco[3], paddingHorizontal: espaco[4], borderTopWidth: primeira ? 0 : borda.fina, borderTopColor: cores.regua }}>
      <Texto variante="titulo3" cor={cancelada ? 'textoSecundario' : minha ? 'marca' : 'texto'} style={{ width: 56, fontFamily: NUMERO, fontVariant: ['tabular-nums'], textDecorationLine: cancelada ? 'line-through' : 'none' }}>
        {hora}
      </Texto>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Texto variante="corpoForte" cor={cancelada ? 'textoSecundario' : 'texto'} numberOfLines={2} style={{ textDecorationLine: cancelada ? 'line-through' : 'none' }}>
          {titulo}
        </Texto>
        {apoio ? (
          <Texto variante="corpoPequeno" cor="textoSecundario" numberOfLines={2}>
            {apoio}
          </Texto>
        ) : null}
      </View>
      {selo ? <Selo texto={selo} marca={seloMarca} /> : null}
      {aoTocar ? <Icone nome="avancar" cor="textoSecundario" /> : null}
    </View>
  );
  if (!aoTocar)
    return (
      <View role="listitem" accessible accessibilityLabel={rotuloAcessivel ?? `${hora}, ${titulo}${apoio ? `, ${apoio}` : ''}${selo ? `, ${selo}` : ''}`} testID={testID}>
        {conteudo}
      </View>
    );
  return (
    <Pressable role="listitem" onPress={aoTocar} accessibilityRole="button" accessibilityLabel={rotuloAcessivel ?? `${hora}, ${titulo}${apoio ? `, ${apoio}` : ''}${selo ? `, ${selo}` : ''}`} testID={testID} style={({ pressed }) => ({ backgroundColor: pressed ? cores.superficieElevada : 'transparent' })}>
      {conteudo}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// O topo da tela (sobretítulo e título grande)
// ---------------------------------------------------------------------------

export function TopoDaTela({ sobretitulo, titulo, avatar, acao, aoVoltar }: { sobretitulo?: string; titulo: string; avatar?: string; acao?: ReactNode; aoVoltar?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
      {aoVoltar ? <Botao variante="neutro" tamanho="icone" icone="voltar" rotuloAcessivel="Voltar" aoTocar={aoVoltar} /> : null}
      {avatar ? <Avatar nome={avatar} tamanho={40} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        {sobretitulo ? (
          <Texto variante="corpoPequeno" cor="textoSecundario" numberOfLines={1}>
            {sobretitulo}
          </Texto>
        ) : null}
        <Texto variante="titulo1" accessibilityRole="header" numberOfLines={2}>
          {titulo}
        </Texto>
      </View>
      {acao ?? null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// O aviso da academia (ou da turma)
// ---------------------------------------------------------------------------

export function CartaoDeAviso({ de, texto, aoDispensar }: { de: string; texto: string; aoDispensar?: () => void }) {
  const { cores, sombras } = useTema();
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`Aviso de ${de}: ${texto}`}
      style={{ flexDirection: 'row', gap: espaco[2], paddingVertical: espaco[3], paddingLeft: espaco[4], paddingRight: espaco[1], borderRadius: raio.cartao, backgroundColor: cores.avisoFundo, borderLeftWidth: 4, borderLeftColor: cores.avisoFio, boxShadow: sombras.sombra2 }}
    >
      <View style={{ flex: 1, gap: espaco[1] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[2] }}>
          <Icone nome="academia" tamanho="pequeno" cor="textoSecundario" />
          <Texto variante="legenda" cor="textoSecundario" numberOfLines={1} style={{ flexShrink: 1 }}>
            {de}
          </Texto>
        </View>
        <Texto variante="corpo">{texto}</Texto>
      </View>
      {aoDispensar ? <Botao variante="neutro" tamanho="icone" icone="fechar" rotuloAcessivel="Dispensar aviso" aoTocar={aoDispensar} /> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Atalhos (2 colunas)
// ---------------------------------------------------------------------------

export interface Atalho {
  icone: NomeDoIcone;
  rotulo: string;
  aoTocar: () => void;
}

export function GradeDeAtalhos({ atalhos }: { atalhos: readonly Atalho[] }) {
  const { cores } = useTema();
  return (
    <View accessibilityRole="list" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco[3] }}>
      {atalhos.map((a) => (
        <View key={a.rotulo} role="listitem" style={{ flexGrow: 1, flexBasis: 150 }}>
          <Cartao aoTocar={a.aoTocar} padding={espaco[3]} raioDoCartao={raio.grande} rotuloAcessivel={a.rotulo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
              <View style={{ width: 40, height: 40, borderRadius: raio.medio, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' }}>
                <Icone nome={a.icone} cor="marca" />
              </View>
              <Texto variante="corpoForte" numberOfLines={2} style={{ flexShrink: 1 }}>
                {a.rotulo}
              </Texto>
            </View>
          </Cartao>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// A semana em bolinhas e o mês em quadrados (presença)
// ---------------------------------------------------------------------------

export interface DiaDaBolinha {
  letra: string;
  rotulo: string;
  numero: number;
  feito: boolean;
  hoje: boolean;
  semAula?: boolean;
}

export function SemanaEmBolinhas({ dias }: { dias: readonly DiaDaBolinha[] }) {
  const { cores } = useTema();
  const t = tokens.mapa.bolinhaSemana;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityRole="list" accessibilityLabel="Dias da semana">
      {dias.map((x) => (
        <View key={`${x.rotulo}-${x.numero}`} role="listitem" style={{ alignItems: 'center', gap: espaco[1], minWidth: t }} accessible accessibilityLabel={`${x.rotulo}${x.hoje ? ', hoje' : ''}${x.feito ? ', esteve na aula' : x.semAula ? ', sem aula' : ''}`}>
          <Texto variante="legenda" cor={x.hoje ? 'texto' : 'textoSecundario'}>
            {x.letra}
          </Texto>
          <View
            style={{
              width: t,
              height: t,
              borderRadius: raio.redondo,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: x.feito ? cores.progresso : x.hoje ? 'transparent' : cores.mapaVazio,
              borderWidth: x.hoje && !x.feito ? borda.media : 0,
              borderColor: cores.progresso,
              opacity: x.semAula && !x.feito && !x.hoje ? 0.5 : 1,
            }}
          >
            {x.feito ? <Icone nome="marcar" tamanho="pequeno" cor="marcaTexto" /> : x.hoje ? <Texto variante="legenda">{x.numero}</Texto> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

/** O mês em quadrados (segunda a domingo), com as aulas feitas cheias e hoje em contorno. */
export function MesEmQuadrados({ ano, mes, comAula, hoje, rotulo }: { ano: number; mes: number; comAula: ReadonlySet<number>; hoje?: number; rotulo: string }) {
  const { cores } = useTema();
  const t = tokens.mapa.dia;
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay();
  const vazios = (primeiro + 6) % 7;
  const total = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const celulas: (number | null)[] = [...Array.from({ length: vazios }, () => null), ...Array.from({ length: total }, (_, i) => i + 1)];
  const semanas: (number | null)[][] = [];
  for (let i = 0; i < celulas.length; i += 7) semanas.push(celulas.slice(i, i + 7));
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={rotulo} style={{ gap: espaco[2] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((l, i) => (
          <Texto key={i} variante="legenda" cor="textoSecundario" alinhar="center" style={{ width: t }}>
            {l}
          </Texto>
        ))}
      </View>
      {semanas.map((s, i) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {Array.from({ length: 7 }, (_, j) => s[j] ?? null).map((d, j) => (
            <View
              key={j}
              style={{
                width: t,
                height: t,
                borderRadius: raio.medio,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: d === null ? 'transparent' : comAula.has(d) ? cores.progresso : d === hoje ? 'transparent' : cores.mapaVazio,
                borderWidth: d !== null && d === hoje && !comAula.has(d) ? borda.media : 0,
                borderColor: cores.progresso,
              }}
            >
              {d !== null ? (
                <Texto variante="corpoPequeno" cor={comAula.has(d) ? 'marcaTexto' : d === hoje ? 'texto' : 'textoSecundario'} style={{ fontVariant: ['tabular-nums'] }}>
                  {d}
                </Texto>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Um número com rótulo, dentro de um cartão (`.p-quadro`): "14 aulas desde o último grau". */
export function NumeroComRotulo({ rotulo, numero, unidade }: { rotulo: string; numero: string; unidade?: string }) {
  const { cores } = useTema();
  return (
    <View style={{ flex: 1, minWidth: 140, gap: espaco[1], padding: espaco[3], borderRadius: raio.grande, backgroundColor: cores.fundo }} accessible accessibilityLabel={`${rotulo}: ${numero}${unidade ? ` ${unidade}` : ''}`}>
      <Texto variante="corpoPequeno" cor="textoSecundario">
        {rotulo}
      </Texto>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: espaco[1] }}>
        <Texto variante="titulo1" style={{ fontFamily: NUMERO, fontVariant: ['tabular-nums'] }}>
          {numero}
        </Texto>
        {unidade ? (
          <Texto variante="corpoPequeno" cor="textoSecundario">
            {unidade}
          </Texto>
        ) : null}
      </View>
    </View>
  );
}
