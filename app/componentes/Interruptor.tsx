/**
 * Interruptor (52 × 32, bolinha de 26, `entrada.css › .o-interruptor`) e a
 * linha com chave, em que a LINHA TODA é o alvo (o interruptor sozinho tem 32
 * de altura; a linha tem no mínimo 56).
 *
 * Promovido pelo agente AA (P11) de `telas/entrada/pecas.tsx` (agente Z). A
 * `Chave` das telas do aluno (agente Y) usava o Switch do sistema, que não está
 * em mockup nenhum; agora as duas visões usam este, o desenhado.
 *
 * - `naLista`: dentro de uma `Lista`/`GrupoDeLinhas` (margem lateral de 16 e
 *   altura 56/72 da linha); fora dela, a linha não tem margem própria.
 * - `travado`: a chave não muda (perfil escondido pelo dono, aviso já enviado
 *   hoje) e o leitor de tela ouve "indisponível".
 */
import { Pressable, View } from 'react-native';
import { controle, espaco, layout, raio, useTema } from '@/tema';
import { Texto } from './Texto';

export function Interruptor({ ligado, travado }: { ligado: boolean; travado?: boolean }) {
  const { cores } = useTema();
  return (
    <View style={{ width: 52, height: 32, borderRadius: raio.redondo, backgroundColor: ligado ? cores.viva : cores.trilho, justifyContent: 'center', opacity: travado ? cores.desabilitadoOpacidade : 1 }}>
      <View
        style={{
          position: 'absolute',
          top: 3,
          left: ligado ? 23 : 3,
          width: 26,
          height: 26,
          borderRadius: raio.redondo,
          backgroundColor: ligado ? cores.vivaTexto : cores.superficie,
          boxShadow: ligado ? undefined : '0 1px 2px rgba(0,0,0,0.25)',
        }}
      />
    </View>
  );
}

export interface PropsDaLinhaComChave {
  rotulo: string;
  apoio?: string;
  ligado: boolean;
  aoMudar: (v: boolean) => void;
  travado?: boolean;
  /** Dentro de uma lista agrupada: margem de 16 e texto `corpo` (o rótulo da linha). */
  naLista?: boolean;
  testID?: string;
}

export function LinhaComChave({ rotulo, apoio, ligado, aoMudar, travado, naLista, testID }: PropsDaLinhaComChave) {
  const { cores } = useTema();
  return (
    <Pressable
      testID={testID}
      onPress={travado ? undefined : () => aoMudar(!ligado)}
      accessibilityRole="switch"
      accessibilityState={{ checked: ligado, disabled: !!travado }}
      aria-checked={ligado}
      aria-disabled={!!travado}
      accessibilityLabel={rotulo}
      accessibilityHint={apoio}
      style={{
        minHeight: naLista ? (apoio ? layout.alturaLinhaPadrao : layout.alturaLinhaCompacta) : controle.maximo,
        flexDirection: 'row',
        alignItems: 'center',
        gap: espaco[3],
        paddingVertical: espaco[2],
        paddingHorizontal: naLista ? espaco[4] : 0,
        opacity: naLista && travado ? cores.desabilitadoOpacidade : 1,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: naLista ? 0 : espaco[1] }}>
        <Texto variante={naLista ? 'corpo' : 'corpoForte'}>{rotulo}</Texto>
        {apoio ? (
          <Texto variante="corpoPequeno" cor="textoSecundario">
            {apoio}
          </Texto>
        ) : null}
      </View>
      <Interruptor ligado={ligado} travado={naLista ? false : travado} />
    </Pressable>
  );
}
