// Os dados ficam somente no navegador de quem usa o painel (localStorage).
// Nada é enviado a servidor algum, e nada é gravado no repositório.
const CHAVE = 'painel-prazos:v1';

export function estadoVazio() {
  return {
    versao: 1,
    exemplo: false,
    processos: [],
    prazos: [],
    tarefas: [],
    config: { presets: ['para'], personalizados: [] },
  };
}

export function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const salvo = normalizar(JSON.parse(bruto));
    const estado = removerExemplos(salvo);
    if (estado !== salvo) localStorage.setItem(CHAVE, JSON.stringify(estado));
    return estado;
  } catch {
    return null;
  }
}

export function salvar(estado) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
    return true;
  } catch {
    return false;
  }
}

export function normalizar(dados) {
  if (!dados || typeof dados !== 'object') throw new Error('Arquivo de backup inválido.');
  const base = estadoVazio();
  return {
    ...base,
    ...dados,
    processos: Array.isArray(dados.processos) ? dados.processos : [],
    prazos: Array.isArray(dados.prazos) ? dados.prazos : [],
    tarefas: Array.isArray(dados.tarefas) ? dados.tarefas : [],
    config: { ...base.config, ...(dados.config || {}) },
  };
}

export function novoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Versões anteriores abriam com dados fictícios. Remove esses exemplos de um estado salvo,
// preservando qualquer registro real que tenha sido incluído ao lado deles.
const CLIENTES_EXEMPLO = ['Cliente Exemplo A', 'Condomínio Exemplo', 'Cliente Exemplo B'];
const TAREFA_EXEMPLO = 'Conferir portaria de feriados do TJPA para 2027';

export function removerExemplos(e) {
  if (!e.exemplo) return e;
  const ids = new Set(e.processos.filter((p) => CLIENTES_EXEMPLO.includes(p.cliente)).map((p) => p.id));
  return {
    ...e,
    exemplo: false,
    processos: e.processos.filter((p) => !ids.has(p.id)),
    prazos: e.prazos.filter((p) => !ids.has(p.processoId)),
    tarefas: e.tarefas.filter((t) => !ids.has(t.processoId) && t.titulo !== TAREFA_EXEMPLO),
  };
}
