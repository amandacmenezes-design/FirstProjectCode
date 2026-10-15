import test from 'node:test';
import assert from 'node:assert/strict';
import { buscarComunicacoes, normalizarComunicacao, sugerirPrazo, textoPlano } from '../js/djen.js';

test('texto plano remove HTML e entidades', () => {
  assert.equal(textoPlano('<p>Intime-se&nbsp;a parte.</p><p>Belém, 1&ordm; de outubro</p>'), 'Intime-se a parte.\nBelém, 1º de outubro');
});

test('sugere prazo expresso no texto', () => {
  assert.equal(sugerirPrazo('Intime-se o autor para, no prazo de 15 (quinze) dias, apresentar réplica.').dias, 15);
  assert.equal(sugerirPrazo('manifestem-se no prazo comum de 05 dias').dias, 5);
  assert.equal(sugerirPrazo('no prazo de cinco dias, sob pena de preclusão').dias, 5);
  const c = sugerirPrazo('no prazo de 10 (dez) dias corridos');
  assert.equal(c.contagem, 'corridos');
  assert.match(sugerirPrazo('Intime-se para, no prazo de 15 dias, emendar').trecho, /prazo de 15 dias/);
});

test('sem prazo expresso, sugere pelo tipo de ato ou não sugere', () => {
  assert.equal(sugerirPrazo('Julgo procedente o pedido.', 'Sentença').descricao, 'Apelação');
  assert.equal(sugerirPrazo('Cumpra-se.', 'Despacho'), null);
  assert.equal(sugerirPrazo('prazo de 48 horas', 'Despacho'), null);
});

test('normaliza a comunicação do DJEN', () => {
  const c = normalizarComunicacao({ id: 7, data_disponibilizacao: '2026-10-14', tipoDocumento: 'Sentença', nomeOrgao: '5ª Vara Cível', siglaTribunal: 'TJPA', texto: '<b>Ok</b>', numeroprocessocommascara: '0801234-79.2026.8.14.0301', link: 'https://pje.tjpa.jus.br/x', data_cancelamento: null, ativo: true });
  assert.equal(c.data, '2026-10-14');
  assert.equal(c.texto, 'Ok');
  assert.equal(c.cancelada, false);
  assert.equal(normalizarComunicacao({ datadisponibilizacao: '09/09/2026', link: 'javascript:alert(1)' }).data, '2026-09-09');
  assert.equal(normalizarComunicacao({ link: 'javascript:alert(1)' }).link, '');
});

test('busca pagina, ordena e trata erros', async () => {
  const chamadas = [];
  const fakeFetch = async (url) => {
    chamadas.push(url);
    const pagina = Number(new URL(url).searchParams.get('pagina'));
    const items = pagina === 1 ? [{ id: 1, data_disponibilizacao: '2026-09-09' }, { id: 2, data_disponibilizacao: '2026-10-14' }] : [{ id: 3, data_disponibilizacao: '2026-08-01' }];
    return { ok: true, status: 200, json: async () => ({ status: 'success', count: 3, items }) };
  };
  const itens = await buscarComunicacoes('0801234-79.2026.8.14.0301', { fetch: fakeFetch, porPagina: 2 });
  assert.deepEqual(itens.map((i) => i.data), ['2026-10-14', '2026-09-09', '2026-08-01']);
  assert.equal(chamadas.length, 2);
  assert.match(chamadas[0], /numeroProcesso=08012347920268140301/);
  await assert.rejects(buscarComunicacoes('123'), /20 dígitos/);
  await assert.rejects(buscarComunicacoes('08012347920268140301', { fetch: async () => { throw new TypeError('Failed to fetch'); } }), /GitHub Pages/);
  await assert.rejects(buscarComunicacoes('08012347920268140301', { fetch: async () => ({ ok: false, status: 503 }) }), /HTTP 503/);
});
