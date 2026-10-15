import { ISO_RE, addDias, criarIso, diaSemana, formatar, hojeIso, nomeDiaSemana } from './datas.js';
import { PRESETS } from './feriados.js';
import { PRAZOS_USUAIS, calcularPrazo, criarCalendario, situacao } from './prazos.js';
import { analisarNumeroCnj } from './cnj.js';
import { buscarComunicacoes, sugerirPrazo } from './djen.js';
import { carregar, estadoExemplo, estadoVazio, normalizar, novoId, salvar } from './store.js';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

let estado = carregar() || estadoExemplo();
const ui = {
  aba: 'painel',
  gaveta: null, // 'prazo' | 'processo' | null
  filtroAgenda: null,
  filtroPrazos: 'pendentes',
  buscaPrazos: '',
  buscaProcessos: '',
  mesCal: hojeIso().slice(0, 7),
  diaSel: hojeIso(),
  processoEdit: null,
  djen: { estado: 'ocioso', itens: [], erro: '', escolhida: null },
};
let rascunho = rascunhoNovo();
let mensagem = null;
let mensagemErro = false;

const app = document.getElementById('app');

function rascunhoNovo(extra = {}) {
  const base = { id: null, dataMarco: hojeIso(), marco: 'disponibilizacao', contagem: 'uteis', dias: 15, dobro: false, suspenderRecesso: true, descricao: '', processoId: '', numeroBusca: '', publicacao: null, ...extra };
  if (!base.numeroBusca && base.processoId) base.numeroBusca = estado.processos.find((p) => p.id === base.processoId)?.numero || '';
  return base;
}

