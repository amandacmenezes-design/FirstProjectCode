import { addDias, hojeIso } from './datas.js';
import { digitoVerificador } from './cnj.js';

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
    return normalizar(JSON.parse(bruto));
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

function numeroExemplo(seq, origem) {
  const n = String(seq).padStart(7, '0');
  return `${n}-${digitoVerificador(n, '2026', '8', '14', origem)}.2026.8.14.${origem}`;
}

// Dados fictícios para a primeira abertura, claramente marcados como exemplo.
export function estadoExemplo(hoje = hojeIso()) {
  const e = estadoVazio();
  e.exemplo = true;
  const p1 = { id: novoId(), numero: numeroExemplo(801234, '0301'), cliente: 'Cliente Exemplo A', parteContraria: 'Construtora Exemplo Ltda.', orgao: '5ª Vara Cível e Empresarial de Belém', area: 'Imobiliário', obs: 'Ação de rescisão contratual (exemplo)' };
  const p2 = { id: novoId(), numero: numeroExemplo(805678, '0301'), cliente: 'Condomínio Exemplo', parteContraria: 'Condômino Exemplo', orgao: '2ª Vara Cível de Belém', area: 'Condominial', obs: 'Cobrança de cotas condominiais (exemplo)' };
  const p3 = { id: novoId(), numero: numeroExemplo(800321, '0006'), cliente: 'Cliente Exemplo B', parteContraria: 'Banco Exemplo S.A.', orgao: 'Juizado Especial Cível de Ananindeua', area: 'Consumidor', obs: '' };
  e.processos.push(p1, p2, p3);
  e.prazos.push(
    { id: novoId(), processoId: p1.id, descricao: 'Réplica', dataMarco: addDias(hoje, -20), marco: 'disponibilizacao', contagem: 'uteis', dias: 15, dobro: false, suspenderRecesso: true, cumprido: false },
    { id: novoId(), processoId: p2.id, descricao: 'Embargos de declaração', dataMarco: addDias(hoje, -3), marco: 'intimacao', contagem: 'uteis', dias: 5, dobro: false, suspenderRecesso: true, cumprido: false },
    { id: novoId(), processoId: p3.id, descricao: 'Recurso inominado', dataMarco: addDias(hoje, -1), marco: 'disponibilizacao', contagem: 'uteis', dias: 10, dobro: false, suspenderRecesso: true, cumprido: false },
    { id: novoId(), processoId: p1.id, descricao: 'Contestação', dataMarco: addDias(hoje, -40), marco: 'intimacao', contagem: 'uteis', dias: 15, dobro: false, suspenderRecesso: true, cumprido: true },
  );
  e.tarefas.push(
    { id: novoId(), titulo: 'Reunir comprovantes de pagamento com o cliente', processoId: p1.id, data: addDias(hoje, 2), prioridade: 'alta', concluida: false },
    { id: novoId(), titulo: 'Atualizar planilha de débito condominial', processoId: p2.id, data: addDias(hoje, 6), prioridade: 'normal', concluida: false },
    { id: novoId(), titulo: 'Conferir portaria de feriados do TJPA para 2027', processoId: '', data: addDias(hoje, 30), prioridade: 'normal', concluida: false },
  );
  return e;
}
