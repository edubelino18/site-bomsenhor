// ============================================================
// PROJETOS DE RESTAURAÇÃO
// ============================================================
// COMO ADICIONAR um projeto novo:
//   1. Copie um bloco inteiro (da { até a } que fecha ele).
//   2. Cole no final, antes do "];".
//   3. Troque o "id" (sem espaços/acentos, ex: 'fusca-1970').
//   4. Preencha os campos de texto e as "etapas" (o passo a passo
//      que aparece na página do projeto).
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
//   Exemplo:
//     fotos:['antes.jpg','pintura.jpg','pronto.jpg']
// ============================================================
const PROJETOS=[
  {id:'cadillac-deville-1967',nome:'Cadillac DeVille',ano:1967,status:'concluido',duracao:'8 meses',
   cliente:'Colecionador particular',
   descricao:'O Cadillac DeVille 1967 chegou ao nosso ateliê com funilaria comprometida por décadas e pintura em camadas. O desafio era devolver a elegância que tornou o DeVille o símbolo de status americano.\n\nApós oito meses de trabalho meticuloso, saiu restaurado com a cor original Arctic White, interiores em couro branco com detalhes dourados e mecânica recondicionada ao padrão de fábrica.',
   resultado:'Restauração para nível de show car. Premiado em concurso de elegância regional.',
   fotos:[],
   bg:bg(210,200,10,8,20,12),
   etapas:[
     {num:'01',titulo:'Desmontagem completa',data:'Jan–Fev 2024',desc:'Remoção total da carroceria, documentação fotográfica de cada peça e avaliação estrutural do chassi.'},
     {num:'02',titulo:'Funilaria e estrutura',data:'Mar–Abr 2024',desc:'Recuperação da lataria com chapas de calibre idêntico ao original. Solda TIG em pontos críticos.'},
     {num:'03',titulo:'Pintura Arctic White',data:'Mai 2024',desc:'Preparação com primer epóxi, 4 demãos de base e 6 de verniz de alto brilho na cor original.'},
     {num:'04',titulo:'Mecânica e revisão',data:'Jun–Jul 2024',desc:'Revisão completa do V8 472 ci, transmissão Turbo Hydra-Matic, suspensão e freios.'},
     {num:'05',titulo:'Interiores e entrega',data:'Ago 2024',desc:'Tapeçaria em couro branco costurada à mão seguindo padrões originais Cadillac. Entrega ao cliente.'}
   ]},
  {id:'dodge-charger-1970',nome:'Dodge Charger R/T',ano:1970,status:'concluido',duracao:'6 meses',
   cliente:'Colecionador — Joinville, SC',
   descricao:'O Charger R/T 1970 chegou com motor trocado e pintura não original. A missão: devolver o Hemi Orange original, instalar bloco 440 Magnum de números correspondentes e restabelecer a autenticidade.\n\nUm dos muscle cars mais procurados do mercado, hoje devolvido ao seu estado correto de especificação.',
   resultado:'Devolvido ao estado original com motor de números correspondentes.',
   fotos:[],
   bg:bg(18,10,80,60,30,18),
   etapas:[
     {num:'01',titulo:'Auditoria de autenticidade',data:'Set 2023',desc:'Decodificação do VIN, verificação da plaqueta e mapeamento de todas as deviações da especificação original.'},
     {num:'02',titulo:'Busca do motor original',data:'Out 2023',desc:'Localização nos EUA de bloco 440 Magnum com números correspondentes ao padrão de fábrica.'},
     {num:'03',titulo:'Funilaria e pintura',data:'Nov–Dez 2023',desc:'Retorno à cor Hemi Orange B5 original com preparação à base de solvente e poliuretano de alta durabilidade.'},
     {num:'04',titulo:'Mecânica e entrega',data:'Jan–Fev 2024',desc:'Instalação do motor, revisão da transmissão 4 velocidades e ajuste fino de toda a mecânica.'}
   ]},
  {id:'indian-scout-1948',nome:'Indian Scout',ano:1948,status:'concluido',duracao:'10 meses',
   cliente:'Museu particular — Blumenau, SC',
   descricao:'Uma das restaurações mais desafiadoras: um Indian Scout 1948 após mais de 30 anos em depósito. A moto chegou completa mas inutilizável.\n\nO trabalho envolveu pesquisa histórica intensa para manter cada detalhe fiel ao período, incluindo técnicas de esmaltagem da época.',
   resultado:'Peça museal em estado de show. Exposta no Museu do Automóvel de Blumenau.',
   fotos:[],
   bg:bg(30,22,50,35,25,15),
   etapas:[
     {num:'01',titulo:'Catalogação e pesquisa',data:'Jan–Mar 2023',desc:'Documentação fotográfica completa, pesquisa histórica em arquivos americanos e catalogação de cada peça.'},
     {num:'02',titulo:'Usinagem de peças',data:'Abr–Jun 2023',desc:'Fabricação de peças inexistentes por usinagem CNC a partir de moldes ou referências originais.'},
     {num:'03',titulo:'Motor e transmissão',data:'Jul–Set 2023',desc:'Reconstrução completa do twin-V 45ci, incluindo usinagem de sedes de válvulas e retífica do bloco.'},
     {num:'04',titulo:'Pintura e douração',data:'Out–Nov 2023',desc:'Vermelho Indian com faixas douradas em esmalte vitrificado seguindo técnica da época.'}
   ]},
  {id:'ford-f100-1956',nome:'Ford F-100',ano:1956,status:'andamento',duracao:'Previsto: 7 meses',
   cliente:'Colecionador — Florianópolis, SC',
   descricao:'A Ford F-100 1956 chegou com chassi sólido mas carroceria com oxidação extensa. O projeto envolve restauração completa mantendo mecânica original e atualização discreta do sistema elétrico.\n\nEtapa atual: funilaria em execução.',
   resultado:'Em andamento — etapa atual: funilaria.',
   fotos:[],
   bg:bg(200,210,50,35,22,14),
   etapas:[
     {num:'01',titulo:'Desmontagem e diagnóstico',data:'Mar 2025 ✓',desc:'Chassi aprovado. Carroceria com oxidação moderada catalogada. Plano de restauração aprovado pelo cliente.'},
     {num:'02',titulo:'Funilaria',data:'Abr–Jun 2025 (atual)',desc:'Recuperação das asas dianteiras e caixa de carga. Em execução.'},
     {num:'03',titulo:'Pintura',data:'Jul 2025',desc:'Retorno à cor original Tropical Coral com técnica a pistola de alta transferência.'},
     {num:'04',titulo:'Mecânica e entrega',data:'Ago 2025',desc:'Revisão do inline-6, atualização elétrica e entrega ao proprietário.'}
   ]},
  {id:'chevrolet-bel-air-1957',nome:'Chevrolet Bel Air',ano:1957,status:'andamento',duracao:'Previsto: 9 meses',
   cliente:'Colecionador — São Paulo, SP',
   descricao:'O Bel Air 1957 é o carro de colecionador americano mais reconhecível no mundo. Este chegou com motor não original e necessidade de restauração completa.\n\nEtapa atual: busca de motor Small-Block 283 de números correspondentes nos EUA.',
   resultado:'Em andamento — busca de motor original.',
   fotos:[],
   bg:bg(345,355,60,40,28,18),
   etapas:[
     {num:'01',titulo:'Auditoria e planejamento',data:'Mai 2025 ✓',desc:'VIN decodificado. Cores confirmadas: Matador Red / Colonial Cream. Motor atual não original catalogado.'},
     {num:'02',titulo:'Busca do motor original',data:'Jun–Jul 2025 (atual)',desc:'Pesquisa ativa nos EUA por bloco 283 V8 Power Pack de números correspondentes.'},
     {num:'03',titulo:'Funilaria e pintura',data:'Ago–Out 2025',desc:'Restauração completa da carroceria e combinação bicolor original.'},
     {num:'04',titulo:'Mecânica e entrega',data:'Nov–Jan 2026',desc:'Instalação do motor original, revisão completa e entrega.'}
   ]},
  {id:'cadillac-fleetwood-1948',nome:'Cadillac Fleetwood Series 62',ano:1948,status:'concluido',duracao:'8 meses',
   cliente:'Confidencial',
   descricao:'Restauração completa do Cadillac Fleetwood Series 62 1948, em Azul Escuro, com cromados polidos, para-choques triplos característicos da época, ornamento "Flying Lady" no capô e estepe exposto no porta-malas. Interior revestido em tecido azul-claro.\n\nForam feitos todos os acabamentos de montagem final, bem como revisão mecânica e elétrica completa.',
   resultado:'Restauração concluída com acabamentos de montagem final e revisão mecânica e elétrica completa.',
   fotos:[],
   bg:bg(210,215,55,45,25,15),
   etapas:[
     {num:'01',titulo:'Acabamentos de montagem final',data:'—',desc:'Ajustes finais de carroceria, cromados e acabamentos para devolver o padrão original de montagem.'},
     {num:'02',titulo:'Revisão mecânica e elétrica',data:'—',desc:'Revisão completa da mecânica e do sistema elétrico do veículo.'},
     {num:'03',titulo:'Entrega',data:'—',desc:'Veículo entregue ao cliente após 8 meses de trabalho.'}
   ]}
];
