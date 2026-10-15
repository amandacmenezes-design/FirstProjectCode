import { ISO_RE, addDias, formatar, hojeIso, nomeDiaSemana } from './datas.js';
import { PRESETS } from './feriados.js';
import { PRAZOS_USUAIS, calcularPrazo, criarCalendario, situacao } from './prazos.js';
import { analisarNumeroCnj } from './cnj.js';
import { carregar, estadoExemplo, estadoVazio, normalizar, novoId, salvar } from './store.js';

let estado = carregar() || estadoExemplo();
let aba = 'painel';
let filtroPrazos = 'pendentes';
let rascunho = { dataMarco: hojeIso(), marco: 'disponibilizacao', contagem: 'uteis', dias: 15, dobro: false, suspenderRecesso: true, descricao: '', processoId: '' };
let mensagem = null;

const app = document.getElementById('app');

// ---------- utilidades ----------
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dataBonita = (iso) => (iso ? `<span class="data">${formatar(iso)}<small>${nomeDiaSemana(iso, true)}</small></span>` : '—');
const calendario = () => criarCalendario(estado.config);
const processo = (id) => estado.processos.find((p) => p.id === id);
const rotuloProcesso = (id) => {
  const p = processo(id);
  return p ? `${esc(p.numero)}${p.cliente ? ` · ${esc(p.cliente)}` : ''}` : '';
};

function persistir(texto) {
  const ok = salvar(estado);
  mensagem = ok ? texto : 'Não foi possível salvar neste navegador (armazenamento bloqueado). Exporte um backup antes de fechar.';
  render();
}

function prazoCalculado(p, cal = calendario()) {
  try {
    return { ...p, calc: calcularPrazo(p, cal) };
  } catch (e) {
    return { ...p, erro: e.message };
  }
}

function itensAgenda() {
  const hoje = hojeIso();
  const cal = calendario();
  const prazos = estado.prazos.filter((p) => !p.cumprido).map((p) => prazoCalculado(p, cal)).filter((p) => p.calc)
    .map((p) => ({ tipo: 'prazo', id: p.id, data: p.calc.vencimento, titulo: p.descricao || 'Prazo', processoId: p.processoId, sit: situacao(p.calc.vencimento, hoje) }));
  const tarefas = estado.tarefas.filter((t) => !t.concluida && ISO_RE.test(t.data || ''))
    .map((t) => ({ tipo: 'tarefa', id: t.id, data: t.data, titulo: t.titulo, processoId: t.processoId, prioridade: t.prioridade, sit: situacao(t.data, hoje) }));
  return [...prazos, ...tarefas].sort((a, b) => a.data.localeCompare(b.data));
}

const pill = (sit) => `<span class="pill pill-${sit.chave}">${esc(sit.rotulo)}</span>`;

