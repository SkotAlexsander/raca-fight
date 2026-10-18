/**
 * Aviso da academia (mapa, Parte 4 "Visão da academia"; F10; R10.10–R10.13)
 * e, na luta (P12), o AVISO DA TURMA (R22.1; F22): o professor escreve para os
 * alunos (e os responsáveis) de uma turma dele, com as mesmas regras (160
 * caracteres, sem link, sem citar aluno nem saúde) e uma notificação por
 * turma por dia.
 * Sem mockup próprio: desenhado com os mesmos componentes (cartão, chips,
 * campo, interruptor, folha de confirmação).
 *
 * - Avisos da academia: os em vigor no topo ("No Início até sexta", quem
 *   escreveu, se foi com notificação); os antigos embaixo, em cinza. Nenhuma
 *   contagem de quem leu. Retirar: o dono retira qualquer um; a recepção, os dela.
 * - Novo aviso: texto até 160 caracteres e 3 linhas (validado pelo domínio),
 *   "Fica no Início por" 1 · 3 · 7 · 14 dias (padrão 3), "Mandar notificação"
 *   (travada se já houve uma hoje, R10.11), a linha fixa "Vai para todos os
 *   alunos. Não cite aluno nem saúde." e a prévia do cartão do Início.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Botao, Campo, Cartao, Chip, Chips, EstadoVazio, FolhaInferior, Icone, LinhaComChave, Texto, useAvisoRapido, useGravarComAviso, useUmPorVez } from '@/componentes';
import { useAvisosDaAcademia, useEquipe, useGravar, useSessao } from '@/dados';
import { LIMITE_DO_AVISO_DA_ACADEMIA, validarAvisoDaAcademia, type ProblemaDoAviso } from '@/dominio/avisos';
import { espaco, raio, useTema } from '@/tema';
import { alunosDaTurma, useLutaDaEquipe, useQuemEstaNaEquipe } from '../luta/dados';
import { dataCurta, dataLocal, plural, primeiroNome, somarDias } from '@/componentes/formatos';
import { Secao, TelaDaAcademia } from './pecas';
import { ErroAoCarregar, EsqueletoDaTela } from '../compartilhado/estados';

const VALIDADES = [1, 3, 7, 14] as const;

const PROBLEMA: Record<ProblemaDoAviso, string> = {
  vazio: 'Escreva o aviso.',
  longo_demais: `Até ${LIMITE_DO_AVISO_DA_ACADEMIA} caracteres.`,
  linhas_demais: 'No máximo 3 linhas.',
  tem_link: 'Sem link: o aluno não sabe se é golpe. Escreva só o recado.',
  validade_invalida: 'Escolha por quantos dias o aviso fica no Início.',
};

interface AvisoNaLista {
  id: string;
  texto: string;
  autor: string;
  publicadoEm: string;
  ate: string;
  comNotificacao: boolean;
  podeRetirar: boolean;
  doRepositorio: boolean;
  retirado: boolean;
}

/** Todos os avisos da academia (gravados pelo repositório), mais recentes primeiro. */
function useAvisos(turmaId?: string) {
  const avisos = useAvisosDaAcademia();
  const membros = useEquipe().data ?? [];
  const { usuario } = useSessao();
  const { ehDono } = useQuemEstaNaEquipe();
  const nomeDe = (id: string) => {
    const m = membros.find((x) => x.usuario.id === id);
    return m?.perfil?.nomeExibicao ?? (m ? primeiroNome(m.usuario.nome) : 'Academia');
  };
  const lista: AvisoNaLista[] = (avisos.data ?? []).filter((a) => (a.turmaId ?? null) === (turmaId ?? null)).map((a) => ({
    id: a.id,
    texto: a.texto,
    autor: nomeDe(a.autorId),
    publicadoEm: a.publicadoEm,
    ate: somarDias(a.publicadoEm.slice(0, 10), a.validadeDias),
    comNotificacao: a.comNotificacao,
    podeRetirar: ehDono || a.autorId === usuario?.id,
    doRepositorio: true,
    retirado: !!a.retiradoEm,
  }));
  const hoje = dataLocal();
  const emVigor = lista.filter((a) => !a.retirado && a.ate >= hoje).sort((x, y) => (x.publicadoEm < y.publicadoEm ? 1 : -1));
  const antigos = lista.filter((a) => a.retirado || a.ate < hoje).sort((x, y) => (x.publicadoEm < y.publicadoEm ? 1 : -1));
  const notificouHoje = lista.some((a) => a.comNotificacao && a.publicadoEm.slice(0, 10) === hoje);
  return { emVigor, antigos, notificouHoje, carregando: avisos.isLoading, erro: avisos.isError, tentarDeNovo: () => void avisos.refetch() };
}

