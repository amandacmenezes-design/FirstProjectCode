#!/usr/bin/env node
// Calcula um prazo processual com o mesmo motor do Painel de Prazos e imprime a memória de cálculo.
//
// Uso:
//   node calcular_prazo.mjs --data 2026-10-14 --dias 15 [--marco disponibilizacao|intimacao]
//                           [--corridos] [--dobro] [--sem-suspensao-recesso] [--sem-para]
//                           [--suspensao 2026-10-21:2026-10-22:"Indisponibilidade do PJe"] [--json]
//
// --marco disponibilizacao (padrão): data de disponibilização no DJe/DJEN (Lei 11.419/2006, art. 4º, §§ 3º e 4º).
// --marco intimacao: data da intimação, ciência ou juntada (CPC, art. 224).
// --corridos: dias corridos (CPP, art. 798); o padrão é dias úteis (CPC, art. 219).
// --sem-suspensao-recesso: só para dias corridos (réu preso, Lei Maria da Penha, urgência; CPP, art. 798-A).
// --sem-para: não aplica os feriados do Pará/Belém (aplicados por padrão).
// --suspensao: pode ser repetido; formato INICIO[:FIM[:DESCRICAO]].

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const base = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'app', 'js');
const { calcularPrazo, criarCalendario } = await import(join(base, 'prazos.js'));
const { formatar, nomeDiaSemana } = await import(join(base, 'datas.js'));

function lerArgs(argv) {
  const a = { marco: 'disponibilizacao', contagem: 'uteis', dobro: false, suspenderRecesso: true, para: true, suspensoes: [], json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    const v = () => argv[++i];
    if (k === '--data') a.dataMarco = v();
    else if (k === '--dias') a.dias = Number(v());
    else if (k === '--marco') a.marco = v();
    else if (k === '--corridos') a.contagem = 'corridos';
    else if (k === '--dobro') a.dobro = true;
    else if (k === '--sem-suspensao-recesso') a.suspenderRecesso = false;
    else if (k === '--sem-para') a.para = false;
    else if (k === '--json') a.json = true;
    else if (k === '--suspensao') {
      const [inicio, fim, ...desc] = v().split(':');
      a.suspensoes.push({ inicio, fim: fim || inicio, descricao: desc.join(':') || 'Suspensão de expediente' });
    } else if (k === '--ajuda' || k === '-h') a.ajuda = true;
    else throw new Error(`Opção desconhecida: ${k}`);
  }
  return a;
}

try {
  const a = lerArgs(process.argv.slice(2));
  if (a.ajuda || !a.dataMarco || !a.dias) {
    console.log('Uso: node calcular_prazo.mjs --data AAAA-MM-DD --dias N [--marco disponibilizacao|intimacao] [--corridos] [--dobro] [--sem-suspensao-recesso] [--sem-para] [--suspensao INICIO:FIM:DESCRICAO] [--json]');
    process.exit(a.ajuda ? 0 : 1);
  }
  const cal = criarCalendario({ presets: a.para ? ['para'] : [], personalizados: a.suspensoes });
  const r = calcularPrazo(a, cal);
  if (a.json) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(`Vencimento: ${formatar(r.vencimento)} (${nomeDiaSemana(r.vencimento)})${r.prorrogado ? ' — prorrogado' : ''}`);
    if (r.publicacao) console.log(`Publicação: ${formatar(r.publicacao)}`);
    console.log(`Início da contagem: ${formatar(r.inicio)}`);
    console.log(`Dias: ${r.dias} ${a.contagem === 'uteis' ? 'úteis' : 'corridos'}${a.dobro ? ' (em dobro)' : ''}`);
    console.log('\nMemória de cálculo:');
    for (const m of r.memoria) {
      const n = m.conta ? `${String(m.conta).padStart(3)}º` : '   —';
      const obs = m.vencimento ? `Termo final${m.texto ? ' · ' + m.texto : ''}` : m.texto;
      console.log(`  ${formatar(m.data)} ${nomeDiaSemana(m.data, true).padEnd(3)} ${n}  ${obs || ''}`);
    }
  }
} catch (e) {
  console.error(`Erro: ${e.message}`);
  process.exit(1);
}
