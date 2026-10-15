# Painel de Prazos

Ferramenta interna para cadastro de processos judiciais, cálculo automático de prazos processuais e controle de tarefas, com painel de vencimentos.

## O que faz

A página inicial mostra indicadores (processos cadastrados, prazos em aberto e concluídos, tarefas em aberto), um gráfico de vencimentos por semana, o percentual de prazos com baixa e a distribuição dos processos por área. Abaixo, o painel reúne, em ordem cronológica, os prazos e as tarefas pendentes, destacando os vencidos, os que vencem hoje e os que vencem em até sete dias. Na aba **Prazos**, a calculadora apura o termo final a partir da data do marco inicial e mostra a memória de cálculo dia a dia, com a indicação de cada dia excluído e do motivo.

Regras implementadas:

| Situação | Regra |
| --- | --- |
| Contagem em dias úteis | CPC, art. 219 |
| Exclusão do dia do começo, inclusão do dia do vencimento | CPC, art. 224 |
| Disponibilização no DJe/DJEN: publicação no primeiro dia útil seguinte; prazo a partir do primeiro dia útil após a publicação | Lei 11.419/2006, art. 4º, §§ 3º e 4º |
| Recesso forense de 20/12 a 20/01 | CPC, art. 220 |
| Prazo em dobro | CPC, arts. 180, 183, 186 e 229 |
| Dias corridos, com prorrogação do termo final em dia não útil | CPP, art. 798 |
| Suspensão no recesso em matéria penal, salvo réu preso, Lei Maria da Penha e urgências | CPP, art. 798-A |
| Número único do processo, com verificação do dígito (módulo 97) | Resolução CNJ 65/2008 |

Feriados considerados automaticamente: os nacionais, Carnaval (segunda e terça), Sexta-feira da Paixão e Corpus Christi. Há um conjunto opcional para o Pará/Belém (15/08, segunda-feira do Círio e 08/12), que deve ser conferido anualmente com a portaria do TJPA. Feriados municipais, pontos facultativos e indisponibilidades do sistema são cadastrados na aba **Ajustes**.

> A ferramenta é de apoio. Confira sempre o termo final com a certidão do sistema e com o calendário oficial do tribunal.

## Busca automática no DJEN

No formulário de novo prazo, informe o número CNJ do processo (ou escolha um processo cadastrado) e clique em **Buscar no DJEN**. O painel consulta a API pública do Diário de Justiça Eletrônico Nacional (`comunicaapi.pje.jus.br`, CNJ), lista as publicações do processo e, ao escolher uma, preenche o marco (data de disponibilização) e sugere a quantidade de dias quando o teor traz prazo expresso ("no prazo de 15 (quinze) dias"). A sugestão deve sempre ser conferida. Se o processo ainda não estiver cadastrado, ele é criado ao salvar o prazo, com o órgão julgador e a classe vindos do DJEN.

Limitações: a API só atende acessos feitos do Brasil; a busca funciona na versão publicada no GitHub Pages (a versão de teste no claude.ai não pode acessar outros sites); e intimações feitas pelo painel do sistema processual (ciência expressa ou tácita) não aparecem no DJEN.

A página `teste-djen.html` faz um diagnóstico da conexão com a API a partir do navegador.

## Privacidade

Os dados (processos, prazos e tarefas) ficam **apenas no navegador** de quem usa o painel (`localStorage`). Nada é gravado neste repositório, que é público. A única informação enviada para fora é o número do processo, quando a senhora usa a busca no DJEN, e apenas à API pública do CNJ. Use a função de backup em **Ajustes** para guardar uma cópia ou levar os dados a outro aparelho. Nunca faça commit de arquivos de backup.

## Como usar

Não há dependências. Para rodar localmente:

```bash
npm start          # serve a pasta em http://localhost:8080
npm test           # executa os testes do cálculo de prazos
```

Para publicar no GitHub Pages: em *Settings → Pages*, escolha *Deploy from a branch*, selecione a branch e a pasta `/ (root)`.

Para gerar uma página única (CSS e JavaScript embutidos), usada na versão de teste no claude.ai:

```bash
node scripts/gerar-pagina-unica.mjs   # cria dist/painel.html
```

## Estrutura

```
index.html                  página principal
css/style.css               estilos (tema claro e escuro)
js/datas.js                 utilitários de data
js/feriados.js              Páscoa, feriados nacionais e regionais, recesso
js/prazos.js                calendário forense e cálculo de prazos
js/cnj.js                   validação do número CNJ
js/djen.js                  consulta ao DJEN e sugestão de prazo
js/store.js                 armazenamento local
js/tema.js                  identidade visual (vidro, marrom terroso e azul-escuro) e fontes
js/app.js                   interface
tests/*.test.mjs            testes automatizados
teste-djen.html             diagnóstico da API do DJEN
scripts/gerar-pagina-unica.mjs
```

## Próximos passos sugeridos

Importação em lote das intimações da OAB do dia; feriados municipais por comarca; lembretes por e-mail ou notificação; e sincronização entre aparelhos.

## Skill do Claude

A pasta `skill/painel-de-prazos/` reúne o projeto em forma de skill do Claude (código, calculadora de prazos na linha de comando, regras, API do DJEN e identidade visual). O arquivo `skill/painel-de-prazos.skill` é o pacote instalável.