function CartaoDoAviso({ a, aoRetirar }: { a: AvisoNaLista; aoRetirar?: () => void }) {
  const ativo = !a.retirado && a.ate >= dataLocal();
  return (
    <Cartao>
      <View style={{ gap: espaco[2], opacity: ativo ? 1 : 0.6 }}>
        <Texto variante="corpo">{a.texto}</Texto>
        <Texto variante="corpoPequeno" cor="textoSecundario">
          {a.retirado ? 'Retirado' : ativo ? `No Início até ${dataCurta(a.ate)}` : `Ficou até ${dataCurta(a.ate)}`} · {a.autor} · {a.comNotificacao ? 'com notificação' : 'sem notificação'}
        </Texto>
        {ativo && aoRetirar ? <Botao rotulo="Retirar" variante="perigoDiscreto" tamanho="pequeno" intrinseco aoTocar={aoRetirar} /> : null}
      </View>
    </Cartao>
  );
}

export function TelaAvisosDaAcademia() {
  const router = useRouter();
  const gravar = useGravar();
  // grava com aviso de erro e "Tentar de novo" (o passo inteiro roda de novo; agente AG)
  const { gravar: comAviso } = useGravarComAviso((passo: () => Promise<void>) => passo());
  const { usuario } = useSessao();
  const aviso = useAvisoRapido();
  const { vinculo } = useQuemEstaNaEquipe();
  const academia = vinculo?.academia ?? null;
  const { emVigor, antigos, carregando, erro, tentarDeNovo } = useAvisos();
  const [retirando, setRetirando] = useState<AvisoNaLista | null>(null);
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/alunos'));

  return (
    <TelaDaAcademia titulo="Avisos da academia" subtitulo={academia?.nome} aoVoltar={voltar} rodape={<Botao rotulo="Novo aviso" icone="mais" aoTocar={() => router.push('/alunos/novo-aviso')} />}>
      {erro ? (
        <ErroAoCarregar aoTentar={tentarDeNovo} />
      ) : carregando ? (
        <EsqueletoDaTela heroi={null} linhas={2} />
      ) : (
      <>
      <Secao titulo="Em vigor" contagem={emVigor.length} apoio="O Início mostra um por vez, o mais recente. Ninguém vê quem leu.">
        {emVigor.length === 0 ? (
          <Cartao padding={0}>
            <EstadoVazio variante="compacta" icone="sino" titulo="Nenhum aviso no Início" texto="Escreva um recado para todos os alunos." />
          </Cartao>
        ) : (
          emVigor.map((a) => <CartaoDoAviso key={a.id} a={a} aoRetirar={a.podeRetirar ? () => setRetirando(a) : undefined} />)
        )}
      </Secao>
      {antigos.length > 0 ? (
        <Secao titulo="Antigos" contagem={antigos.length}>
          {antigos.map((a) => (
            <CartaoDoAviso key={a.id} a={a} />
          ))}
        </Secao>
      ) : null}
      </>
      )}

      <FolhaInferior
        visivel={!!retirando}
        aoFechar={() => setRetirando(null)}
        titulo="Retirar o aviso do Início?"
        rodape={
          <>
            <Botao rotulo="Cancelar" variante="secundario" aoTocar={() => setRetirando(null)} />
            <Botao
              rotulo="Retirar"
              variante="perigo"
              aoTocar={() => {
                const a = retirando;
                if (!a) return;
                void comAviso(async () => {
                  await gravar.retirarAviso(a.id, usuario?.id ?? '');
                  setRetirando(null);
                  aviso.mostrar({ texto: 'Aviso retirado do Início.' });
                });
              }}
            />
          </>
        }
      >
        <Texto variante="corpo" cor="textoSecundario">
          Some do Início de todos os alunos agora. A notificação que já chegou não volta.
        </Texto>
      </FolhaInferior>
    </TelaDaAcademia>
  );
}

