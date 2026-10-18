import { Redirect } from 'expo-router';
import type { ComponentType } from 'react';

/**
 * /componentes: todos os componentes base juntos, nos dois temas (P11, X.6).
 * Só em desenvolvimento (revisão AE, C16): no export de produção o Metro troca
 * `__DEV__` por `false` e corta o `require`, então o catálogo nem entra no
 * pacote; o endereço manda para o começo.
 */
const Catalogo: ComponentType | null = __DEV__ ? require('@/telas/compartilhado/TelaCatalogoDeComponentes').TelaCatalogoDeComponentes : null;

export default function Rota() {
  return Catalogo ? <Catalogo /> : <Redirect href="/" />;
}
