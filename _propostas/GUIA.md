# Guia: como montar uma proposta de importação e restauração

Este guia mostra, passo a passo, como transformar um carro encontrado nos EUA
numa proposta de venda com página própria no site da Bomsenhor, como a do
**Corvette 1954**:
https://bomsenhorrestauracoes.com.br/proposta/corvette-1954/

A proposta é uma página do site que só abre para quem recebe o link. Ela não
aparece no Google nem no menu do site.

---

## Visão geral

| # | Etapa | Quem faz | Tempo aproximado |
|---|---|---|---|
| 1 | Juntar as informações do carro e do negócio | Equipe | 1 dia |
| 2 | Separar as fotos | Equipe | 1 hora |
| 3 | Criar as simulações do carro restaurado | Claude + equipe revisa | 1 a 2 horas |
| 4 | Montar a página | Claude | 30 minutos |
| 5 | Revisar e aprovar | Equipe | 30 minutos |
| 6 | Publicar e enviar o link | Claude publica, equipe envia | 10 minutos |
| 7 | Depois da venda | Equipe decide, Claude executa | 10 minutos |

**Atalho:** no Claude Code, com a pasta do site aberta, escreva
**"nova proposta para o [carro]"**. O Claude segue este processo, pergunta o que
faltar e mostra tudo antes de publicar.

---

## 1. Juntar as informações

Use esta lista. O que não tiver, deixe em branco que o Claude pergunta.

**O carro**
- [ ] Marca, modelo e ano
- [ ] Cores (carroceria e interior)
- [ ] Motor, câmbio e parte elétrica
- [ ] Hodômetro (milhas ou km)
- [ ] Onde o carro está (estado/cidade nos EUA)
- [ ] O que já foi feito ou é novo (motor, suspensão, peças…)
- [ ] O que acompanha (chave reserva, manual, documentos de época…)
- [ ] O que precisa de restauração (carroceria, interior, capota…)

**O negócio**
- [ ] Valor de compra + importação (o que está incluso: frete, impostos, despachante, placa preta?)
- [ ] Esse valor é fixo ou varia com o dólar?
- [ ] Valor da restauração e o que entra nela
- [ ] O que é cobrado à parte (personalizações)
- [ ] Prazo de cada fase, em meses (ex.: importação 4, restauração 9)
- [ ] Parcelas: valor de cada uma e em que momento é paga
- [ ] **A soma das parcelas tem de bater com o total**
- [ ] Validade da proposta (ex.: até o carro ser vendido nos EUA)
- [ ] Nome do cliente, ou proposta genérica para vários compradores

**Pesquisa (o Claude faz e mostra as fontes)**
- [ ] Quantos foram fabricados e outros fatos de raridade
- [ ] Se o carro tem mais de 30 anos (regra para importar veículo de coleção)
- [ ] 2 ou 3 anúncios de carros parecidos à venda no Brasil, com link e data

> Números de raridade só entram com fonte. Sem fonte, o texto fica genérico
> ("pouquíssimas unidades no Brasil"), para não arriscar um dado errado.

---

## 2. Separar as fotos

Crie uma pasta para o carro (por exemplo, `OneDrive/Imagens/Nome do Carro`) com
três pastas dentro:

```
hoje/           fotos reais do carro como está hoje
referencias/    fotos de um carro igual já restaurado (tiradas de anúncios)
comparativo/    pares de fotos no mesmo ângulo (veja abaixo)
```

**Fotos de hoje (o que pedir ao vendedor)**
- Frente reta, de três-quartos e lateral, com fundo limpo (o ideal é estúdio)
- Traseira
- Interior visto de cima, painel e volante
- Motor dos dois lados
- Parte de baixo: chassi, suspensão, freios, escapamento
- Porta-malas e itens que acompanham

**Referências**
- Mesmas cores do carro, se possível
- Várias vistas: perfil, frente, traseira, interior, motor, detalhes cromados
- Na página, ficam marcadas como "imagens ilustrativas de referência"

**Comparativo (antes e depois)**
- Escolha de 4 a 6 ângulos: frente, lateral, traseira, interior, motor e,
  se fizer sentido, "com capota"
- Coloque a foto de hoje de cada ângulo como `frente-hoje.jpg`,
  `lateral-hoje.jpg` etc. A melhor de todas vira também `capa-hoje.jpg`
- As versões "novo" (`frente-novo.png`…) saem da etapa 3

---

## 3. Criar as simulações do carro restaurado

O Claude usa o Google AI Studio (Gemini), na sua conta, pelo Chrome. Ele
recria cada foto de hoje com o carro novo, no mesmo ângulo, fundo e luz, para a
barra de arrastar funcionar.

**O que você precisa fazer**
- Estar logado no Google AI Studio no Chrome
- Na primeira vez, aceitar o aviso de termos do AI Studio
- Quando o Chrome perguntar se o AI Studio pode "acessar outros apps e serviços
  neste dispositivo", clicar em **Permitir** (é assim que as imagens chegam ao
  computador)
- **Não fechar as abas do AI Studio** enquanto o Claude estiver trabalhando

