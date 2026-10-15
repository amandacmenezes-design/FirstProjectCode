// Número único de processo (Resolução CNJ 65/2008): NNNNNNN-DD.AAAA.J.TR.OOOO
// Dígito verificador pelo módulo 97 (ISO 7064).

const FORMATO = /^(\d{7})-?(\d{2})\.?(\d{4})\.?(\d)\.?(\d{2})\.?(\d{4})$/;

function mod97(numero) {
  let resto = 0;
  for (const c of numero) resto = (resto * 10 + Number(c)) % 97;
  return resto;
}

export function digitoVerificador(n, ano, j, tr, origem) {
  return String(98 - mod97(`${n}${ano}${j}${tr}${origem}00`)).padStart(2, '0');
}

export function analisarNumeroCnj(texto) {
  const limpo = String(texto || '').trim().replace(/\s/g, '');
  const m = limpo.match(FORMATO);
  if (!m) return { valido: false, erro: 'Use o formato NNNNNNN-DD.AAAA.J.TR.OOOO (20 dígitos).' };
  const [, n, dv, ano, j, tr, origem] = m;
  const formatado = `${n}-${dv}.${ano}.${j}.${tr}.${origem}`;
  const esperado = digitoVerificador(n, ano, j, tr, origem);
  if (dv !== esperado) return { valido: false, formatado, erro: `Dígito verificador não confere (esperado ${esperado}). Confira o número.` };
  return { valido: true, formatado, segmento: SEGMENTOS[j] || 'Segmento desconhecido', tribunal: tr, ano };
}

const SEGMENTOS = {
  1: 'Supremo Tribunal Federal',
  2: 'Conselho Nacional de Justiça',
  3: 'Superior Tribunal de Justiça',
  4: 'Justiça Federal',
  5: 'Justiça do Trabalho',
  6: 'Justiça Eleitoral',
  7: 'Justiça Militar da União',
  8: 'Justiça Estadual',
  9: 'Justiça Militar Estadual',
};
