import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatarNumero,
  lerNumero,
  gramasParaQuilos,
  quilosParaGramas,
  formatarPeso,
  milimetrosParaCentimetros,
  centimetrosParaMilimetros,
  milimetrosParaMetros,
  metrosParaMilimetros,
  formatarAltura,
  formatarCircunferencia,
  segundosParaMinutosSegundos,
  minutosSegundosParaSegundos,
  formatarTempo,
  formatarDuracao,
  formatarPercentualDecimos,
  formatarCalorias,
  formatarReais,
  formatarData,
  lerDataBrasileira,
  calcularIdade,
  calcularImc,
  instanteComFuso,
} from './unidades.ts';

describe('números em PT-BR', () => {
  test('formata com vírgula e corta zeros à direita', () => {
    assert.equal(formatarNumero(72.5, 1), '72,5');
    assert.equal(formatarNumero(72, 1), '72');
    assert.equal(formatarNumero(1.25, 2), '1,25');
    assert.equal(formatarNumero(1.2, 2), '1,2');
  });

  test('mantém zeros quando pedido', () => {
    assert.equal(formatarNumero(1.7, 2, false), '1,70');
  });

  test('lê vírgula e ponto como decimal', () => {
    assert.equal(lerNumero('72,5'), 72.5);
    assert.equal(lerNumero('72.5'), 72.5);
    assert.equal(lerNumero(' 80 '), 80);
    assert.equal(lerNumero(',5'), 0.5);
  });

  test('devolve NaN para texto que não é número', () => {
    assert.ok(Number.isNaN(lerNumero('')));
    assert.ok(Number.isNaN(lerNumero('abc')));
    assert.ok(Number.isNaN(lerNumero('1,2,3')));
  });
});

describe('massa', () => {
  test('gramas ↔ quilos', () => {
    assert.equal(gramasParaQuilos(72500), 72.5);
    assert.equal(quilosParaGramas(72.5), 72500);
    assert.equal(quilosParaGramas(0), 0);
  });

  test('quilos com mais casas que o grama arredondam para inteiro', () => {
    assert.equal(quilosParaGramas(1.2345), 1235);
    assert.ok(Number.isInteger(quilosParaGramas(0.0005)));
  });

  test('não aceita negativo nem NaN', () => {
    assert.throws(() => quilosParaGramas(-1), RangeError);
    assert.throws(() => quilosParaGramas(Number.NaN), RangeError);
  });

  test('formata peso (R7: uma casa)', () => {
    assert.equal(formatarPeso(72500), '72,5 kg');
    assert.equal(formatarPeso(72400), '72,4 kg');
    assert.equal(formatarPeso(80000), '80,0 kg'); // revisão A: era '80 kg', contra a tabela da seção 7
  });
});

describe('comprimento', () => {
  test('milímetros ↔ centímetros ↔ metros', () => {
    assert.equal(milimetrosParaCentimetros(825), 82.5);
    assert.equal(centimetrosParaMilimetros(82.5), 825);
    assert.equal(milimetrosParaMetros(1750), 1.75);
    assert.equal(metrosParaMilimetros(1.75), 1750);
  });

  test('ida e volta não perde o inteiro', () => {
    for (const mm of [0, 1, 999, 1750, 2100]) {
      assert.equal(metrosParaMilimetros(milimetrosParaMetros(mm)), mm);
      assert.equal(centimetrosParaMilimetros(milimetrosParaCentimetros(mm)), mm);
    }
  });

  test('formata altura sempre com 2 casas', () => {
    assert.equal(formatarAltura(1750), '1,75 m');
    assert.equal(formatarAltura(1700), '1,70 m');
    assert.equal(formatarAltura(1600), '1,60 m');
  });

  test('formata circunferência em cm', () => {
    assert.equal(formatarCircunferencia(825), '82,5 cm');
    assert.equal(formatarCircunferencia(820), '82 cm');
  });
});

