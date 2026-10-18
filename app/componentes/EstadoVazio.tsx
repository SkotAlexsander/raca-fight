/**
 * Componente 15 — Estado vazio (sistema.css `.estado-vazio`).
 *
 * Centrado, largura máxima 280, 16 entre as partes: a "ilustração" (um ícone
 * de luta de 40 num círculo de 96 em `marcaSuave`) ou ícone de 32 · título `titulo3` · texto `corpoPequeno` `textoSecundario` · botões.
 * Variante `erro`: ícone em `erro`, "Não deu para carregar" + "Tentar de novo".
 * Variante `compacta`: em linha, dentro de um cartão (ícone 24, título
 * `corpoForte`, sem botão). O texto diz o que fazer, não o que faltou.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { espaco, raio, useTema } from '@/tema';
import { Icone, type NomeDoIcone } from './Icone';
import { Texto } from './Texto';

/** As ilustrações que existem nos dois temas (estados-vazios/<nome>-claro|-escuro). */
export type IlustracaoDoVazio =
  | 'aguardando-personal'
  | 'biblioteca-vazia'
  | 'busca-sem-resultado'
  | 'erro-carregar'
  | 'historico-vazio'
  | 'nenhum-aluno'
  | 'primeiro-treino'
  | 'sem-conexao'
  | 'sem-plano'
  | 'sem-plus-alimentacao';

/**
 * Revisão AN: as ilustrações raster de `estados-vazios/` são do Academia Plus
 * (verde-água) e várias desenham musculação (bancos de supino em
 * "nenhum-aluno", anilha em "erro-carregar"). Na Raça Fight, cada uma vira um
 * ícone de luta na cor da marca, até o design desenhar as novas.
 */
const ICONE_DA_ILUSTRACAO: Readonly<Record<IlustracaoDoVazio, NomeDoIcone>> = {
  'aguardando-personal': 'relogio',
  'biblioteca-vazia': 'luva',
  'busca-sem-resultado': 'buscar',
  'erro-carregar': 'alerta',
  'historico-vazio': 'faixa',
  'nenhum-aluno': 'tatame',
  'primeiro-treino': 'luva',
  'sem-conexao': 'nuvem',
  'sem-plano': 'hoje',
  'sem-plus-alimentacao': 'hoje',
};

export interface PropsDoEstadoVazio {
  titulo: string;
  texto?: string;
  ilustracao?: IlustracaoDoVazio;
  icone?: NomeDoIcone;
  variante?: 'padrao' | 'erro' | 'compacta';
  /** Botões (primário intrínseco, ou dois em coluna no primeiro uso). */
  children?: ReactNode;
}

export function EstadoVazio({ titulo, texto, ilustracao, icone, variante = 'padrao', children }: PropsDoEstadoVazio) {
  const { cores } = useTema();

  if (variante === 'compacta') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[2], padding: espaco[3] }}>
        {icone ? <Icone nome={icone} cor="textoSecundario" /> : null}
        <View style={{ flex: 1 }}>
          <Texto variante="corpoForte">{titulo}</Texto>
          {texto ? (
            <Texto variante="corpoPequeno" cor="textoSecundario" numberOfLines={1}>
              {texto}
            </Texto>
          ) : null}
        </View>
      </View>
    );
  }

  const doVazio = ilustracao ? ICONE_DA_ILUSTRACAO[ilustracao] : undefined;
  return (
    <View style={{ alignItems: 'center', gap: espaco[4], paddingVertical: espaco[8], paddingHorizontal: espaco[4], maxWidth: 280, alignSelf: 'center', width: '100%' }}>
      {doVazio ? (
        <View testID="estado-vazio-icone" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 96, height: 96, borderRadius: raio.redondo, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' }}>
          <Icone nome={doVazio} tamanho={40} cor="marca" />
        </View>
      ) : icone || variante === 'erro' ? (
        <Icone nome={icone ?? 'alerta'} tamanho="grande" cor={variante === 'erro' ? 'erro' : 'textoSecundario'} />
      ) : null}
      <Texto variante="titulo3" alinhar="center" accessibilityRole="header">
        {titulo}
      </Texto>
      {texto ? (
        <Texto variante="corpoPequeno" cor="textoSecundario" alinhar="center">
          {texto}
        </Texto>
      ) : null}
      {children ? <View style={{ gap: espaco[3], alignItems: 'center', alignSelf: 'stretch' }}>{children}</View> : null}
    </View>
  );
}