**Limites**
- O modelo usado (Nano Banana 2 Lite) tem uma **cota diária**. Se acabar, as
  correções são feitas no próprio computador ou no dia seguinte.
- Modelos pagos só são usados com autorização.
- As fotos enviadas ficam salvas no Google Drive da conta.

**Revisão: o que olhar em cada simulação**

A IA erra detalhes. No Corvette apareceram todos estes:

- [ ] Placa de outro carro copiada da referência
- [ ] Vidro da placa sumido (tampado com tinta)
- [ ] Peça cromada "derretida" ou grudada na carroceria
- [ ] Peça que não existe (ex.: uma alavanca de câmbio a mais)
- [ ] Interior quase igual ao de hoje (não "restaurou")
- [ ] Foto deitada quando a original é em pé
- [ ] Escrita errada (ex.: "Blue Flame" com seta de duas pontas)
- [ ] Marca d'água do Gemini (estrela no canto)
- [ ] Detalhes que o carro não vai ter depois da restauração

Compare sempre com uma foto real do modelo. O que estiver errado, o Claude
corrige ou refaz.

> Na página, as simulações são chamadas de **"simulação digital"**, nunca de
> foto do carro restaurado. Isso evita mal-entendido com o comprador.

---

## 4. Montar a página

Tudo de um carro fica num único arquivo de dados: `_propostas/<nome-do-carro>.json`.
O visual é o mesmo para todas as propostas, então não é preciso mexer em design.

O Claude:
1. Copia o arquivo do Corvette como modelo e preenche com os dados do carro novo
2. Prepara as fotos (tamanho, peso, recortes iguais nos pares)
3. Gera a página e confere sozinho:
   - se as parcelas somam o total
   - se todos os marcos estão dentro do prazo
   - se todas as fotos existem

**Seções da página**

| Seção | Obrigatória? |
|---|---|
| Capa com comparativo "hoje × como vai ficar" | Sim |
| Raridade | Não (quando o carro é raro) |
| Ficha técnica e destaques | Sim |
| Como o carro está hoje (galeria) | Sim |
| Antes e depois (abas) | Não, mas recomendada |
| Como vai ficar (referências) | Não |
| O que está incluso | Sim |
| Valor do projeto | Sim |
| Referência de mercado | Não (quando há anúncios para comparar) |
| Prazos (linha do tempo) | Sim |
| Forma de pagamento | Sim |
| Condições | Sim |
| Quem faz e contato | Sim (automático) |

**Para os textos soarem naturais**
- Frases diretas, como se você estivesse explicando ao cliente na oficina
- Sem exagero e sem slogans vazios
- Mostrar a comparação de preços com números e data, sem adjetivos

---

## 5. Revisar e aprovar

O Claude mostra a página no navegador do app, antes de publicar. Confira:

- [ ] Textos, valores, prazos e parcelas
- [ ] No celular e no computador
- [ ] Todas as abas do antes e depois
- [ ] Galerias sem espaços em branco
- [ ] Títulos e rótulos cabendo nas colunas

Só depois do seu "pode publicar" a página vai para o ar.

---

## 6. Publicar e enviar

- O endereço fica `https://bomsenhorrestauracoes.com.br/proposta/<nome-do-carro>/`
- O site atualiza cerca de 1 minuto depois da publicação
- Ao colar o link no WhatsApp, aparece a foto do carro restaurado e o título
- **Antes de mandar ao cliente, cole o link numa conversa sua** para conferir a prévia

**Se alguém disser que está vendo a versão antiga:** o navegador guarda a
página por até 10 minutos. Peça para atualizar (Ctrl + F5 no computador, ou
fechar e abrir o link no celular). Quando uma foto já publicada é trocada, o
Claude muda a "versão das fotos" para todos receberem a nova na hora.

---

## 7. Depois da venda

Quando o carro for vendido, escolha:
- **Tirar a página do ar**, ou
- **Transformar em caso de restauração** no site (seção Projetos), com as fotos
  reais da restauração no lugar das simulações

---

## Onde fica cada coisa (para referência técnica)

| Arquivo | O que é |
|---|---|
| `_propostas/<carro>.json` | Dados de cada proposta (o único que muda por carro) |
| `_propostas/empresa.json` | Contato e dados da Bomsenhor, usados em todas |
| `_propostas/modelo/` | Visual e funcionamento da página |
| `scripts/preparar-fotos-proposta.py` | Prepara as fotos |
| `scripts/gerar-proposta.mjs` | Gera a página |
| `scripts/receber-imagens-gemini.py` | Recebe as simulações do AI Studio |
| `proposta/<carro>/` | A página publicada e as fotos dela |

A pasta `_propostas/` não é publicada no site. Mas o projeto do site fica num
repositório **público** no GitHub, então qualquer pessoa pode ver esses
arquivos por lá. Não coloque informação sigilosa (custos internos, margens,
dados de clientes) nos arquivos de dados.

**Comandos (para quem for rodar à mão)**

```
python scripts/preparar-fotos-proposta.py <carro> "<pasta das fotos>"
node scripts/gerar-proposta.mjs <carro>
python -m http.server 8080     (prévia em http://localhost:8080/proposta/<carro>/)
```
