import type { MenuItem, CrustOption, ExtraOption } from '../../src/types/index.ts';

export const MENU_ITEMS: MenuItem[] = [
  // --- TRADICIONAIS ---
  {
    id: 'pizza-calabresa',
    name: 'Calabresa Especial Gordeixo\'s',
    category: 'tradicionais',
    description: 'Molho de tomate artesanal italiano pelati, fatias nobres de calabresa defumada artesanalmente, cebola roxa fresca fatiada fininha, azeitonas pretas chilenas e orégano.',
    basePrice: 59.90,
    image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80',
    isPizza: true,
    popular: true,
    tags: ['Mais Pedido', 'Forno a Lenha'],
    sizes: [
      { id: 'media', name: 'Média (6 fatias - 30cm)', slices: 6, price: 59.90, description: 'Ideal para 2 pessoas' },
      { id: 'grande', name: 'Grande (8 fatias - 35cm)', slices: 8, price: 74.90, description: 'Ideal para 3 a 4 pessoas' },
      { id: 'familia', name: 'Família (12 fatias - 40cm)', slices: 12, price: 89.90, description: 'Ideal para 5 a 6 pessoas' }
    ]
  },
  {
    id: 'pizza-marguerita',
    name: 'Marguerita Clássica 1986',
    category: 'tradicionais',
    description: 'Molho rústico de tomate pelati, generosa camada de mussarela de búfala e mussarela tradicional derretida, rodelas de tomate caqui, folhas frescas de manjericão gigante da horta e azeite extravirgem.',
    basePrice: 58.90,
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    isPizza: true,
    popular: true,
    vegetarian: true,
    tags: ['Vegetariana', 'Receita Original'],
    sizes: [
      { id: 'media', name: 'Média (6 fatias - 30cm)', slices: 6, price: 58.90, description: 'Ideal para 2 pessoas' },
      { id: 'grande', name: 'Grande (8 fatias - 35cm)', slices: 8, price: 72.90, description: 'Ideal para 3 a 4 pessoas' },
      { id: 'familia', name: 'Família (12 fatias - 40cm)', slices: 12, price: 86.90, description: 'Ideal para 5 a 6 pessoas' }
    ]
  },
  {
    id: 'pizza-mussarela',
    name: 'Mussarela Tradicional da Casa',
    category: 'tradicionais',
    description: 'Molho de tomate fresco temperado, 400g de queijo mussarela especial derretido no forno a lenha, rodelas suculentas de tomate e orégano.',
    basePrice: 54.90,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
    isPizza: true,
    vegetarian: true,
    tags: ['Clássico', 'Vegetariana'],
    sizes: [
      { id: 'media', name: 'Média (6 fatias - 30cm)', slices: 6, price: 54.90, description: 'Ideal para 2 pessoas' },
      { id: 'grande', name: 'Grande (8 fatias - 35cm)', slices: 8, price: 68.90, description: 'Ideal para 3 a 4 pessoas' },
      { id: 'familia', name: 'Família (12 fatias - 40cm)', slices: 12, price: 82.90, description: 'Ideal para 5 a 6 pessoas' }
    ]
  },
  {
    id: 'pizza-portuguesa',
    name: 'Portuguesa Carioca & Candanga',
    category: 'tradicionais',
    description: 'Molho de tomate artesanal, mussarela, presunto cozido magro desfiado, ovos cozidos picadinhos, cebola roxa crocante, ervilhas frescas, azeitonas pretas e orégano.',
    basePrice: 62.90,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    isPizza: true,
    popular: true,
    tags: ['Sucesso da Casa', 'Tradicional'],
    sizes: [
      { id: 'media', name: 'Média (6 fatias - 30cm)', slices: 6, price: 62.90, description: 'Ideal para 2 pessoas' },
      { id: 'grande', name: 'Grande (8 fatias - 35cm)', slices: 8, price: 77.90, description: 'Ideal para 3 a 4 pessoas' },
      { id: 'familia', name: 'Família (12 fatias - 40cm)', slices: 12, price: 92.90, description: 'Ideal para 5 a 6 pessoas' }
    ]
  },
  {
    id: 'pizza-frango-catupiry',
    name: 'Frango Desfiado com Catupiry® Original',
    category: 'tradicionais',
    description: 'Peito de frango selecionado, cozido lentamente e desfiado com temperos caseiros da vovó, coberto com o autêntico requeijão cremoso Catupiry® e milho verde tenro.',
    basePrice: 64.90,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    isPizza: true,
    popular: true,
    tags: ['Catupiry® Original', 'Top Vendas'],
    sizes: [
      { id: 'media', name: 'Média (6 fatias - 30cm)', slices: 6, price: 64.90, description: 'Ideal para 2 pessoas' },
      { id: 'grande', name: 'Grande (8 fatias - 35cm)', slices: 8, price: 79.90, description: 'Ideal para 3 a 4 pessoas' },
      { id: 'familia', name: 'Família (12 fatias - 40cm)', slices: 12, price: 94.90, description: 'Ideal para 5 a 6 pessoas' }
    ]
  },

  // --- ESPECIAIS ---
  {
    id: 'pizza-carne-sol-cerrado',
    name: 'Carne de Sol do Cerrado com Queijo Coalho',
    category: 'especiais',
    description: 'Homenagem a Brasília: deliciosa carne de sol desfiada e puxada na manteiga de garrafa, queijo coalho grelhado em cubos, cebola caramelizada, pimenta biquinho suave e toque de cheiro-verde.',
    basePrice: 69.90,
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80',
    isPizza: true,
    popular: true,
    tags: ['Sabor de Brasília', 'Exclusividade'],
    sizes: [
      { id: 'media', name: 'Média (6 fatias - 30cm)', slices: 6, price: 69.90, description: 'Ideal para 2 pessoas' },
      { id: 'grande', name: 'Grande (8 fatias - 35cm)', slices: 8, price: 86.90, description: 'Ideal para 3 a 4 pessoas' },
      { id: 'familia', name: 'Família (12 fatias - 40cm)', slices: 12, price: 102.90, description: 'Ideal para 5 a 6 pessoas' }
    ]
  },
  {
    id: 'pizza-file-mignon-gourmet',
    name: 'Filé Mignon ao Alho Negro & Catupiry',
    category: 'especiais',
    description: 'Iscas tenras de filé mignon grelhadas no azeite de ervas, mussarela de búfala, gotas generosas de Catupiry®, lâminas crocantes de alho tostado e chimichurri fresco.',
    basePrice: 72.90,
    image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=800&q=80',
    isPizza: true,
    tags: ['Premium', 'Chef Sugere'],
    sizes: [
      { id: 'media', name: 'Média (6 fatias - 30cm)', slices: 6, price: 72.90, description: 'Ideal para 2 pessoas' },
      { id: 'grande', name: 'Grande (8 fatias - 35cm)', slices: 8, price: 89.90, description: 'Ideal para 3 a 4 pessoas' },
      { id: 'familia', name: 'Família (12 fatias - 40cm)', slices: 12, price: 108.90, description: 'Ideal para 5 a 6 pessoas' }
    ]
  },
  {
    id: 'pizza-quatro-queijos-nobre',
    name: 'Quatro Queijos Nobres',
    category: 'especiais',
    description: 'Mussarela premium, Gorgonzola italiano dolce, Provolone defumado em lenha nobre, Catupiry® legítimo e finalizado com nozes crocantes picadas.',
    basePrice: 66.90,
    image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=800&q=80',
    isPizza: true,
    vegetarian: true,
    tags: ['Queijos Nobres', 'Vegetariana'],
    sizes: [
      { id: 'media', name: 'Média (6 fatias - 30cm)', slices: 6, price: 66.90, description: 'Ideal para 2 pessoas' },
      { id: 'grande', name: 'Grande (8 fatias - 35cm)', slices: 8, price: 82.90, description: 'Ideal para 3 a 4 pessoas' },
      { id: 'familia', name: 'Família (12 fatias - 40cm)', slices: 12, price: 98.90, description: 'Ideal para 5 a 6 pessoas' }
    ]
  },
  {
    id: 'pizza-pepperoni-supremo',
    name: 'Pepperoni Supremo com Mel Picante',
    category: 'especiais',
    description: 'Mussarela derretida, fatias generosas de pepperoni premium crocantes no forno a lenha, folhas de rúcula fresca e finalizada com um fio de mel picante artesanal infusionado.',
    basePrice: 68.90,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
    isPizza: true,
    popular: true,
    tags: ['Tendência', 'Forno a Lenha'],
    sizes: [
      { id: 'media', name: 'Média (6 fatias - 30cm)', slices: 6, price: 68.90, description: 'Ideal para 2 pessoas' },
      { id: 'grande', name: 'Grande (8 fatias - 35cm)', slices: 8, price: 84.90, description: 'Ideal para 3 a 4 pessoas' },
      { id: 'familia', name: 'Família (12 fatias - 40cm)', slices: 12, price: 99.90, description: 'Ideal para 5 a 6 pessoas' }
    ]
  },

  // --- DOCES ---
  {
    id: 'pizza-morango-nutella',
    name: 'Nutella® com Morangos Frescos',
    category: 'doces',
    description: 'Creme aveludado de avelã Nutella® original espalhado sobre massa crocante assada a lenha, morangos frescos fatiados e raspas finas de chocolate branco belga.',
    basePrice: 58.90,
    image: 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&w=800&q=80',
    isPizza: true,
    popular: true,
    tags: ['Nutella Oficial', 'Sobremesa'],
    sizes: [
      { id: 'media', name: 'Média (6 fatias - 30cm)', slices: 6, price: 58.90, description: 'Ideal para 2 pessoas' },
      { id: 'grande', name: 'Grande (8 fatias - 35cm)', slices: 8, price: 74.90, description: 'Ideal para 3 a 4 pessoas' },
      { id: 'familia', name: 'Família (12 fatias - 40cm)', slices: 12, price: 88.90, description: 'Ideal para 5 a 6 pessoas' }
    ]
  },
  {
    id: 'pizza-banana-canela-vicosa',
    name: 'Banana Flambada com Doce de Leite Viçosa',
    category: 'doces',
    description: 'Fatias finas de banana prata selecionada, legítimo doce de leite Viçosa de Minas Gerais, pitadas de canela do Ceilão e açúcar caramelizado no maçarico.',
    basePrice: 52.90,
    image: 'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?auto=format&fit=crop&w=800&q=80',
    isPizza: true,
    tags: ['Tradição Mineira/Candanga'],
    sizes: [
      { id: 'media', name: 'Média (6 fatias - 30cm)', slices: 6, price: 52.90, description: 'Ideal para 2 pessoas' },
      { id: 'grande', name: 'Grande (8 fatias - 35cm)', slices: 8, price: 66.90, description: 'Ideal para 3 a 4 pessoas' },
      { id: 'familia', name: 'Família (12 fatias - 40cm)', slices: 12, price: 79.90, description: 'Ideal para 5 a 6 pessoas' }
    ]
  },
  {
    id: 'pizza-romeu-julieta',
    name: 'Romeu & Julieta da Serra da Canastra',
    category: 'doces',
    description: 'Camada dupla de queijo meia-cura da Canastra derretido com goiabada cascão cremosa e crocante de castanhas de caju.',
    basePrice: 54.90,
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
    isPizza: true,
    tags: ['Clássico Brasileiro'],
    sizes: [
      { id: 'media', name: 'Média (6 fatias - 30cm)', slices: 6, price: 54.90, description: 'Ideal para 2 pessoas' },
      { id: 'grande', name: 'Grande (8 fatias - 35cm)', slices: 8, price: 68.90, description: 'Ideal para 3 a 4 pessoas' },
      { id: 'familia', name: 'Família (12 fatias - 40cm)', slices: 12, price: 82.90, description: 'Ideal para 5 a 6 pessoas' }
    ]
  },

  // --- PARMEGIANAS (Tradição Gordeixo's em Brasília) ---
  {
    id: 'parmegiana-file-mignon-duplo',
    name: 'Parmegiana de Filé Mignon Gordeixo\'s (Serve 2 a 3)',
    category: 'parmegianas',
    description: 'O famoso prato tradicional da casa desde 1986: 600g de filé mignon empanado crocante, coberto com muito queijo mussarela derretido e molho de tomate caseiro. Acompanha arroz branco soltinho e batata frita rústica crocante.',
    basePrice: 89.90,
    image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=80',
    isPizza: false,
    popular: true,
    tags: ['Prato Icônico', 'Serve 2 a 3 pessoas']
  },
  {
    id: 'parmegiana-frango-familia',
    name: 'Parmegiana de Frango Crocante (Serve 2 pessoas)',
    category: 'parmegianas',
    description: 'Filé de peito de frango selecionado empanado na farinha panko especial, gratinado com molho de tomate ao manjericão e queijo mussarela. Acompanha arroz e fritas.',
    basePrice: 69.90,
    image: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?auto=format&fit=crop&w=800&q=80',
    isPizza: false,
    tags: ['Serve 2 pessoas', 'Crocante']
  },

  // --- COMBOS ---
  {
    id: 'combo-familia-candanga',
    name: 'Combo Família Candanga (Pizza Grande + Refri 2L + Pizza Doce Broto)',
    category: 'combos',
    description: '1 Pizza Grande Salgada (qualquer tradicional) + 1 Pizza Doce Broto (Nutella ou Banana) + 1 Refrigerante 2L (Coca-Cola ou Guaraná Antarctica). Economize R$ 28,00.',
    basePrice: 119.90,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    isPizza: false,
    popular: true,
    tags: ['Super Econômico', 'Combo Completo']
  },
  {
    id: 'combo-casal-gourmet',
    name: 'Combo Casal Gourmet (Pizza Média Especial + 2 Bebidas + Borda Recheada Grátis)',
    category: 'combos',
    description: '1 Pizza Média de qualquer sabor Especial + Borda Vulcão de Catupiry Original inclusa + 2 refrigerantes lata ou cervejas artesanais.',
    basePrice: 84.90,
    image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=800&q=80',
    isPizza: false,
    tags: ['Borda Grátis', 'Perfeito p/ 2']
  },

  // --- BEBIDAS ---
  {
    id: 'bebida-coca-cola-2l',
    name: 'Coca-Cola Original 2L Gelada',
    category: 'bebidas',
    description: 'Garrafa pet de 2 Litros, entregue bem gelada.',
    basePrice: 14.90,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
    isPizza: false
  },
  {
    id: 'bebida-guarana-2l',
    name: 'Guaraná Antarctica 2L Gelado',
    category: 'bebidas',
    description: 'Garrafa pet de 2 Litros do autêntico guaraná brasileiro.',
    basePrice: 13.90,
    image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80',
    isPizza: false
  },
  {
    id: 'bebida-coca-zero-lata',
    name: 'Coca-Cola Zero Lata 350ml',
    category: 'bebidas',
    description: 'Lata 350ml bem gelada.',
    basePrice: 6.90,
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=800&q=80',
    isPizza: false
  },
  {
    id: 'bebida-cerveja-heineken',
    name: 'Cerveja Heineken Long Neck 330ml',
    category: 'bebidas',
    description: 'Cerveja puro malte super gelada (Venda proibida para menores de 18 anos).',
    basePrice: 11.90,
    image: 'https://images.unsplash.com/photo-1608270199044-67d7168c4cf3?auto=format&fit=crop&w=800&q=80',
    isPizza: false
  },
  {
    id: 'bebida-suco-laranja-1l',
    name: 'Suco Natural de Laranja 1L (Sem Açúcar)',
    category: 'bebidas',
    description: 'Suco 100% natural espremido na hora, sem conservantes.',
    basePrice: 18.90,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
    isPizza: false
  }
];

