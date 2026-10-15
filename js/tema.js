// Paletas e fontes selecionáveis em Ajustes → Aparência.
// Cada paleta define os tons do tema claro e do escuro; o restante da interface
// (superfícies, textos, cores de situação) vem de css/style.css.

// Estilo vidro escuro: base azul-marinho com uma cor de destaque.
function vidro(nome, c) {
  const t = {
    acento: '#5b8cf0', acentoTinta: '#ffffff', suave: 'rgba(91, 140, 240, .16)', fundo: '#12234a', lateral: '#0c1834',
    lateralBg: 'rgba(8, 16, 38, .55)', lateral2: 'rgba(255, 255, 255, .07)', lateralTinta: '#b4c1dc', lateralForte: '#ffffff', lateralBorda: 'rgba(160, 185, 255, .14)',
    ouro: c.forte, d1: '#2a56b8', d2: '#13295e', brilho: '#5b8cf0', luz: c.luz, luzClaro: c.claro, luzTinta: c.tinta,
    fundoImagem: `radial-gradient(at 8% 6%, #2b55ad 0, transparent 42%), radial-gradient(at 92% 8%, ${c.reflexo} 0, transparent 38%), radial-gradient(at 78% 92%, #2c3d93 0, transparent 48%), radial-gradient(at 8% 96%, #1a4b86 0, transparent 40%), #12234a`,
    superficie: 'rgba(255, 255, 255, .075)', superficie2: 'rgba(255, 255, 255, .055)', linha: 'rgba(170, 195, 255, .14)', vidroBorda: 'rgba(190, 210, 255, .18)', vidroBrilho: 'rgba(255, 255, 255, .10)',
  };
  return { nome, estilo: 'vidro', sempreEscuro: true, claro: t, escuro: t };
}

const VIDROS = {
  vidro: vidro('Vidro · azul e turquesa', { luz: '#2ccfe0', claro: '#7ee8f2', forte: '#13a7ba', tinta: '#04252c', reflexo: '#0f5f70' }),
  vidroDourado: vidro('Vidro · azul e dourado', { luz: '#e0b24a', claro: '#f3d58a', forte: '#b98a2b', tinta: '#2a1d05', reflexo: '#5a4416' }),
  vidroLilas: vidro('Vidro · azul e lilás', { luz: '#b39bff', claro: '#d6c9ff', forte: '#8a6cf0', tinta: '#1c1240', reflexo: '#46338f' }),
};

