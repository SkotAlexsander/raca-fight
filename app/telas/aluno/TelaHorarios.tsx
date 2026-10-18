/**
 * Horários (mockup `luta.html`, tela 2): a GRADE REAL da academia por dia.
 * As aulas da pessoa ficam em vermelho com "Sua turma"; Kids, OPEN e
 * Competição viram selo; a aula cancelada aparece riscada. Filtro "Minhas
 * modalidades" (padrão de quem tem matrícula) · "Todas". Também na vitrine,
 * sem conta (R14.11), só para ler.
 */
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Cartao, Chip, Chips, Texto } from '@/componentes';
import { aulasDoDia, type Turma } from '@/dominio/turmas/turmas';
import { diaDaSemanaDe, somarDias } from '@/dominio/turmas/horario';
import type { DiaDaSemana } from '@/dominio/tipos';
import { borda, espaco, raio, useTema } from '@/tema';
import { NOME_CURTO_DO_DIA, NOME_DO_DIA } from '@/componentes/formatos';
import { TelaComRolagem } from './comum/Tela';
import { ErroAoCarregar, EsqueletoDaTela } from '../compartilhado/estados';
import { LinhaDeAula, ListaDeAulas, TopoDaTela } from '../luta/pecas';
import { nomeDoProfessor, primeiroNome, useLutaDoAluno } from '../luta/dados';
import { turmasDaFicha } from './CartaoDaProximaAula';