export function TelaNovoAviso() {
  const router = useRouter();
  const gravar = useGravar();
  const aviso = useAvisoRapido();
  const { cores, sombras } = useTema();
  const { usuario } = useSessao();
  // com ?turma=…, o aviso é DA TURMA (R22.1)
  const { turma: turmaId } = useLocalSearchParams<{ turma?: string }>();
  const equipe = useLutaDaEquipe();
  const academia = equipe.vinculo?.academia ?? null;
  const academiaId = equipe.academiaId;
  const turma = turmaId ? equipe.luta?.turmas.find((t) => t.id === turmaId) : undefined;
  const { notificouHoje } = useAvisos(turmaId);
  const [texto, setTexto] = useState('');
  const [validade, setValidade] = useState<number>(3);
  const [notificar, setNotificar] = useState(!notificouHoje);
  const [tentou, setTentou] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  // duplo toque em "Enviar" publicava o aviso duas vezes (agente AB); a recusa do repositório vira aviso de erro, não promessa solta
  const publicar = useUmPorVez(async () => {
    if (!usuario || !academiaId) return;
    try {
      // grava primeiro (o repositório confere pela regra do domínio); o aviso segue o dado
      await gravar.publicarAviso({ academiaId, ...(turma ? { turmaId: turma.id } : {}), texto: texto.trim(), validadeDias: validade, comNotificacao: notificar && !notificouHoje, autorId: usuario.id });
    } catch {
      aviso.mostrar({ texto: 'Não deu para publicar o aviso. Confira o texto.', tipo: 'erro' });
      return;
    }
    setConfirmar(false);
    aviso.mostrar({ texto: 'Aviso no Início dos alunos.', tipo: 'sucesso' });
    voltar();
  });

  const problemas = validarAvisoDaAcademia({ texto, validadeDias: validade });
  const caracteres = Array.from(texto.trim()).length;
  const ativos = turma ? alunosDaTurma(equipe.fichas, turma.id).length : equipe.fichas.length;
  const paraQuem = turma ? `${plural(ativos, 'aluno', 'alunos')} e responsáveis da turma ${turma.nome}` : plural(ativos, 'aluno', 'alunos');
  const voltar = () => (router.canGoBack() ? router.back() : router.replace(turma ? '/turmas' : '/alunos/avisos'));

  return (
    <TelaDaAcademia
      titulo={turma ? 'Aviso para a turma' : 'Novo aviso'}
      subtitulo={turma?.nome ?? academia?.nome}
      aoVoltar={voltar}
      rodape={
        <Botao
          rotulo={turma ? 'Enviar para a turma' : `Enviar para ${plural(ativos, 'aluno', 'alunos')}`}
          aoTocar={() => {
            setTentou(true);
            if (problemas.length === 0) setConfirmar(true);
          }}
        />
      }
    >
      <View style={{ gap: espaco[2] }}>
        <Campo
          rotulo="Aviso"
          placeholder={turma ? 'Ex.: Tragam a caneleira na quinta.' : 'Ex.: Feriado na segunda: abrimos das 8h às 12h.'}
          value={texto}
          onChangeText={setTexto}
          multilinha
          erro={(tentou && problemas.length > 0) || caracteres > LIMITE_DO_AVISO_DA_ACADEMIA ? PROBLEMA[problemas[0] ?? 'longo_demais'] + ` (${caracteres} de ${LIMITE_DO_AVISO_DA_ACADEMIA})` : undefined}
          apoio={`${caracteres} de ${LIMITE_DO_AVISO_DA_ACADEMIA}`}
        />
      </View>

      <View style={{ gap: espaco[2] }}>
        <Texto variante="legenda" cor="textoSecundario">
          Fica no Início por
        </Texto>
        <Chips>
          {VALIDADES.map((d) => (
            <Chip key={d} rotulo={plural(d, 'dia', 'dias')} selecionado={validade === d} aoTocar={() => setValidade(d)} />
          ))}
        </Chips>
      </View>

      <LinhaComChave
        rotulo="Mandar notificação"
        apoio={notificouHoje ? (turma ? 'Hoje esta turma já recebeu uma notificação. Este vai só como cartão no Início.' : 'Hoje já saiu um aviso com notificação. Este vai só como cartão no Início.') : 'Uma por dia. Escrito entre 22h e 7h, a notificação sai às 7h.'}
        ligado={notificar && !notificouHoje}
        travado={notificouHoje}
        aoMudar={setNotificar}
      />

      <View style={{ flexDirection: 'row', gap: espaco[2], alignItems: 'flex-start' }}>
        <Icone nome="escudo" tamanho={20} cor="marca" />
        <Texto variante="corpoPequeno" style={{ flex: 1 }}>
          {turma ? `Vai para ${paraQuem}.` : 'Vai para todos os alunos.'} Não cite aluno nem saúde.
        </Texto>
      </View>

      <Secao titulo="Prévia no Início">
        <View style={{ borderRadius: raio.grande, backgroundColor: cores.avisoFundo, borderLeftWidth: 4, borderLeftColor: cores.avisoFio, padding: espaco[4], gap: espaco[1], boxShadow: sombras.sombra1 }}>
          <Texto variante="legenda" cor="textoSecundario">
            {turma?.nome ?? academia?.nome} · agora
          </Texto>
          <Texto variante="corpo" numberOfLines={3}>
            {texto.trim() || 'O seu recado aparece aqui.'}
          </Texto>
        </View>
      </Secao>

      <FolhaInferior
        visivel={confirmar}
        aoFechar={() => setConfirmar(false)}
        titulo={turma ? `Enviar para a turma ${turma.nome}?` : `Enviar para ${plural(ativos, 'aluno', 'alunos')}?`}
        rodape={
          <>
            <Botao rotulo="Cancelar" variante="secundario" aoTocar={() => setConfirmar(false)} />
            <Botao
              rotulo="Enviar"
              carregando={publicar.ocupado}
              aoTocar={() => void publicar.executar()}
            />
          </>
        }
      >
        <Texto variante="corpo" cor="textoSecundario">
          Fica no Início por {plural(validade, 'dia', 'dias')}
          {notificar && !notificouHoje ? ', com notificação' : ', sem notificação'}. Dá para retirar depois.
        </Texto>
      </FolhaInferior>
    </TelaDaAcademia>
  );
}
