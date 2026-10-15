import { addDias, criarIso } from './datas.js';

// Domingo de Páscoa pelo algoritmo de Meeus/Jones/Butcher (calendário gregoriano).
export function pascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return criarIso(ano, mes, dia);
}

// Feriados nacionais e dias sem expediente forense em âmbito nacional
// (CPC, art. 216: são feriados forenses os dias em que não haja expediente).
export function feriadosNacionais(ano) {
  const p = pascoa(ano);
  const lista = [
    [criarIso(ano, 1, 1), 'Confraternização Universal'],
    [addDias(p, -48), 'Carnaval (segunda-feira)'],
    [addDias(p, -47), 'Carnaval (terça-feira)'],
    [addDias(p, -2), 'Sexta-feira da Paixão'],
    [criarIso(ano, 4, 21), 'Tiradentes'],
    [criarIso(ano, 5, 1), 'Dia do Trabalho'],
    [addDias(p, 60), 'Corpus Christi'],
    [criarIso(ano, 9, 7), 'Independência do Brasil'],
    [criarIso(ano, 10, 12), 'Nossa Senhora Aparecida'],
    [criarIso(ano, 11, 2), 'Finados'],
    [criarIso(ano, 11, 15), 'Proclamação da República'],
    [criarIso(ano, 12, 25), 'Natal'],
  ];
  if (ano >= 2024) lista.push([criarIso(ano, 11, 20), 'Dia Nacional de Zumbi e da Consciência Negra']);
  return lista;
}

// Segunda segunda-feira de outubro: dia seguinte ao Círio de Nazaré (segundo domingo de outubro).
function segundaDoCirio(ano) {
  let d = criarIso(ano, 10, 1);
  let domingos = 0;
  while (true) {
    if (new Date(d + 'T00:00:00Z').getUTCDay() === 0 && ++domingos === 2) return addDias(d, 1);
    d = addDias(d, 1);
  }
}

// Conjuntos regionais opcionais. Devem ser conferidos anualmente com a portaria
// de calendário do tribunal, pois podem mudar de um ano para outro.
export const PRESETS = {
  para: {
    nome: 'Pará / Belém (conferir portaria anual do TJPA)',
    feriados: (ano) => [
      [criarIso(ano, 8, 15), 'Adesão do Pará à Independência'],
      [segundaDoCirio(ano), 'Segunda-feira do Círio de Nazaré'],
      [criarIso(ano, 12, 8), 'Dia da Justiça / N. Sra. da Conceição'],
    ],
  },
};

export function emRecesso(iso) {
  const mes = Number(iso.slice(5, 7));
  const dia = Number(iso.slice(8, 10));
  return (mes === 12 && dia >= 20) || (mes === 1 && dia <= 20);
}
