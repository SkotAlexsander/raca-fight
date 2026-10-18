/**
 * A lista da equipe como o ALUNO vê (mapa, Parte 7.2; F14.2; R11.4, R11.5,
 * R11.9, R11.13): os chips de especialidade (só as que alguém marcou, mais
 * "Todos") e os cartões em ordem alfabética, cada um com avatar, nome de
 * exibição, formação e até 3 especialidades. Sem nota, estrela, ranking ou
 * contagem (R11.9), nunca telefone, e-mail nem preço (R11.6, R11.10).
 *
 * Promovido pelo agente AA (P11) de `telas/aluno/perfil/TelaEquipe.tsx`
 * (agente Y). Recebe os perfis JÁ filtrados por quem pode ver
 * (`podeVerPerfil`, `equipeParaMostrar`): o componente não decide visibilidade.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { especialidadesDaEquipe } from '@/dominio/perfil-profissional';
import type { Especialidade, PerfilProfissional } from '@/dominio/tipos';
import { espaco, raio } from '@/tema';
import { Avatar } from './Auxiliares';
import { Cartao } from './Cartao';
import { Chip, Chips } from './Chip';
import { NOME_DA_ESPECIALIDADE } from './formatos';
import { Icone } from './Icone';
import { Texto } from './Texto';

/** Um profissional na lista: avatar 40, nome `titulo3`, formação e até 3 especialidades. */
export function CartaoDoProfissional({ perfil, aoTocar }: { perfil: PerfilProfissional; aoTocar?: () => void }) {
  const especialidades = perfil.especialidades.filter((e) => e !== 'outra').slice(0, 3);
  return (
    <Cartao aoTocar={aoTocar} raioDoCartao={raio.grande} rotuloAcessivel={`${perfil.nomeExibicao}, ${perfil.formacao}. ${especialidades.map((e) => NOME_DA_ESPECIALIDADE[e]).join(', ')}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
        <Avatar nome={perfil.nomeExibicao} tamanho={40} />
        <View style={{ flex: 1, minWidth: 0, gap: espaco[1] }}>
          <Texto variante="titulo3" numberOfLines={1}>
            {perfil.nomeExibicao}
          </Texto>
          <Texto variante="corpoPequeno" cor="textoSecundario" numberOfLines={1}>
            {perfil.formacao}
          </Texto>
          {especialidades.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco[1], marginTop: espaco[1] }}>
              {especialidades.map((e) => (
                <Chip key={e} variante="info" rotulo={NOME_DA_ESPECIALIDADE[e]} />
              ))}
            </View>
          ) : null}
        </View>
        {aoTocar ? <Icone nome="avancar" cor="textoSecundario" /> : null}
      </View>
    </Cartao>
  );
}

/** Os chips de especialidade e os cartões, filtrados pelo chip escolhido. */
export function ListaDaEquipe({ perfis, aoAbrir }: { perfis: readonly PerfilProfissional[]; aoAbrir?: (perfil: PerfilProfissional) => void }) {
  const [filtro, setFiltro] = useState<Especialidade | null>(null);
  const chips = especialidadesDaEquipe(perfis);
  const lista = perfis.filter((p) => !filtro || p.especialidades.includes(filtro));
  return (
    <>
      <Chips>
        <Chip rotulo="Todos" selecionado={filtro === null} aoTocar={() => setFiltro(null)} />
        {chips.map((e) => (
          <Chip key={e} rotulo={NOME_DA_ESPECIALIDADE[e]} selecionado={filtro === e} aoTocar={() => setFiltro(filtro === e ? null : e)} />
        ))}
      </Chips>
      <View style={{ gap: espaco[3] }} accessibilityRole="list">
        {/* cada cartão num item de lista (axe: aria-required-children; agente AG, pedido do AH) */}
        {lista.map((p) => (
          <View key={p.id} role="listitem">
            <CartaoDoProfissional perfil={p} aoTocar={aoAbrir ? () => aoAbrir(p) : undefined} />
          </View>
        ))}
      </View>
    </>
  );
}
