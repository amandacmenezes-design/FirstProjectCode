// Paletas e fontes selecionáveis em Ajustes → Aparência.
// Cada paleta define os tons do tema claro e do escuro; o restante da interface
// (superfícies, textos, cores de situação) vem de css/style.css.

export const PALETAS = {
  azul: {
    nome: 'Azul e laranja',
    claro: { acento: '#1f5fbf', suave: '#e4edfb', fundo: '#f1f4f9', lateral: '#0c2547', lateral2: '#163a6b', lateralTinta: '#b8c8e2', ouro: '#d9701a', d1: '#0f2f5c', d2: '#0a1f3d', brilho: '#2b6fd1', luz: '#ff9a3c' },
    escuro: { acento: '#7fb0ff', suave: '#172a48', fundo: '#0a1220', lateral: '#060d1a', lateral2: '#13284a', d1: '#0f2a52', d2: '#081a33', brilho: '#1f4f99', luz: '#ff9a3c' },
  },
  jade: {
    nome: 'Jade',
    claro: { acento: '#16805c', suave: '#e1f2ea', fundo: '#f1f5f3', lateral: '#0e3a31', lateral2: '#17503f', lateralTinta: '#b7d3c8', ouro: '#b07a1c', d1: '#0f4436', d2: '#0b2d25', brilho: '#1f7a5c', luz: '#8fe0b8' },
    escuro: { acento: '#5fd0a2', suave: '#163a2e', fundo: '#0a1311', lateral: '#06110e', lateral2: '#12302a', d1: '#0f3a2f', d2: '#08201a', brilho: '#1b6a50', luz: '#8fe0b8' },
  },
  marinho: {
    nome: 'Marinho e dourado',
    claro: { acento: '#1f4a8c', suave: '#e5edf9', fundo: '#eef1f5', lateral: '#0e1c33', lateral2: '#17294a', lateralTinta: '#b9c5d9', ouro: '#b88a35', d1: '#10203c', d2: '#0b172b', brilho: '#2a4a80', luz: '#d8ab58' },
    escuro: { acento: '#7ea6ec', suave: '#1b2a45', fundo: '#0a111d', lateral: '#070d18', lateral2: '#13203a', d1: '#10203c', d2: '#0b172b', brilho: '#2a4a80', luz: '#d8ab58' },
  },
  vinho: {
    nome: 'Vinho',
    claro: { acento: '#9b2c48', suave: '#f7e6eb', fundo: '#f6f2f3', lateral: '#3a1020', lateral2: '#521a2f', lateralTinta: '#e0bcc8', ouro: '#a8741f', d1: '#4a1427', d2: '#2a0b16', brilho: '#7a2440', luz: '#f0b8c8' },
    escuro: { acento: '#ec8aa5', suave: '#3a1a24', fundo: '#140b0e', lateral: '#0d0609', lateral2: '#2a1019', d1: '#3d1121', d2: '#220912', brilho: '#6a1f38', luz: '#f0b8c8' },
  },
  grafite: {
    nome: 'Grafite e âmbar',
    claro: { acento: '#9a5a00', suave: '#fbefd9', fundo: '#f3f3f2', lateral: '#1d2125', lateral2: '#2b3137', lateralTinta: '#b9c0c7', ouro: '#3d6f8f', d1: '#262b30', d2: '#15181b', brilho: '#4a3a1c', luz: '#f2b34a' },
    escuro: { acento: '#f2b34a', suave: '#33280f', fundo: '#0e0f10', lateral: '#08090a', lateral2: '#1d2125', d1: '#22262a', d2: '#121417', brilho: '#4a3a1c', luz: '#f2b34a' },
  },
};

export const FONTES = {
  outfit: { nome: 'Moderna', descricao: 'Outfit', titulo: "'Outfit', system-ui, sans-serif", texto: "'Outfit', system-ui, sans-serif" },
  poppins: { nome: 'Geométrica', descricao: 'Poppins', titulo: "'Poppins', system-ui, sans-serif", texto: "'Poppins', system-ui, sans-serif" },
  dmsans: { nome: 'Neutra', descricao: 'DM Sans', titulo: "'DM Sans', system-ui, sans-serif", texto: "'DM Sans', system-ui, sans-serif" },
  classica: { nome: 'Clássica', descricao: 'Newsreader + Plus Jakarta Sans', titulo: "'Newsreader', Georgia, serif", texto: "'Plus Jakarta Sans', system-ui, sans-serif" },
};

export const APARENCIA_PADRAO = { paleta: 'azul', fonte: 'outfit' };

function variaveis(t, f) {
  const v = [
    `--acento:${t.acento}`, `--acento-suave:${t.suave}`, `--fundo:${t.fundo}`,
    `--lateral:${t.lateral}`, `--lateral-2:${t.lateral2}`,
    `--destaque-1:${t.d1}`, `--destaque-2:${t.d2}`, `--destaque-brilho:${t.brilho}`, `--luz:${t.luz}`,
  ];
  if (t.lateralTinta) v.push(`--lateral-tinta:${t.lateralTinta}`);
  if (t.ouro) v.push(`--ouro:${t.ouro}`);
  if (f) v.push(`--f-titulo:${f.titulo}`, `--f-texto:${f.texto}`);
  return v.join(';');
}

// Gera a folha de estilo do tema escolhido, nos três estados do tema do sistema.
export function cssDoTema({ paleta, fonte } = APARENCIA_PADRAO) {
  const p = PALETAS[paleta] || PALETAS[APARENCIA_PADRAO.paleta];
  const f = FONTES[fonte] || FONTES[APARENCIA_PADRAO.fonte];
  return `:root{${variaveis(p.claro, f)}}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${variaveis(p.escuro)}}}
:root[data-theme="dark"]{${variaveis(p.escuro)}}`;
}