// ---------- ícones ----------
const ICONES = {
  painel: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  prazos: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  processos: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  tarefas: '<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>',
  ajustes: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  fechar: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  esq: '<path d="M15 6l-6 6 6 6"/>',
  dir: '<path d="M9 6l6 6-6 6"/>',
  busca: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  lixo: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
  balanca: '<path d="M12 4v16M8 20h8M5 8h14M12 4l-1 4M5 8l-2.5 6a2.5 2.5 0 0 0 5 0zM19 8l-2.5 6a2.5 2.5 0 0 0 5 0z"/>',
  alerta: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  editar: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
};
const ic = (nome, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONES[nome]}</svg>`;

// ---------- utilidades ----------
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const calendario = () => criarCalendario(estado.config);
const processo = (id) => estado.processos.find((p) => p.id === id);
const nomeUsuario = () => (estado.config.nome ?? 'Dra. Amanda').trim();
const dataExtensa = (iso) => `${nomeDiaSemana(iso)}, ${Number(iso.slice(8))} de ${MESES[Number(iso.slice(5, 7)) - 1]}`;
const blocoData = (iso) => `<div class="dia"><span class="dia-n">${iso.slice(8)}</span><span class="dia-m">${MESES_CURTO[Number(iso.slice(5, 7)) - 1]}</span><span class="dia-s">${nomeDiaSemana(iso, true)}</span></div>`;
const chip = (sit) => `<span class="chip chip-${sit.chave}">${esc(sit.rotulo)}</span>`;
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

function rotuloProcesso(id, comCliente = true) {
  const p = processo(id);
  if (!p) return '';
  return `<span class="mono">${esc(p.numero)}</span>${comCliente && p.cliente ? ` · ${esc(p.cliente)}` : ''}`;
}

function persistir(texto) {
  const ok = salvar(estado);
  if (!ok) return avisar('Não foi possível salvar neste navegador. Gere um backup em Ajustes antes de fechar.');
  mensagem = texto;
  render();
}

function avisar(texto) {
  mensagem = texto;
  mensagemErro = true;
  render();
}

function comCalculo(p, cal = calendario()) {
  try {
    return { ...p, calc: calcularPrazo(p, cal) };
  } catch (e) {
    return { ...p, erro: e.message };
  }
}

function itensAgenda() {
  const hoje = hojeIso();
  const cal = calendario();
  const prazos = estado.prazos.filter((p) => !p.cumprido).map((p) => comCalculo(p, cal)).filter((p) => p.calc)
    .map((p) => ({ tipo: 'prazo', id: p.id, data: p.calc.vencimento, titulo: p.descricao || 'Prazo', processoId: p.processoId, sit: situacao(p.calc.vencimento, hoje) }));
  const tarefas = estado.tarefas.filter((t) => !t.concluida && ISO_RE.test(t.data || ''))
    .map((t) => ({ tipo: 'tarefa', id: t.id, data: t.data, titulo: t.titulo, processoId: t.processoId, prioridade: t.prioridade, sit: situacao(t.data, hoje) }));
  return [...prazos, ...tarefas].sort((a, b) => a.data.localeCompare(b.data) || (a.tipo === 'prazo' ? -1 : 1));
}

const GRUPOS = [
  ['vencido', 'Vencidos', (f) => f < 0],
  ['hoje', 'Hoje', (f) => f === 0],
  ['amanha', 'Amanhã', (f) => f === 1],
  ['semana', 'Próximos 7 dias', (f) => f >= 2 && f <= 7],
  ['depois', 'Mais adiante', (f) => f > 7],
];

function vazio(titulo, dica, acao = '') {
  return `<div class="vazio">${ic('check', 'vazio-ic')}<strong>${esc(titulo)}</strong><span>${esc(dica)}</span>${acao}</div>`;
}

// ---------- painel ----------
function telaPainel() {
  const itens = itensAgenda();
  const prazos = itens.filter((i) => i.tipo === 'prazo');
  const n = {
    vencido: prazos.filter((i) => i.sit.faltam < 0).length,
    hoje: prazos.filter((i) => i.sit.faltam === 0).length,
    semana: prazos.filter((i) => i.sit.faltam > 0 && i.sit.faltam <= 7).length,
    tarefa: itens.filter((i) => i.tipo === 'tarefa').length,
  };
  const proximo = prazos.find((i) => i.sit.faltam >= 0);

  let destaque;
  if (n.vencido) {
    destaque = `
      <div class="destaque destaque-alerta">
        <div class="destaque-ic">${ic('alerta')}</div>
        <div class="destaque-corpo"><span class="eyebrow">Atenção</span><strong class="destaque-titulo">${plural(n.vencido, 'prazo vencido', 'prazos vencidos')} sem baixa</strong><span>Confira se já foram cumpridos e dê baixa, ou tome as providências cabíveis.</span></div>
        <button class="btn btn-claro" data-acao="filtro-agenda" data-valor="vencido">Ver vencidos</button>
      </div>`;
  } else if (proximo) {
    destaque = `
      <div class="destaque">
        <div class="destaque-data"><span class="destaque-dia">${proximo.data.slice(8)}</span><span>${MESES_CURTO[Number(proximo.data.slice(5, 7)) - 1]} · ${nomeDiaSemana(proximo.data, true)}</span></div>
        <div class="destaque-corpo"><span class="eyebrow">Próximo vencimento · ${esc(proximo.sit.rotulo.toLowerCase())}</span><strong class="destaque-titulo">${esc(proximo.titulo)}</strong><span class="destaque-proc">${rotuloProcesso(proximo.processoId) || 'Sem processo vinculado'}</span></div>
        <button class="btn btn-claro" data-acao="cumprir" data-id="${proximo.id}">${ic('check')}Dar baixa</button>
      </div>`;
  } else {
    destaque = `
      <div class="destaque">
        <div class="destaque-ic">${ic('check')}</div>
        <div class="destaque-corpo"><span class="eyebrow">Tudo em dia</span><strong class="destaque-titulo">Nenhum prazo pendente</strong><span>Cadastre um prazo para acompanhá-lo por aqui.</span></div>
        <button class="btn btn-claro" data-acao="abrir-prazo">${ic('mais')}Novo prazo</button>
      </div>`;
  }

  const stat = (chave, numero, rotulo, tom) => `
    <button class="stat ${numero && tom ? 'stat-' + tom : ''} ${ui.filtroAgenda === chave ? 'ativo' : ''}" data-acao="filtro-agenda" data-valor="${chave}" aria-pressed="${ui.filtroAgenda === chave}">
      <span class="stat-n">${numero}</span><span class="stat-l">${rotulo}</span>
    </button>`;

  const filtrados = itens.filter((i) => {
    if (!ui.filtroAgenda) return true;
    if (ui.filtroAgenda === 'tarefa') return i.tipo === 'tarefa';
    if (ui.filtroAgenda === 'semana') return i.tipo === 'prazo' && i.sit.faltam > 0 && i.sit.faltam <= 7;
    return i.tipo === 'prazo' && GRUPOS.find(([k]) => k === ui.filtroAgenda)[2](i.sit.faltam);
  });

  const grupos = GRUPOS.map(([k, rotulo, teste]) => [k, rotulo, filtrados.filter((i) => teste(i.sit.faltam))]).filter(([, , l]) => l.length);

  return `
    ${destaque}
    <div class="stats">
      ${stat('vencido', n.vencido, 'Vencidos', 'vencido')}
      ${stat('hoje', n.hoje, 'Vencem hoje', 'hoje')}
      ${stat('semana', n.semana, 'Em 7 dias', '')}
      ${stat('tarefa', n.tarefa, 'Tarefas abertas', '')}
    </div>
    <div class="grade-painel">
      <section class="cartao">
        <header class="cartao-cab">
          <h2>Agenda</h2>
          ${ui.filtroAgenda ? `<button class="link" data-acao="filtro-agenda" data-valor="">Limpar filtro</button>` : `<span class="sub">${plural(itens.length, 'item pendente', 'itens pendentes')}</span>`}
        </header>
        ${grupos.length ? grupos.map(([k, rotulo, lista]) => `
          <div class="grupo grupo-${k}">
            <h3 class="grupo-titulo">${rotulo}<span>${lista.length}</span></h3>
            <ul class="agenda">${lista.map(itemAgenda).join('')}</ul>
          </div>`).join('') : vazio('Nada por aqui', ui.filtroAgenda ? 'Nenhum item corresponde a este filtro.' : 'Sem prazos ou tarefas pendentes.')}
      </section>
      <aside class="cartao">${miniCalendario(itens)}</aside>
    </div>`;
}

function itemAgenda(i) {
  const acao = i.tipo === 'prazo' ? 'cumprir' : 'concluir';
  return `
    <li class="ag-item sit-${i.sit.chave}">
      ${blocoData(i.data)}
      <div class="ag-corpo">
        <div class="ag-titulo"><span class="tag tag-${i.tipo}">${i.tipo === 'prazo' ? 'Prazo' : 'Tarefa'}</span>${esc(i.titulo)}${i.prioridade === 'alta' ? '<span class="chip chip-urgente">Prioridade alta</span>' : ''}</div>
        ${i.processoId ? `<div class="ag-proc">${rotuloProcesso(i.processoId)}</div>` : ''}
      </div>
      <div class="ag-lado">${chip(i.sit)}<button class="btn-icone" data-acao="${acao}" data-id="${i.id}" title="${i.tipo === 'prazo' ? 'Dar baixa no prazo' : 'Concluir tarefa'}" aria-label="${i.tipo === 'prazo' ? 'Dar baixa no prazo' : 'Concluir tarefa'}">${ic('check')}</button></div>
    </li>`;
}

function miniCalendario(itens) {
  const [ano, mes] = ui.mesCal.split('-').map(Number);
  const primeiro = criarIso(ano, mes, 1);
  const inicio = addDias(primeiro, -diaSemana(primeiro));
  const cal = calendario();
  const hoje = hojeIso();
  const porDia = new Map();
  itens.forEach((i) => porDia.set(i.data, [...(porDia.get(i.data) || []), i]));

  const celulas = [];
  for (let d = inicio, k = 0; k < 42; k += 1, d = addDias(d, 1)) {
    if (k === 35 && d.slice(0, 7) !== ui.mesCal) break;
    const motivo = cal.motivo(d);
    const dow = diaSemana(d);
    const feriado = motivo && dow !== 0 && dow !== 6;
    const doDia = porDia.get(d) || [];
    const classes = ['cal-dia', d.slice(0, 7) !== ui.mesCal && 'fora', motivo && 'nao-util', feriado && 'feriado', d === hoje && 'hoje', d === ui.diaSel && 'sel'].filter(Boolean).join(' ');
    celulas.push(`<button class="${classes}" data-acao="dia" data-valor="${d}" title="${esc(motivo || '')}" aria-label="${dataExtensa(d)}${motivo ? ', ' + esc(motivo) : ''}${doDia.length ? ', ' + plural(doDia.length, 'item', 'itens') : ''}">
      <span>${Number(d.slice(8))}</span>
      <span class="pontos">${doDia.slice(0, 3).map((i) => `<i class="ponto ponto-${i.tipo === 'tarefa' ? 'tarefa' : i.sit.chave}"></i>`).join('')}</span>
    </button>`);
  }

  const sel = ui.diaSel;
  const motivoSel = cal.motivo(sel);
  const doSel = porDia.get(sel) || [];

  return `
    <header class="cartao-cab cal-cab">
      <h2>${MESES[mes - 1][0].toUpperCase() + MESES[mes - 1].slice(1)} <span class="sub">${ano}</span></h2>
      <div class="cal-nav">
        <button class="btn-icone" data-acao="mes" data-valor="-1" aria-label="Mês anterior">${ic('esq')}</button>
        <button class="link" data-acao="mes" data-valor="0">Hoje</button>
        <button class="btn-icone" data-acao="mes" data-valor="1" aria-label="Próximo mês">${ic('dir')}</button>
      </div>
    </header>
    <div class="cal-grade" role="grid">
      ${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d) => `<span class="cal-sem">${d}</span>`).join('')}
      ${celulas.join('')}
    </div>
    <div class="cal-legenda"><span><i class="ponto ponto-vencido"></i>Vencido</span><span><i class="ponto ponto-urgente"></i>Até 3 dias</span><span><i class="ponto ponto-futuro"></i>Prazo</span><span><i class="ponto ponto-tarefa"></i>Tarefa</span></div>
    <div class="cal-detalhe">
      <strong>${dataExtensa(sel)}</strong>
      ${motivoSel ? `<span class="sub">Sem expediente · ${esc(motivoSel)}</span>` : '<span class="sub">Dia útil</span>'}
      ${doSel.length ? `<ul class="cal-itens">${doSel.map((i) => `<li><span class="tag tag-${i.tipo}">${i.tipo === 'prazo' ? 'Prazo' : 'Tarefa'}</span>${esc(i.titulo)}</li>`).join('')}</ul>` : ''}
    </div>`;
}

// ---------- prazos ----------
function listaPrazos() {
  const cal = calendario();
  const hoje = hojeIso();
  const busca = ui.buscaPrazos.trim().toLowerCase();
  const lista = estado.prazos
    .filter((p) => (ui.filtroPrazos === 'pendentes' ? !p.cumprido : ui.filtroPrazos === 'cumpridos' ? p.cumprido : true))
    .filter((p) => !busca || `${p.descricao} ${processo(p.processoId)?.numero || ''} ${processo(p.processoId)?.cliente || ''}`.toLowerCase().includes(busca))
    .map((p) => comCalculo(p, cal))
    .sort((a, b) => (a.calc?.vencimento || '').localeCompare(b.calc?.vencimento || ''));
  if (!lista.length) return vazio('Nenhum prazo encontrado', busca ? 'Tente outro termo de busca.' : 'Calcule e salve o primeiro prazo.', `<button class="btn" data-acao="abrir-prazo">${ic('mais')}Novo prazo</button>`);
  return `<ul class="tabela">${lista.map((p) => {
    const sit = p.calc && situacao(p.calc.vencimento, hoje);
    return `
    <li class="tab-linha ${p.cumprido ? 'feito' : sit ? 'sit-' + sit.chave : ''}">
      ${p.calc ? blocoData(p.calc.vencimento) : '<div class="dia"></div>'}
      <div class="tab-corpo">
        <strong>${esc(p.descricao || 'Prazo')}</strong>
        <span class="sub">${p.processoId ? rotuloProcesso(p.processoId) : 'Sem processo vinculado'}</span>
        <span class="sub">${p.dias} dias ${p.contagem === 'uteis' ? 'úteis' : 'corridos'}${p.dobro ? ', em dobro' : ''} · ${p.marco === 'disponibilizacao' ? 'disponibilizado' : 'intimado'} em ${formatar(p.dataMarco)}</span>
      </div>
      <div class="tab-lado">
        ${p.cumprido ? '<span class="chip chip-ok">Cumprido</span>' : sit ? chip(sit) : `<span class="chip chip-vencido">${esc(p.erro)}</span>`}
        <div class="acoes">
          <button class="btn-icone" data-acao="${p.cumprido ? 'reabrir' : 'cumprir'}" data-id="${p.id}" title="${p.cumprido ? 'Reabrir' : 'Dar baixa'}" aria-label="${p.cumprido ? 'Reabrir prazo' : 'Dar baixa no prazo'}">${ic(p.cumprido ? 'esq' : 'check')}</button>
          <button class="btn-icone" data-acao="ver-prazo" data-id="${p.id}" title="Ver cálculo e editar" aria-label="Ver cálculo e editar">${ic('calc')}</button>
          <button class="btn-icone perigo" data-acao="excluir-prazo" data-id="${p.id}" title="Excluir" aria-label="Excluir prazo">${ic('lixo')}</button>
        </div>
      </div>
    </li>`;
  }).join('')}</ul>`;
}

function telaPrazos() {
  return `
    <section class="cartao">
      <div class="ferramentas">
        <label class="busca">${ic('busca')}<input id="busca-prazos" type="search" placeholder="Buscar por ato, número ou cliente" value="${esc(ui.buscaPrazos)}" aria-label="Buscar prazos"></label>
        <div class="seg" role="group" aria-label="Filtrar prazos">
          ${[['pendentes', 'Pendentes'], ['cumpridos', 'Cumpridos'], ['todos', 'Todos']].map(([k, r]) => `<button class="seg-btn ${ui.filtroPrazos === k ? 'ativo' : ''}" data-acao="filtro-prazos" data-valor="${k}" aria-pressed="${ui.filtroPrazos === k}">${r}</button>`).join('')}
        </div>
      </div>
      <div id="lista-prazos">${listaPrazos()}</div>
    </section>`;
}

// ---------- processos ----------
function listaProcessos() {
  const cal = calendario();
  const hoje = hojeIso();
  const busca = ui.buscaProcessos.trim().toLowerCase();
  const lista = estado.processos.filter((p) => !busca || Object.values(p).join(' ').toLowerCase().includes(busca));
  if (!lista.length) return vazio('Nenhum processo encontrado', busca ? 'Tente outro termo de busca.' : 'Cadastre o primeiro processo pelo número CNJ.', `<button class="btn" data-acao="abrir-processo">${ic('mais')}Novo processo</button>`);
  return `<div class="cards">${lista.map((p) => {
    const abertos = estado.prazos.filter((z) => z.processoId === p.id && !z.cumprido).map((z) => comCalculo(z, cal)).filter((z) => z.calc)
      .sort((a, b) => a.calc.vencimento.localeCompare(b.calc.vencimento));
    const prox = abertos[0];
    const sit = prox && situacao(prox.calc.vencimento, hoje);
    return `
    <article class="proc ${sit ? 'sit-' + sit.chave : ''}">
      <div class="proc-topo">${p.area ? `<span class="tag">${esc(p.area)}</span>` : '<span></span>'}<button class="btn-icone" data-acao="editar-processo" data-id="${p.id}" aria-label="Editar processo" title="Editar">${ic('editar')}</button></div>
      <div class="proc-num mono">${esc(p.numero)}</div>
      <div class="proc-partes"><strong>${esc(p.cliente || 'Cliente não informado')}</strong>${p.parteContraria ? `<span class="sub">× ${esc(p.parteContraria)}</span>` : ''}</div>
      ${p.orgao ? `<div class="sub">${esc(p.orgao)}</div>` : ''}
      <div class="proc-rodape">
        ${prox ? `<div class="proc-prox"><span class="sub">Próximo prazo · ${esc(prox.descricao)}</span><span><strong class="mono">${formatar(prox.calc.vencimento)}</strong> ${chip(sit)}</span></div>` : '<span class="sub">Nenhum prazo em aberto</span>'}
        <button class="btn btn-sec" data-acao="prazo-para" data-id="${p.id}">${ic('mais')}Prazo</button>
      </div>
    </article>`;
  }).join('')}</div>`;
}

function telaProcessos() {
  return `
    <div class="ferramentas solta">
      <label class="busca">${ic('busca')}<input id="busca-processos" type="search" placeholder="Buscar por número, cliente, parte ou vara" value="${esc(ui.buscaProcessos)}" aria-label="Buscar processos"></label>
      <span class="sub">${plural(estado.processos.length, 'processo', 'processos')}</span>
    </div>
    <div id="lista-processos">${listaProcessos()}</div>`;
}

// ---------- tarefas ----------
function telaTarefas() {
  const hoje = hojeIso();
  const abertas = estado.tarefas.filter((t) => !t.concluida);
  const feitas = estado.tarefas.filter((t) => t.concluida);
  const ord = (a, b) => (a.data || '9').localeCompare(b.data || '9');
  const grupos = [
    ['Atrasadas', abertas.filter((t) => t.data && t.data < hoje)],
    ['Hoje', abertas.filter((t) => t.data === hoje)],
    ['Próximas', abertas.filter((t) => t.data && t.data > hoje)],
    ['Sem data', abertas.filter((t) => !t.data)],
  ].filter(([, l]) => l.length);

  const linha = (t) => `
    <li class="tarefa ${t.concluida ? 'feita' : ''}">
      <input type="checkbox" id="tf-${t.id}" class="caixa" data-acao="alternar-tarefa" data-id="${t.id}" ${t.concluida ? 'checked' : ''}>
      <label for="tf-${t.id}" class="tarefa-corpo">
        <span class="tarefa-titulo">${esc(t.titulo)}${t.prioridade === 'alta' ? '<span class="chip chip-urgente">Alta</span>' : ''}</span>
        <span class="sub">${[t.data ? formatar(t.data) + ' · ' + nomeDiaSemana(t.data, true) : '', t.processoId ? rotuloProcesso(t.processoId) : ''].filter(Boolean).join(' · ')}</span>
      </label>
      ${!t.concluida && t.data ? chip(situacao(t.data, hoje)) : ''}
      <button class="btn-icone perigo" data-acao="excluir-tarefa" data-id="${t.id}" aria-label="Excluir tarefa" title="Excluir">${ic('lixo')}</button>
    </li>`;

  return `
    <form id="form-tarefa" class="cartao rapida" autocomplete="off">
      <input id="tf-titulo" name="titulo" required placeholder="O que precisa ser feito?" aria-label="Descrição da tarefa">
      <div class="rapida-opcoes">
        <select id="tf-processo" name="processoId" aria-label="Processo">${opcoesProcesso('', 'Sem processo')}</select>
        <input id="tf-data" type="date" name="data" value="${hoje}" aria-label="Data">
        <select id="tf-prioridade" name="prioridade" aria-label="Prioridade"><option value="normal">Prioridade normal</option><option value="alta">Prioridade alta</option></select>
        <button type="submit" class="btn">${ic('mais')}Adicionar</button>
      </div>
    </form>
    <section class="cartao">
      ${grupos.length ? grupos.map(([rotulo, l]) => `<div class="grupo"><h3 class="grupo-titulo">${rotulo}<span>${l.length}</span></h3><ul class="tarefas">${l.sort(ord).map(linha).join('')}</ul></div>`).join('') : vazio('Nenhuma tarefa aberta', 'Escreva acima o que precisa ser feito e pressione Enter.')}
      ${feitas.length ? `<details class="feitas"><summary>Concluídas (${feitas.length})</summary><ul class="tarefas">${feitas.sort(ord).map(linha).join('')}</ul></details>` : ''}
    </section>`;
}

// ---------- ajustes ----------
function telaAjustes() {
  const ano = Number(hojeIso().slice(0, 4));
  const feriados = calendario().feriadosDoAno(ano);
  return `
    <div class="ajustes">
      <section class="cartao">
        <header class="cartao-cab"><h2>Preferências</h2></header>
        <form id="form-nome" class="form" autocomplete="off">
          <label class="campo">Como deseja ser chamada no painel<input id="cfg-nome" name="nome" value="${esc(nomeUsuario())}"></label>
          <div class="form-acoes"><button class="btn btn-sec" type="submit">Salvar</button></div>
        </form>
      </section>
      <section class="cartao">
        <header class="cartao-cab"><h2>Calendário forense</h2></header>
        <p class="nota">Já considerados: feriados nacionais, Carnaval, Sexta-feira da Paixão, Corpus Christi e o recesso de 20/12 a 20/01.</p>
        ${Object.entries(PRESETS).map(([k, p]) => `
          <label class="interruptor"><input type="checkbox" id="preset-${k}" data-acao="preset" data-valor="${k}" ${estado.config.presets.includes(k) ? 'checked' : ''}><span class="trilho"></span><span>${esc(p.nome)}</span></label>`).join('')}
        <h3 class="sub-titulo">Suspensões e feriados locais</h3>
        <form id="form-suspensao" class="form tres" autocomplete="off">
          <label class="campo">De<input id="sp-inicio" type="date" name="inicio" required></label>
          <label class="campo">Até (opcional)<input id="sp-fim" type="date" name="fim"></label>
          <label class="campo larg">Motivo<input id="sp-descricao" name="descricao" placeholder="Ex.: Indisponibilidade do PJe, Portaria nº…" required></label>
          <div class="form-acoes larg"><button type="submit" class="btn btn-sec">${ic('mais')}Adicionar suspensão</button></div>
        </form>
        ${estado.config.personalizados.length ? `<ul class="simples">${estado.config.personalizados.map((s, i) => `<li><span><strong>${esc(s.descricao)}</strong><span class="sub mono">${formatar(s.inicio)}${s.fim && s.fim !== s.inicio ? ' a ' + formatar(s.fim) : ''}</span></span><button class="btn-icone perigo" data-acao="excluir-suspensao" data-id="${i}" aria-label="Remover suspensão">${ic('lixo')}</button></li>`).join('')}</ul>` : ''}
        <details><summary>Dias sem expediente em ${ano} (${feriados.length})</summary>
          <ul class="simples">${feriados.map(([d, nome]) => `<li><span class="mono">${formatar(d)} <span class="sub">${nomeDiaSemana(d, true)}</span></span><span>${esc(nome)}</span></li>`).join('')}</ul>
        </details>
      </section>
      <section class="cartao">
        <header class="cartao-cab"><h2>Backup</h2></header>
        <p class="nota">Os dados ficam somente neste navegador. Gere um backup periodicamente e guarde-o em local seguro; para usar em outro aparelho, cole o backup aqui e importe.</p>
        <textarea id="backup" rows="5" class="mono area" placeholder="Clique em “Gerar backup” ou cole aqui um backup para importar." aria-label="Conteúdo do backup"></textarea>
        <div class="form-acoes"><button class="btn btn-sec" data-acao="exportar">Gerar backup</button><button class="btn btn-sec" data-acao="copiar-backup">Copiar</button><button class="btn" data-acao="importar">Importar</button></div>
      </section>
      <section class="cartao">
        <header class="cartao-cab"><h2>Recomeçar</h2></header>
        <p class="nota">Apaga processos, prazos e tarefas deste navegador. Não pode ser desfeito.</p>
        <div class="form-acoes"><button class="btn btn-perigo" data-acao="apagar-tudo">Apagar todos os dados</button></div>
      </section>
    </div>`;
}

// ---------- gavetas ----------
function opcoesProcesso(selecionado, rotuloVazio = 'Sem processo vinculado') {
  return `<option value="">${rotuloVazio}</option>` + estado.processos.map((p) => `<option value="${p.id}" ${p.id === selecionado ? 'selected' : ''}>${esc(p.numero)}${p.cliente ? ' · ' + esc(p.cliente) : ''}</option>`).join('');
}

function htmlResultado() {
  try {
    const r = calcularPrazo(rascunho, calendario());
    const sit = situacao(r.vencimento, hojeIso());
    return `
      <div class="res">
        <span class="eyebrow">Vencimento</span>
        <div class="res-data">${formatar(r.vencimento)}</div>
        <div class="res-sub">${nomeDiaSemana(r.vencimento)}${r.prorrogado ? ' · prorrogado' : ''} ${chip(sit)}</div>
        <dl class="res-fatos">
          ${r.publicacao ? `<div><dt>Publicação</dt><dd>${formatar(r.publicacao)}</dd></div>` : ''}
          <div><dt>Início</dt><dd>${formatar(r.inicio)}</dd></div>
          <div><dt>Dias</dt><dd>${r.dias}${rascunho.dobro ? ' (dobro)' : ''}</dd></div>
        </dl>
      </div>
      <details class="memoria-det">
        <summary>Memória de cálculo dia a dia</summary>
        <div class="tabela-wrap"><table class="memoria">
          <thead><tr><th>Data</th><th>Dia</th><th>Nº</th><th>Observação</th></tr></thead>
          <tbody>${r.memoria.map((m) => `<tr class="m-${m.tipo}${m.vencimento ? ' m-venc' : ''}"><td class="mono">${formatar(m.data)}</td><td>${nomeDiaSemana(m.data, true)}</td><td class="mono">${m.conta ? `${m.conta}º` : '—'}</td><td>${esc(m.vencimento ? `Termo final${m.texto ? ' · ' + m.texto : ''}` : m.texto)}</td></tr>`).join('')}</tbody>
        </table></div>
      </details>`;
  } catch (e) {
    return `<div class="res res-erro">${ic('alerta')}<span>${esc(e.message)}</span></div>`;
  }
}

function htmlDjen() {
  const d = ui.djen;
  const aviso = '<p class="nota djen-nota">Intimações feitas pelo painel do sistema processual (ciência expressa ou tácita) não aparecem no DJEN. Se nada for encontrado, confira o processo no sistema do tribunal.</p>';
  if (d.estado === 'ocioso') {
    return rascunho.publicacao
      ? `<div class="pub-escolhida">${ic('check')}<span>Marco baseado na publicação de <strong>${formatar(rascunho.publicacao.data)}</strong> (${esc(rascunho.publicacao.tipoDocumento)}).</span></div>`
      : '<p class="nota">Busque as publicações do processo no Diário de Justiça Eletrônico Nacional e escolha a que inicia o prazo. O marco e a data serão preenchidos automaticamente.</p>';
  }
  if (d.estado === 'carregando') return '<div class="djen-carregando"><span class="giro" aria-hidden="true"></span>Consultando o DJEN… pode levar alguns segundos.</div>';
  if (d.estado === 'erro') return `<div class="res res-erro">${ic('alerta')}<span>${esc(d.erro)}</span></div>`;
  if (!d.itens.length) return `<div class="vazio vazio-p"><strong>Nenhuma publicação encontrada</strong><span>O DJEN não tem comunicações para este número.</span></div>${aviso}`;
  return `
    <p class="sub">${plural(d.itens.length, 'publicação encontrada', 'publicações encontradas')} · da mais recente para a mais antiga</p>
    <ul class="pubs">${d.itens.map((c, i) => {
      const sug = sugerirPrazo(c.texto, c.tipoDocumento);
      return `
      <li class="pub ${d.escolhida === i ? 'escolhida' : ''} ${c.cancelada ? 'cancelada' : ''}">
        <div class="pub-cab">
          <span class="pub-data mono">${formatar(c.data)}</span>
          <span class="tag tag-prazo">${esc(c.tipoDocumento)}</span>
          ${c.cancelada ? '<span class="chip chip-vencido">Cancelada</span>' : ''}
        </div>
        <div class="sub">${esc([c.tribunal, c.orgao].filter(Boolean).join(' · '))}</div>
        <details class="pub-texto"><summary>${esc(c.texto.slice(0, 180))}${c.texto.length > 180 ? '…' : ''}</summary><p>${esc(c.texto)}</p>${c.link ? `<a href="${esc(c.link)}" target="_blank" rel="noopener">Abrir documento original</a>` : ''}</details>
        ${sug ? `<div class="pub-sug">${ic('calc')}<span>${sug.fonte === 'texto' ? `Prazo identificado no texto: <strong>${sug.dias} dias${sug.contagem === 'corridos' ? ' corridos' : ''}</strong>` : `Sugestão pelo tipo de ato: <strong>${esc(sug.descricao)}, ${sug.dias} dias</strong>`}<small>“${esc(sug.trecho)}”</small></span></div>` : ''}
        <button type="button" class="btn ${d.escolhida === i ? '' : 'btn-sec'} pub-usar" data-acao="usar-pub" data-valor="${i}" ${c.cancelada ? 'disabled' : ''}>${d.escolhida === i ? `${ic('check')}Publicação escolhida` : 'Usar esta publicação'}</button>
      </li>`;
    }).join('')}</ul>
    ${aviso}`;
}

function atualizarDjen() {
  const alvo = document.getElementById('djen-area');
  if (alvo) alvo.innerHTML = htmlDjen();
}

async function buscarDjen() {
  const form = document.getElementById('form-prazo');
  lerRascunho(form);
  const cnj = analisarNumeroCnj(rascunho.numeroBusca);
  if (!cnj.formatado) {
    ui.djen = { estado: 'erro', itens: [], erro: cnj.erro, escolhida: null };
    atualizarDjen();
    return;
  }
  form.numeroBusca.value = cnj.formatado;
  rascunho.numeroBusca = cnj.formatado;
  ui.djen = { estado: 'carregando', itens: [], erro: '', escolhida: null };
  atualizarDjen();
  try {
    const itens = await buscarComunicacoes(cnj.formatado);
    ui.djen = { estado: 'ok', itens, erro: '', escolhida: null };
  } catch (e) {
    ui.djen = { estado: 'erro', itens: [], erro: e.message, escolhida: null };
  }
  atualizarDjen();
}

function usarPublicacao(i) {
  const c = ui.djen.itens[i];
  const form = document.getElementById('form-prazo');
  if (!c || !form) return;
  ui.djen.escolhida = i;
  form.querySelector('input[name=marco][value=disponibilizacao]').checked = true;
  form.dataMarco.value = c.data;
  const sug = sugerirPrazo(c.texto, c.tipoDocumento);
  if (sug) {
    form.dias.value = sug.dias;
    if (sug.contagem) form.contagem.value = sug.contagem;
    if (sug.descricao && !form.descricao.value) form.descricao.value = sug.descricao;
  }
  lerRascunho(form);
  rascunho.publicacao = { id: c.id, data: c.data, tipoDocumento: c.tipoDocumento, orgao: c.orgao, tribunal: c.tribunal, classe: c.classe, link: c.link };
  document.getElementById('linha-recesso').hidden = rascunho.contagem !== 'corridos';
  atualizarDjen();
  atualizarResultado();
  mensagem = sug ? 'Publicação aplicada. Confira o ato e a quantidade de dias.' : 'Publicação aplicada. Informe o ato e a quantidade de dias.';
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status'); t.innerHTML = `${ic('check')}<span>${esc(mensagem)}</span>`;
  app.append(t); setTimeout(() => t.classList.add('saindo'), 2800); setTimeout(() => t.remove(), 3200);
  mensagem = null;
  form.descricao.focus();
}

function gavetaPrazo() {
  const r = rascunho;
  return `
    <form id="form-prazo" class="gaveta-form" autocomplete="off">
      <header class="gaveta-cab"><h2>${r.id ? 'Prazo e memória de cálculo' : 'Novo prazo'}</h2><button type="button" class="btn-icone" data-acao="fechar" aria-label="Fechar">${ic('fechar')}</button></header>
      <div class="gaveta-corpo">
        <fieldset class="passo">
          <legend><span class="passo-n">1</span>Processo e publicação</legend>
          <label class="campo">Processo cadastrado<select id="pz-processo" name="processoId">${opcoesProcesso(r.processoId, 'Nenhum (informe o número abaixo)')}</select></label>
          <div class="busca-djen">
            <label class="campo">Número CNJ<input id="pz-numero" name="numeroBusca" class="mono" inputmode="numeric" placeholder="0000000-00.0000.0.00.0000" value="${esc(r.numeroBusca)}"></label>
            <button type="button" class="btn" data-acao="buscar-djen">${ic('busca')}Buscar no DJEN</button>
          </div>
          <div id="djen-area" aria-live="polite">${htmlDjen()}</div>
        </fieldset>
        <fieldset class="passo">
          <legend><span class="passo-n">2</span>Ato processual</legend>
          <label class="campo">Ato / prazo<input id="pz-descricao" name="descricao" placeholder="Ex.: Contestação" value="${esc(r.descricao)}"></label>
          <div class="sugestoes" aria-label="Prazos usuais">${PRAZOS_USUAIS.map((u, i) => `<button type="button" class="sug ${r.descricao === u.nome ? 'ativo' : ''}" data-acao="usual" data-valor="${i}" title="${esc(u.base)}">${esc(u.nome)} <span>${u.dias}d</span></button>`).join('')}</div>
        </fieldset>
        <fieldset class="passo">
          <legend><span class="passo-n">3</span>Marco inicial</legend>
          <div class="opcoes-radio">
            <label class="radio"><input type="radio" name="marco" value="disponibilizacao" ${r.marco === 'disponibilizacao' ? 'checked' : ''}><span><strong>Disponibilização no DJe/DJEN</strong><small>Publicação no dia útil seguinte</small></span></label>
            <label class="radio"><input type="radio" name="marco" value="intimacao" ${r.marco === 'intimacao' ? 'checked' : ''}><span><strong>Intimação ou ciência</strong><small>Inclui juntada do mandado ou AR</small></span></label>
          </div>
          <label class="campo">Data<input id="pz-data" type="date" name="dataMarco" value="${esc(r.dataMarco)}" required></label>
        </fieldset>
        <fieldset class="passo">
          <legend><span class="passo-n">4</span>Contagem</legend>
          <div class="linha-campos">
            <label class="campo">Dias<input id="pz-dias" type="number" min="1" max="3650" step="1" name="dias" value="${esc(r.dias)}" required></label>
            <label class="campo">Forma<select id="pz-contagem" name="contagem">
              <option value="uteis" ${r.contagem === 'uteis' ? 'selected' : ''}>Dias úteis (CPC)</option>
              <option value="corridos" ${r.contagem === 'corridos' ? 'selected' : ''}>Dias corridos (CPP)</option>
            </select></label>
          </div>
          <label class="interruptor"><input id="pz-dobro" type="checkbox" name="dobro" ${r.dobro ? 'checked' : ''}><span class="trilho"></span><span>Prazo em dobro <small>CPC, arts. 180, 183, 186 e 229</small></span></label>
          <label class="interruptor" id="linha-recesso" ${r.contagem === 'corridos' ? '' : 'hidden'}><input id="pz-recesso" type="checkbox" name="suspenderRecesso" ${r.suspenderRecesso !== false ? 'checked' : ''}><span class="trilho"></span><span>Suspender no recesso <small>Desligue para réu preso, Lei Maria da Penha ou urgência (CPP, art. 798-A)</small></span></label>
        </fieldset>
        <div id="resultado" class="resultado" aria-live="polite">${htmlResultado()}</div>
      </div>
      <footer class="gaveta-rodape"><span id="rodape-venc" class="rodape-venc">${resumoVencimento()}</span><button type="button" class="btn btn-sec" data-acao="fechar">Cancelar</button><button type="submit" class="btn">${r.id ? 'Salvar alterações' : 'Salvar prazo'}</button></footer>
    </form>`;
}

function resumoVencimento() {
  try {
    const r = calcularPrazo(rascunho, calendario());
    return `<small>Vence em</small><strong class="mono">${formatar(r.vencimento)}</strong>`;
  } catch {
    return '<small>Complete os dados</small>';
  }
}

function gavetaProcesso() {
  const p = ui.processoEdit ? processo(ui.processoEdit) : {};
  const cnj = p.numero ? analisarNumeroCnj(p.numero) : null;
  return `
    <form id="form-processo" class="gaveta-form" autocomplete="off">
      <header class="gaveta-cab"><h2>${p.id ? 'Editar processo' : 'Novo processo'}</h2><button type="button" class="btn-icone" data-acao="fechar" aria-label="Fechar">${ic('fechar')}</button></header>
      <div class="gaveta-corpo">
        <label class="campo">Número CNJ<input id="pr-numero" name="numero" class="mono" placeholder="0000000-00.0000.0.00.0000" value="${esc(p.numero)}" required>
          <span id="pr-numero-aviso" class="aviso ${cnj ? (cnj.valido ? 'aviso-ok' : 'aviso-erro') : ''}" aria-live="polite">${cnj ? esc(cnj.valido ? `${cnj.segmento} · TR ${cnj.tribunal} · ${cnj.ano}` : cnj.erro) : 'O dígito verificador é conferido automaticamente.'}</span></label>
        <label class="campo">Cliente<input id="pr-cliente" name="cliente" value="${esc(p.cliente)}"></label>
        <label class="campo">Parte contrária<input id="pr-contraria" name="parteContraria" value="${esc(p.parteContraria)}"></label>
        <label class="campo">Órgão julgador<input id="pr-orgao" name="orgao" placeholder="Ex.: 3ª Vara Cível de Belém" value="${esc(p.orgao)}"></label>
        <label class="campo">Área<input id="pr-area" name="area" list="areas" placeholder="Ex.: Condominial" value="${esc(p.area)}"><datalist id="areas"><option value="Cível"><option value="Imobiliário"><option value="Condominial"><option value="Locação"><option value="Consumidor"><option value="Empresarial"><option value="Família"><option value="Penal"></datalist></label>
        <label class="campo">Observações<textarea id="pr-obs" name="obs" rows="3">${esc(p.obs)}</textarea></label>
        ${p.id ? `<div class="zona-perigo"><span class="sub">Excluir remove também os prazos deste processo.</span><button type="button" class="btn btn-perigo" data-acao="excluir-processo" data-id="${p.id}">Excluir processo</button></div>` : ''}
      </div>
      <footer class="gaveta-rodape"><button type="button" class="btn btn-sec" data-acao="fechar">Cancelar</button><button type="submit" class="btn">${p.id ? 'Salvar alterações' : 'Cadastrar processo'}</button></footer>
    </form>`;
}

// ---------- estrutura ----------
const ABAS = [
  ['painel', 'Painel', telaPainel],
  ['prazos', 'Prazos', telaPrazos],
  ['processos', 'Processos', telaProcessos],
  ['tarefas', 'Tarefas', telaTarefas],
  ['ajustes', 'Ajustes', telaAjustes],
];

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

function cabecalho() {
  const hoje = hojeIso();
  if (ui.aba === 'painel') {
    const nome = nomeUsuario();
    return { titulo: `${saudacao()}${nome ? ', ' + esc(nome) : ''}`, sub: dataExtensa(hoje) + ` de ${hoje.slice(0, 4)}`, acoes: `<button class="btn btn-sec esconde-movel" data-acao="ir" data-valor="tarefas">${ic('tarefas')}Nova tarefa</button><button class="btn" data-acao="abrir-prazo">${ic('mais')}Novo prazo</button>` };
  }
  if (ui.aba === 'prazos') return { titulo: 'Prazos', sub: 'Calcule, acompanhe e dê baixa nos prazos processuais', acoes: `<button class="btn" data-acao="abrir-prazo">${ic('mais')}Novo prazo</button>` };
  if (ui.aba === 'processos') return { titulo: 'Processos', sub: 'Sua carteira de processos', acoes: `<button class="btn" data-acao="abrir-processo">${ic('mais')}Novo processo</button>` };
  if (ui.aba === 'tarefas') return { titulo: 'Tarefas', sub: 'Providências do escritório', acoes: '' };
  return { titulo: 'Ajustes', sub: 'Calendário, backup e preferências', acoes: '' };
}

function contadores() {
  const itens = itensAgenda();
  return {
    prazos: itens.filter((i) => i.tipo === 'prazo' && i.sit.faltam <= 3).length,
    tarefas: itens.filter((i) => i.tipo === 'tarefa' && i.sit.faltam <= 0).length,
  };
}

function render() {
  const tela = ABAS.find(([k]) => k === ui.aba)[2];
  const cab = cabecalho();
  const cont = contadores();
  const badge = (k) => (cont[k] ? `<span class="badge" aria-label="${cont[k]} urgentes">${cont[k]}</span>` : '');
  const nav = (cls) => ABAS.map(([k, r]) => `<button class="${cls} ${k === ui.aba ? 'ativo' : ''}" data-acao="ir" data-valor="${k}" ${k === ui.aba ? 'aria-current="page"' : ''}>${ic(k)}<span>${r}</span>${badge(k)}</button>`).join('');

  app.innerHTML = `
    <div class="shell">
      <aside class="lateral">
        <div class="marca">${ic('balanca', 'marca-ic')}<span><strong>Painel de Prazos</strong><small>Gestão processual</small></span></div>
        <button class="btn btn-ouro" data-acao="abrir-prazo">${ic('mais')}Novo prazo</button>
        <nav class="nav" aria-label="Seções">${nav('nav-item')}</nav>
        <p class="lateral-nota">Dados guardados apenas neste navegador.</p>
      </aside>
      <div class="principal">
        <header class="barra">
          <div class="barra-titulos"><h1>${cab.titulo}</h1><p>${cab.sub}</p></div>
          <div class="barra-acoes">${cab.acoes}</div>
        </header>
        ${estado.exemplo ? `<div class="faixa"><span>Você está vendo <strong>dados de exemplo</strong>, todos fictícios.</span><button class="btn btn-sec" data-acao="limpar-exemplo">Começar com painel vazio</button></div>` : ''}
        <main class="conteudo">${tela()}</main>
        <footer class="rodape">Ferramenta de apoio. Confira sempre o termo final com a certidão do sistema e com o calendário oficial do tribunal.</footer>
      </div>
      <nav class="nav-movel" aria-label="Seções">${nav('nm-item')}</nav>
      ${ui.gaveta ? `<div class="veu" data-acao="fechar"></div><div class="gaveta" role="dialog" aria-modal="true">${ui.gaveta === 'prazo' ? gavetaPrazo() : gavetaProcesso()}</div>` : ''}
      ${mensagem ? `<div class="toast ${mensagemErro ? 'toast-erro' : ''}" role="status">${ic(mensagemErro ? 'alerta' : 'check')}<span>${esc(mensagem)}</span></div>` : ''}
    </div>`;
  if (mensagem) {
    const t = app.querySelector('.toast');
    setTimeout(() => t?.classList.add('saindo'), 2800);
    setTimeout(() => t?.remove(), 3200);
  }
  mensagem = null;
  mensagemErro = false;
  document.body.classList.toggle('travado', !!ui.gaveta);
}

function abrirGaveta(tipo) {
  ui.gaveta = tipo;
  render();
  app.querySelector('.gaveta input:not([type=hidden]), .gaveta select')?.focus();
}

function fecharGaveta() {
  ui.gaveta = null;
  ui.processoEdit = null;
  render();
}

// ---------- eventos ----------
function confirmar(botao) {
  if (botao.dataset.armado) return true;
  botao.dataset.armado = '1';
  const original = botao.innerHTML;
  botao.innerHTML = '<span>Confirmar?</span>';
  botao.classList.add('armado');
  setTimeout(() => { if (botao.isConnected) { delete botao.dataset.armado; botao.innerHTML = original; botao.classList.remove('armado'); } }, 4000);
  return false;
}

function atualizarResultado() {
  const alvo = document.getElementById('resultado');
  if (alvo) alvo.innerHTML = htmlResultado();
  const rodape = document.getElementById('rodape-venc');
  if (rodape) rodape.innerHTML = resumoVencimento();
}

app.addEventListener('click', async (ev) => {
  const b = ev.target.closest('[data-acao]');
  if (!b || b.type === 'checkbox') return;
  const { acao, id, valor } = b.dataset;
  const acharPrazo = () => estado.prazos.find((p) => p.id === id);
  switch (acao) {
    case 'ir': ui.aba = valor; ui.gaveta = null; render(); window.scrollTo(0, 0); break;
    case 'fechar': fecharGaveta(); break;
    case 'abrir-prazo': rascunho = rascunhoNovo(); ui.djen = { estado: 'ocioso', itens: [], erro: '', escolhida: null }; abrirGaveta('prazo'); break;
    case 'buscar-djen': buscarDjen(); break;
    case 'usar-pub': usarPublicacao(Number(valor)); break;
    case 'prazo-para': rascunho = rascunhoNovo({ processoId: id }); ui.djen = { estado: 'ocioso', itens: [], erro: '', escolhida: null }; abrirGaveta('prazo'); break;
    case 'ver-prazo': rascunho = rascunhoNovo({ ...acharPrazo() }); ui.djen = { estado: 'ocioso', itens: [], erro: '', escolhida: null }; abrirGaveta('prazo'); break;
    case 'abrir-processo': ui.processoEdit = null; abrirGaveta('processo'); break;
    case 'editar-processo': ui.processoEdit = id; abrirGaveta('processo'); break;
    case 'usual': {
      const u = PRAZOS_USUAIS[Number(valor)];
      const form = document.getElementById('form-prazo');
      form.descricao.value = u.nome;
      form.dias.value = u.dias;
      form.querySelectorAll('.sug').forEach((s) => s.classList.toggle('ativo', s === b));
      lerRascunho(form);
      atualizarResultado();
      break;
    }
    case 'filtro-agenda': ui.filtroAgenda = valor && ui.filtroAgenda !== valor ? valor : null; render(); break;
    case 'filtro-prazos': ui.filtroPrazos = valor; render(); break;
    case 'dia': ui.diaSel = valor; if (valor.slice(0, 7) !== ui.mesCal) ui.mesCal = valor.slice(0, 7); render(); break;
    case 'mes': {
      if (valor === '0') { ui.mesCal = hojeIso().slice(0, 7); ui.diaSel = hojeIso(); } else {
        const [a, m] = ui.mesCal.split('-').map(Number);
        ui.mesCal = criarIso(a, m + Number(valor), 1).slice(0, 7);
      }
      render();
      break;
    }
    case 'cumprir': acharPrazo().cumprido = true; persistir('Baixa registrada no prazo.'); break;
    case 'reabrir': acharPrazo().cumprido = false; persistir('Prazo reaberto.'); break;
    case 'concluir': estado.tarefas.find((t) => t.id === id).concluida = true; persistir('Tarefa concluída.'); break;
    case 'excluir-prazo': if (confirmar(b)) { estado.prazos = estado.prazos.filter((p) => p.id !== id); persistir('Prazo excluído.'); } break;
    case 'excluir-tarefa': if (confirmar(b)) { estado.tarefas = estado.tarefas.filter((t) => t.id !== id); persistir('Tarefa excluída.'); } break;
    case 'excluir-processo':
      if (confirmar(b)) {
        estado.processos = estado.processos.filter((p) => p.id !== id);
        estado.prazos = estado.prazos.filter((p) => p.processoId !== id);
        estado.tarefas = estado.tarefas.map((t) => (t.processoId === id ? { ...t, processoId: '' } : t));
        ui.gaveta = null; ui.processoEdit = null;
        persistir('Processo e respectivos prazos excluídos.');
      }
      break;
    case 'excluir-suspensao': estado.config.personalizados.splice(Number(id), 1); persistir('Suspensão removida.'); break;
    case 'limpar-exemplo': estado = estadoVazio(); ui.aba = 'processos'; persistir('Painel zerado. Cadastre seu primeiro processo.'); break;
    case 'apagar-tudo': if (confirmar(b)) { estado = estadoVazio(); persistir('Todos os dados foram apagados.'); } break;
    case 'exportar': document.getElementById('backup').value = JSON.stringify(estado, null, 2); break;
    case 'copiar-backup': {
      const area = document.getElementById('backup');
      if (!area.value) area.value = JSON.stringify(estado, null, 2);
      try { await navigator.clipboard.writeText(area.value); b.textContent = 'Copiado'; } catch { area.select(); b.textContent = 'Texto selecionado'; }
      break;
    }
    case 'importar': {
      try {
        estado = normalizar(JSON.parse(document.getElementById('backup').value));
        estado.exemplo = false;
        persistir('Backup importado.');
      } catch {
        avisar('O texto colado não é um backup válido.');
      }
      break;
    }
    default: break;
  }
});

app.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.dataset.acao === 'alternar-tarefa') {
    estado.tarefas.find((t) => t.id === el.dataset.id).concluida = el.checked;
    persistir(el.checked ? 'Tarefa concluída.' : 'Tarefa reaberta.');
  } else if (el.dataset.acao === 'preset') {
    const s = new Set(estado.config.presets);
    if (el.checked) s.add(el.dataset.valor); else s.delete(el.dataset.valor);
    estado.config.presets = [...s];
    persistir('Calendário atualizado; vencimentos recalculados.');
  } else if (el.id === 'pz-processo') {
    const p = processo(el.value);
    if (p) el.form.numeroBusca.value = p.numero;
    lerRascunho(el.form);
    atualizarResultado();
  } else if (el.form?.id === 'form-prazo') {
    lerRascunho(el.form);
    document.getElementById('linha-recesso').hidden = rascunho.contagem !== 'corridos';
    atualizarResultado();
  }
});

app.addEventListener('input', (ev) => {
  const el = ev.target;
  if (el.id === 'busca-prazos') {
    ui.buscaPrazos = el.value;
    document.getElementById('lista-prazos').innerHTML = listaPrazos();
  } else if (el.id === 'busca-processos') {
    ui.buscaProcessos = el.value;
    document.getElementById('lista-processos').innerHTML = listaProcessos();
  } else if (el.id === 'pr-numero') {
    const aviso = document.getElementById('pr-numero-aviso');
    const r = analisarNumeroCnj(el.value);
    aviso.textContent = !el.value ? 'O dígito verificador é conferido automaticamente.' : r.valido ? `${r.segmento} · TR ${r.tribunal} · ${r.ano}` : r.erro;
    aviso.className = 'aviso ' + (!el.value ? '' : r.valido ? 'aviso-ok' : 'aviso-erro');
  } else if (el.form?.id === 'form-prazo') {
    lerRascunho(el.form);
    atualizarResultado();
  }
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter' && ev.target.id === 'pz-numero') { ev.preventDefault(); buscarDjen(); return; }
  if (ev.key === 'Escape' && ui.gaveta) fecharGaveta();
});

function lerRascunho(form) {
  const f = new FormData(form);
  rascunho = {
    ...rascunho,
    processoId: f.get('processoId') || '',
    numeroBusca: (f.get('numeroBusca') || '').trim(),
    descricao: (f.get('descricao') || '').trim(),
    marco: f.get('marco'),
    dataMarco: f.get('dataMarco'),
    contagem: f.get('contagem'),
    dias: Number(f.get('dias')),
    dobro: f.get('dobro') === 'on',
    suspenderRecesso: f.get('contagem') === 'corridos' ? f.get('suspenderRecesso') === 'on' : true,
  };
}

app.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const form = ev.target;
  const f = Object.fromEntries(new FormData(form));
  if (form.id === 'form-prazo') {
    lerRascunho(form);
    try {
      calcularPrazo(rascunho, calendario());
    } catch (e) {
      atualizarResultado();
      return;
    }
    let criado = false;
    if (!rascunho.processoId && rascunho.numeroBusca) {
      const cnj = analisarNumeroCnj(rascunho.numeroBusca);
      if (cnj.formatado) {
        const existente = estado.processos.find((p) => p.numero === cnj.formatado);
        if (existente) rascunho.processoId = existente.id;
        else {
          const pub = rascunho.publicacao || {};
          const novo = { id: novoId(), numero: cnj.formatado, cliente: '', parteContraria: '', orgao: [pub.orgao, pub.tribunal].filter(Boolean).join(' · '), area: '', obs: pub.classe || '' };
          estado.processos.push(novo);
          rascunho.processoId = novo.id;
          criado = true;
        }
      }
    }
    const { numeroBusca, ...semBusca } = rascunho;
    const dados = { ...semBusca, descricao: rascunho.descricao || 'Prazo' };
    if (dados.id) {
      estado.prazos = estado.prazos.map((p) => (p.id === dados.id ? { ...p, ...dados } : p));
    } else {
      estado.prazos.push({ ...dados, id: novoId(), cumprido: false });
    }
    ui.gaveta = null;
    persistir(rascunho.id ? 'Prazo atualizado.' : criado ? 'Prazo salvo. O processo foi cadastrado com os dados do DJEN; complete o cliente em Processos.' : 'Prazo salvo e incluído na agenda.');
  } else if (form.id === 'form-processo') {
    const r = analisarNumeroCnj(f.numero);
    if (!r.formatado) { avisar(r.erro); return; }
    if (estado.processos.some((p) => p.numero === r.formatado && p.id !== ui.processoEdit)) { avisar('Este processo já está cadastrado.'); return; }
    const dados = { numero: r.formatado, cliente: f.cliente.trim(), parteContraria: f.parteContraria.trim(), orgao: f.orgao.trim(), area: f.area.trim(), obs: f.obs.trim() };
    if (ui.processoEdit) estado.processos = estado.processos.map((p) => (p.id === ui.processoEdit ? { ...p, ...dados } : p));
    else estado.processos.push({ id: novoId(), ...dados });
    const editando = !!ui.processoEdit;
    ui.gaveta = null; ui.processoEdit = null;
    mensagemErro = !r.valido;
    persistir(!r.valido ? 'Processo salvo, mas o dígito verificador não confere. Revise o número.' : editando ? 'Processo atualizado.' : 'Processo cadastrado.');
  } else if (form.id === 'form-tarefa') {
    estado.tarefas.push({ id: novoId(), titulo: f.titulo.trim(), processoId: f.processoId, data: f.data, prioridade: f.prioridade, concluida: false });
    persistir('Tarefa adicionada.');
    document.getElementById('tf-titulo')?.focus();
  } else if (form.id === 'form-suspensao') {
    if (f.fim && f.fim < f.inicio) { avisar('A data final é anterior à inicial.'); return; }
    estado.config.personalizados.push({ inicio: f.inicio, fim: f.fim || f.inicio, descricao: f.descricao.trim() });
    persistir('Suspensão cadastrada; vencimentos recalculados.');
  } else if (form.id === 'form-nome') {
    estado.config.nome = f.nome.trim();
    persistir('Preferência salva.');
  }
});

render();
