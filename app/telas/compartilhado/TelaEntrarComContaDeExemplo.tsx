/**
 * Entrada PROVISÓRIA: escolher uma das contas de exemplo (sem login de
 * verdade; Apple, Google e e-mail ficam com o agente Z, simulados). Serve para
 * ver as duas visões e o "Entrar como…" de quem tem dois papéis.
 */
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Botao, Cartao, Icone, Texto } from '@/componentes';
import { useRepositorio, useSessao } from '@/dados';
import { espaco, layout, useTema } from '@/tema';

export function TelaEntrarComContaDeExemplo() {
  const { cores } = useTema();
  const repo = useRepositorio();
  const { entrar } = useSessao();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: cores.fundo }} contentContainerStyle={{ paddingTop: insets.top + espaco[8], paddingBottom: insets.bottom + espaco[8], paddingHorizontal: layout.margemLateral }}>
      <View style={{ maxWidth: layout.larguraMaximaConteudo, width: '100%', alignSelf: 'center', gap: espaco[4] }}>
        <Texto variante="tituloEntrada" accessibilityRole="header">
          Raça Fight
        </Texto>
        <Texto variante="corpo" cor="textoSecundario">
          Contas de exemplo, sem senha e com nomes fictícios: escolha quem vai entrar.
        </Texto>
        {repo.contasDeExemplo().map((c) => (
          <Cartao
            key={c.usuarioId}
            rotuloAcessivel={`Entrar como ${c.nome}, ${c.descricao}`}
            aoTocar={async () => {
              await entrar(c.usuarioId);
              router.replace('/');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
              <Avatar nome={c.nome} />
              <View style={{ flex: 1 }}>
                <Texto variante="corpoForte">{c.nome}</Texto>
                <Texto variante="corpoPequeno" cor="textoSecundario">
                  {c.descricao}
                </Texto>
              </View>
              <Icone nome="avancar" cor="textoSecundario" />
            </View>
          </Cartao>
        ))}
        {__DEV__ ? <Botao rotulo="Ver os componentes" variante="texto" aoTocar={() => router.push('/componentes')} /> : null}
      </View>
    </ScrollView>
  );
}