// ---------- telas ----------
function telaPainel() {
  const itens = itensAgenda();
  const prazos = itens.filter((i) => i.tipo === 'prazo');
  const conta = (f) => prazos.filter(f).length;
  const vencidos = conta((i) => i.sit.chave === 'vencido');
  const hoje = conta((i) => i.sit.chave === 'hoje');
  const semana = conta((i) => i.sit.faltam > 0 && i.sit.faltam <= 7);
  const tarefas = itens.filter((i) => i.tipo === 'tarefa').length;

  const cal = calendario();
  const h = hojeIso();
  const proximosFeriados = [];
  for (let d = h, n = 0; n < 120 && proximosFeriados.length < 4; n += 1, d = addDias(d, 1)) {
    const m = cal.motivo(d, { considerarRecesso: false });
    const dow = new Date(d + 'T00:00:00Z').getUTCDay();
    if (m && dow !== 0 && dow !== 6) proximosFeriados.push([d, m]);
  }

  return `
    <section class="tiles" aria-label="Resumo">
      <div class="tile ${vencidos ? 't-vencido' : ''}"><span class="tile-n">${vencidos}</span><span class="tile-l">Prazos vencidos</span></div>
      <div class="tile ${hoje ? 't-hoje' : ''}"><span class="tile-n">${hoje}</span><span class="tile-l">Vencem hoje</span></div>
      <div class="tile"><span class="tile-n">${semana}</span><span class="tile-l">Vencem em 7 dias</span></div>
      <div class="tile"><span class="tile-n">${tarefas}</span><span class="tile-l">Tarefas abertas</span></div>
    </section>
    <div class="painel-grid">
      <section class="bloco">
        <header class="bloco-cab"><h2>Agenda</h2><span class="sub">Prazos e tarefas pendentes, do mais antigo ao mais distante</span></header>
        ${itens.length ? `<ol class="agenda">${itens.map(itemAgenda).join('')}</ol>` : vazio('Nenhum prazo ou tarefa pendente.', 'Cadastre um prazo na aba Prazos.')}
      </section>
      <aside class="bloco lateral">
        <header class="bloco-cab"><h2>Próximos dias sem expediente</h2></header>
        <ul class="feriados">${proximosFeriados.map(([d, m]) => `<li>${dataBonita(d)}<span>${esc(m)}</span></li>`).join('') || '<li class="sub">Nenhum nos próximos 120 dias.</li>'}</ul>
        <p class="nota">Inclui feriados nacionais${estado.config.presets.length ? ', regionais selecionados' : ''} e suspensões cadastradas em Ajustes. O recesso de 20/12 a 20/01 é aplicado automaticamente.</p>
      </aside>
    </div>`;
}

function itemAgenda(i) {
  const acao = i.tipo === 'prazo'
    ? `<button class="btn-sec" data-acao="cumprir" data-id="${i.id}">Cumprido</button>`
    : `<button class="btn-sec" data-acao="concluir" data-id="${i.id}">Concluir</button>`;
  return `
    <li class="item sit-${i.sit.chave}">
      <div class="item-data">${dataBonita(i.data)}</div>
      <div class="item-corpo">
        <div class="item-titulo"><span class="tipo">${i.tipo === 'prazo' ? 'Prazo' : 'Tarefa'}</span>${esc(i.titulo)}${i.prioridade === 'alta' ? ' <span class="pill pill-urgente">Alta</span>' : ''}</div>
        ${i.processoId ? `<div class="item-proc">${rotuloProcesso(i.processoId)}</div>` : ''}
      </div>
      <div class="item-acoes">${pill(i.sit)}${acao}</div>
    </li>`;
}

function vazio(titulo, dica) {
  return `<div class="vazio"><strong>${esc(titulo)}</strong><span>${esc(dica)}</span></div>`;
}

function opcoesProcesso(selecionado, rotuloVazio = 'Sem processo vinculado') {
  return `<option value="">${rotuloVazio}</option>` + estado.processos.map((p) => `<option value="${p.id}" ${p.id === selecionado ? 'selected' : ''}>${esc(p.numero)}${p.cliente ? ' · ' + esc(p.cliente) : ''}</option>`).join('');
}

