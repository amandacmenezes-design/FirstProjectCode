# Identidade visual aprovada (15/10/2026)

Definida em `assets/app/js/tema.js` (cores) e `assets/app/css/style.css` (regras do estilo "vidro", sob `:root[data-estilo="vidro"]`). A usuária aprovou este visual após várias rodadas; ao alterar o painel, preserve-o, salvo pedido expresso.

## Conceito

Vidro (glassmorphism) sobre fundo cinza-chumbo, com uma cor principal terrosa e uma secundária azul-escura. A cor fica reservada aos elementos que importam; fundo, barra lateral e cartões são neutros. O visual é escuro em qualquer tema do sistema.

## Cores

| Papel | Valor |
| --- | --- |
| Fundo | `#26282f`, com manchas suaves de marrom e azul (radial-gradients a 15% de opacidade) |
| Barra lateral | `#1b1c21` (mais escura que o fundo) |
| Cartões (vidro) | `rgba(255,255,255,.06)`, borda `rgba(255,255,255,.11)`, `backdrop-filter: blur(20px) saturate(160%)` |
| Cor principal (marrom terroso) | `#93512b`; claro `#d39468`; escuro `#6e3a1a` |
| Cor secundária (azul-escuro) | `#2f4fb5`; claro `#8fa8ff`; escuro `#22398a` |
| Texto | `#e7ecf3`, secundário `#a3afc2` |
| Situação | vencido `#f4877b`, hoje `#f8a26a`, até 3 dias `#e8c564`, cumprido `#6fd09a` |

Onde cada cor aparece: o marrom nos gráficos, no medidor, nas barras de área, no botão "Novo prazo" do topo, nos círculos dos indicadores 1 e 3 e no item ativo do menu; o azul-escuro no botão lateral, no logotipo e nos círculos dos indicadores 2 e 4; o cartão do próximo vencimento usa um degradê do marrom ao azul-escuro.

## Forma

Cantos de 22px nos cartões; botões, busca e itens de menu em formato de pílula; ícones dentro de círculos com degradê, brilho interno e sombra ("ícones boleados"). Fonte padrão: Outfit (alternativas em Ajustes: Poppins, DM Sans, Newsreader + Plus Jakarta Sans).

## Preferências de redação da interface

Português do Brasil, tratamento formal ("Dra. Amanda" na saudação, editável em Ajustes), termos jurídicos corretos e textos curtos. A usuária recusou: fundo branco, laranja, dourado e interfaces em que tudo tem a mesma cor.
