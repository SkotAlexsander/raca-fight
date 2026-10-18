/**
 * Raiz do app (Expo Router, raiz em `navegacao/` pelo app.json).
 *
 * Ordem dos provedores: tema (cores, movimento, transparência) → dados
 * (repositório, sessão, preferências, fila) → vibração (a chave do Perfil) →
 * o cronômetro de rounds (um só no app, nos dois apps, R17.1) → aviso rápido
 * (um por vez, acima da barra de abas).
 *
 * As fontes: no build, o plugin `expo-font` já embute; no Expo Go e no
 * navegador, `useFonts` carrega os mesmos arquivos (04-IPHONE.md, seção 7).
 * A abertura (expo-splash-screen) só sai quando fonte e sessão estão prontas.
 */
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { ProvedorDeAvisoRapido } from '@/componentes';
import { ProvedorDeDados, usePreferencias, useSessao } from '@/dados';
import { duracao, FONTES_DA_MARCA, ProvedorDeTema, ProvedorDeVibracao, useTema } from '@/tema';
import { ProvedorDoCronometro } from '@/telas/compartilhado/cronometro/ProvedorDoCronometro';

void SplashScreen.preventAutoHideAsync().catch(() => {});

function Conteudo() {
  const { cores, esquema, reduzirMovimento } = useTema();
  const { vibracao } = usePreferencias();
  const { carregando } = useSessao();

  useEffect(() => {
    if (!carregando) void SplashScreen.hideAsync().catch(() => {});
  }, [carregando]);

  return (
    <ProvedorDeVibracao ligada={vibracao}>
      <View style={{ flex: 1, backgroundColor: cores.fundo }}>
        <StatusBar style={esquema === 'escuro' ? 'light' : 'dark'} />
        <ProvedorDoCronometro>
          <ProvedorDeAvisoRapido>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: cores.fundo },
                // pilha: a transição nativa de cada sistema; com "reduzir movimento", esmaecer (catálogo 4.4)
                animation: reduzirMovimento ? 'fade' : 'default',
                animationDuration: reduzirMovimento ? duracao.esmaecerReduzido : undefined,
              }}
            >
              <Stack.Screen name="cronometro" options={{ animation: reduzirMovimento ? 'fade' : 'slide_from_bottom', contentStyle: { backgroundColor: '#141414' } }} />
            </Stack>
          </ProvedorDeAvisoRapido>
        </ProvedorDoCronometro>
      </View>
    </ProvedorDeVibracao>
  );
}

export default function Raiz() {
  const [fontesProntas, erroDasFontes] = useFonts(FONTES_DA_MARCA);
  if (!fontesProntas && !erroDasFontes) return null;
  return (
    <ProvedorDeTema>
      <ProvedorDeDados>
        <Conteudo />
      </ProvedorDeDados>
    </ProvedorDeTema>
  );
}