function telaPrazos() {
  let resultado = '';
  try {
    const r = calcularPrazo(rascunho, calendario());
    resultado = `
      <div class="resultado">
        <div class="res-linha">
          <div><span class="rotulo">Vencimento</span><span class="res-venc">${formatar(r.vencimento)}</span><span class="sub">${nomeDiaSemana(r.vencimento)}${r.prorrogado ? ' · prorrogado' : ''}</span></div>
          ${r.publicacao ? `<div><span class="rotulo">Publicação</span>${dataBonita(r.publicacao)}</div>` : ''}
          <div><span class="rotulo">Início</span>${dataBonita(r.inicio)}</div>
          <div><span class="rotulo">Dias</span><span class="mono">${r.dias}${rascunho.dobro ? ' (em dobro)' : ''}</span></div>
        </div>
        <details>
          <summary>Memória de cálculo (${r.memoria.length} dias)</summary>
          <div class="tabela-wrap"><table class="memoria">
            <thead><tr><th>Data</th><th>Dia</th><th>Contagem</th><th>Observação</th></tr></thead>
            <tbody>${r.memoria.map((m) => `<tr class="m-${m.tipo}${m.vencimento ? ' m-venc' : ''}"><td class="mono">${formatar(m.data)}</td><td>${nomeDiaSemana(m.data, true)}</td><td class="mono">${m.conta ? `${m.conta}º` : '—'}</td><td>${esc(m.vencimento ? `Termo final${m.texto ? ' · ' + m.texto : ''}` : m.texto)}</td></tr>`).join('')}</tbody>
          </table></div>
        </details>
      </div>`;
  } catch (e) {
    resultado = `<div class="resultado erro">${esc(e.message)}</div>`;
  }

  const cal = calendario();
  const hoje = hojeIso();
  const lista = estado.prazos
    .filter((p) => (filtroPrazos === 'pendentes' ? !p.cumprido : filtroPrazos === 'cumpridos' ? p.cumprido : true))
    .map((p) => prazoCalculado(p, cal))
    .sort((a, b) => (a.calc?.vencimento || '').localeCompare(b.calc?.vencimento || ''));

  return `
    <div class="duas-colunas">
      <section class="bloco">
        <header class="bloco-cab"><h2>Calcular prazo</h2><span class="sub">O resultado é atualizado enquanto você preenche</span></header>
        <form id="form-prazo" class="form" autocomplete="off">
          <label class="campo larg">Processo<select id="pz-processo" name="processoId">${opcoesProcesso(rascunho.processoId)}</select></label>
          <label class="campo larg">Ato / prazo
            <input id="pz-descricao" name="descricao" list="prazos-usuais" placeholder="Ex.: Contestação" value="${esc(rascunho.descricao)}">
            <datalist id="prazos-usuais">${PRAZOS_USUAIS.map((u) => `<option value="${esc(u.nome)}">${u.dias} dias · ${esc(u.base)}</option>`).join('')}</datalist>
          </label>
          <label class="campo">Marco inicial
            <select id="pz-marco" name="marco">
              <option value="disponibilizacao" ${rascunho.marco === 'disponibilizacao' ? 'selected' : ''}>Disponibilização no DJe/DJEN</option>
              <option value="intimacao" ${rascunho.marco === 'intimacao' ? 'selected' : ''}>Intimação / ciência / juntada</option>
            </select>
          </label>
          <label class="campo">Data do marco<input id="pz-data" type="date" name="dataMarco" value="${esc(rascunho.dataMarco)}" required></label>
          <label class="campo">Contagem
            <select id="pz-contagem" name="contagem">
              <option value="uteis" ${rascunho.contagem === 'uteis' ? 'selected' : ''}>Dias úteis (CPC, art. 219)</option>
              <option value="corridos" ${rascunho.contagem === 'corridos' ? 'selected' : ''}>Dias corridos (CPP, art. 798)</option>
            </select>
          </label>
          <label class="campo">Quantidade de dias<input id="pz-dias" type="number" min="1" max="3650" step="1" name="dias" value="${esc(rascunho.dias)}" required></label>
          <label class="check"><input id="pz-dobro" type="checkbox" name="dobro" ${rascunho.dobro ? 'checked' : ''}> Prazo em dobro (CPC, arts. 180, 183, 186 e 229)</label>
          ${rascunho.contagem === 'corridos' ? `<label class="check"><input id="pz-recesso" type="checkbox" name="suspenderRecesso" ${rascunho.suspenderRecesso !== false ? 'checked' : ''}> Suspender no recesso (desmarque para réu preso, Lei Maria da Penha ou medida urgente, CPP, art. 798-A)</label>` : ''}
          ${resultado}
          <div class="form-acoes"><button type="submit" class="btn">Salvar prazo</button></div>
        </form>
      </section>
      <section class="bloco">
        <header class="bloco-cab"><h2>Prazos cadastrados</h2>
          <div class="seg" role="group" aria-label="Filtrar prazos">
            ${['pendentes', 'cumpridos', 'todos'].map((f) => `<button class="seg-btn ${filtroPrazos === f ? 'ativo' : ''}" data-acao="filtro" data-valor="${f}">${f[0].toUpperCase() + f.slice(1)}</button>`).join('')}
          </div>
        </header>
        ${lista.length ? `<ul class="lista">${lista.map((p) => `
          <li class="linha ${p.calc && !p.cumprido ? 'sit-' + situacao(p.calc.vencimento, hoje).chave : ''}">
            <div class="linha-princ">
              <strong>${esc(p.descricao || 'Prazo')}</strong>
              <span class="sub">${p.processoId ? rotuloProcesso(p.processoId) : 'Sem processo vinculado'}</span>
              <span class="sub">${p.dias} dias ${p.contagem === 'uteis' ? 'úteis' : 'corridos'}${p.dobro ? ' em dobro' : ''} · marco ${formatar(p.dataMarco)}</span>
            </div>
            <div class="linha-lado">
              ${p.calc ? dataBonita(p.calc.vencimento) : `<span class="pill pill-vencido">${esc(p.erro)}</span>`}
              ${p.cumprido ? '<span class="pill pill-ok">Cumprido</span>' : p.calc ? pill(situacao(p.calc.vencimento, hoje)) : ''}
              <div class="acoes">
                <button class="btn-sec" data-acao="${p.cumprido ? 'reabrir' : 'cumprir'}" data-id="${p.id}">${p.cumprido ? 'Reabrir' : 'Cumprido'}</button>
                <button class="btn-sec" data-acao="editar-prazo" data-id="${p.id}">Recalcular</button>
                <button class="btn-perigo" data-acao="excluir-prazo" data-id="${p.id}">Excluir</button>
              </div>
            </div>
          </li>`).join('')}</ul>` : vazio('Nenhum prazo nesta lista.', 'Use o formulário ao lado para calcular e salvar.')}
      </section>
    </div>`;
}

