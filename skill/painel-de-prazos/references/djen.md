# Busca no DJEN (Diário de Justiça Eletrônico Nacional)

Implementada em `assets/app/js/djen.js` e confirmada por diagnóstico real em 15/10/2026 (`assets/app/teste-djen.html`).

## Endpoint

`GET https://comunicaapi.pje.jus.br/api/v1/comunicacao`

Parâmetros usados: `numeroProcesso` (20 dígitos, com ou sem máscara: ambos funcionam), `numeroOab`, `ufOab`, `dataDisponibilizacaoInicio`, `dataDisponibilizacaoFim` (AAAA-MM-DD), `itensPorPagina` (até 100), `pagina`.

Resposta: `{ status, message, count, items }`. Campos de cada item: `id`, `data_disponibilizacao` (AAAA-MM-DD), `siglaTribunal`, `tipoComunicacao`, `nomeOrgao`, `idOrgao`, `texto` (HTML), `numero_processo`, `meio`, `link`, `tipoDocumento` (Sentença, Despacho, Ato ordinatório, Intimação…), `nomeClasse`, `codigoClasse`, `numeroComunicacao`, `ativo`, `hash`, `status`, `motivo_cancelamento`, `data_cancelamento`, `datadisponibilizacao`, `meiocompleto`, `numeroprocessocommascara`, `destinatarios`, `destinatarioadvogados`.

## Restrições de acesso

- A API só responde a acessos feitos do Brasil (CloudFront bloqueia outros países com HTTP 403). Servidores na nuvem fora do Brasil, inclusive ambientes de execução do Claude, normalmente são bloqueados.
- O navegador da usuária, no Brasil, consegue chamar a API diretamente (CORS liberado). Por isso a busca funciona na versão publicada no GitHub Pages.
- Páginas publicadas como Artifact do claude.ai não podem acessar sites externos; nelas a busca mostra uma mensagem explicando isso.

## Sugestão de prazo

`sugerirPrazo(texto, tipoDocumento)` procura no teor expressões como "no prazo de 15 (quinze) dias" (inclusive números por extenso e "dias corridos") e devolve o trecho de origem. Sem prazo expresso, sugere apelação (15 dias) para sentenças e contestação (15 dias) para citações. A sugestão sempre precisa ser conferida pela advogada.