export const CRUST_OPTIONS: CrustOption[] = [
  { id: 'sem-borda', name: 'Massa Tradicional (Sem recheio extra)', price: 0, category: 'salgada' },
  { id: 'borda-catupiry', name: 'Borda Vulcão com Catupiry® Original', price: 14.90, category: 'salgada', description: 'O legítimo requeijão Catupiry®' },
  { id: 'borda-cheddar', name: 'Borda Vulcão com Cheddar Cremoso Especial', price: 14.90, category: 'salgada', description: 'Cheddar derretido cremoso' },
  { id: 'borda-alho-poro', name: 'Borda Cream Cheese com Alho Poró', price: 16.90, category: 'especial', description: 'Toque gourmet suave' },
  { id: 'borda-chocolate', name: 'Borda Vulcão com Chocolate ao Leite Belga', price: 15.90, category: 'doce', description: 'Ideal para fechar com chave de ouro' },
  { id: 'borda-doce-leite', name: 'Borda com Doce de Leite Viçosa', price: 15.90, category: 'doce', description: 'Tradição pura de Minas' }
];

export const EXTRA_OPTIONS: ExtraOption[] = [
  { id: 'extra-bacon', name: 'Bacon Crocante Extra em Cubos (+80g)', price: 6.90 },
  { id: 'extra-queijo', name: 'Mussarela Extra Gratinada (+100g)', price: 7.90 },
  { id: 'extra-catupiry', name: 'Fios Extras de Catupiry® (+80g)', price: 6.90 },
  { id: 'extra-alho-frito', name: 'Alho Dourado Crocante', price: 3.50 },
  { id: 'extra-rucula-parmesao', name: 'Rúcula Fresca + Lascas de Parmesão', price: 5.90 },
  { id: 'extra-azeitonas-chilenas', name: 'Porção Extra de Azeitonas Pretas', price: 4.00 }
];

export const COUPONS = [
  { code: 'GORDEIXO10', discountPercent: 10, minOrder: 50, description: '10% de desconto em todo o cardápio' },
  { code: 'BEMVINDO', discountAmount: 15, minOrder: 70, description: 'R$ 15,00 OFF no seu primeiro pedido' },
  { code: 'BRASILIA1986', discountPercent: 15, minOrder: 90, description: '15% de desconto especial Tradição' }
];