function telaProcessos() {
  const cal = calendario();
  const hoje = hojeIso();
  return `
    <div class="duas-colunas">
      <section class="bloco">
        <header class="bloco-cab"><h2>Novo processo</h2></header>
        <form id="form-processo" class="form" autocomplete="off">
          <label class="campo larg">Número CNJ<input id="pr-numero" name="numero" class="mono" placeholder="0000000-00.0000.0.00.0000" required><span id="pr-numero-aviso" class="aviso" aria-live="polite"></span></label>
          <label class="campo">Cliente<input id="pr-cliente" name="cliente"></label>
          <label class="campo">Parte contrária<input id="pr-contraria" name="parteContraria"></label>
          <label class="campo">Órgão julgador<input id="pr-orgao" name="orgao" placeholder="Ex.: 3ª Vara Cível de Belém"></label>
          <label class="campo">Área<input id="pr-area" name="area" list="areas" placeholder="Ex.: Condominial"><datalist id="areas"><option value="Cível"><option value="Imobiliário"><option value="Condominial"><option value="Locação"><option value="Consumidor"><option value="Empresarial"><option value="Família"><option value="Penal"></datalist></label>
          <label class="campo larg">Observações<textarea id="pr-obs" name="obs" rows="2"></textarea></label>
          <div class="form-acoes"><button type="submit" class="btn">Cadastrar processo</button></div>
        </form>
      </section>
      <section class="bloco">
        <header class="bloco-cab"><h2>Processos</h2><span class="sub">${estado.processos.length} cadastrado(s)</span></header>
        ${estado.processos.length ? `<ul class="lista">${estado.processos.map((p) => {
          const abertos = estado.prazos.filter((z) => z.processoId === p.id && !z.cumprido).map((z) => prazoCalculado(z, cal)).filter((z) => z.calc);
          const prox = abertos.sort((a, b) => a.calc.vencimento.localeCompare(b.calc.vencimento))[0];
          return `
          <li class="linha">
            <div class="linha-princ">
              <strong class="mono">${esc(p.numero)}</strong>
              <span>${esc(p.cliente || '—')}${p.parteContraria ? ` <span class="sub">× ${esc(p.parteContraria)}</span>` : ''}</span>
              <span class="sub">${[p.orgao, p.area].filter(Boolean).map(esc).join(' · ')}</span>
              ${p.obs ? `<span class="sub">${esc(p.obs)}</span>` : ''}
            </div>
            <div class="linha-lado">
              ${prox ? `<span class="sub">Próximo prazo</span>${dataBonita(prox.calc.vencimento)}${pill(situacao(prox.calc.vencimento, hoje))}` : '<span class="sub">Sem prazos abertos</span>'}
              <div class="acoes">
                <button class="btn-sec" data-acao="novo-prazo-para" data-id="${p.id}">Novo prazo</button>
                <button class="btn-perigo" data-acao="excluir-processo" data-id="${p.id}">Excluir</button>
              </div>
            </div>
          </li>`;
        }).join('')}</ul>` : vazio('Nenhum processo cadastrado.', 'Informe o número CNJ ao lado para começar.')}
      </section>
    </div>`;
}

