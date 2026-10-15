// Gera dist/painel.html: uma página única, com CSS e JavaScript embutidos,
// para publicação como Artifact do claude.ai ou para abrir sem servidor.
// Uso: node scripts/gerar-pagina-unica.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ler = (p) => readFileSync(join(raiz, p), 'utf8');

// Ordem de dependência dos módulos. Os nomes de topo são únicos entre os arquivos,
// então basta remover as linhas de import e a palavra "export".
const MODULOS = ['js/datas.js', 'js/feriados.js', 'js/cnj.js', 'js/prazos.js', 'js/djen.js', 'js/tema.js', 'js/store.js', 'js/app.js'];
const js = MODULOS.map((m) => `// ---- ${m} ----\n` + ler(m)
  .split('\n')
  .filter((l) => !/^import\s.+from\s.+;$/.test(l))
  .map((l) => l.replace(/^export\s+/, ''))
  .join('\n')).join('\n');

const html = ler('index.html');
const corpo = html.slice(html.indexOf('<!-- conteudo-artefato:inicio -->'), html.indexOf('<!-- conteudo-artefato:fim -->'))
  .replace('<link rel="stylesheet" href="css/style.css">', `<style>\n${ler('css/style.css')}\n</style>`)
  .replace('<script type="module" src="js/app.js"></script>', `<script type="module">\n${js}\n</script>`)
  .replace(/<\/?(head|body)>\n?/g, '')
  .replace(/<!-- conteudo-artefato:inicio -->\n?/, '');

mkdirSync(join(raiz, 'dist'), { recursive: true });
writeFileSync(join(raiz, 'dist/painel.html'), corpo);
console.log('dist/painel.html gerado.');
