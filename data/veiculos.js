// ============================================================
// VEÍCULOS DO ACERVO
// ============================================================
// COMO ADICIONAR um veículo novo:
//   1. Copie um bloco inteiro (da { até a } que fecha ele).
//   2. Cole no final, antes do "];".
//   3. Troque o "id" (sem espaços/acentos, ex: 'puma-gte-1980').
//   4. Preencha os campos de texto.
//   5. Se já tiver fotos, veja "FOTOS" abaixo. Se não tiver ainda,
//      pode deixar fotos:[] e apagar ou deixar a linha "bg:" — o
//      site mostra uma cor no lugar da foto até você adicionar uma.
//
// COMO REMOVER um veículo:
//   Apague o bloco inteiro dele (da { até a }).
//
// FOTOS:
//   Crie uma pasta em images/acervo/<id>/ (mesmo nome do "id" do
//   veículo) e coloque as fotos dentro, com qualquer nome de
//   arquivo. Depois liste os nomes dos arquivos no campo "fotos",
//   na ordem que quiser que apareçam. A primeira da lista é usada
//   como foto de capa (no card e no topo da página do veículo).
//   Exemplo:
//     fotos:['frente.jpg','lateral.jpg','interior.jpg']
// ============================================================
const VEICULOS=[
  {id:'ford-galaxie-500',nome:'Ford Galaxie 500',ano:1964,tipo:'carro',status:'disponivel',preco:'R$ 185.000',
   motor:'V8 390 ci (6.4L) Thunderbird High Performance',transmissao:'Automática Cruise-O-Matic 3 vel.',
   cor:'Vermelho Granada',km:'87.400 milhas originais',procedencia:'EUA — Georgia',carroceria:'Hardtop Fastback',
   descricao:'O Galaxie 500 de 1964 representa o ápice do design americano da era pré-muscle car. Este exemplar chega dos EUA com documentação completa de procedência e apenas 87 mil milhas originais.\n\nA pintura em Vermelho Granada foi restaurada mantendo a fórmula Ford original, e o interior em couro preto está em condição impecável. O motor 390 FE responde com toda a força que tornou esse modelo lendário.',
   destaques:['Documentação original EUA','Interior couro original','Direção hidráulica','Freios a disco dianteiros'],
   fotos:[],
   bg:bg(10,20,60,40,30,15),destaque:true},
  {id:'chevrolet-opala-ss',nome:'Chevrolet Opala SS',ano:1975,tipo:'carro',status:'disponivel',preco:'R$ 98.000',
   motor:'2.5L 4 cilindros original',transmissao:'Manual 4 marchas',cor:'Amarelo Ocre',km:'112.000 km',
   procedencia:'Brasil — São Paulo',carroceria:'Coupé',
   descricao:'O Opala SS 1975 é um dos símbolos mais amados do automobilismo brasileiro. Permaneceu em família por décadas antes de passar por restauração que preservou toda a identidade original.\n\nA pintura Amarelo Ocre é a cor de fábrica original, verificada por plaqueta no compartimento do motor. Mecânica revisada com peças originais GM.',
   destaques:['Cor original verificada','Documentação completa','Mecânica revisada','Interiores preservados'],
   fotos:[],
   bg:bg(40,30,70,50,30,20),destaque:true},
  {id:'vw-fusca-1972',nome:'VW Fusca',ano:1972,tipo:'carro',status:'disponivel',preco:'R$ 62.000',
   motor:'1.6L ar — 50 cv',transmissao:'Manual 4 marchas',cor:'Verde Scala',km:'68.200 km',
   procedencia:'Brasil — Minas Gerais',carroceria:'Sedan',
   descricao:'Um Fusca 1972 neste estado de conservação é cada vez mais raro. Com apenas 68 mil quilômetros verificados e toda a pintura original presente, este exemplar é uma cápsula do tempo.\n\nO motor 1600 foi revisado com peças originais e os cromados estão em ótimo estado.',
   destaques:['Pintura original preservada','Cromados excelentes','Motor revisado','Borrachas novas'],
   fotos:[],
   bg:bg(130,140,35,25,22,15),destaque:false},
  {id:'honda-cb400',nome:'Honda CB 400',ano:1979,tipo:'moto',status:'disponivel',preco:'R$ 28.000',
   motor:'395cc DOHC 4 cilindros',transmissao:'Manual 6 marchas',cor:'Azul Kandari',km:'32.000 km',
   procedencia:'Japão — importação',carroceria:'Standard',
   descricao:'A Honda CB 400 Four é o objeto de culto das motos clássicas. Este exemplar veio diretamente do Japão com documentação original e está em condição excepcional.\n\nO 4 cilindros em linha funciona com toda a suavidade característica. Cromas impecáveis e tapeçaria de fábrica.',
   destaques:['Importada do Japão','Documentação original','Motor perfeito','Carenagem original'],
   fotos:[],
   bg:bg(210,220,60,40,28,18),destaque:true},
  {id:'ford-maverick-1974',nome:'Ford Maverick',ano:1974,tipo:'carro',status:'vendido',preco:'Vendido',
   motor:'4.1L 6 cilindros',transmissao:'Automática',cor:'Marrom Metalizado',km:'94.000 km',
   procedencia:'Brasil — Rio de Janeiro',carroceria:'Sedan',
   descricao:'Maverick 1974 restaurado com maestria. Este exemplar passou por restauração completa de mecânica, funilaria e pintura antes de encontrar seu novo proprietário.',
   destaques:['Restauração completa','Mecânica recondicionada'],
   fotos:[],
   bg:bg(28,20,40,30,25,15),destaque:false},
  {id:'honda-cb450',nome:'Honda CB 450',ano:1978,tipo:'moto',status:'projeto',preco:'Consultar',
   motor:'444cc DOHC 2 cilindros',transmissao:'Manual 5 marchas',cor:'Prata/Preto (em restauração)',km:'Em restauração',
   procedencia:'Brasil',carroceria:'Standard',
   descricao:'Honda CB 450 Black Bomber em processo de restauração completa. Motor revisado, funilaria em execução. Previsão de conclusão: 90 dias.',
   destaques:['Motor revisado','Projeto em andamento'],
   fotos:[],
   bg:bg(0,10,5,5,18,12),destaque:false},
  {id:'dodge-polara-1980',nome:'Dodge Polara',ano:1980,tipo:'carro',status:'vendido',preco:'Vendido',
   motor:'A CONFIRMAR',transmissao:'Automática de fábrica',
   cor:'Prata',km:'101.700 km originais',procedencia:'Brasil — Gaspar, SC',carroceria:'Cupê 2 portas',
   descricao:'Dodge Polara 1980 automático de fábrica, com interior original e mecânica revisada — é pegar e andar. Quilometragem original compatível com o ano, manual e chave reserva, além de todos os selos e adesivos de inspeção originais preservados.\n\nVeículo encontra-se em Gaspar, SC, mas já entregue pode ser despachado para qualquer lugar do Brasil e do mundo.',
   destaques:['Automático de fábrica','Interior original','Faróis CIBIÉ originais','Calotas originais raríssimas','Todos os frisos preservados','Quilometragem original (101.700 km)','Manual e chave reserva','Selos e adesivos de inspeção originais','Mecânica revisada'],
   fotos:[],
   bg:bg(210,215,10,8,55,45),destaque:false}
];