function telaTarefas() {
  const hoje = hojeIso();
  const ordenadas = [...estado.tarefas].sort((a, b) => Number(a.concluida) - Number(b.concluida) || (a.data || '9').localeCompare(b.data || '9'));
  return `
    <div class="duas-colunas">
      <section class="bloco">
        <header class="bloco-cab"><h2>Nova tarefa</h2></header>
        <form id="form-tarefa" class="form" autocomplete="off">
          <label class="campo larg">Descrição<input id="tf-titulo" name="titulo" required placeholder="Ex.: Ligar para o cliente sobre a audiência"></label>
          <label class="campo larg">Processo<select id="tf-processo" name="processoId">${opcoesProcesso('')}</select></label>
          <label class="campo">Data<input id="tf-data" type="date" name="data" value="${hoje}"></label>
          <label class="campo">Prioridade<select id="tf-prioridade" name="prioridade"><option value="normal">Normal</option><option value="alta">Alta</option></select></label>
          <div class="form-acoes"><button type="submit" class="btn">Adicionar tarefa</button></div>
        </form>
      </section>
      <section class="bloco">
        <header class="bloco-cab"><h2>Tarefas</h2><span class="sub">${estado.tarefas.filter((t) => !t.concluida).length} aberta(s)</span></header>
        ${ordenadas.length ? `<ul class="lista">${ordenadas.map((t) => `
          <li class="linha ${t.concluida ? 'feita' : t.data ? 'sit-' + situacao(t.data, hoje).chave : ''}">
            <label class="check tarefa-check"><input type="checkbox" data-acao="alternar-tarefa" data-id="${t.id}" ${t.concluida ? 'checked' : ''}><span><strong>${esc(t.titulo)}</strong>${t.prioridade === 'alta' ? ' <span class="pill pill-urgente">Alta</span>' : ''}${t.processoId ? `<span class="sub bloco-sub">${rotuloProcesso(t.processoId)}</span>` : ''}</span></label>
            <div class="linha-lado">
              ${t.data ? dataBonita(t.data) : ''}
              ${!t.concluida && t.data ? pill(situacao(t.data, hoje)) : ''}
              <div class="acoes"><button class="btn-perigo" data-acao="excluir-tarefa" data-id="${t.id}">Excluir</button></div>
            </div>
          </li>`).join('')}</ul>` : vazio('Nenhuma tarefa.', 'Adicione a primeira pelo formulário.')}
      </section>
    </div>`;
}

