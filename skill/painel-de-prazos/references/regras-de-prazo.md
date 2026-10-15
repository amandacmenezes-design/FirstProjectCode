# Regras de contagem implementadas

O motor está em `assets/app/js/prazos.js` (função `calcularPrazo`) e `assets/app/js/feriados.js`. Todas as regras abaixo estão cobertas pelos testes em `assets/app/tests/`.

## Marco inicial

- **Disponibilização no DJe/DJEN** (`marco: 'disponibilizacao'`): considera-se publicado no primeiro dia útil seguinte à disponibilização, e o prazo começa no primeiro dia útil após a publicação (Lei 11.419/2006, art. 4º, §§ 3º e 4º).
- **Intimação, ciência ou juntada** (`marco: 'intimacao'`): exclui-se o dia do começo e inclui-se o do vencimento; o prazo começa no primeiro dia útil seguinte (CPC, art. 224).

## Contagem

- **Dias úteis** (`contagem: 'uteis'`, padrão): CPC, art. 219. O recesso de 20/12 a 20/01 suspende o prazo (CPC, art. 220).
- **Dias corridos** (`contagem: 'corridos'`): CPP, art. 798. Termo final em dia não útil prorroga-se para o primeiro dia útil seguinte (§ 3º). O recesso suspende, salvo réu preso, Lei Maria da Penha e medidas urgentes (CPP, art. 798-A), caso em que se usa `suspenderRecesso: false`.
- **Prazo em dobro** (`dobro: true`): CPC, arts. 180, 183, 186 e 229.

## Dias sem expediente

- Nacionais: 01/01, Carnaval (segunda e terça), Sexta-feira da Paixão, 21/04, 01/05, Corpus Christi, 07/09, 12/10, 02/11, 15/11, 20/11 (a partir de 2024) e 25/12. A Quarta-feira de Cinzas é tratada como dia útil.
- Conjunto do Pará/Belém (ativo por padrão): 15/08 (Adesão do Pará), segunda-feira do Círio de Nazaré (dia seguinte ao segundo domingo de outubro) e 08/12. Deve ser conferido anualmente com a portaria do TJPA.
- Suspensões locais (feriados municipais, indisponibilidade do sistema): cadastradas pela usuária com início, fim e descrição.

## Prazos usuais sugeridos

Contestação 15 (CPC 335); réplica 15 (CPC 350 e 351); apelação 15 e contrarrazões 15 (CPC 1.003, § 5º, e 1.010, § 1º); agravo de instrumento 15; embargos de declaração 5 (CPC 1.023); impugnação ao cumprimento de sentença 15 (CPC 525); embargos à execução 15 (CPC 915); manifestação sem prazo fixado 5 (CPC 218, § 3º); recurso inominado no JEC 10 (Lei 9.099/1995, art. 42).

## Limites que devem ser comunicados

- A ferramenta é de apoio: o termo final deve ser conferido com a certidão do sistema e com o calendário oficial do tribunal.
- Intimações feitas pelo painel do sistema processual (ciência expressa ou tácita após 10 dias corridos, Lei 11.419/2006, art. 5º, § 3º) não aparecem no DJEN e não são tratadas como marco próprio.
- Número CNJ: o dígito verificador é conferido pelo módulo 97 (Resolução CNJ 65/2008), em `assets/app/js/cnj.js`.
