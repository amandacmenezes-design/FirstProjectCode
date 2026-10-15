import { ISO_RE, addDias, diaSemana, diferencaDias } from './datas.js';
import { PRESETS, emRecesso, feriadosNacionais } from './feriados.js';

// Calendário forense: decide se um dia é útil e, se não for, explica o motivo.
// personalizados: [{ inicio: 'AAAA-MM-DD', fim?: 'AAAA-MM-DD', descricao }]
export function criarCalendario({ presets = [], personalizados = [] } = {}) {
  const porAno = new Map();

  function feriadosDoAno(ano) {
    if (!porAno.has(ano)) {
      const mapa = new Map();
      const incluir = ([iso, nome]) => mapa.set(iso, mapa.has(iso) ? `${mapa.get(iso)} · ${nome}` : nome);
      feriadosNacionais(ano).forEach(incluir);
      presets.forEach((chave) => PRESETS[chave]?.feriados(ano).forEach(incluir));
      porAno.set(ano, mapa);
    }
    return porAno.get(ano);
  }

  function motivo(iso, { considerarRecesso = true } = {}) {
    const motivos = [];
    const dow = diaSemana(iso);
    if (dow === 0) motivos.push('Domingo');
    if (dow === 6) motivos.push('Sábado');
    const feriado = feriadosDoAno(Number(iso.slice(0, 4))).get(iso);
    if (feriado) motivos.push(feriado);
    for (const p of personalizados) {
      if (p.inicio && iso >= p.inicio && iso <= (p.fim || p.inicio)) motivos.push(p.descricao || 'Suspensão de expediente');
    }
    if (considerarRecesso && emRecesso(iso)) motivos.push('Recesso forense (20/12 a 20/01)');
    return motivos.length ? motivos.join(' · ') : null;
  }

  return {
    motivo,
    ehDiaUtil: (iso, opcoes) => motivo(iso, opcoes) === null,
    feriadosDoAno: (ano) => [...feriadosDoAno(ano).entries()].sort(([a], [b]) => a.localeCompare(b)),
  };
}

