import type { MenuItem, CrustOption, ExtraOption, BairroDelivery, OrderCustomer, OrderItemPayload } from '../../src/types/index.ts';
import { MENU_ITEMS, CRUST_OPTIONS, EXTRA_OPTIONS, COUPONS } from './menuData.ts';
import { BAIRROS_DF } from './taxasEntrega.ts';
import { isSupabaseConfigured, supabaseRest } from '../lib/supabase.ts';

export interface CouponItem {
  code: string;
  description: string;
  discountPercent?: number;
  discountAmount?: number;
  minOrder: number;
  active: boolean;
}

export type KitchenOrderStatus = 'pending_payment' | 'recebido' | 'preparando' | 'saiu_entrega' | 'pronto_retirada' | 'concluido' | 'cancelado';

export interface StoredOrder {
  id: string;
  numeroPedido: string;
  createdAt: number;
  dataHora: string;
  subtotal: number;
  desconto: number;
  taxaEntrega: number;
  total: number;
  cliente: OrderCustomer;
  itens: OrderItemPayload[];
  linkWhatsApp: string;
  textoFormatado: string;
  tempoEstimado: string;
  status: KitchenOrderStatus;
  statusHistory: { status: KitchenOrderStatus; timestamp: number; note?: string }[];
  pixChave?: string;
  pixQrPayload?: string;
  motoboyNome?: string;
  observacoesInternas?: string;
  /** Token secreto de uso único devolvido ao cliente após criação do pedido.
   *  Obrigatório em todas as operações de pagamento para garantir que só o
   *  dono do pedido possa iniciar ou consultar o pagamento.
   */
  paymentToken?: string;
}


// In-Memory Server Store (initialized with seed data)
class RestaurantStore {
  private menu: (MenuItem & { available: boolean })[] = [];
  private crusts: (CrustOption & { available: boolean })[] = [];
  private extras: ExtraOption[] = [];
  private coupons: CouponItem[] = [];
  private bairros: BairroDelivery[] = [];
  private orders: StoredOrder[] = [];
  private storeId = '';
  private productDatabaseIds = new Map<string, string>();
  private variantDatabaseIds = new Map<string, string>();
  private optionDatabaseIds = new Map<string, string>();
  private initialized = false;

  constructor() {
    this.seed();
  }

