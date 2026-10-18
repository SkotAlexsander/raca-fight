/**
 * Componente 10 — Selo Plus (sistema.css `.selo-plus`). Sempre com a palavra
 * "Plus" (menos o ponto, que tem rótulo acessível). `plus` não aparece em nada
 * que não seja do plano.
 *
 * - cheio: fundo `plus`, texto `plusTexto` (assinante, recurso ativo);
 * - contorno: 1,5 `plusTextoSobreFundo` (convite: o dourado de preenchimento
 *   não serve de texto no claro, 1,89:1);
 * - atencao: "Plus vencido" em `atencao`.
 */
import { View } from 'react-native';
import { espaco, estiloDeTexto, raio, useTema } from '@/tema';
import { Icone } from './Icone';
import { Texto } from './Texto';

export interface PropsDoSeloPlus {
  variante?: 'cheio' | 'contorno' | 'atencao';
  tamanho?: 'pequeno' | 'padrao';
  /** Texto além de "Plus": "Plus · 3 dias", "Plus vencido". */
  texto?: string;
  /** Relógio de "a vencer". */
  comRelogio?: boolean;
}

export function SeloPlus({ variante = 'cheio', tamanho = 'padrao', texto = 'Plus', comRelogio }: PropsDoSeloPlus) {
  const { cores } = useTema();
  const cor = variante === 'cheio' ? cores.plusTexto : variante === 'contorno' ? cores.plusTextoSobreFundo : cores.atencao;
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={texto}
      style={{
        minHeight: tamanho === 'pequeno' ? 20 : 24,
        paddingHorizontal: tamanho === 'pequeno' ? espaco[2] : espaco[3],
        borderRadius: raio.redondo,
        backgroundColor: variante === 'cheio' ? cores.plus : 'transparent',
        borderWidth: variante === 'cheio' ? 0 : 1.5,
        borderColor: cor,
        flexDirection: 'row',
        alignItems: 'center',
        gap: espaco[1],
        alignSelf: 'flex-start',
      }}
    >
      {comRelogio ? <Icone nome="relogio" tamanho="pequeno" cor={cor} /> : null}
      {/* legenda em 700 com 0,04 em (sistema.css .selo-plus) */}
      <Texto variante="legenda" style={{ color: cor, fontFamily: estiloDeTexto('titulo1').estilo.fontFamily, letterSpacing: 13 * 0.04 }}>
        {texto}
      </Texto>
    </View>
  );
}

/** O ponto de 8 sobre o ícone da aba (sem texto; o rótulo da aba diz "Plus"). */
export function PontoPlus() {
  const { cores } = useTema();
  return <View style={{ width: 8, height: 8, borderRadius: raio.redondo, backgroundColor: cores.plus }} />;
}