// Calcula o termo final de um prazo e devolve a memória de cálculo dia a dia.
//
// entrada.marco:
//   'disponibilizacao' – data de disponibilização no DJe/DJEN. Considera-se publicado no
//                        primeiro dia útil seguinte (Lei 11.419/2006, art. 4º, § 3º) e o
//                        prazo começa no primeiro dia útil após a publicação (§ 4º).
//   'intimacao'        – data da intimação/ciência; o dia do começo é excluído (CPC, art. 224).
// entrada.contagem:
//   'uteis'    – CPC, art. 219: só dias úteis; recesso suspende (art. 220).
//   'corridos' – CPP, art. 798: dias contínuos; termo final em dia não útil prorroga-se (§ 3º);
//                recesso suspende, salvo réu preso, Lei Maria da Penha e urgências (art. 798-A).
export function calcularPrazo(entrada, calendario) {
  const { dataMarco, marco = 'intimacao', contagem = 'uteis', dobro = false } = entrada;
  const diasBase = Number(entrada.dias);
  if (!ISO_RE.test(dataMarco || '')) throw new Error('Informe a data do marco inicial.');
  if (!Number.isInteger(diasBase) || diasBase < 1) throw new Error('Informe um número inteiro de dias, maior que zero.');
  if (diasBase > 3650) throw new Error('Prazo acima de 3.650 dias não é suportado.');
  const dias = dobro ? diasBase * 2 : diasBase;

  const suspendeRecesso = contagem === 'uteis' || entrada.suspenderRecesso !== false;
  const opcoes = { considerarRecesso: suspendeRecesso };
  const util = (iso) => calendario.ehDiaUtil(iso, opcoes);
  const memoria = [{
    data: dataMarco,
    tipo: 'marco',
    texto: marco === 'disponibilizacao' ? 'Disponibilização no Diário de Justiça Eletrônico' : 'Intimação / ciência do ato (dia excluído)',
  }];

  let d = dataMarco;
  const avancarAteUtil = () => {
    d = addDias(d, 1);
    while (!util(d)) {
      memoria.push({ data: d, tipo: 'excluido', texto: calendario.motivo(d, opcoes) });
      d = addDias(d, 1);
    }
  };

  let publicacao = null;
  if (marco === 'disponibilizacao') {
    avancarAteUtil();
    publicacao = d;
    memoria.push({ data: d, tipo: 'publicacao', texto: 'Data da publicação (Lei 11.419/2006, art. 4º, § 3º)' });
  }

  avancarAteUtil();
  const inicio = d;
  let conta = 1;
  memoria.push({ data: d, tipo: 'conta', conta, texto: 'Primeiro dia do prazo' });

  while (conta < dias) {
    d = addDias(d, 1);
    if (contagem === 'uteis' ? util(d) : !(suspendeRecesso && emRecesso(d))) {
      conta += 1;
      memoria.push({ data: d, tipo: 'conta', conta, texto: contagem === 'corridos' && !util(d) ? calendario.motivo(d, opcoes) : '' });
    } else {
      memoria.push({ data: d, tipo: 'excluido', texto: calendario.motivo(d, opcoes) });
    }
  }

  let prorrogado = false;
  if (contagem === 'corridos') {
    while (!util(d)) {
      prorrogado = true;
      d = addDias(d, 1);
      memoria.push({ data: d, tipo: util(d) ? 'prorrogacao' : 'excluido', texto: util(d) ? 'Termo final prorrogado (CPP, art. 798, § 3º)' : calendario.motivo(d, opcoes) });
    }
  }

  memoria[memoria.length - 1].vencimento = true;
  return { publicacao, inicio, vencimento: d, dias, prorrogado, memoria };
}

// Situação de um prazo em relação a hoje, para o painel.
export function situacao(vencimento, hoje) {
  const faltam = diferencaDias(hoje, vencimento);
  if (faltam < 0) return { chave: 'vencido', rotulo: faltam === -1 ? 'Venceu ontem' : `Venceu há ${-faltam} dias`, faltam };
  if (faltam === 0) return { chave: 'hoje', rotulo: 'Vence hoje', faltam };
  if (faltam <= 3) return { chave: 'urgente', rotulo: faltam === 1 ? 'Vence amanhã' : `Faltam ${faltam} dias`, faltam };
  if (faltam <= 7) return { chave: 'proximo', rotulo: `Faltam ${faltam} dias`, faltam };
  return { chave: 'futuro', rotulo: `Faltam ${faltam} dias`, faltam };
}

// Prazos usuais (CPC), para preenchimento rápido. O usuário pode alterar livremente.
export const PRAZOS_USUAIS = [
  { nome: 'Contestação', dias: 15, base: 'CPC, art. 335' },
  { nome: 'Réplica', dias: 15, base: 'CPC, arts. 350 e 351' },
  { nome: 'Apelação', dias: 15, base: 'CPC, art. 1.003, § 5º' },
  { nome: 'Contrarrazões', dias: 15, base: 'CPC, art. 1.010, § 1º' },
  { nome: 'Agravo de instrumento', dias: 15, base: 'CPC, art. 1.003, § 5º' },
  { nome: 'Embargos de declaração', dias: 5, base: 'CPC, art. 1.023' },
  { nome: 'Impugnação ao cumprimento de sentença', dias: 15, base: 'CPC, art. 525' },
  { nome: 'Embargos à execução', dias: 15, base: 'CPC, art. 915' },
  { nome: 'Manifestação (prazo não fixado)', dias: 5, base: 'CPC, art. 218, § 3º' },
  { nome: 'Recurso inominado (JEC)', dias: 10, base: 'Lei 9.099/1995, art. 42' },
];