  private seed() {
    // Seed Menu Items
    this.menu = MENU_ITEMS.map((item) => ({
      ...item,
      available: true
    }));

    // Seed Crusts
    this.crusts = CRUST_OPTIONS.map((c) => ({
      ...c,
      available: true
    }));

    // Seed Extras
    this.extras = [...EXTRA_OPTIONS];

    // Seed Coupons
    this.coupons = COUPONS.map((cp) => ({
      ...cp,
      active: true
    }));

    // Seed Bairros
    this.bairros = [...BAIRROS_DF];

    // Seed a couple of initial sample orders for instant preview in KDS
    const now = Date.now();
    this.orders = [
      {
        id: `ped_${now - 1000 * 60 * 12}_1986`,
        numeroPedido: '#GDX-1986',
        createdAt: now - 1000 * 60 * 12,
        dataHora: new Date(now - 1000 * 60 * 12).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        subtotal: 104.80,
        desconto: 5.24,
        taxaEntrega: 6.90,
        total: 106.46,
        cliente: {
          nome: 'Mariana Alencar Guimarães',
          whatsapp: '(61) 98452-1144',
          tipoEntrega: 'delivery',
          cep: '70742-020',
          bairroId: 'asa-norte',
          bairroNome: 'Asa Norte (Plano Piloto)',
          endereco: 'SQN 206 Bloco F',
          numero: '304',
          complemento: 'Ed. Belvedere',
          referencia: 'Próximo à Comercial da 205',
          formaPagamento: 'pix'
        },
        itens: [
          {
            productId: 'pizza-calabresa',
            name: 'Calabresa Especial Gordeixo\'s',
            category: 'tradicionais',
            sizeId: 'grande',
            sizeName: 'Grande (8 fatias - 35cm)',
            crustId: 'borda-catupiry',
            crustName: 'Borda Vulcão com Catupiry® Original',
            unitPrice: 89.80,
            quantity: 1,
            observations: 'Cebola bem fininha e bem assada por favor'
          },
          {
            productId: 'bebida-guarana-2l',
            name: 'Guaraná Antarctica 2L Gelado',
            category: 'bebidas',
            unitPrice: 15.00,
            quantity: 1
          }
        ],
        linkWhatsApp: 'https://api.whatsapp.com/send?phone=5561999998686',
        textoFormatado: 'Pedido #GDX-1986 de teste',
        tempoEstimado: '25 a 40 min',
        status: 'preparando',
        statusHistory: [
          { status: 'recebido', timestamp: now - 1000 * 60 * 12, note: 'Pedido recebido via WhatsApp' },
          { status: 'preparando', timestamp: now - 1000 * 60 * 5, note: 'Entrou no Forno a Lenha' }
        ]
      },
      {
        id: `ped_${now - 1000 * 60 * 25}_2042`,
        numeroPedido: '#GDX-2042',
        createdAt: now - 1000 * 60 * 25,
        dataHora: new Date(now - 1000 * 60 * 25).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        subtotal: 139.80,
        desconto: 15.00,
        taxaEntrega: 0,
        total: 124.80,
        cliente: {
          nome: 'Rodrigo Siqueira (Balcão)',
          whatsapp: '(61) 99123-7788',
          tipoEntrega: 'retirada',
          formaPagamento: 'cartao_credito',
          cupom: 'BEMVINDO'
        },
        itens: [
          {
            productId: 'pizza-file-mignon-gourmet',
            name: 'Filé Mignon ao Alho Negro & Catupiry',
            category: 'especiais',
            sizeId: 'grande',
            sizeName: 'Grande (8 fatias - 35cm)',
            unitPrice: 89.90,
            quantity: 1
          },
          {
            productId: 'pizza-morango-nutella',
            name: 'Nutella® com Morangos Frescos',
            category: 'doces',
            sizeId: 'media',
            sizeName: 'Média (6 fatias - 30cm)',
            unitPrice: 49.90,
            quantity: 1,
            observations: 'Morangos frescos à parte se possível'
          }
        ],
        linkWhatsApp: 'https://api.whatsapp.com/send?phone=5561999998686',
        textoFormatado: 'Pedido #GDX-2042 de teste',
        tempoEstimado: 'Pronto p/ Retirada Balcão',
        status: 'pronto_retirada',
        statusHistory: [
          { status: 'recebido', timestamp: now - 1000 * 60 * 25 },
          { status: 'preparando', timestamp: now - 1000 * 60 * 18 },
          { status: 'pronto_retirada', timestamp: now - 1000 * 60 * 3, note: 'Embalado e aguardando cliente' }
        ]
      }
    ];
  }

