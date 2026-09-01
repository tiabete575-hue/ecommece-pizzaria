import type { NextRequest } from 'next/server';
import type { GatewayProvider, MenuItem, OrderPayload, CrustOption } from '../../../src/types/index.ts';
import type { KitchenOrderStatus } from '../../../server/data/store.ts';
import { restaurantStore } from '../../../server/data/store.ts';
import { processOrder } from '../../../server/controllers/orderController.ts';
import { paymentGatewayService } from '../../../server/services/paymentGateways.ts';
import { loadStaffIdentity, signInStaff } from '../../../server/lib/supabase.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

let initialization: Promise<void> | null = null;

async function prepareStore() {
  if (!initialization) initialization = restaurantStore.initialize();
  await initialization;
  await Promise.all([
    restaurantStore.reloadFromDatabase(),
    paymentGatewayService.loadPersistedConfig()
  ]);
}

const json = (data: unknown, status = 200) => Response.json(data, {
  status,
  headers: { 'Cache-Control': 'no-store' }
});

async function readBody(request: NextRequest) {
  const raw = await request.text();
  if (!raw) return { raw: Buffer.alloc(0), body: {} as any };
  try {
    return { raw: Buffer.from(raw), body: JSON.parse(raw) };
  } catch {
    return { raw: Buffer.from(raw), body: {} as any };
  }
}

async function authorize(request: NextRequest, roles?: string[]) {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { error: json({ sucesso: false, mensagem: 'Sessão administrativa obrigatória.' }, 401) };
  const staff = await loadStaffIdentity(token).catch(() => null);
  if (!staff) return { error: json({ sucesso: false, mensagem: 'Sessão inválida ou expirada.' }, 401) };
  if (roles && !roles.includes(staff.role)) return { error: json({ sucesso: false, mensagem: 'Perfil sem permissão para esta operação.' }, 403) };
  return { staff };
}

const categories = [
  { id: 'todos', nome: 'Todos os Pratos', icon: 'UtensilsCrossed' },
  { id: 'tradicionais', nome: 'Pizzas Tradicionais', icon: 'Pizza' },
  { id: 'especiais', nome: 'Pizzas Especiais', icon: 'Sparkles' },
  { id: 'doces', nome: 'Pizzas Doces', icon: 'Cake' },
  { id: 'parmegianas', nome: 'Parmegianas de Brasília', icon: 'Flame' },
  { id: 'combos', nome: 'Combos & Promoções', icon: 'Gift' },
  { id: 'bebidas', nome: 'Bebidas Geladas', icon: 'Wine' }
];

