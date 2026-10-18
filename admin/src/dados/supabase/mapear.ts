/**
 * O banco usa snake_case; o domínio usa camelCase. Só as chaves de PRIMEIRO
 * nível trocam: o que mora em JSONB (descontos, repartição, remuneração) já é
 * guardado em camelCase, igual aos tipos.
 */

export const paraSnake = (k: string) => k.replace(/([A-Z])/g, '_$1').toLowerCase();
export const paraCamel = (k: string) => k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** Objeto do domínio → linha do banco (o `undefined` some; vira o padrão da coluna). */
export function paraBanco(o: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [paraSnake(k), v]));
}

/** Linha do banco → objeto do domínio (o `null` some: no domínio, opcional é ausente). */
export function doBanco<T>(linha: Record<string, unknown>): T {
  return Object.fromEntries(Object.entries(linha).filter(([, v]) => v !== null).map(([k, v]) => [paraCamel(k), v])) as T;
}