const DIAS_DA_GRADE: DiaDaSemana[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

export function TelaHorarios({ somenteLeitura, aoVoltar }: { somenteLeitura?: boolean; aoVoltar?: () => void } = {}) {
  const router = useRouter();
  const luta = useLutaDoAluno();
  const { cores, sombras } = useTema();
  const hoje = luta.hoje;
  const diaDeHoje = hoje ? diaDaSemanaDe(hoje) : 'seg';
  const [dia, setDia] = useState<DiaDaSemana>(DIAS_DA_GRADE.includes(diaDeHoje) ? diaDeHoje : 'seg');
  const temMatricula = luta.fichas.length > 0 && !somenteLeitura;
  const [minhas, setMinhas] = useState(true);
  const filtrar = temMatricula && minhas;

  // a data do dia escolhido: hoje ou a próxima vez dele (a grade mostra o que vem)
  const data = useMemo(() => {
    if (!hoje) return null;
    for (let i = 0; i < 7; i += 1) {
      const d = somarDias(hoje, i);
      if (diaDaSemanaDe(d) === dia) return d;
    }
    return hoje;
  }, [hoje, dia]);

  const minhasTurmas = useMemo(() => new Set(luta.fichas.flatMap((f) => (luta.luta ? turmasDaFicha(luta.luta, f).map((t) => t.id) : []))), [luta.fichas, luta.luta]);
  const minhasModalidades = useMemo(() => new Set(luta.fichas.flatMap((f) => f.modalidadeIds)), [luta.fichas]);
  const aulas = useMemo(() => {
    if (!luta.luta || !data) return [];
    return aulasDoDia(luta.luta.turmas, data, luta.luta.fuso, luta.ajustes).filter((a) => {
      if (!filtrar) return true;
      const t = luta.luta!.turmas.find((x) => x.id === a.turmaId)!;
      if (minhasTurmas.has(t.id)) return true;
      if (t.publico === 'kids' || t.publico === 'competicao') return false;
      return t.modalidadeIds.some((m) => minhasModalidades.has(m));
    });
  }, [luta.luta, data, luta.ajustes, filtrar, minhasTurmas, minhasModalidades]);

  const selo = (t: Turma, cancelada: boolean) => {
    if (cancelada) return { texto: 'Cancelada', marca: false };
    if (minhasTurmas.has(t.id) && t.publico !== 'aberta' && !somenteLeitura) return { texto: 'Sua turma', marca: true };
    if (t.publico === 'kids') return { texto: 'Kids', marca: false };
    if (t.publico === 'aberta') return { texto: 'OPEN', marca: false };
    if (t.publico === 'competicao') return { texto: 'Competição', marca: false };
    return null;
  };

  return (
    <TelaComRolagem semCabecalho>
      <TopoDaTela sobretitulo="Grade da semana" titulo="Horários" aoVoltar={aoVoltar} />
      <View accessibilityRole="radiogroup" accessibilityLabel="Dia da semana" style={{ flexDirection: 'row', gap: espaco[1] }}>
        {DIAS_DA_GRADE.map((d) => {
          const ativo = d === dia;
          return (
            <Pressable
              key={d}
              role="radio"
              accessibilityState={{ selected: ativo }}
              aria-checked={ativo}
              accessibilityLabel={NOME_DO_DIA[d]}
              onPress={() => setDia(d)}
              hitSlop={{ top: 4, bottom: 4 }}
              style={{ flex: 1, minHeight: 48, borderRadius: raio.pilula, alignItems: 'center', justifyContent: 'center', backgroundColor: ativo ? cores.viva : cores.superficie, boxShadow: ativo ? undefined : sombras.sombra1, borderWidth: borda.fina, borderColor: ativo ? cores.viva : 'transparent' }}
            >
              <Texto variante="corpoPequeno" style={{ color: ativo ? cores.vivaTexto : cores.texto }}>
                {NOME_CURTO_DO_DIA[d]}
              </Texto>
            </Pressable>
          );
        })}
      </View>
      {temMatricula ? (
        <Chips>
          <Chip rotulo="Minhas modalidades" selecionado={minhas} aoTocar={() => setMinhas(true)} />
          <Chip rotulo="Todas" selecionado={!minhas} aoTocar={() => setMinhas(false)} />
        </Chips>
      ) : null}

      {luta.erro ? (
        <Cartao>
          <ErroAoCarregar aoTentar={luta.tentarDeNovo} />
        </Cartao>
      ) : luta.carregando || !luta.luta ? (
        <EsqueletoDaTela heroi={null} linhas={4} />
      ) : aulas.length === 0 ? (
        <Cartao>
          <Texto variante="corpo" cor="textoSecundario">
            {dia === 'sab' || dia === 'sex' ? 'Neste dia só há a aula especial da academia.' : 'Nenhuma aula das suas modalidades neste dia.'}
          </Texto>
        </Cartao>
      ) : (
        <ListaDeAulas rotulo={`Aulas de ${NOME_DO_DIA[dia].toLocaleLowerCase('pt-BR')}`}>
          {aulas.map((a, i) => {
            const t = luta.luta!.turmas.find((x) => x.id === a.turmaId)!;
            const s = selo(t, a.cancelada);
            const prof = nomeDoProfessor(luta.equipe, a.professorId);
            const titulo = t.publico === 'aberta' ? `Sexta OPEN · até ${a.horaDoFim}` : t.publico === 'competicao' ? `Treino de competição · até ${a.horaDoFim}` : t.nome;
            const apoio = t.publico === 'competicao' ? 'Só atletas' : prof ? `Prof. ${primeiroNome(prof)}` : 'Escala da semana';
            return (
              <LinhaDeAula
                key={a.id}
                primeira={i === 0}
                hora={a.hora}
                titulo={titulo}
                apoio={a.cancelada && a.motivoDoCancelamento ? `${apoio} · cancelada` : apoio}
                selo={s?.texto}
                seloMarca={s?.marca}
                minha={!!s?.marca}
                cancelada={a.cancelada}
                aoTocar={() => router.push({ pathname: somenteLeitura ? '/conheca/turma/[id]' : '/horarios/[id]', params: { id: t.id } })}
              />
            );
          })}
        </ListaDeAulas>
      )}
      <Texto variante="corpoPequeno" cor="textoSecundario">
        A grade é a que a academia publica. Turmas Kids aparecem para quem tem dependente matriculado; o treino de competição, só para atletas.
      </Texto>
    </TelaComRolagem>
  );
}
