// Utilitários de data. Todas as datas circulam como texto ISO "AAAA-MM-DD"
// e são manipuladas em UTC, para que horário de verão e fuso não alterem a contagem.

export const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const DIAS_SEMANA_CURTO = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function paraData(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

export function paraIso(data) {
  return data.toISOString().slice(0, 10);
}

export function criarIso(ano, mes, dia) {
  return paraIso(new Date(Date.UTC(ano, mes - 1, dia)));
}

export function addDias(iso, n) {
  const d = paraData(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return paraIso(d);
}

export function diferencaDias(deIso, ateIso) {
  return Math.round((paraData(ateIso) - paraData(deIso)) / 86400000);
}

export function diaSemana(iso) {
  return paraData(iso).getUTCDay();
}

export function nomeDiaSemana(iso, curto = false) {
  return (curto ? DIAS_SEMANA_CURTO : DIAS_SEMANA)[diaSemana(iso)];
}

export function formatar(iso) {
  if (!iso || !ISO_RE.test(iso)) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

export function hojeIso(agora = new Date()) {
  // Usa a data local do usuário, não a data UTC.
  return criarIso(agora.getFullYear(), agora.getMonth() + 1, agora.getDate());
}