function telaAjustes() {
  const ano = Number(hojeIso().slice(0, 4));
  const feriados = calendario().feriadosDoAno(ano);
  return `
    <div class="duas-colunas">
      <section class="bloco">
        <header class="bloco-cab"><h2>Calendário forense</h2></header>
        <div class="form">
          ${Object.entries(PRESETS).map(([k, p]) => `<label class="check larg"><input type="checkbox" data-acao="preset" data-valor="${k}" ${estado.config.presets.includes(k) ? 'checked' : ''}> ${esc(p.nome)}</label>`).join('')}
          <p class="nota larg">Feriados nacionais, Carnaval, Sexta-feira da Paixão, Corpus Christi e o recesso de 20/12 a 20/01 já são considerados. Feriados municipais, pontos facultativos e indisponibilidades do sistema devem ser cadastrados abaixo, conforme as portarias do tribunal.</p>
        </div>
        <form id="form-suspensao" class="form" autocomplete="off">
          <label class="campo">De<input id="sp-inicio" type="date" name="inicio" required></label>
          <label class="campo">Até (opcional)<input id="sp-fim" type="date" name="fim"></label>
          <label class="campo larg">Motivo<input id="sp-descricao" name="descricao" placeholder="Ex.: Indisponibilidade do PJe (Portaria nº ...)" required></label>
          <div class="form-acoes"><button type="submit" class="btn">Adicionar suspensão</button></div>
        </form>
        ${estado.config.personalizados.length ? `<ul class="lista compacta">${estado.config.personalizados.map((s, i) => `<li class="linha"><div class="linha-princ"><strong>${esc(s.descricao)}</strong><span class="sub mono">${formatar(s.inicio)}${s.fim && s.fim !== s.inicio ? ' a ' + formatar(s.fim) : ''}</span></div><div class="acoes"><button class="btn-perigo" data-acao="excluir-suspensao" data-id="${i}">Remover</button></div></li>`).join('')}</ul>` : ''}
        <details class="larg"><summary>Feriados considerados em ${ano} (${feriados.length})</summary>
          <ul class="feriados">${feriados.map(([d, n]) => `<li>${dataBonita(d)}<span>${esc(n)}</span></li>`).join('')}</ul>
        </details>
      </section>
      <section class="bloco">
        <header class="bloco-cab"><h2>Backup dos dados</h2></header>
        <p class="nota">Os dados ficam apenas neste navegador. Copie o backup periodicamente e guarde-o em local seguro. Ao trocar de aparelho, cole o backup no campo abaixo e importe.</p>
        <div class="form">
          <div class="form-acoes larg"><button class="btn-sec" data-acao="exportar">Gerar backup</button><button class="btn-sec" data-acao="copiar-backup">Copiar</button><button class="btn" data-acao="importar">Importar o texto colado</button></div>
          <label class="campo larg">Conteúdo do backup (JSON)<textarea id="backup" rows="6" class="mono" placeholder="Clique em Gerar backup ou cole aqui um backup para importar."></textarea></label>
        </div>
        <header class="bloco-cab"><h2>Recomeçar</h2></header>
        <p class="nota">Apaga todos os processos, prazos e tarefas deste navegador.</p>
        <div class="form-acoes"><button class="btn-perigo" data-acao="apagar-tudo">Apagar todos os dados</button></div>
      </section>
    </div>`;
}

const ABAS = [
  ['painel', 'Painel', telaPainel],
  ['prazos', 'Prazos', telaPrazos],
  ['processos', 'Processos', telaProcessos],
  ['tarefas', 'Tarefas', telaTarefas],
  ['ajustes', 'Ajustes', telaAjustes],
];