async function dispatch(request: NextRequest, pathParts: string[]) {
  try {
    await prepareStore();
    const method = request.method;
    const path = `/${pathParts.join('/')}`;
    const url = request.nextUrl;
    const { raw, body } = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? await readBody(request) : { raw: Buffer.alloc(0), body: {} as any };

    if (method === 'GET' && path === '/health') return json({ status: 'ok', restaurante: "Gordeixo's Pizzaria Brasília", runtime: 'nextjs-vercel', timestamp: new Date().toISOString() });

    if (method === 'POST' && path === '/auth/login') {
      if (!body.email || !body.password) return json({ sucesso: false, mensagem: 'Informe e-mail e senha.' }, 400);
      try {
        const session = await signInStaff(String(body.email).trim().toLowerCase(), String(body.password));
        return json({ sucesso: true, session });
      } catch (error) {
        return json({ sucesso: false, mensagem: error instanceof Error ? error.message : 'Não foi possível autenticar.' }, 401);
      }
    }

    if (method === 'GET' && path === '/auth/session') {
      const auth = await authorize(request);
      if (auth.error) return auth.error;
      return json({ sucesso: true, staff: auth.staff });
    }

    if (method === 'GET' && path === '/menu') {
      let products = restaurantStore.getMenu().filter((item) => item.available !== false);
      const category = url.searchParams.get('categoria');
      const search = url.searchParams.get('busca')?.toLowerCase().trim();
      if (category && category !== 'todos') products = products.filter((item) => item.category === category);
      if (search) products = products.filter((item) => item.name.toLowerCase().includes(search) || item.description.toLowerCase().includes(search) || item.tags?.some((tag) => tag.toLowerCase().includes(search)));
      return json({ sucesso: true, totalItens: products.length, categorias: categories, produtos: products, bordas: restaurantStore.getCrusts().filter((item) => item.available !== false), adicionais: restaurantStore.getExtras(), cupons: restaurantStore.getCoupons().filter((coupon) => coupon.active).map(({ active: _active, ...coupon }) => coupon) });
    }

    if (method === 'GET' && path === '/bairros') return json({ sucesso: true, regiaoAtendida: 'Distrito Federal', bairros: restaurantStore.getBairros().filter((zone) => zone.ativo) });

    if (method === 'POST' && path === '/pedidos') {
      const result = await processOrder(body as OrderPayload);
      return json(result, result.sucesso ? 201 : 400);
    }

    const publicStatus = path.match(/^\/pedidos\/([^/]+)\/status$/);
    if (method === 'GET' && publicStatus) {
      const order = restaurantStore.getOrderById(decodeURIComponent(publicStatus[1]));
      if (!order) return json({ sucesso: false, mensagem: 'Pedido não encontrado.' }, 404);
      const statusInfo: Record<KitchenOrderStatus, [number, number, string, string]> = {
        pending_payment: [0, 10, 'Aguardando Pagamento', 'O pedido será enviado à cozinha após a confirmação.'],
        recebido: [1, 25, 'Pedido Confirmado', 'Pedido recebido pela pizzaria.'],
        preparando: [2, 50, 'No Forno a Lenha', 'Seu pedido está sendo preparado.'],
        saiu_entrega: [3, 75, 'Saiu para Entrega', 'O entregador está a caminho.'],
        pronto_retirada: [3, 85, 'Pronto para Retirada', 'Pedido aguardando no balcão.'],
        concluido: [4, 100, 'Concluído', 'Pedido entregue com sucesso.'],
        cancelado: [0, 0, 'Pedido Cancelado', 'Pedido cancelado pela pizzaria.']
      };
      const [step, percent, titulo, desc] = statusInfo[order.status];
      return json({ sucesso: true, pedidoId: order.id, numeroPedido: order.numeroPedido, step, statusKey: order.status, percent, info: { titulo, desc }, tempoEstimado: order.tempoEstimado, motoboyNome: order.motoboyNome, updatedAt: Date.now() });
    }

    if (path.startsWith('/admin/')) {
      const auth = await authorize(request);
      if (auth.error) return auth.error;

      if (method === 'GET' && path === '/admin/pedidos') {
        let orders = restaurantStore.getOrders().filter((order) => order.status !== 'pending_payment');
        const status = url.searchParams.get('status');
        if (status && status !== 'todos') orders = orders.filter((order) => order.status === status);
        return json({ sucesso: true, total: orders.length, pedidos: orders });
      }

      const orderStatus = path.match(/^\/admin\/pedidos\/([^/]+)\/status$/);
      if (method === 'PATCH' && orderStatus) {
        const allowed = ['owner', 'admin', 'manager', 'kitchen', 'dispatcher'];
        if (!allowed.includes(auth.staff!.role)) return json({ sucesso: false, mensagem: 'Sem permissão.' }, 403);
        const updated = await restaurantStore.updateOrderStatus(decodeURIComponent(orderStatus[1]), body.status, body.note);
        if (!updated) return json({ sucesso: false, mensagem: 'Pedido não encontrado.' }, 404);
        if (body.motoboyNome !== undefined) await restaurantStore.updateOrderMotoboy(updated.id, body.motoboyNome);
        return json({ sucesso: true, mensagem: 'Status atualizado.', pedido: updated });
      }

      if (method === 'POST' && path === '/admin/pedidos/mock') {
        if (!['owner', 'admin', 'manager'].includes(auth.staff!.role)) return json({ sucesso: false, mensagem: 'Sem permissão.' }, 403);
        const menu = restaurantStore.getMenu().filter((item) => item.available !== false);
        const product = menu.find((item) => item.isPizza) || menu[0];
        const size = product.sizes?.[0];
        const result = await processOrder({ cliente: { nome: 'Pedido Demonstração', whatsapp: '(61) 99999-0000', tipoEntrega: 'retirada', formaPagamento: 'cartao_credito' }, itens: [{ productId: product.id, name: product.name, category: product.category, sizeId: size?.id, sizeName: size?.name, unitPrice: 0, quantity: 1 }] });
        return json({ sucesso: result.sucesso, mensagem: 'Pedido demonstrativo inserido.', pedido: result.pedido }, result.sucesso ? 201 : 400);
      }

      if (method === 'GET' && path === '/admin/menu') return json({ sucesso: true, produtos: restaurantStore.getMenu(), bordas: restaurantStore.getCrusts() });

      if (method === 'POST' && path === '/admin/menu') {
        if (!['owner', 'admin', 'manager'].includes(auth.staff!.role)) return json({ sucesso: false, mensagem: 'Sem permissão.' }, 403);
        if (!body.name || !body.category) return json({ sucesso: false, mensagem: 'Nome e categoria são obrigatórios.' }, 400);
        const isPizza = body.isPizza ?? ['tradicionais', 'especiais', 'doces'].includes(body.category);
        const id = body.id || `item-${Date.now()}`;
        const product = await restaurantStore.addMenuItem({ id, name: String(body.name).trim(), description: body.description || '', category: body.category, basePrice: Number(body.basePrice || 0), isPizza, popular: Boolean(body.isPopular ?? body.popular), vegetarian: Boolean(body.isVegetarian ?? body.vegetarian), image: body.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800', tags: Array.isArray(body.tags) ? body.tags : [], sizes: isPizza ? body.sizes : undefined, available: body.available ?? true });
        return json({ sucesso: true, mensagem: 'Produto criado.', produto: product }, 201);
      }

      const menuItem = path.match(/^\/admin\/menu\/([^/]+)$/);
      if (menuItem && ['PUT', 'DELETE'].includes(method)) {
        if (!['owner', 'admin', 'manager'].includes(auth.staff!.role) || (method === 'DELETE' && auth.staff!.role === 'manager')) return json({ sucesso: false, mensagem: 'Sem permissão.' }, 403);
        const id = decodeURIComponent(menuItem[1]);
        if (method === 'PUT') {
          const product = await restaurantStore.updateMenuItem(id, body as Partial<MenuItem>);
          return product ? json({ sucesso: true, produto: product }) : json({ sucesso: false, mensagem: 'Produto não encontrado.' }, 404);
        }
        const removed = await restaurantStore.deleteMenuItem(id);
        return removed ? json({ sucesso: true }) : json({ sucesso: false, mensagem: 'Produto não encontrado.' }, 404);
      }

      const menuToggle = path.match(/^\/admin\/menu\/([^/]+)\/toggle$/);
      if (method === 'PATCH' && menuToggle) {
        if (!['owner', 'admin', 'manager', 'kitchen'].includes(auth.staff!.role)) return json({ sucesso: false, mensagem: 'Sem permissão.' }, 403);
        const product = await restaurantStore.toggleMenuItemAvailability(decodeURIComponent(menuToggle[1]), body.available);
        return product ? json({ sucesso: true, produto: product, mensagem: `Item ${product.available ? 'ativado' : 'pausado'}.` }) : json({ sucesso: false, mensagem: 'Produto não encontrado.' }, 404);
      }

      const crustItem = path.match(/^\/admin\/bordas\/([^/]+)$/);
      if (method === 'PUT' && crustItem) {
        if (!['owner', 'admin', 'manager'].includes(auth.staff!.role)) return json({ sucesso: false, mensagem: 'Sem permissão.' }, 403);
        const crust = await restaurantStore.updateCrust(decodeURIComponent(crustItem[1]), body as Partial<CrustOption>);
        return crust ? json({ sucesso: true, borda: crust }) : json({ sucesso: false, mensagem: 'Borda não encontrada.' }, 404);
      }

      const crustToggle = path.match(/^\/admin\/bordas\/([^/]+)\/toggle$/);
      if (method === 'PATCH' && crustToggle) {
        const crust = await restaurantStore.toggleCrustAvailability(decodeURIComponent(crustToggle[1]), body.available);
        return crust ? json({ sucesso: true, borda: crust }) : json({ sucesso: false, mensagem: 'Borda não encontrada.' }, 404);
      }

      if (method === 'GET' && path === '/admin/cupons') return json({ sucesso: true, cupons: restaurantStore.getCoupons() });
      if (method === 'POST' && path === '/admin/cupons') {
        if (!['owner', 'admin', 'manager'].includes(auth.staff!.role)) return json({ sucesso: false, mensagem: 'Sem permissão.' }, 403);
        if (!body.code || (!body.discountPercent && !body.discountAmount)) return json({ sucesso: false, mensagem: 'Código e desconto são obrigatórios.' }, 400);
        const coupon = await restaurantStore.addCoupon({ code: String(body.code).trim().toUpperCase(), description: body.description || 'Cupom Promocional', discountPercent: body.discountPercent ? Number(body.discountPercent) : undefined, discountAmount: body.discountAmount ? Number(body.discountAmount) : undefined, minOrder: Number(body.minOrder || 0), active: body.active ?? true });
        return json({ sucesso: true, cupom: coupon }, 201);
      }

      const couponItem = path.match(/^\/admin\/cupons\/([^/]+)$/);
      if (method === 'DELETE' && couponItem) {
        const removed = await restaurantStore.deleteCoupon(decodeURIComponent(couponItem[1]));
        return removed ? json({ sucesso: true }) : json({ sucesso: false, mensagem: 'Cupom não encontrado.' }, 404);
      }
      const couponToggle = path.match(/^\/admin\/cupons\/([^/]+)\/toggle$/);
      if (method === 'PATCH' && couponToggle) {
        const coupon = await restaurantStore.toggleCoupon(decodeURIComponent(couponToggle[1]), body.active);
        return coupon ? json({ sucesso: true, cupom: coupon }) : json({ sucesso: false, mensagem: 'Cupom não encontrado.' }, 404);
      }

      if (method === 'GET' && path === '/admin/bairros') return json({ sucesso: true, bairros: restaurantStore.getBairros() });
      if (method === 'POST' && path === '/admin/bairros') {
        const name = String(body.nome || '').trim();
        if (!name) return json({ sucesso: false, mensagem: 'Nome obrigatório.' }, 400);
        const id = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const zone = await restaurantStore.addBairro({ id, nome: name, regiao: body.regiao || 'Distrito Federal', taxaEntrega: Number(body.taxaEntrega || 0), tempoMin: Number(body.tempoMin || 30), tempoMax: Number(body.tempoMax || 50), freteGratisMin: body.freteGratisMin ? Number(body.freteGratisMin) : undefined, ativo: body.ativo ?? true });
        return json({ sucesso: true, bairro: zone }, 201);
      }
      const zoneItem = path.match(/^\/admin\/bairros\/([^/]+)$/);
      if (zoneItem && ['PUT', 'DELETE'].includes(method)) {
        const id = decodeURIComponent(zoneItem[1]);
        if (method === 'PUT') {
          const zone = await restaurantStore.updateBairro(id, { nome: body.nome, regiao: body.regiao, taxaEntrega: body.taxaEntrega === undefined ? undefined : Number(body.taxaEntrega), tempoMin: body.tempoMin === undefined ? undefined : Number(body.tempoMin), tempoMax: body.tempoMax === undefined ? undefined : Number(body.tempoMax), freteGratisMin: body.freteGratisMin === undefined ? undefined : Number(body.freteGratisMin), ativo: body.ativo });
          return zone ? json({ sucesso: true, bairro: zone }) : json({ sucesso: false, mensagem: 'Bairro não encontrado.' }, 404);
        }
        return (await restaurantStore.deleteBairro(id)) ? json({ sucesso: true }) : json({ sucesso: false, mensagem: 'Bairro não encontrado.' }, 404);
      }
      const zoneToggle = path.match(/^\/admin\/bairros\/([^/]+)\/toggle$/);
      if (method === 'PATCH' && zoneToggle) {
        const zone = await restaurantStore.toggleBairro(decodeURIComponent(zoneToggle[1]), body.ativo);
        return zone ? json({ sucesso: true, bairro: zone }) : json({ sucesso: false, mensagem: 'Bairro não encontrado.' }, 404);
      }

      if (method === 'GET' && path === '/admin/stats') return json({ sucesso: true, stats: restaurantStore.getStats() });
      if (method === 'GET' && path === '/admin/gateways') return json({ sucesso: true, config: paymentGatewayService.getSafeConfig() });
      if (method === 'POST' && path === '/admin/gateways') {
        if (!['owner', 'admin'].includes(auth.staff!.role)) return json({ sucesso: false, mensagem: 'Sem permissão.' }, 403);
        return json({ sucesso: true, config: await paymentGatewayService.updateConfig(body) });
      }
      if (method === 'POST' && path === '/admin/gateways/test') {
        if (!['owner', 'admin'].includes(auth.staff!.role)) return json({ sucesso: false, mensagem: 'Sem permissão.' }, 403);
        return json(await paymentGatewayService.testGatewayConnection((body.provider || 'simulated') as GatewayProvider));
      }
    }

    if (method === 'POST' && path === '/payments/pix/create') {
      const order = restaurantStore.getOrderById(String(body.orderId || ''));
      if (!order) return json({ sucesso: false, mensagem: 'Pedido não encontrado.' }, 404);
      return json(await paymentGatewayService.createPixPayment(order.id, order.total, String(body.customerName || order.cliente.nome), body.customerEmail, body.customerCpf));
    }
    if (method === 'POST' && path === '/payments/card/process') return json(await paymentGatewayService.processCardPayment(body));
    const paymentStatus = path.match(/^\/payments\/status\/([^/]+)$/);
    if (method === 'GET' && paymentStatus) {
      const transaction = await paymentGatewayService.getTransactionStatus(decodeURIComponent(paymentStatus[1]));
      return transaction ? json({ sucesso: true, transaction, isPaid: transaction.status === 'approved' }) : json({ sucesso: false, mensagem: 'Transação não encontrada.' }, 404);
    }
    const simulatePayment = path.match(/^\/payments\/simulate-paid\/([^/]+)$/);
    if (method === 'POST' && simulatePayment) return json(await paymentGatewayService.simulateApprovePayment(decodeURIComponent(simulatePayment[1])));

    const webhook = path.match(/^\/webhooks\/(mercadopago|efi|asaas|infinitepay)$/);
    if (method === 'POST' && webhook) {
      const providerMap: Record<string, GatewayProvider> = { mercadopago: 'mercadopago', efi: 'efi_gerencianet', asaas: 'asaas', infinitepay: 'infinitepay' };
      const provider = providerMap[webhook[1]];
      const signaturePayload = webhook[1] === 'mercadopago' ? { ...body, _queryDataId: url.searchParams.get('data.id') } : body;
      if (!paymentGatewayService.verifyWebhookSignature(provider, raw, Object.fromEntries(request.headers.entries()), signaturePayload)) return json({ received: false, mensagem: 'Assinatura inválida.' }, 401);
      if (provider === 'mercadopago') return json(await paymentGatewayService.handleMercadoPagoWebhook(body, Object.fromEntries(url.searchParams.entries())));
      if (provider === 'efi_gerencianet') return json(await paymentGatewayService.handleEfiWebhook(body));
      if (provider === 'asaas') return json(await paymentGatewayService.handleAsaasWebhook(body));
      return json(await paymentGatewayService.handleInfinitePayWebhook(body));
    }

    return json({ sucesso: false, mensagem: 'Rota não encontrada.' }, 404);
  } catch (error) {
    console.error('API Next.js:', error);
    return json({ sucesso: false, mensagem: 'Erro interno ao processar a solicitação.' }, 500);
  }
}

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handler(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return dispatch(request, params.path || []);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