export const PALETAS = {
  ...VIDROS,
  moderno: {
    nome: 'Moderno claro',
    claro: { acento: '#2563eb', suave: '#e8efff', fundo: '#f5f7fb', lateral: '#ffffff', lateral2: '#eef3ff', lateralTinta: '#5b6474', lateralForte: '#1d4ed8', lateralBorda: '#e3e8f0', ouro: '#f97316', d1: '#1d4ed8', d2: '#1e3a8a', brilho: '#3b82f6', luz: '#f97316' },
    escuro: { acento: '#6ea8ff', suave: '#16233d', fundo: '#0b0f17', lateral: '#0f141d', lateral2: '#1a2333', lateralTinta: '#9aa6b8', lateralBorda: '#1f2937', d1: '#1d3b7a', d2: '#111c33', brilho: '#2b5fd0', luz: '#fb923c' },
  },
  gradiente: {
    nome: 'Gradiente azul',
    claro: { acento: '#2556d8', suave: '#e7eeff', fundo: '#f4f6fb', lateral: '#1b2a7a', lateralBg: 'linear-gradient(180deg, #2453d4 0%, #1b2a7a 100%)', lateral2: 'rgba(255, 255, 255, .14)', lateralTinta: '#d4ddff', ouro: '#f97316', d1: '#2453d4', d2: '#1b2a7a', brilho: '#5b8cff', luz: '#ff8a3d' },
    escuro: { acento: '#7aa2ff', suave: '#18224a', fundo: '#0a0d1a', lateral: '#0f164a', lateralBg: 'linear-gradient(180deg, #1a3aa0 0%, #0f164a 100%)', lateral2: 'rgba(255, 255, 255, .12)', lateralTinta: '#c3cdf5', d1: '#1a3aa0', d2: '#0f164a', brilho: '#3c66e0', luz: '#ff8a3d' },
  },
  petroleo: {
    nome: 'Petróleo e coral',
    claro: { acento: '#0f766e', suave: '#e0f2ef', fundo: '#f4f7f6', lateral: '#ffffff', lateral2: '#e6f4f1', lateralTinta: '#5b6670', lateralForte: '#0f766e', lateralBorda: '#e2e8e6', ouro: '#f26b4f', d1: '#115e59', d2: '#0b3b38', brilho: '#14b8a6', luz: '#f97352' },
    escuro: { acento: '#4fd1c1', suave: '#12302d', fundo: '#0a1110', lateral: '#0f1716', lateral2: '#182725', lateralTinta: '#9fb0ad', lateralBorda: '#1f2b29', d1: '#115e59', d2: '#0b3b38', brilho: '#0f8f84', luz: '#f97352' },
  },
  azul: {
    nome: 'Azul e laranja escuro',
    claro: { acento: '#163f80', suave: '#e2e9f5', fundo: '#eef1f6', lateral: '#081a33', lateral2: '#10294f', lateralTinta: '#b3c1d8', ouro: '#c2560f', d1: '#0b2347', d2: '#06152c', brilho: '#1a4a8f', luz: '#dd6a17' },
    escuro: { acento: '#6f9ce6', suave: '#142540', fundo: '#090f1b', lateral: '#050b16', lateral2: '#0f2242', d1: '#0b2347', d2: '#06152c', brilho: '#18427f', luz: '#e0701a' },
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

const BASE_ESCURO = [
  '--superficie:#121b2b', '--superficie-2:#172234', '--tinta:#e7ecf3', '--tinta-2:#a3afc2', '--tinta-3:#75829a', '--linha:#233047',
  '--vencido:#f4877b', '--vencido-bg:rgba(244, 135, 123, .14)', '--hoje:#f8a26a', '--hoje-bg:rgba(248, 162, 106, .14)',
  '--urgente:#e8c564', '--urgente-bg:rgba(232, 197, 100, .14)', '--ok:#6fd09a', '--ok-bg:rgba(111, 208, 154, .14)',
  '--sombra:0 1px 2px rgba(0, 0, 0, .3), 0 10px 30px rgba(0, 0, 0, .3)', '--sombra-forte:0 20px 60px rgba(0, 0, 0, .6)',
].join(';');

export const APARENCIA_PADRAO = { paleta: 'vidro', fonte: 'outfit' };

function variaveis(t, f) {
  const v = [
    `--acento:${t.acento}`, `--acento-suave:${t.suave}`, `--fundo:${t.fundo}`,
    `--lateral:${t.lateral}`, `--lateral-2:${t.lateral2}`,
    `--destaque-1:${t.d1}`, `--destaque-2:${t.d2}`, `--destaque-brilho:${t.brilho}`, `--luz:${t.luz}`,
  ];
  v.push(`--lateral-tinta:${t.lateralTinta || '#a9b6cc'}`, `--lateral-forte:${t.lateralForte || '#ffffff'}`,
    `--lateral-bg:${t.lateralBg || t.lateral}`, `--lateral-borda:${t.lateralBorda || 'transparent'}`);
  if (t.ouro) v.push(`--ouro:${t.ouro}`);
  if (t.fundoImagem) v.push(`--fundo-imagem:${t.fundoImagem}`);
  if (t.luzClaro) v.push(`--luz-claro:${t.luzClaro}`);
  if (t.acentoTinta) v.push(`--acento-tinta:${t.acentoTinta}`);
  if (t.luzTinta) v.push(`--luz-tinta:${t.luzTinta}`);
  if (t.vidroBorda) v.push(`--vidro-borda:${t.vidroBorda}`, `--vidro-brilho:${t.vidroBrilho}`);
  if (t.superficie) v.push(`--superficie:${t.superficie}`, `--superficie-2:${t.superficie2}`, `--linha:${t.linha}`);
  if (f) v.push(`--f-titulo:${f.titulo}`, `--f-texto:${f.texto}`);
  return v.join(';');
}

// Gera a folha de estilo do tema escolhido, nos três estados do tema do sistema.
export function cssDoTema({ paleta, fonte } = APARENCIA_PADRAO) {
  const p = PALETAS[paleta] || PALETAS[APARENCIA_PADRAO.paleta];
  const f = FONTES[fonte] || FONTES[APARENCIA_PADRAO.fonte];
  if (p.sempreEscuro) {
    // Visual escuro fixo: usa a base escura da interface em qualquer tema do sistema.
    const v = `${BASE_ESCURO};${variaveis(p.escuro, f)};color-scheme:dark`;
    return `:root{${v}}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${v}}}
:root[data-theme="dark"]{${v}}`;
  }
  return `:root{${variaveis(p.claro, f)}}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${variaveis(p.escuro)}}}
:root[data-theme="dark"]{${variaveis(p.escuro)}}`;
}

export function estiloDoTema({ paleta } = APARENCIA_PADRAO) {
  return (PALETAS[paleta] || PALETAS[APARENCIA_PADRAO.paleta]).estilo || 'padrao';
}