  public async initialize(): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('[RestaurantStore] Supabase não configurado. Operando com cardápio e dados em memória (modo local/demo).');
      this.initialized = true;
      return;
    }

    const stores = await supabaseRest<any[]>('stores', {
      query: 'select=id&slug=eq.gordeixos-brasilia&is_active=eq.true&limit=1'
    });
    if (!stores[0]) {
      throw new Error('Loja gordeixos-brasilia não cadastrada. Aplique a migração de dados iniciais.');
    }
    this.storeId = stores[0].id;

    await this.bootstrapCatalogIfEmpty();
    await this.reloadFromDatabase();
    this.initialized = true;
  }

  public isInitialized() {
    return this.initialized;
  }

  private async bootstrapCatalogIfEmpty() {
    const existing = await supabaseRest<any[]>('products', {
      query: `select=id&store_id=eq.${this.storeId}&limit=1`
    });
    if (!existing.length) {
      const categories = await supabaseRest<any[]>('categories', {
      query: `select=id,slug&store_id=eq.${this.storeId}`
      });
      const categoryIds = new Map(categories.map((category) => [category.slug, category.id]));

    for (const item of MENU_ITEMS) {
      const [product] = await supabaseRest<any[]>('products', {
        method: 'POST',
        body: {
          store_id: this.storeId,
          category_id: categoryIds.get(item.category) || null,
          external_code: item.id,
          slug: item.id,
          name: item.name,
          description: item.description,
          product_type: item.isPizza ? 'pizza' : item.category === 'bebidas' ? 'beverage' : item.category === 'combos' ? 'combo' : 'standard',
          base_price: item.basePrice,
          image_url: item.image,
          tags: item.tags || [],
          dietary_flags: item.vegetarian ? ['vegetarian'] : [],
          popular: Boolean(item.popular),
          featured: Boolean(item.isNew),
          metadata: { legacyCategory: item.category }
        }
      });

      if (item.sizes?.length) {
        await supabaseRest('product_variants', {
          method: 'POST',
          body: item.sizes.map((size, index) => ({
            product_id: product.id,
            external_code: size.id,
            name: size.name,
            description: size.description,
            price: size.price,
            slices: size.slices,
            sort_order: index
          }))
        });
      }
      }
    }

    let groups = await supabaseRest<any[]>('option_groups', { query: `select=id,slug&store_id=eq.${this.storeId}` });
    if (!groups.length) groups = await supabaseRest<any[]>('option_groups', {
      method: 'POST', body: [
        { store_id: this.storeId, slug: 'bordas', name: 'Bordas', selection_type: 'single', maximum_selections: 1 },
        { store_id: this.storeId, slug: 'adicionais', name: 'Adicionais', selection_type: 'multiple', maximum_selections: null }
      ]
    });
    const crustGroup = groups.find((group) => group.slug === 'bordas');
    const extrasGroup = groups.find((group) => group.slug === 'adicionais');
    const existingOptions = await supabaseRest<any[]>('product_options', { query: `select=id&option_group_id=in.(${crustGroup.id},${extrasGroup.id})&limit=1` });
    if (!existingOptions.length) await supabaseRest('product_options', {
      method: 'POST', body: [
        ...CRUST_OPTIONS.map((option, index) => ({ option_group_id: crustGroup.id, external_code: option.id, name: option.name, description: option.description || null, price_delta: option.price, sort_order: index, metadata: { category: option.category } })),
        ...EXTRA_OPTIONS.map((option, index) => ({ option_group_id: extrasGroup.id, external_code: option.id, name: option.name, description: null, price_delta: option.price, sort_order: index, metadata: {} }))
      ]
    });

    const existingCoupons = await supabaseRest<any[]>('coupons', { query: `select=id&store_id=eq.${this.storeId}&limit=1` });
    if (!existingCoupons.length) await supabaseRest('coupons', {
      method: 'POST', query: 'on_conflict=store_id,code', prefer: 'resolution=merge-duplicates,return=minimal',
      body: COUPONS.map((coupon) => ({
        store_id: this.storeId,
        code: coupon.code.toUpperCase(),
        description: coupon.description,
        discount_type: coupon.discountPercent ? 'percentage' : 'fixed',
        discount_value: coupon.discountPercent || coupon.discountAmount || 0,
        minimum_order: coupon.minOrder,
        active: true
      }))
    });

    const existingZones = await supabaseRest<any[]>('delivery_zones', { query: `select=id&store_id=eq.${this.storeId}&limit=1` });
    if (!existingZones.length) await supabaseRest('delivery_zones', {
      method: 'POST', query: 'on_conflict=store_id,slug', prefer: 'resolution=merge-duplicates,return=minimal',
      body: BAIRROS_DF.map((zone) => ({
        store_id: this.storeId,
        slug: zone.id,
        name: zone.nome,
        region: zone.regiao,
        delivery_fee: zone.taxaEntrega,
        free_delivery_threshold: zone.freteGratisMin || null,
        estimated_minutes_min: zone.tempoMin,
        estimated_minutes_max: zone.tempoMax,
        active: zone.ativo
      }))
    });
  }

  public async reloadFromDatabase() {
    if (!isSupabaseConfigured() || !this.storeId) return;
    const [products, groups, coupons, zones, orders] = await Promise.all([
      supabaseRest<any[]>('products', { query: `select=*,categories(slug),product_variants(*)&store_id=eq.${this.storeId}&order=sort_order.asc` }),
      supabaseRest<any[]>('option_groups', { query: `select=slug,product_options(*)&store_id=eq.${this.storeId}` }),
      supabaseRest<any[]>('coupons', { query: `select=*&store_id=eq.${this.storeId}&order=created_at.asc` }),
      supabaseRest<any[]>('delivery_zones', { query: `select=*&store_id=eq.${this.storeId}&order=name.asc` }),
      supabaseRest<any[]>('orders', { query: `select=*,order_items(*)&store_id=eq.${this.storeId}&order=created_at.desc&limit=500` })
    ]);

    this.productDatabaseIds.clear();
    this.variantDatabaseIds.clear();
    this.menu = products.map((product) => {
      const legacyId = product.external_code || product.slug;
      this.productDatabaseIds.set(legacyId, product.id);
      const sizes = (product.product_variants || []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((variant: any) => {
        const sizeId = variant.external_code || variant.id;
        this.variantDatabaseIds.set(`${legacyId}:${sizeId}`, variant.id);
        return { id: sizeId, name: variant.name, description: variant.description || '', slices: variant.slices || 1, price: Number(variant.price) };
      });
      return {
        id: legacyId,
        name: product.name,
        description: product.description,
        category: product.categories?.slug || product.metadata?.legacyCategory || 'tradicionais',
        basePrice: Number(product.base_price),
        image: product.image_url || '',
        isPizza: product.product_type === 'pizza',
        sizes: sizes.length ? sizes : undefined,
        popular: product.popular,
        isNew: product.featured,
        vegetarian: (product.dietary_flags || []).includes('vegetarian'),
        tags: product.tags || [],
        available: product.active && product.available
      } as MenuItem & { available: boolean };
    });

    this.optionDatabaseIds.clear();
    const crustGroup = groups.find((group) => group.slug === 'bordas');
    const extrasGroup = groups.find((group) => group.slug === 'adicionais');
    this.crusts = (crustGroup?.product_options || []).map((option: any) => {
      const id = option.external_code || option.id;
      this.optionDatabaseIds.set(id, option.id);
      return { id, name: option.name, description: option.description || '', price: Number(option.price_delta), category: option.metadata?.category || 'salgada', available: option.active && option.available };
    });
    this.extras = (extrasGroup?.product_options || []).filter((option: any) => option.active && option.available).map((option: any) => {
      const id = option.external_code || option.id;
      this.optionDatabaseIds.set(id, option.id);
      return { id, name: option.name, price: Number(option.price_delta) };
    });

    this.coupons = coupons.map((coupon) => ({ code: coupon.code, description: coupon.description || '', discountPercent: coupon.discount_type === 'percentage' ? Number(coupon.discount_value) : undefined, discountAmount: coupon.discount_type === 'fixed' ? Number(coupon.discount_value) : undefined, minOrder: Number(coupon.minimum_order), active: coupon.active && (!coupon.starts_at || Date.parse(coupon.starts_at) <= Date.now()) && (!coupon.ends_at || Date.parse(coupon.ends_at) > Date.now()) }));
    this.bairros = zones.map((zone) => ({ id: zone.slug, nome: zone.name, regiao: zone.region || '', taxaEntrega: Number(zone.delivery_fee), tempoMin: zone.estimated_minutes_min, tempoMax: zone.estimated_minutes_max, freteGratisMin: zone.free_delivery_threshold ? Number(zone.free_delivery_threshold) : undefined, ativo: zone.active }));
    this.orders = orders.map((order) => this.mapDatabaseOrder(order));
  }

  private mapDatabaseOrder(order: any): StoredOrder {
    const statusMap: Record<string, KitchenOrderStatus> = { pending_payment: 'pending_payment', received: 'recebido', accepted: 'recebido', preparing: 'preparando', ready_for_pickup: 'pronto_retirada', out_for_delivery: 'saiu_entrega', delivered: 'concluido', completed: 'concluido', cancelled: 'cancelado', payment_failed: 'pending_payment' };
    return {
      id: order.id,
      numeroPedido: `#${order.display_number}`,
      createdAt: Date.parse(order.created_at),
      dataHora: new Date(order.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      subtotal: Number(order.subtotal), desconto: Number(order.discount_total), taxaEntrega: Number(order.delivery_fee), total: Number(order.total),
      cliente: { nome: order.customer_name, whatsapp: order.customer_phone, tipoEntrega: order.fulfillment_type === 'delivery' ? 'delivery' : 'retirada', formaPagamento: this.fromDatabasePaymentMethod(order.payment_method), cupom: order.coupon_code || undefined, ...(order.delivery_address || {}) },
      itens: (order.order_items || []).map((item: any) => ({ ...(item.configuration || {}), productId: item.configuration?.productId || item.product_id, name: item.product_name, sizeName: item.variant_name || undefined, unitPrice: Number(item.unit_price) + Number(item.options_total), quantity: item.quantity, observations: item.notes || undefined })),
      linkWhatsApp: order.metadata?.linkWhatsApp || '', textoFormatado: order.customer_notes || '', tempoEstimado: order.metadata?.tempoEstimado || '30 a 40 min', status: statusMap[order.status] || 'recebido', statusHistory: [],
      ...(order.metadata || {}), pago: order.payment_status === 'paid', statusPagamento: order.payment_status === 'paid' ? 'pago' : 'pendente'
    } as StoredOrder;
  }

  private fromDatabasePaymentMethod(method: string) {
    const map: Record<string, any> = { pix: 'pix', credit_card_online: 'cartao_online', credit_card_on_delivery: 'cartao_credito', debit_card_on_delivery: 'cartao_debito', cash: 'dinheiro' };
    return map[method] || 'dinheiro';
  }

  // --- ORDERS ---
  public getOrders(): StoredOrder[] {
    return [...this.orders].sort((a, b) => b.createdAt - a.createdAt);
  }

  public getOrderById(id: string): StoredOrder | undefined {
    return this.orders.find((o) => o.id === id || o.numeroPedido === id);
  }

  /** Valida o paymentToken e retorna o pedido somente se o token bater.
   *  Retorna undefined se o pedido não existir OU se o token for inválido/ausente.
   */
  public verifyPaymentToken(orderId: string, paymentToken: string): StoredOrder | undefined {
    if (!orderId || !paymentToken) return undefined;
    const order = this.orders.find((o) => o.id === orderId || o.numeroPedido === orderId);
    if (!order || !order.paymentToken) return undefined;
    // Comparação em tempo constante para evitar timing attacks
    const expected = order.paymentToken;
    if (expected.length !== paymentToken.length) return undefined;
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) {
      mismatch |= expected.charCodeAt(i) ^ paymentToken.charCodeAt(i);
    }
    return mismatch === 0 ? order : undefined;
  }

  public async addOrder(order: StoredOrder): Promise<StoredOrder> {
    const onlinePayment = ['pix', 'cartao_online'].includes(order.cliente.formaPagamento);
    if (!isSupabaseConfigured()) {
      const persisted: StoredOrder = {
        ...order,
        status: onlinePayment ? 'pending_payment' as const : 'recebido' as const
      };
      this.orders.unshift(persisted);
      return persisted;
    }

    const paymentMethodMap: Record<string, string> = { pix: 'pix', cartao_online: 'credit_card_online', cartao_credito: 'credit_card_on_delivery', cartao_debito: 'debit_card_on_delivery', dinheiro: 'cash' };
    const zone = order.cliente.bairroId ? await supabaseRest<any[]>('delivery_zones', { query: `select=id&store_id=eq.${this.storeId}&slug=eq.${encodeURIComponent(order.cliente.bairroId)}&limit=1` }) : [];
    const [created] = await supabaseRest<any[]>('orders', {
      method: 'POST',
      body: {
        store_id: this.storeId,
        delivery_zone_id: zone[0]?.id || null,
        idempotency_key: order.id,
        channel: 'website',
        fulfillment_type: order.cliente.tipoEntrega === 'delivery' ? 'delivery' : 'pickup',
        status: onlinePayment ? 'pending_payment' : 'received',
        payment_status: 'pending',
        customer_name: order.cliente.nome,
        customer_phone: order.cliente.whatsapp,
        delivery_address: order.cliente.tipoEntrega === 'delivery' ? { cep: order.cliente.cep, bairroId: order.cliente.bairroId, bairroNome: order.cliente.bairroNome, endereco: order.cliente.endereco, numero: order.cliente.numero, complemento: order.cliente.complemento, referencia: order.cliente.referencia } : null,
        subtotal: order.subtotal,
        discount_total: order.desconto,
        delivery_fee: order.taxaEntrega,
        total: order.total,
        coupon_code: order.cliente.cupom || null,
        payment_method: paymentMethodMap[order.cliente.formaPagamento],
        change_for: order.cliente.trocoPara || null,
        customer_notes: order.textoFormatado,
        metadata: { linkWhatsApp: order.linkWhatsApp, tempoEstimado: order.tempoEstimado, pixChave: order.pixChave, pixQrPayload: order.pixQrPayload }
      }
    });

    await supabaseRest('order_items', {
      method: 'POST',
      body: order.itens.map((item) => {
        const productId = this.productDatabaseIds.get(item.productId) || null;
        const variantId = item.sizeId ? this.variantDatabaseIds.get(`${item.productId}:${item.sizeId}`) || null : null;
        const optionsTotal = (item.extras || []).reduce((sum, extra) => sum + extra.price, 0) + (item.crustId && item.crustId !== 'sem-borda' ? (this.crusts.find((crust) => crust.id === item.crustId)?.price || 0) : 0);
        const baseUnitPrice = Math.max(0, item.unitPrice - optionsTotal);
        return { order_id: created.id, product_id: productId, variant_id: variantId, product_name: item.name, variant_name: item.sizeName || null, quantity: item.quantity, unit_price: baseUnitPrice, options_total: optionsTotal, line_total: item.unitPrice * item.quantity, notes: item.observations || null, configuration: item };
      })
    });

    const persisted = { ...order, id: created.id, numeroPedido: `#${created.display_number}`, status: onlinePayment ? 'pending_payment' as const : 'recebido' as const };
    this.orders.unshift(persisted);
    return persisted;
  }

  public async updateOrderStatus(id: string, newStatus: KitchenOrderStatus, note?: string): Promise<StoredOrder | null> {
    const order = this.orders.find((o) => o.id === id || o.numeroPedido === id);
    if (!order) return null;

    if (isSupabaseConfigured()) {
      const statusMap: Record<KitchenOrderStatus, string> = { pending_payment: 'pending_payment', recebido: 'received', preparando: 'preparing', saiu_entrega: 'out_for_delivery', pronto_retirada: 'ready_for_pickup', concluido: 'completed', cancelado: 'cancelled' };
      await supabaseRest('orders', { method: 'PATCH', query: `id=eq.${encodeURIComponent(order.id)}`, body: { status: statusMap[newStatus], completed_at: newStatus === 'concluido' ? new Date().toISOString() : undefined, cancelled_at: newStatus === 'cancelado' ? new Date().toISOString() : undefined } });
    }

    order.status = newStatus;
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: newStatus,
      timestamp: Date.now(),
      note
    });

    return order;
  }

  public async updateOrderMotoboy(id: string, motoboyNome: string): Promise<StoredOrder | null> {
    const order = this.orders.find((o) => o.id === id || o.numeroPedido === id);
    if (!order) return null;
    order.motoboyNome = motoboyNome;
    if (isSupabaseConfigured()) {
      await supabaseRest('orders', { method: 'PATCH', query: `id=eq.${encodeURIComponent(order.id)}`, body: { internal_notes: `Motoboy: ${motoboyNome}` } });
    }
    return order;
  }

  // --- MENU ITEMS ---
  public getMenu(): (MenuItem & { available: boolean })[] {
    return this.menu;
  }

  public getMenuItem(id: string) {
    return this.menu.find((m) => m.id === id);
  }

  public getExtras(): ExtraOption[] {
    return this.extras;
  }

  public async updateMenuItem(id: string, updates: Partial<MenuItem & { available: boolean }>): Promise<MenuItem | null> {
    const item = this.menu.find((m) => m.id === id);
    if (!item) return null;

    const databaseId = this.productDatabaseIds.get(id);
    if (!databaseId) return null;
    await supabaseRest('products', { method: 'PATCH', query: `id=eq.${databaseId}`, body: { name: updates.name, description: updates.description, base_price: updates.basePrice, image_url: updates.image, tags: updates.tags, popular: updates.popular, available: updates.available } });
    if (updates.sizes) {
      for (const size of updates.sizes) {
        const variantId = this.variantDatabaseIds.get(`${id}:${size.id}`);
        if (variantId) await supabaseRest('product_variants', { method: 'PATCH', query: `id=eq.${variantId}`, body: { name: size.name, description: size.description, price: size.price, slices: size.slices } });
      }
    }
    Object.assign(item, updates);
    return item;
  }

  public async toggleMenuItemAvailability(id: string, available?: boolean): Promise<MenuItem | null> {
    const item = this.menu.find((m) => m.id === id);
    if (!item) return null;

    item.available = available !== undefined ? available : !item.available;
    await supabaseRest('products', { method: 'PATCH', query: `id=eq.${this.productDatabaseIds.get(id)}`, body: { available: item.available } });
    return item;
  }

  public async addMenuItem(item: MenuItem & { available?: boolean }): Promise<MenuItem & { available: boolean }> {
    const newItem: MenuItem & { available: boolean } = {
      ...item,
      id: item.id || `item-${Date.now()}`,
      available: item.available !== undefined ? item.available : true
    };
    const categories = await supabaseRest<any[]>('categories', { query: `select=id&store_id=eq.${this.storeId}&slug=eq.${encodeURIComponent(item.category)}&limit=1` });
    const [created] = await supabaseRest<any[]>('products', { method: 'POST', body: { store_id: this.storeId, category_id: categories[0]?.id || null, external_code: newItem.id, slug: newItem.id, name: newItem.name, description: newItem.description, product_type: newItem.isPizza ? 'pizza' : 'standard', base_price: newItem.basePrice, image_url: newItem.image, tags: newItem.tags || [], popular: Boolean(newItem.popular), available: newItem.available, metadata: { legacyCategory: newItem.category } } });
    this.productDatabaseIds.set(newItem.id, created.id);
    if (newItem.sizes?.length) {
      const variants = await supabaseRest<any[]>('product_variants', { method: 'POST', body: newItem.sizes.map((size, index) => ({ product_id: created.id, external_code: size.id, name: size.name, description: size.description, price: size.price, slices: size.slices, sort_order: index })) });
      variants.forEach((variant) => this.variantDatabaseIds.set(`${newItem.id}:${variant.external_code}`, variant.id));
    }
    this.menu = this.menu.filter((m) => m.id !== newItem.id);
    this.menu.push(newItem);
    return newItem;
  }

  public async deleteMenuItem(id: string): Promise<boolean> {
    const before = this.menu.length;
    const databaseId = this.productDatabaseIds.get(id);
    if (databaseId) await supabaseRest('products', { method: 'DELETE', query: `id=eq.${databaseId}` });
    this.menu = this.menu.filter((m) => m.id !== id);
    return this.menu.length < before;
  }

  // --- CRUSTS ---
  public getCrusts(): (CrustOption & { available: boolean })[] {
    return this.crusts;
  }

  public async updateCrust(id: string, updates: Partial<CrustOption & { available: boolean }>): Promise<CrustOption | null> {
    const crust = this.crusts.find((c) => c.id === id);
    if (!crust) return null;

    await supabaseRest('product_options', { method: 'PATCH', query: `id=eq.${this.optionDatabaseIds.get(id)}`, body: { name: updates.name, description: updates.description, price_delta: updates.price, available: updates.available } });
    Object.assign(crust, updates);
    return crust;
  }

  public async toggleCrustAvailability(id: string, available?: boolean): Promise<CrustOption | null> {
    const crust = this.crusts.find((c) => c.id === id);
    if (!crust) return null;

    crust.available = available !== undefined ? available : !crust.available;
    await supabaseRest('product_options', { method: 'PATCH', query: `id=eq.${this.optionDatabaseIds.get(id)}`, body: { available: crust.available } });
    return crust;
  }

  // --- COUPONS ---
  public getCoupons(): CouponItem[] {
    return this.coupons;
  }

  public async addCoupon(coupon: CouponItem): Promise<CouponItem> {
    // Remove if existing with same code
    this.coupons = this.coupons.filter((c) => c.code.toUpperCase() !== coupon.code.toUpperCase());
    const newCoupon = {
      ...coupon,
      code: coupon.code.toUpperCase().trim()
    };
    await supabaseRest('coupons', { method: 'POST', query: 'on_conflict=store_id,code', prefer: 'resolution=merge-duplicates,return=representation', body: { store_id: this.storeId, code: newCoupon.code, description: newCoupon.description, discount_type: newCoupon.discountPercent ? 'percentage' : 'fixed', discount_value: newCoupon.discountPercent || newCoupon.discountAmount || 0, minimum_order: newCoupon.minOrder, active: newCoupon.active } });
    this.coupons.push(newCoupon);
    return newCoupon;
  }

  public async deleteCoupon(code: string): Promise<boolean> {
    const before = this.coupons.length;
    await supabaseRest('coupons', { method: 'DELETE', query: `store_id=eq.${this.storeId}&code=eq.${encodeURIComponent(code.toUpperCase())}` });
    this.coupons = this.coupons.filter((c) => c.code.toUpperCase() !== code.toUpperCase());
    return this.coupons.length < before;
  }

  public async toggleCoupon(code: string, active?: boolean): Promise<CouponItem | null> {
    const coupon = this.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase());
    if (!coupon) return null;
    coupon.active = active !== undefined ? active : !coupon.active;
    await supabaseRest('coupons', { method: 'PATCH', query: `store_id=eq.${this.storeId}&code=eq.${encodeURIComponent(code.toUpperCase())}`, body: { active: coupon.active } });
    return coupon;
  }

  // --- BAIRROS ---
  public getBairros(): BairroDelivery[] {
    return this.bairros;
  }

  public async updateBairro(id: string, updates: Partial<BairroDelivery>): Promise<BairroDelivery | null> {
    const bairro = this.bairros.find((b) => b.id === id);
    if (!bairro) return null;

    await supabaseRest('delivery_zones', { method: 'PATCH', query: `store_id=eq.${this.storeId}&slug=eq.${encodeURIComponent(id)}`, body: { name: updates.nome, region: updates.regiao, delivery_fee: updates.taxaEntrega, estimated_minutes_min: updates.tempoMin, estimated_minutes_max: updates.tempoMax, free_delivery_threshold: updates.freteGratisMin, active: updates.ativo } });
    Object.assign(bairro, updates);
    return bairro;
  }

  public async toggleBairro(id: string, ativo?: boolean): Promise<BairroDelivery | null> {
    const bairro = this.bairros.find((b) => b.id === id);
    if (!bairro) return null;
    bairro.ativo = ativo !== undefined ? ativo : !bairro.ativo;
    await supabaseRest('delivery_zones', { method: 'PATCH', query: `store_id=eq.${this.storeId}&slug=eq.${encodeURIComponent(id)}`, body: { active: bairro.ativo } });
    return bairro;
  }

  public async addBairro(bairro: BairroDelivery): Promise<BairroDelivery> {
    const newBairro: BairroDelivery = {
      ...bairro,
      id: bairro.id || `bairro-${Date.now()}`,
      ativo: bairro.ativo !== undefined ? bairro.ativo : true
    };
    await supabaseRest('delivery_zones', { method: 'POST', query: 'on_conflict=store_id,slug', prefer: 'resolution=merge-duplicates,return=representation', body: { store_id: this.storeId, slug: newBairro.id, name: newBairro.nome, region: newBairro.regiao, delivery_fee: newBairro.taxaEntrega, estimated_minutes_min: newBairro.tempoMin, estimated_minutes_max: newBairro.tempoMax, free_delivery_threshold: newBairro.freteGratisMin || null, active: newBairro.ativo } });
    this.bairros = this.bairros.filter((b) => b.id !== newBairro.id);
    this.bairros.push(newBairro);
    return newBairro;
  }

  public async deleteBairro(id: string): Promise<boolean> {
    const before = this.bairros.length;
    await supabaseRest('delivery_zones', { method: 'DELETE', query: `store_id=eq.${this.storeId}&slug=eq.${encodeURIComponent(id)}` });
    this.bairros = this.bairros.filter((b) => b.id !== id);
    return this.bairros.length < before;
  }

  // --- STATS ---
  public getStats() {
    const totalOrders = this.orders.length;
    const completedOrders = this.orders.filter((o) => o.status === 'concluido');
    const activeOrders = this.orders.filter((o) => o.status !== 'pending_payment' && o.status !== 'concluido' && o.status !== 'cancelado');
    const totalRevenue = this.orders
      .filter((o) => o.status === 'concluido' || (o as any).pago === true)
      .reduce((sum, o) => sum + o.total, 0);

    const deliveryCount = this.orders.filter((o) => o.cliente.tipoEntrega === 'delivery').length;
    const pickupCount = this.orders.filter((o) => o.cliente.tipoEntrega === 'retirada').length;

    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalOrders,
      activeOrders: activeOrders.length,
      completedOrders: completedOrders.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      avgTicket: Number(avgTicket.toFixed(2)),
      deliveryCount,
      pickupCount,
      byStatus: {
        pending_payment: this.orders.filter((o) => o.status === 'pending_payment').length,
        recebido: this.orders.filter((o) => o.status === 'recebido').length,
        preparando: this.orders.filter((o) => o.status === 'preparando').length,
        saiu_entrega: this.orders.filter((o) => o.status === 'saiu_entrega').length,
        pronto_retirada: this.orders.filter((o) => o.status === 'pronto_retirada').length,
        concluido: completedOrders.length,
        cancelado: this.orders.filter((o) => o.status === 'cancelado').length
      }
    };
  }
}

export const restaurantStore = new RestaurantStore();
