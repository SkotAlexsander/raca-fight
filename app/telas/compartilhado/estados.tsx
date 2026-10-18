/**
 * Os estados que toda tela com dado precisa (agente AH, P11): carregando,
 * erro com "Tentar de novo" e o anúncio para o leitor de tela. Feitos só com
 * os componentes que existem (Esqueleto, EstadoVazio, Botao): nenhum desenho novo.
 *
 * - `EsqueletoDaTela`: o bloco grande do herói e as linhas de 56, como o
 *   catálogo 4.6 pede (o Esqueleto só aparece depois de 300 ms).
 * - `ErroAoCarregar`: a variante de erro do Estado vazio (componente 15), com o
 *   botão que tenta de novo. O erro é do sistema, não da pessoa (tom de voz, 6).
 * - `AvisoAoLeitor`: o que muda sem a pessoa tocar (série marcada, descanso que
 *   acabou, fase do cronômetro) é lido em voz alta. Na web e no Android vai por
 *   uma região viva (`aria-live`); no iPhone, que ignora a região viva, pelo
 *   `announceForAccessibility`. A região fica fora da vista, mas no leitor.
 */
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform, View } from 'react-native';
import { Botao, Esqueleto, EstadoVazio, Texto } from '@/componentes';
import { espaco, raio } from '@/tema';

export function EsqueletoDaTela({ heroi = 200, linhas = 3 }: { heroi?: number | null; linhas?: number }) {
  return (
    <View style={{ gap: espaco[3] }} accessibilityLabel="Carregando" aria-busy>
      {heroi ? <Esqueleto altura={heroi} raioDoBloco={raio.grande} /> : null}
      {Array.from({ length: linhas }, (_, i) => (
        <Esqueleto key={i} altura={56} raioDoBloco={raio.grande} />
      ))}
    </View>
  );
}

export function ErroAoCarregar({ aoTentar, texto = 'Confira a conexão e tente de novo.' }: { aoTentar: () => void; texto?: string }) {
  return (
    <EstadoVazio variante="erro" ilustracao="erro-carregar" titulo="Não deu para carregar" texto={texto}>
      <Botao variante="secundario" rotulo="Tentar de novo" aoTocar={aoTentar} />
    </EstadoVazio>
  );
}

/**
 * Lê `mensagem` em voz alta quando ela muda (e só então). `chave` força a
 * leitura de novo com o mesmo texto (duas séries iguais seguidas).
 */
export function AvisoAoLeitor({ mensagem, chave }: { mensagem: string | null; chave?: string | number }) {
  const anterior = useRef<string | null>(null);
  useEffect(() => {
    if (!mensagem) return;
    const id = `${chave ?? ''}|${mensagem}`;
    if (anterior.current === id) return;
    anterior.current = id;
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(mensagem);
  }, [mensagem, chave]);
  return (
    <View
      accessibilityLiveRegion="polite"
      aria-live="polite"
      pointerEvents="none"
      style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0.01, left: 0, top: 0 }}
    >
      {/* no iPhone o anúncio já foi falado; o texto aqui serve à web e ao Android */}
      {Platform.OS !== 'ios' && mensagem ? <Texto key={`${chave ?? ''}`}>{mensagem}</Texto> : null}
    </View>
  );
}
