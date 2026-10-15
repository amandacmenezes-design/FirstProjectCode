// Identidade visual do painel: vidro sobre fundo cinza, marrom terroso e azul-escuro.
// O visual é escuro em qualquer tema do sistema. A fonte pode ser escolhida em Ajustes → Aparência.

const VISUAL = {
  acento: '#93512b', acentoClaro: '#d39468', acentoTinta: '#ffffff', suave: 'rgba(147, 81, 43, .22)',
  fundo: '#26282f', lateral: '#1b1c21', lateralBg: 'rgba(255, 255, 255, .025)', lateral2: 'rgba(255, 255, 255, .07)',
  lateralTinta: '#a3a8b4', lateralForte: '#ffffff', lateralBorda: 'rgba(255, 255, 255, .08)',
  d1: '#6e3a1a', d2: '#1f2f7c', luz: '#2f4fb5', luzClaro: '#8fa8ff', luzTinta: '#ffffff', ouro: '#22398a',
  fundoImagem: 'radial-gradient(at 12% 0%, rgba(147, 81, 43, .15) 0, transparent 42%), radial-gradient(at 95% 12%, rgba(47, 79, 181, .15) 0, transparent 38%), radial-gradient(at 70% 100%, rgba(147, 81, 43, .15) 0, transparent 45%), #26282f',
  superficie: 'rgba(255, 255, 255, .06)', superficie2: 'rgba(255, 255, 255, .04)', linha: 'rgba(255, 255, 255, .09)',
  vidroBorda: 'rgba(255, 255, 255, .11)', vidroBrilho: 'rgba(255, 255, 255, .08)',
};

// Base escura comum (textos, cores de situação e sombras).
const BASE_ESCURO = [
  '--tinta:#e7ecf3', '--tinta-2:#a3afc2', '--tinta-3:#75829a',
  '--vencido:#f4877b', '--vencido-bg:rgba(244, 135, 123, .14)', '--hoje:#f8a26a', '--hoje-bg:rgba(248, 162, 106, .14)',
  '--urgente:#e8c564', '--urgente-bg:rgba(232, 197, 100, .14)', '--ok:#6fd09a', '--ok-bg:rgba(111, 208, 154, .14)',
  '--sombra:0 1px 2px rgba(0, 0, 0, .3), 0 10px 30px rgba(0, 0, 0, .3)', '--sombra-forte:0 20px 60px rgba(0, 0, 0, .6)',
];

export const FONTES = {
  outfit: { nome: 'Moderna', descricao: 'Outfit', titulo: "'Outfit', system-ui, sans-serif", texto: "'Outfit', system-ui, sans-serif" },
  poppins: { nome: 'Geométrica', descricao: 'Poppins', titulo: "'Poppins', system-ui, sans-serif", texto: "'Poppins', system-ui, sans-serif" },
  dmsans: { nome: 'Neutra', descricao: 'DM Sans', titulo: "'DM Sans', system-ui, sans-serif", texto: "'DM Sans', system-ui, sans-serif" },
  classica: { nome: 'Clássica', descricao: 'Newsreader + Plus Jakarta Sans', titulo: "'Newsreader', Georgia, serif", texto: "'Plus Jakarta Sans', system-ui, sans-serif" },
};

export const APARENCIA_PADRAO = { fonte: 'outfit' };

function variaveis(t, f) {
  return [
    ...BASE_ESCURO,
    `--acento:${t.acento}`, `--acento-tinta:${t.acentoTinta}`, `--acento-suave:${t.suave}`, `--fundo:${t.fundo}`, `--fundo-imagem:${t.fundoImagem}`,
    `--lateral:${t.lateral}`, `--lateral-bg:${t.lateralBg}`, `--lateral-2:${t.lateral2}`,
    `--lateral-tinta:${t.lateralTinta}`, `--lateral-forte:${t.lateralForte}`, `--lateral-borda:${t.lateralBorda}`,
    `--destaque-1:${t.d1}`, `--destaque-2:${t.d2}`, `--destaque-brilho:${t.acentoClaro}`,
    `--luz:${t.luz}`, `--luz-claro:${t.luzClaro}`, `--luz-tinta:${t.luzTinta}`, `--ouro:${t.ouro}`,
    `--superficie:${t.superficie}`, `--superficie-2:${t.superficie2}`, `--linha:${t.linha}`,
    `--vidro-borda:${t.vidroBorda}`, `--vidro-brilho:${t.vidroBrilho}`,
    `--f-titulo:${f.titulo}`, `--f-texto:${f.texto}`,
    'color-scheme:dark',
  ].join(';');
}

// Folha de estilo do visual, aplicada nos três estados do tema do sistema.
export function cssDoTema({ fonte } = APARENCIA_PADRAO) {
  const v = variaveis(VISUAL, FONTES[fonte] || FONTES[APARENCIA_PADRAO.fonte]);
  return `:root{${v}}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${v}}}
:root[data-theme="dark"]{${v}}`;
}

export const ESTILO = 'vidro';
