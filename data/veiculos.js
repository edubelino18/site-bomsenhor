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
{id:'ford-f350',nome:'Ford F-350 "Dually"',ano:1963,tipo:'carro',status:'disponivel',preco:'R$ 200.000',
motor:'V8 (gasolina)',transmissao:'Manual',
cor:'Verde e Creme',km:'Não informada',procedencia:'Nacional',carroceria:'Pick-up com Plataforma de Madeira',
descricao:'A Ford F-350 de 1963 é um clássico de trabalho pesado e estilo inconfundível. Este exemplar conta com o rodado duplo traseiro "Dually", pintura estilo saia e blusa em verde e creme com ótimo acabamento, além de plataforma traseira com assoalho em madeira, para-lamas largos e rodado duplo.\n\nO interior está impecável, com rádio de época e painel completo, ambos totalmente funcionais. Mecânica toda revisada — motor V8 e caixa de câmbio operando perfeitamente —, pronta para rodar para qualquer lugar do Brasil com documentação em dia.',
destaques:['Motor V8 e caixa revisados','Plataforma com assoalho em madeira','Rodado duplo traseiro','Rádio de época e painel funcionais'],
fotos:['4.jpg','1.jpg','2.jpg','3.jpg','5.jpg','6.jpg','7.jpg','8.jpg','9.jpg','10.jpg','11.jpg','12.jpg','13.jpg'],
bg:bg(10,20,60,40,30,15),destaque:true},
{id:'dkw-vemaguet',nome:'DKW-Vemag Vemaguet',ano:1967,tipo:'carro',status:'disponivel',preco:'R$ 40.000',
motor:'3 cilindros',transmissao:'Manual 4 vel. (alavanca na coluna)',
cor:'Vermelha',km:'Não informada',procedencia:'Nacional',carroceria:'Perua (Station Wagon)',
descricao:'A Vemaguet de 1967 é um verdadeiro clássico da indústria automobilística nacional, em modelo cada vez mais raro e valorizado no mercado de veículos antigos. Um exemplar ideal para quem busca uma base honesta para restauração estética, contando com estrutura funcional e mecânica impecável.\n\nO motor de 3 cilindros e 2 tempos é original, novo e está em perfeitas condições, assim como a caixa de câmbio e o sistema elétrico, ambos inteiramente revisados. O veículo conta com pneus novos, rádio de época, interior em boas condições gerais e roda perfeitamente para qualquer lugar do Brasil.',
destaques:['Motor 2 tempos novo e revisado','Mecânica e elétrica 100% funcionais','Muitas peças e rádio de época originais','Pneus novos e rodando perfeitamente'],
fotos:['1.jpg','2.jpg','3.jpg','4.jpg','5.jpg','6.jpg','7.jpg','8.jpg','9.jpg'],
   bg:bg(40,30,70,50,30,20),destaque:true},
  {id:'jawa-250',nome:'Jawa 250',ano:1954,tipo:'moto',status:'disponivel',preco:'R$ 60.000',
motor:'250cc',transmissao:'Manual 4 vel.',
cor:'Vermelha',km:'Não informada',procedencia:'Importada',carroceria:'Motocicleta',
descricao:'A Jawa 250 de 1954 é um clássico exemplar da engenharia europeia do pós-guerra, combinando elegância e mecânica robusta. Este veículo totalmente original preserva a pintura e os detalhes de época, contando ainda com a chancela da Placa Preta e documentação pronta para transferência imediata.\n\nCom motor monocilíndrico de 2 tempos inteiramente revisado e funcionando perfeitamente, o modelo recebeu diversas peças novas importadas direto da fábrica. Uma raridade impecável, pronta para rodar para qualquer lugar do Brasil.',
destaques:['Placa Preta e documentação em dia','Motor 2 tempos totalmente revisado','100% original com peças importadas de fábrica','Pintura e detalhes de época conservados'],
   fotos:['1.jpg','2.jpg','3.jpg','4.jpg','5.jpg','6.jpg','7.jpg','8.jpg'],
   bg:bg(130,140,35,25,22,15),destaque:false},
  {id:'lambretta-li-150',nome:'Lambretta LI 150',ano:1963,tipo:'moto',status:'disponivel',preco:'R$ 50.000',
motor:'150cc',transmissao:'Manual 4 vel. no punho',
cor:'Não informada',km:'Não informada',procedencia:'Nacional',carroceria:'Scooter',
descricao:'A Lambretta LI 150 de 1963 é uma verdadeira joia do design italiano sobre duas rodas, representando todo o charme e a elegância da era de ouro dos scooters. Este exemplar passou por uma restauração completa de alto nível, mantendo rigorosamente a originalidade e os padrões de fábrica.\n\nCom motor 150cc original funcionando perfeitamente, o veículo conta com a chancela da Placa Preta de coleção e documentação 100% em dia. Como diferencial exclusivo, acompanha um par de capacetes personalizados importados da Itália, estando pronta para rodar para qualquer lugar do Brasil com total segurança.',
destaques:['Placa Preta e documentação em dia','Restauração completa em padrão original','Acompanha par de capacetes italianos','Mecânica 100% revisada e pronta para rodar'],
   fotos:['4.jpg','1.jpg','5.jpg','6.jpg','3.jpg','2.jpg'],
   bg:bg(210,220,60,40,28,18),destaque:true},
  {id:'honda-ml-125',nome:'Honda ML 125',ano:1980,tipo:'moto',status:'disponivel',preco:'R$ 29.900',
motor:'125cc',transmissao:'Manual 5 vel.',
cor:'Azul',km:'Não informada',procedencia:'Nacional',carroceria:'Motocicleta',
descricao:'A Honda ML 125 de 1980 é um dos ícones mais marcantes do motociclismo nacional, destacando-se pelo acabamento refinado e pelo estilo inconfundível do início dos anos 80. Este exemplar foi totalmente restaurado nos rigorosos padrões originais, ostentando a cobiçada Placa Preta de coleção.\n\nA moto conta com preservação impecável de componentes originais, incluindo painel, retrovisores, punhos, lentes, porta-corrente e para-lamas. Com motor e mecânica inteiramente revisados, pneus novos no padrão de fábrica, chave reserva original e documentação pronta para transferência imediata, está 100% pronta para rodar.',
destaques:['Placa Preta de coleção','Restaurada nos padrões originais','Diversos componentes e lentes originais','Pneus novos e chave reserva original'],
   fotos:['1.jpg','2.jpg','3.jpg','4.jpg','5.jpg','6.jpg','7.jpg','8.jpg','9.jpg'],
   bg:bg(28,20,40,30,25,15),destaque:false},
{id:'honda-cbr-450sr',nome:'Honda CBR 450SR',ano:1990,tipo:'moto',status:'disponivel',preco:'R$ 15.000',
motor:'450cc',transmissao:'Manual 6 vel.',
cor:'Azul com Branco',km:'Não informada',procedencia:'Nacional',carroceria:'Motocicleta Esportiva',
descricao:'A Honda CBR 450SR de 1990 é uma lenda entre as esportivas nacionais dos anos 90, famosa pelo seu motor bicilíndrico de 46,5 cv e visual marcante. Este exemplar encontra-se completamente restaurado e certificado com Placa Preta de coleção, atestando seu alto grau de originalidade.\n\nCom pintura em azul e branco, o modelo conta com documentação rigorosamente em dia e mecânica totalmente revisada. Seu motor de 447 cm³ e a transmissão de 6 marchas funcionam perfeitamente, garantindo que a moto siga rodando para qualquer lugar do Brasil com total segurança.',
destaques:['Placa Preta de coleção','Completamente restaurada','Motor bicilíndrico de 46,5 cv totalmente revisado','Documentação em dia e pronta para rodar'],
   fotos:['6.jpg','1.jpg','4.jpg','3.jpg','5.jpg','2.jpg'],
   bg:bg(0,10,5,5,18,12),destaque:false},
  {id:'dodge-polara-1980',nome:'Dodge Polara',ano:1980,tipo:'carro',status:'vendido',preco:'Vendido',
   motor:'1.8L Chrysler l4',transmissao:'Automática de fábrica',
   cor:'Prata',km:'101.700 km originais',procedencia:'Brasil — Gaspar, SC',carroceria:'Cupê 2 portas',
   descricao:'Dodge Polara 1980 automático de fábrica, com interior original e mecânica revisada — é pegar e andar. Quilometragem original compatível com o ano, manual e chave reserva, além de todos os selos e adesivos de inspeção originais preservados.\n\nVeículo encontra-se em Gaspar, SC, mas já entregue pode ser despachado para qualquer lugar do Brasil e do mundo.',
   destaques:['Automático de fábrica','Interior original','Faróis CIBIÉ originais','Calotas originais raríssimas','Todos os frisos preservados','Quilometragem original (101.700 km)','Manual e chave reserva','Selos e adesivos de inspeção originais','Mecânica revisada'],
   fotos:['4.jpg','5.jpg','6.jpg','7.jpg','8.jpg','9.jpg','10.jpg','11.jpg','12.jpg','13.jpg'],
   bg:bg(210,215,10,8,55,45),destaque:false}
];