describe('tempo', () => {
  test('segundos → mm:ss', () => {
    assert.equal(segundosParaMinutosSegundos(0), '00:00');
    assert.equal(segundosParaMinutosSegundos(5), '00:05');
    assert.equal(segundosParaMinutosSegundos(90), '01:30');
    assert.equal(segundosParaMinutosSegundos(3725), '62:05');
  });

  test('mm:ss → segundos, aceitando variações', () => {
    assert.equal(minutosSegundosParaSegundos('01:30'), 90);
    assert.equal(minutosSegundosParaSegundos('1:30'), 90);
    assert.equal(minutosSegundosParaSegundos('90'), 90);
    assert.equal(minutosSegundosParaSegundos('1:02:03'), 3723);
  });

  test('ida e volta de mm:ss', () => {
    for (const s of [0, 1, 59, 60, 61, 599, 3600, 5999]) {
      assert.equal(minutosSegundosParaSegundos(segundosParaMinutosSegundos(s)), s);
    }
  });

  test('rejeita tempo mal formado', () => {
    assert.throws(() => minutosSegundosParaSegundos('1:60'), RangeError);
    assert.throws(() => minutosSegundosParaSegundos('abc'), RangeError);
    assert.throws(() => minutosSegundosParaSegundos('1:2:3:4'), RangeError);
    assert.throws(() => minutosSegundosParaSegundos(''), RangeError);
  });

  test('tempo na tela: mm:ss abaixo de 1 h, h:mm:ss acima (R7)', () => {
    assert.equal(formatarTempo(90), '01:30');
    assert.equal(formatarTempo(3599), '59:59');
    assert.equal(formatarTempo(3600), '1:00:00');
    assert.equal(formatarTempo(3725), '1:02:05');
  });

  // revisão AE (texto 16 do AC): unidade sempre com espaço (tom de voz, princípio 8),
  // como o Histórico do aluno já escreve ("46 min"); antes era '46min', '1h 05min'
  test('duração para leitura', () => {
    assert.equal(formatarDuracao(45), '45 s');
    assert.equal(formatarDuracao(90), '1 min 30 s');
    assert.equal(formatarDuracao(600), '10 min');
    assert.equal(formatarDuracao(2760), '46 min');
    assert.equal(formatarDuracao(3900), '1 h 05 min');
    assert.equal(formatarDuracao(7200), '2 h');
  });
});

describe('frações inteiras', () => {
  test('percentual em décimos', () => {
    assert.equal(formatarPercentualDecimos(185), '18,5 %');
    assert.equal(formatarPercentualDecimos(200), '20 %');
  });

  test('calorias em kcal inteiro (R7)', () => {
    assert.equal(formatarCalorias(320), '320 kcal');
    assert.throws(() => formatarCalorias(-1), RangeError);
  });
});

describe('dinheiro e datas (R7)', () => {
  test('centavos → reais', () => {
    assert.equal(formatarReais(4990), 'R$ 49,90');
    assert.equal(formatarReais(100), 'R$ 1,00');
    assert.equal(formatarReais(5), 'R$ 0,05');
    assert.throws(() => formatarReais(12.5), RangeError);
  });

  test('ISO ↔ brasileiro', () => {
    assert.equal(formatarData('2026-10-10'), '10/10/2026');
    assert.equal(lerDataBrasileira('10/10/2026'), '2026-10-10');
    assert.equal(lerDataBrasileira(formatarData('1997-03-05')), '1997-03-05');
    assert.throws(() => formatarData('10/10/2026'), RangeError);
    assert.throws(() => lerDataBrasileira('2026-10-10'), RangeError);
  });

  test('idade deriva da data de nascimento', () => {
    assert.equal(calcularIdade('1997-03-05', '2026-10-10'), 29);
    assert.equal(calcularIdade('1997-10-10', '2026-10-10'), 29);
    assert.equal(calcularIdade('1997-10-11', '2026-10-10'), 28);
    assert.throws(() => calcularIdade('2030-01-01', '2026-10-10'), RangeError);
  });
});

describe('IMC', () => {
  test('calcula com 1 casa', () => {
    assert.equal(calcularImc(72500, 1750), 23.7);
    assert.equal(calcularImc(100000, 2000), 25);
  });

  test('exige altura', () => {
    assert.throws(() => calcularImc(72500, 0), RangeError);
  });
});

// ---------------------------------------------------------------------------
// Revisão A (10/10/2026): cada bloco abaixo nasceu de um bug provado.
// O teste foi escrito antes da correção e falhava com o código antigo.
// ---------------------------------------------------------------------------

