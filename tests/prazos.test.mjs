import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularPrazo, criarCalendario, situacao } from '../js/prazos.js';
import { pascoa } from '../js/feriados.js';
import { analisarNumeroCnj, digitoVerificador } from '../js/cnj.js';

const cal = criarCalendario();

test('Páscoa em anos conhecidos', () => {
  assert.equal(pascoa(2024), '2024-03-31');
  assert.equal(pascoa(2025), '2025-04-20');
  assert.equal(pascoa(2026), '2026-04-05');
});

test('feriados móveis de 2026', () => {
  assert.match(cal.motivo('2026-02-16'), /Carnaval/);
  assert.match(cal.motivo('2026-04-03'), /Paixão/);
  assert.match(cal.motivo('2026-06-04'), /Corpus Christi/);
  assert.equal(cal.motivo('2026-02-18'), null); // Quarta-feira de Cinzas é dia útil por padrão
});

test('disponibilização no DJEN: publicação no dia útil seguinte e Finados excluído', () => {
  const r = calcularPrazo({ dataMarco: '2026-10-15', marco: 'disponibilizacao', dias: 15 }, cal);
  assert.equal(r.publicacao, '2026-10-16');
  assert.equal(r.inicio, '2026-10-19');
  assert.equal(r.vencimento, '2026-11-09');
});

test('intimação: dia do começo excluído (CPC, art. 224)', () => {
  const r = calcularPrazo({ dataMarco: '2026-10-19', marco: 'intimacao', dias: 5 }, cal);
  assert.equal(r.inicio, '2026-10-20');
  assert.equal(r.vencimento, '2026-10-26');
});

test('recesso forense suspende o prazo em dias úteis (CPC, art. 220)', () => {
  const r = calcularPrazo({ dataMarco: '2025-12-18', dias: 5 }, cal);
  assert.equal(r.inicio, '2025-12-19');
  assert.equal(r.vencimento, '2026-01-26');
});

test('prazo em dobro', () => {
  const r = calcularPrazo({ dataMarco: '2026-10-19', dias: 5, dobro: true }, cal);
  assert.equal(r.dias, 10);
  assert.equal(r.vencimento, '2026-11-03');
});

test('dias corridos: intimação na sexta começa na segunda (Súmula 310/STF)', () => {
  const r = calcularPrazo({ dataMarco: '2026-10-16', dias: 5, contagem: 'corridos' }, cal);
  assert.equal(r.inicio, '2026-10-19');
  assert.equal(r.vencimento, '2026-10-23');
});

test('dias corridos: termo em sábado prorroga, saltando o feriado de 12/10', () => {
  const r = calcularPrazo({ dataMarco: '2026-10-05', dias: 5, contagem: 'corridos' }, cal);
  assert.equal(r.vencimento, '2026-10-13');
  assert.equal(r.prorrogado, true);
});

test('dias corridos sem suspensão no recesso (réu preso, CPP art. 798-A)', () => {
  const comSuspensao = calcularPrazo({ dataMarco: '2025-12-15', dias: 10, contagem: 'corridos' }, cal);
  const semSuspensao = calcularPrazo({ dataMarco: '2025-12-15', dias: 10, contagem: 'corridos', suspenderRecesso: false }, cal);
  assert.equal(semSuspensao.vencimento, '2025-12-26');
  assert.ok(comSuspensao.vencimento > '2026-01-20');
});

test('preset do Pará e suspensões personalizadas', () => {
  const pa = criarCalendario({
    presets: ['para'],
    personalizados: [{ inicio: '2026-10-21', fim: '2026-10-22', descricao: 'Indisponibilidade do PJe' }],
  });
  assert.match(pa.motivo('2026-10-12'), /Círio/); // segundo domingo de outubro de 2026 é 11/10
  assert.match(pa.motivo('2026-10-22'), /PJe/);
  const r = calcularPrazo({ dataMarco: '2026-10-19', dias: 5 }, pa);
  assert.equal(r.vencimento, '2026-10-28');
});

test('entradas inválidas são recusadas', () => {
  assert.throws(() => calcularPrazo({ dataMarco: '', dias: 5 }, cal));
  assert.throws(() => calcularPrazo({ dataMarco: '2026-10-19', dias: 0 }, cal));
});

test('situação em relação a hoje', () => {
  assert.equal(situacao('2026-10-14', '2026-10-15').chave, 'vencido');
  assert.equal(situacao('2026-10-15', '2026-10-15').chave, 'hoje');
  assert.equal(situacao('2026-10-17', '2026-10-15').chave, 'urgente');
  assert.equal(situacao('2026-10-30', '2026-10-15').chave, 'futuro');
});

test('número CNJ: dígito verificador', () => {
  const dv = digitoVerificador('0801234', '2025', '8', '14', '0301');
  const ok = analisarNumeroCnj(`0801234-${dv}.2025.8.14.0301`);
  assert.equal(ok.valido, true);
  assert.equal(ok.segmento, 'Justiça Estadual');
  const errado = analisarNumeroCnj(`0801234-${dv === '00' ? '01' : '00'}.2025.8.14.0301`);
  assert.equal(errado.valido, false);
  assert.equal(analisarNumeroCnj('123').valido, false);
});

test('remove os dados de exemplo e preserva os registros reais', async () => {
  const { removerExemplos } = await import('../js/store.js');
  const salvo = {
    exemplo: true,
    processos: [{ id: 'a', cliente: 'Cliente Exemplo A' }, { id: 'r', cliente: 'Maria' }],
    prazos: [{ id: 1, processoId: 'a' }, { id: 2, processoId: 'r' }],
    tarefas: [{ id: 't1', processoId: 'a', titulo: 'x' }, { id: 't2', processoId: '', titulo: 'Conferir portaria de feriados do TJPA para 2027' }, { id: 't3', processoId: '', titulo: 'Ligar para Maria' }],
    config: {},
  };
  const limpo = removerExemplos(salvo);
  assert.equal(limpo.exemplo, false);
  assert.deepEqual(limpo.processos.map((p) => p.id), ['r']);
  assert.deepEqual(limpo.prazos.map((p) => p.id), [2]);
  assert.deepEqual(limpo.tarefas.map((t) => t.id), ['t3']);
  assert.equal(removerExemplos(limpo), limpo);
});
