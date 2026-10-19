// ============================================================
// PROJETOS DE RESTAURAÇÃO
// ============================================================
// IMPORTANTE: depois de editar este arquivo (ou de adicionar fotos
// novas em images/projetos/), rode nesta ordem:
//   python scripts/optimize-photos.py   (redimensiona/comprime fotos)
//   node scripts/generate-pages.mjs     (gera as páginas de cada projeto + sitemap.xml)
// Sem isso, a página pública daquele projeto fica desatualizada ou
// com fotos pesadas, mesmo que o site "ao vivo" já mostre o dado novo.
// O generate-pages.mjs já roda scripts/validate-photos.mjs sozinho
// antes de gerar: ele corrige fotos com extensão em MAIÚSCULA (que
// funcionam no Windows mas quebram no site publicado) e avisa se
// alguma foto listada aqui não existir em disco.
//
// COMO ADICIONAR um projeto novo:
//   1. Copie um bloco inteiro (da { até a } que fecha ele).
//   2. Cole no final, antes do "];".
//   3. Troque o "id" (sem espaços/acentos, ex: 'fusca-1970').
//   4. Preencha os campos de texto e as "etapas" (o passo a passo
//      que aparece na página do projeto). Cada etapa tem um campo
//      "status": 'concluida', 'atual' ou 'futura' — controla o
//      destaque visual na linha do tempo (etapa atual em destaque,
//      futuras esmaecidas). Num projeto já concluído, todas as
//      etapas ficam 'concluida'.
//   5. Veja "FOTOS" abaixo pra colocar as fotos do projeto.
//
// COMO REMOVER um projeto:
//   Apague o bloco inteiro dele (da { até a }).
//
// FOTOS:
//   Crie uma pasta em images/projetos/<id>/ (mesmo nome do "id" do
//   projeto) e coloque as fotos dentro, com qualquer nome de
//   arquivo. Depois liste os nomes dos arquivos no campo "fotos",
//   na ordem que quiser que apareçam. A primeira da lista é usada
//   como foto de capa (no card e no topo da página do projeto).
//   "tipo" é o tipo de serviço (aparece como etiqueta no card e na
//   ficha do projeto), ex.: 'Restauração completa', 'Reparo'.
//
//   Exemplo:
//     fotos:['antes.jpg','pintura.jpg','pronto.jpg']
//   Legendas (opcional): para mostrar um texto embaixo de cada foto
//   (e na foto ampliada), adicione "legendas" na mesma ordem de
//   "fotos". Foto sem legenda: deixe '' na posição dela.
//   Exemplo:
//     legendas:['Como chegou à oficina','Após a pintura','Pronto']
// ============================================================
const PROJETOS=[
  {id:'cadillac-deville-1957',nome:'Cadillac DeVille Coupé',ano:1957,status:'andamento',duracao:'Previsão: 1 ano e meio',
   tipo:'Importação + restauração',
   descricao:'Parado havia mais de seis anos em um galpão, este Cadillac DeVille Coupé 1957 já tinha passado por uma restauração anterior e rodado por alguns lugares antes de chegar à Bomsenhor. Chegou sem motor, sem câmbio, sem vidros, sem interior e, principalmente, sem as peças de acabamento.\n\nComprar tudo peça por peça, nos EUA e no Brasil, sairia caro. A solução foi importar dos EUA um carro doador completo, cerca de 40% mais barato para o cliente. Enquanto o doador faz a viagem até Itajaí, a carroceria original avança na funilaria aqui em Gaspar.',
   fotos:['carroceria-1.jpg','carroceria-2.jpg','doador-1.jpg','doador-2.jpg','doador-motor.jpg','doador-interior.jpg','doador-bancos.jpg'],
   legendas:['A carroceria do cliente como chegou à Bomsenhor, ainda com a pintura bordô da restauração anterior',
     'Vista de cima: a carroceria chegou sem motor, câmbio, vidros e interior',
     'O doador completo nos EUA, antes da importação',
     'Doador de frente: grade, cromados e acabamentos que serão aproveitados',
     'Cofre do doador: motor e componentes completos, justamente o que faltava na carroceria do cliente',
     'Interior do doador: painel, volante, forros de porta e banco dianteiro, base para a restauração do interior',
     'Bancos traseiros do doador: estrutura e acabamentos originais para a tapeçaria'],
   bg:bg(330,320,40,30,30,20),
   etapas:[
     {num:'01',titulo:'Avaliação e orçamento comparativo',data:'Concluída',desc:'Levantamento de todas as peças necessárias, nos EUA e no Brasil, comparado ao custo de importar um carro doador completo. O doador saiu cerca de 40% mais barato.',status:'concluida'},
     {num:'02',titulo:'Compra do carro doador',data:'Concluída',desc:'Negociação e compra, nos EUA, de um Cadillac DeVille Coupé 1957 completo.',status:'concluida'},
     {num:'03',titulo:'Preparação da carroceria',data:'Concluída',desc:'Lavagem e desmontagem, chassi lixado e com fundo, e remoção de todas as camadas de tinta e de produtos de funilaria da cabine.',status:'concluida'},
     {num:'04',titulo:'Funilaria da carroceria',data:'Em andamento',desc:'Correção de toda a funilaria da cabine, deixando a carroceria pronta para a pintura antes da chegada do doador.',status:'atual'},
     {num:'05',titulo:'Importação e desmontagem do doador',data:'Chegada prevista: dez/2026',desc:'Transporte até o armazém parceiro na Flórida, embarque em Miami e chegada em Itajaí. Na oficina, o doador é desmontado e as peças são separadas para restauro, cromagem, revisão mecânica e tapeçaria.',status:'futura'},
     {num:'06',titulo:'Pintura, montagem e acabamentos',data:'A seguir',desc:'Pintura da carroceria, restauro das peças do doador e montagem completa, com mecânica revisada, cromados e tapeçaria.',status:'futura'},
     {num:'07',titulo:'Entrega',data:'Previsão: 1 ano e meio no total',desc:'Entrega do Cadillac restaurado ao cliente.',status:'futura'}
   ]},
  {id:'mercedes-slk-200-2006',nome:'Mercedes-Benz SLK 200 Cabriolet',ano:2006,status:'andamento',duracao:'Previsão: 3 a 5 meses',servico:'reparo',
   tipo:'Reparo + peças importadas',
   descricao:'Nem todo projeto é uma restauração completa. Esta Mercedes-Benz SLK 200 Cabriolet 2006, um modelo raro no mercado nacional, estava parada havia meses depois de uma batida na frente: o dono não encontrava ninguém disposto a assumir o reparo de um carro tão exclusivo.\n\nA Bomsenhor orçou o reparo do para-choque, do capô e do para-lama e também a importação das peças que não existem por aqui (grade, emblema e farol), vindas da Alemanha e dos EUA. Neste momento as peças da carroceria estão sendo restauradas na oficina. A importação leva de 30 a 45 dias, e o prazo total estimado do projeto é de 3 a 5 meses, dependendo da chegada das peças.',
   fotos:['antes-frente.jpg','antes-lateral-esquerda.jpg','antes-lateral-direita.jpg','depois.jpg'],
   legendas:['','','','O carro antes da batida, em foto antiga'],
   bg:bg(220,215,10,8,18,12),
   etapas:[
     {num:'01',titulo:'Avaliação e orçamento',data:'Concluída',desc:'Avaliação dos danos na frente e orçamento do reparo do para-choque, do capô e do para-lama, junto com o orçamento de importação das peças necessárias.',status:'concluida'},
     {num:'02',titulo:'Restauração das peças da carroceria',data:'Em andamento',desc:'Recuperação do para-choque, do capô e do para-lama na oficina.',status:'atual'},
     {num:'03',titulo:'Importação das peças',data:'30 a 45 dias',desc:'Grade, emblema e farol originais, vindos da Alemanha e dos EUA.',status:'futura'},
     {num:'04',titulo:'Montagem e acabamento',data:'Após a chegada das peças',desc:'Pintura, instalação das peças importadas e acabamento final.',status:'futura'},
     {num:'05',titulo:'Entrega',data:'Previsão: 3 a 5 meses no total',desc:'Entrega do carro ao cliente com a frente refeita e as peças originais instaladas.',status:'futura'}
   ]},
  {id:'cadillac-eldorado-brougham-1958',nome:'Cadillac Eldorado Brougham',ano:1958,status:'concluido',duracao:'Cerca de 1 ano',
   tipo:'Finalização de restauração',
   descricao:'O Cadillac Eldorado Brougham está entre os carros mais exclusivos que a Cadillac já produziu. Montado praticamente à mão entre 1957 e 1958, teve apenas 704 unidades fabricadas e, na época, custava mais que um Rolls-Royce. Estima-se que restem menos de mil exemplares nesse estado no mundo e menos de cinco no Brasil.\n\nPor fora, tem teto em aço inoxidável escovado, quatro portas sem coluna central, com as traseiras de abertura invertida, faróis duplos e para-choques cromados com os característicos “Dagmars”. Por baixo, motor V8 de 365 polegadas cúbicas, câmbio automático Hydra-Matic e suspensão a ar. Por dentro, bancos em couro, vidros elétricos e o Autronic Eye, um sensor no painel que alternava sozinho entre farol alto e baixo.\n\nEste exemplar passou mais de 15 anos em processo de restauração antes de chegar à Bomsenhor. O proprietário enfrentou muitos problemas e nunca chegou a rodar com o carro. Em cerca de um ano, fizemos a revisão e a manutenção elétrica e mecânica, a repintura de componentes externos e a finalização dos acabamentos internos e externos. Concluído, o Eldorado seguiu direto para uma empresa da região especializada na compra e venda de clássicos exclusivos.',
   resultado:'Depois de mais de 15 anos parado em restauração, o Eldorado Brougham voltou a rodar e seguiu para o mercado de clássicos exclusivos.',
   fotos:['frente-34.jpg','lateral.jpg','frente.jpg','traseira.jpg','farois.jpg','frente-detalhe.jpg','roda.jpg','motor.jpg','interior.jpg','banco-dianteiro.jpg','porta.jpg','macaneta.jpg','vidros.jpg','painel.jpg','indicadores.jpg','autronic-eye.jpg','ao-volante.jpg'],
   bg:bg(210,200,10,8,20,12),
   etapas:[
     {num:'01',titulo:'Avaliação do projeto',data:'—',desc:'O carro chegou depois de mais de 15 anos em processo de restauração, sem nunca ter rodado. Levantamento completo de tudo o que faltava concluir.',status:'concluida'},
     {num:'02',titulo:'Revisão e manutenção mecânica',data:'—',desc:'Revisão e manutenção de toda a mecânica para colocar o carro em funcionamento.',status:'concluida'},
     {num:'03',titulo:'Revisão e manutenção elétrica',data:'—',desc:'Revisão e manutenção de todo o sistema elétrico.',status:'concluida'},
     {num:'04',titulo:'Repintura de componentes externos',data:'—',desc:'Repintura dos componentes externos que ainda precisavam de acabamento.',status:'concluida'},
     {num:'05',titulo:'Acabamentos internos e externos',data:'—',desc:'Finalização de todos os acabamentos, por dentro e por fora.',status:'concluida'},
     {num:'06',titulo:'Entrega',data:'—',desc:'Veículo concluído após cerca de um ano de trabalho, seguindo para uma empresa especializada em clássicos exclusivos.',status:'concluida'}
   ]},
  {id:'cadillac-fleetwood-1948',nome:'Cadillac Fleetwood Series 62',ano:1948,status:'concluido',duracao:'8 meses',
   tipo:'Acabamentos e revisão',
   descricao:'Restauração completa do Cadillac Fleetwood Series 62 1948, em Azul Escuro, com cromados polidos, para-choques triplos característicos da época, ornamento "Flying Lady" no capô e estepe exposto no porta-malas. Interior revestido em tecido azul-claro.\n\nForam feitos todos os acabamentos de montagem final, bem como revisão mecânica e elétrica completa.',
   resultado:'Restauração concluída com acabamentos de montagem final e revisão mecânica e elétrica completa.',
   fotos:['1.jpg','2.jpg','3.jpg','4.jpg','5.jpg','6.jpg','7.jpg','8.jpg','9.jpg','10.jpg','11.jpg'],
   bg:bg(210,215,55,45,25,15),
   etapas:[
     {num:'01',titulo:'Acabamentos de montagem final',data:'—',desc:'Ajustes finais de carroceria, cromados e acabamentos para devolver o padrão original de montagem.',status:'concluida'},
     {num:'02',titulo:'Revisão mecânica e elétrica',data:'—',desc:'Revisão completa da mecânica e do sistema elétrico do veículo.',status:'concluida'},
     {num:'03',titulo:'Entrega',data:'—',desc:'Veículo entregue ao cliente após 8 meses de trabalho.',status:'concluida'}
   ]}
];
