// Consulta pública ao Diário de Justiça Eletrônico Nacional (DJEN/CNJ).
// A API só responde a acessos feitos do Brasil e aceita chamadas diretas do navegador.
// Campos confirmados em 15/10/2026: data_disponibilizacao, siglaTribunal, tipoComunicacao,
// nomeOrgao, texto, numero_processo, link, tipoDocumento, nomeClasse, numeroprocessocommascara,
// data_cancelamento, ativo.

export const DJEN_API = 'https://comunicaapi.pje.jus.br/api/v1/comunicacao';

const ENTIDADES = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&ordm;': 'º', '&ordf;': 'ª', '&sect;': '§' };

export function textoPlano(html) {
  return String(html || '')
    .replace(/<\s*(br|\/p|\/div|\/li)\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTIDADES[e.toLowerCase()] ?? ' ')
    .replace(/[ \t ]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

function dataIso(item) {
  const d = item.data_disponibilizacao || item.datadisponibilizacao || '';
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

export function normalizarComunicacao(item) {
  return {
    id: String(item.id ?? item.hash ?? ''),
    data: dataIso(item),
    tipoDocumento: item.tipoDocumento || item.tipoComunicacao || 'Comunicação',
    tipoComunicacao: item.tipoComunicacao || '',
    orgao: item.nomeOrgao || '',
    tribunal: item.siglaTribunal || '',
    classe: item.nomeClasse || '',
    numero: item.numeroprocessocommascara || item.numero_processo || '',
    link: typeof item.link === 'string' && /^https?:\/\//.test(item.link) ? item.link : '',
    texto: textoPlano(item.texto),
    cancelada: Boolean(item.data_cancelamento) || item.ativo === false,
  };
}

// Busca todas as comunicações de um processo (20 dígitos, com ou sem máscara).
export async function buscarComunicacoes(numero, { fetch: f = (...a) => globalThis.fetch(...a), porPagina = 100, maxPaginas = 10 } = {}) {
  const digitos = String(numero).replace(/\D/g, '');
  if (digitos.length !== 20) throw new Error('Informe o número completo do processo (20 dígitos).');
  const itens = [];
  let total = Infinity;
  for (let pagina = 1; pagina <= maxPaginas && itens.length < total; pagina += 1) {
    let resposta;
    try {
      resposta = await f(`${DJEN_API}?${new URLSearchParams({ numeroProcesso: digitos, itensPorPagina: porPagina, pagina })}`, { headers: { Accept: 'application/json' } });
    } catch {
      const erro = new Error('Não foi possível acessar o DJEN a partir desta página. A busca funciona na versão publicada no GitHub Pages, acessada do Brasil.');
      erro.codigo = 'rede';
      throw erro;
    }
    if (!resposta.ok) throw new Error(`O DJEN respondeu com erro (HTTP ${resposta.status}). Tente novamente em instantes.`);
    let json;
    try {
      json = await resposta.json();
    } catch {
      throw new Error('O DJEN devolveu uma resposta em formato inesperado. Tente novamente em instantes.');
    }
    const lote = Array.isArray(json.items) ? json.items : [];
    total = Number.isFinite(json.count) ? json.count : lote.length;
    itens.push(...lote);
    if (!lote.length) break;
  }
  return itens
    .map(normalizarComunicacao)
    .filter((c) => c.data)
    .sort((a, b) => b.data.localeCompare(a.data));
}

const EXTENSO = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, 'três': 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, quinze: 15, vinte: 20, trinta: 30 };

// Procura no teor do ato a indicação expressa de prazo ("no prazo de 15 (quinze) dias").
// Devolve uma sugestão para conferência; nunca substitui a leitura do ato.
export function sugerirPrazo(texto, tipoDocumento = '') {
  const t = String(texto || '');
  const re = /prazo\s+(?:comum\s+|sucessivo\s+|legal\s+)?(?:de\s+|em\s+)?(\d{1,3}|[a-zçê]+)\s*(?:\([^)]{1,30}\)\s*)?(dias?|horas?)(\s+úteis|\s+uteis|\s+corridos)?/i;
  const m = t.match(re);
  if (m) {
    const bruto = m[1].toLowerCase();
    const n = /^\d+$/.test(bruto) ? Number(bruto) : EXTENSO[bruto];
    if (n && /^dia/i.test(m[2])) {
      const ini = Math.max(0, m.index - 60);
      const trecho = t.slice(ini, m.index + m[0].length + 40).replace(/\s+/g, ' ').trim();
      return { dias: n, contagem: /corridos/i.test(m[3] || '') ? 'corridos' : 'uteis', fonte: 'texto', trecho };
    }
  }
  const tipo = tipoDocumento.toLowerCase();
  if (tipo.includes('sentença') || tipo.includes('sentenca')) return { dias: 15, descricao: 'Apelação', fonte: 'tipo', trecho: 'Sentença: apelação em 15 dias (CPC, art. 1.003, § 5º); embargos de declaração em 5 dias (art. 1.023).' };
  if (tipo.includes('citação') || tipo.includes('citacao')) return { dias: 15, descricao: 'Contestação', fonte: 'tipo', trecho: 'Citação: contestação em 15 dias (CPC, art. 335).' };
  return null;
}