function render() {
  const foco = document.activeElement?.id;
  const tela = ABAS.find(([k]) => k === aba)[2];
  app.innerHTML = `
    <header class="topo">
      <div class="topo-in">
        <div class="marca"><span class="marca-nome">Painel de Prazos</span><span class="marca-data">${esc(nomeDiaSemana(hojeIso()))}, ${formatar(hojeIso())}</span></div>
        <nav class="abas" aria-label="Seções">${ABAS.map(([k, r]) => `<button class="aba ${k === aba ? 'ativa' : ''}" data-acao="aba" data-valor="${k}" ${k === aba ? 'aria-current="page"' : ''}>${r}</button>`).join('')}</nav>
      </div>
    </header>
    <main class="conteudo">
      ${estado.exemplo ? `<div class="faixa"><span>Você está vendo <strong>dados de exemplo</strong>, todos fictícios.</span> <button class="btn-sec" data-acao="limpar-exemplo">Começar com painel vazio</button></div>` : ''}
      ${mensagem ? `<div class="toast" role="status">${esc(mensagem)}</div>` : ''}
      ${tela()}
      <footer class="rodape">Ferramenta de apoio. Confira sempre o termo final com a certidão do sistema e com o calendário oficial do tribunal.</footer>
    </main>`;
  mensagem = null;
  if (foco) document.getElementById(foco)?.focus();
}

// ---------- eventos ----------
function confirmar(botao) {
  if (botao.dataset.armado) return true;
  botao.dataset.armado = '1';
  botao.textContent = 'Confirmar exclusão';
  setTimeout(() => { if (botao.isConnected) { delete botao.dataset.armado; botao.textContent = 'Excluir'; } }, 4000);
  return false;
}

