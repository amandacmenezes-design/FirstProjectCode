---
name: painel-de-prazos
description: Painel de Prazos da Dra. Amanda Menezes (OAB/PA 27.941) — aplicação web de gestão processual com cálculo automático de prazos (CPC e CPP, feriados nacionais e do Pará, recesso, prazo em dobro), busca de publicações no DJEN pelo número do processo, cadastro de processos e tarefas e dashboard com gráficos, no visual aprovado (vidro sobre cinza, marrom terroso e azul-escuro). Use esta skill sempre que a usuária pedir para calcular ou conferir o vencimento de um prazo processual, montar a memória de cálculo de um prazo, alterar, corrigir, republicar, recriar ou ampliar o Painel de Prazos, mexer no repositório FirstProjectCode, gerar a página única do painel, ou mencionar "painel", "dashboard de prazos", "calcular prazo", "contagem de prazo", "termo final", "tempestividade" ou "publicação no DJEN", mesmo que não cite o painel pelo nome.
---

# Painel de Prazos

Esta skill reúne o Painel de Prazos completo e as decisões tomadas com a usuária ao construí-lo. Use-a para três tipos de pedido: calcular um prazo diretamente na conversa, manter ou evoluir o painel, e recriá-lo do zero se o repositório se perder.

## Onde está cada coisa

```
assets/app/                    código-fonte completo do painel (o mesmo do repositório)
  index.html, css/style.css    página e estilos (estilo "vidro" sob :root[data-estilo="vidro"])
  js/datas.js, feriados.js     datas em UTC, Páscoa, feriados nacionais e do Pará, recesso
  js/prazos.js                 calendário forense e calcularPrazo (motor de cálculo)
  js/cnj.js                    validação do número CNJ (módulo 97)
  js/djen.js                   busca no DJEN e sugestão de prazo pelo teor do ato
  js/tema.js                   identidade visual aprovada e opções de fonte
  js/store.js, js/app.js       armazenamento local (localStorage) e interface
  tests/                       testes (node --test tests/*.test.mjs)
  teste-djen.html              diagnóstico da API do DJEN no navegador da usuária
assets/painel-pagina-unica.html  versão em página única, pronta para publicar como Artifact
scripts/calcular_prazo.mjs     calculadora de prazos na linha de comando (mesmo motor)
scripts/gerar-pagina-unica.mjs regenera a página única a partir de assets/app
references/regras-de-prazo.md  regras processuais implementadas e limites
references/djen.md             API do DJEN: endpoint, campos e restrições de acesso
references/identidade-visual.md cores, formas e preferências visuais aprovadas
```

## Calcular um prazo na conversa

Use o script, que usa exatamente o motor do painel, em vez de contar à mão. Contar dias úteis mentalmente é onde mais se erra.

```bash
node scripts/calcular_prazo.mjs --data 2026-10-14 --dias 15                       # disponibilização no DJEN, dias úteis
node scripts/calcular_prazo.mjs --data 2026-10-19 --dias 5 --marco intimacao      # intimação/ciência
node scripts/calcular_prazo.mjs --data 2026-10-05 --dias 5 --marco intimacao --corridos   # penal (CPP 798)
node scripts/calcular_prazo.mjs --data 2026-10-19 --dias 15 --dobro --suspensao 2026-10-21:2026-10-22:"Indisponibilidade do PJe"
```

Pergunte o que faltar antes de calcular: a data, se é disponibilização no DJEN ou intimação, o número de dias e se há prazo em dobro ou feriado local. Apresente o vencimento com o dia da semana, a data da publicação e do início, e a memória de cálculo quando for útil para fundamentar tempestividade. Lembre sempre que o resultado deve ser conferido com a certidão do sistema e o calendário do tribunal. As regras e seus fundamentos estão em `references/regras-de-prazo.md`.

## Manter ou evoluir o painel

1. Trabalhe no repositório `amandacmenezes-design/FirstProjectCode` quando ele estiver disponível; o código de `assets/app/` é a cópia de referência para quando não estiver.
2. Preserve a identidade visual de `references/identidade-visual.md`. A usuária aprovou esse visual depois de recusar várias alternativas; mudanças de cor ou estilo só com pedido expresso.
3. Rode os testes depois de qualquer alteração em `js/` (`node --test tests/*.test.mjs`) e acrescente testes quando mexer no cálculo.
4. O `app.js` usa nomes de topo únicos entre os módulos porque `gerar-pagina-unica.mjs` concatena os arquivos removendo `import` e `export`. Mantenha imports em uma linha e não repita nomes de topo entre módulos.
5. Publique a página única como Artifact para testes rápidos; a versão completa (com busca no DJEN) roda no GitHub Pages, que exige repositório público no plano gratuito.

## Privacidade e sigilo

Os dados de processos, prazos e tarefas ficam apenas no navegador da usuária (`localStorage`), separados por endereço; a transferência entre versões é feita pelo backup em Ajustes. Nunca grave dados de clientes ou arquivos de backup no repositório, que é público. A única informação enviada para fora é o número do processo, à API pública do CNJ.

## Comunicação com a usuária

Escreva em português do Brasil, em tom formal, tratando-a por "Doutora" ou "senhora". Ela não é programadora: explique passos de GitHub e de configuração com caminhos de clique exatos e evite jargão técnico. Mostre mudanças visuais com capturas de tela.