describe('revisão A — arredondamento na tela é sempre "meio para cima"', () => {
  test('peso: 0,05 kg sobe para a casa de cima, sem depender do binário', () => {
    // Antes: 1450 g → "1,4 kg" mas 2450 g → "2,5 kg"; 72350 g → "72,3 kg".
    assert.equal(formatarPeso(1450), '1,5 kg');
    assert.equal(formatarPeso(2450), '2,5 kg');
    assert.equal(formatarPeso(72350), '72,4 kg');
  });

  test('altura: milímetro ímpar arredonda para cima de forma igual em toda altura', () => {
    // Antes: 1765 → "1,76 m" mas 1775 → "1,77 m" e 1005 → "1,00 m".
    assert.equal(formatarAltura(1005), '1,01 m');
    assert.equal(formatarAltura(1755), '1,76 m');
    assert.equal(formatarAltura(1765), '1,77 m');
    assert.equal(formatarAltura(1775), '1,78 m');
  });

  test('formatarNumero arredonda o decimal que a pessoa vê, não o binário', () => {
    assert.equal(formatarNumero(1.005, 2), '1,01');
    assert.equal(formatarNumero(1.45, 1), '1,5');
    assert.equal(formatarNumero(-1.45, 1), '-1,5');
    assert.equal(formatarNumero(-0.04, 1), '0');
    assert.equal(formatarNumero(1e-7, 2), '0');
  });
});

describe('revisão A — medida inválida não vira "NaN kg" na tela (R7.3)', () => {
  test('formatadores de medida recusam negativo e NaN', () => {
    assert.throws(() => formatarPeso(Number.NaN), RangeError);
    assert.throws(() => formatarPeso(-500), RangeError);
    assert.throws(() => formatarAltura(Number.NaN), RangeError);
    assert.throws(() => formatarCircunferencia(-1), RangeError);
    assert.throws(() => formatarPercentualDecimos(-5), RangeError);
  });

  test('IMC sem altura ou sem peso de verdade lança erro em vez de devolver NaN', () => {
    assert.throws(() => calcularImc(72500, Number.NaN), RangeError);
    assert.throws(() => calcularImc(72500, undefined as unknown as number), RangeError);
    assert.throws(() => calcularImc(Number.NaN, 1750), RangeError);
    assert.throws(() => calcularImc(-1, 1750), RangeError);
  });
});

describe('revisão A — data que não existe no calendário é recusada', () => {
  test('lerDataBrasileira recusa 31/02 e 29/02 de ano não bissexto', () => {
    assert.throws(() => lerDataBrasileira('31/02/2026'), RangeError);
    assert.throws(() => lerDataBrasileira('29/02/2025'), RangeError);
    assert.throws(() => lerDataBrasileira('00/10/2026'), RangeError);
    assert.throws(() => lerDataBrasileira('10/13/2026'), RangeError);
    assert.equal(lerDataBrasileira('29/02/2024'), '2024-02-29');
    assert.equal(lerDataBrasileira('31/12/2026'), '2026-12-31');
  });

  test('formatarData e calcularIdade recusam data impossível', () => {
    assert.throws(() => formatarData('2026-13-45'), RangeError);
    assert.throws(() => formatarData('2026-02-30'), RangeError);
    assert.throws(() => calcularIdade('2026-02-31', '2026-10-10'), RangeError);
    assert.throws(() => calcularIdade('1997-03-05', '2026-10-32'), RangeError);
  });

  test('nascido em 29/02 completa ano em 01/03 no ano não bissexto (Código Civil, art. 132 §3º)', () => {
    assert.equal(calcularIdade('2008-02-29', '2026-02-28'), 17);
    assert.equal(calcularIdade('2008-02-29', '2026-03-01'), 18);
  });
});

describe('revisão A — instante com o fuso do aparelho (R7.4)', () => {
  const tzOriginal = process.env.TZ;
  const restaurar = () => {
    if (tzOriginal === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = tzOriginal;
    }
  };

  test('grava a hora local com o deslocamento, não em UTC com "Z"', () => {
    try {
      process.env.TZ = 'America/Sao_Paulo';
      // 22h30 de 10/10 em São Paulo = 01h30 de 11/10 em UTC: a data não pode virar.
      assert.equal(instanteComFuso(new Date('2026-10-11T01:30:00Z')), '2026-10-10T22:30:00-03:00');
      process.env.TZ = 'Asia/Kolkata';
      assert.equal(instanteComFuso(new Date('2026-10-11T01:30:00Z')), '2026-10-11T07:00:00+05:30');
      process.env.TZ = 'UTC';
      assert.equal(instanteComFuso(new Date('2026-10-11T01:30:00Z')), '2026-10-11T01:30:00+00:00');
    } finally {
      restaurar();
    }
  });
});

describe('revisão A — peso corporal sempre com uma casa (tabela da seção 7)', () => {
  test('peso corporal mostra o zero: "80,0 kg"', () => {
    assert.equal(formatarPeso(80000), '80,0 kg');
    assert.equal(formatarPeso(72400), '72,4 kg');
  });

});