app.addEventListener('click', async (ev) => {
  const b = ev.target.closest('[data-acao]');
  if (!b || b.type === 'checkbox') return;
  const { acao, id, valor } = b.dataset;
  const acharPrazo = () => estado.prazos.find((p) => p.id === id);
  switch (acao) {
    case 'aba': aba = valor; render(); window.scrollTo(0, 0); break;
    case 'filtro': filtroPrazos = valor; render(); break;
    case 'cumprir': acharPrazo().cumprido = true; persistir('Prazo marcado como cumprido.'); break;
    case 'reabrir': acharPrazo().cumprido = false; persistir('Prazo reaberto.'); break;
    case 'concluir': estado.tarefas.find((t) => t.id === id).concluida = true; persistir('Tarefa concluída.'); break;
    case 'editar-prazo': {
      const p = acharPrazo();
      rascunho = { ...p };
      estado.prazos = estado.prazos.filter((x) => x.id !== id);
      persistir('Prazo aberto no formulário. Ajuste e salve novamente.');
      break;
    }
    case 'novo-prazo-para': rascunho = { ...rascunho, processoId: id, descricao: '' }; aba = 'prazos'; render(); break;
    case 'excluir-prazo': if (confirmar(b)) { estado.prazos = estado.prazos.filter((p) => p.id !== id); persistir('Prazo excluído.'); } break;
    case 'excluir-tarefa': if (confirmar(b)) { estado.tarefas = estado.tarefas.filter((t) => t.id !== id); persistir('Tarefa excluída.'); } break;
    case 'excluir-processo':
      if (confirmar(b)) {
        estado.processos = estado.processos.filter((p) => p.id !== id);
        estado.prazos = estado.prazos.filter((p) => p.processoId !== id);
        estado.tarefas = estado.tarefas.map((t) => (t.processoId === id ? { ...t, processoId: '' } : t));
        persistir('Processo e respectivos prazos excluídos.');
      }
      break;
    case 'excluir-suspensao': estado.config.personalizados.splice(Number(id), 1); persistir('Suspensão removida.'); break;
    case 'limpar-exemplo': estado = estadoVazio(); persistir('Painel zerado. Cadastre seu primeiro processo.'); aba = 'processos'; render(); break;
    case 'apagar-tudo': if (confirmar(b)) { estado = estadoVazio(); persistir('Todos os dados foram apagados.'); } break;
    case 'exportar': document.getElementById('backup').value = JSON.stringify(estado, null, 2); break;
    case 'copiar-backup': {
      const area = document.getElementById('backup');
      if (!area.value) area.value = JSON.stringify(estado, null, 2);
      try { await navigator.clipboard.writeText(area.value); b.textContent = 'Copiado'; } catch { area.select(); b.textContent = 'Selecionado: use Ctrl+C'; }
      break;
    }
    case 'importar': {
      try {
        estado = normalizar(JSON.parse(document.getElementById('backup').value));
        estado.exemplo = false;
        persistir('Backup importado.');
      } catch {
        mensagem = 'O texto colado não é um backup válido. Cole o conteúdo completo gerado por "Gerar backup".';
        render();
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
    el.checked ? s.add(el.dataset.valor) : s.delete(el.dataset.valor);
    estado.config.presets = [...s];
    persistir('Calendário atualizado. Os vencimentos foram recalculados.');
  } else if (el.form?.id === 'form-prazo') {
    lerRascunho(el.form);
    render();
  }
});

app.addEventListener('input', (ev) => {
  const el = ev.target;
  if (el.id === 'pr-numero') {
    const aviso = document.getElementById('pr-numero-aviso');
    const r = analisarNumeroCnj(el.value);
    aviso.textContent = !el.value ? '' : r.valido ? `${r.segmento} · TR ${r.tribunal} · ${r.ano}` : r.erro;
    aviso.className = 'aviso ' + (r.valido ? 'aviso-ok' : 'aviso-erro');
  } else if (el.form?.id === 'form-prazo' && el.id === 'pz-descricao') {
    const usual = PRAZOS_USUAIS.find((u) => u.nome === el.value);
    lerRascunho(el.form);
    if (usual) { rascunho.dias = usual.dias; render(); }
  } else if (el.form?.id === 'form-prazo' && (el.id === 'pz-dias' || el.id === 'pz-data')) {
    lerRascunho(el.form);
    render();
  }
});

function lerRascunho(form) {
  const f = new FormData(form);
  rascunho = {
    ...rascunho,
    processoId: f.get('processoId') || '',
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
      mensagem = e.message; render(); return;
    }
    estado.prazos.push({ ...rascunho, id: novoId(), cumprido: false, descricao: rascunho.descricao || 'Prazo' });
    rascunho = { ...rascunho, descricao: '' };
    persistir('Prazo salvo e incluído na agenda.');
  } else if (form.id === 'form-processo') {
    const r = analisarNumeroCnj(f.numero);
    if (!r.formatado) { mensagem = r.erro; render(); return; }
    if (estado.processos.some((p) => p.numero === r.formatado)) { mensagem = 'Este processo já está cadastrado.'; render(); return; }
    estado.processos.push({ id: novoId(), numero: r.formatado, cliente: f.cliente.trim(), parteContraria: f.parteContraria.trim(), orgao: f.orgao.trim(), area: f.area.trim(), obs: f.obs.trim() });
    persistir(r.valido ? 'Processo cadastrado.' : 'Processo cadastrado, mas o dígito verificador não confere. Revise o número.');
  } else if (form.id === 'form-tarefa') {
    estado.tarefas.push({ id: novoId(), titulo: f.titulo.trim(), processoId: f.processoId, data: f.data, prioridade: f.prioridade, concluida: false });
    persistir('Tarefa adicionada.');
  } else if (form.id === 'form-suspensao') {
    if (f.fim && f.fim < f.inicio) { mensagem = 'A data final da suspensão é anterior à inicial.'; render(); return; }
    estado.config.personalizados.push({ inicio: f.inicio, fim: f.fim || f.inicio, descricao: f.descricao.trim() });
    persistir('Suspensão cadastrada. Os vencimentos foram recalculados.');
  }
});

render();
