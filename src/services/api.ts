import { MenuItem, CrustOption, ExtraOption, BairroDelivery, OrderPayload, OrderResponse } from '../types/index.ts';

export const ADMIN_SESSION_KEY = 'gordeixos_admin_session';

const getAdminToken = () => {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY) || sessionStorage.getItem(ADMIN_SESSION_KEY) || 'null')?.accessToken || '';
  } catch {
    return '';
  }
};

const adminFetch = (input: RequestInfo | URL, init: RequestInit = {}) => fetch(input, {
  ...init,
  headers: { ...init.headers, Authorization: `Bearer ${getAdminToken()}` }
});

export const loginAdmin = async (email: string, password: string, remember: boolean) => {
  const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.mensagem || 'Não foi possível entrar.');
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(ADMIN_SESSION_KEY, JSON.stringify(data.session));
  return data.session;
};

export const validateAdminSession = async () => {
  const response = await adminFetch('/api/auth/session');
  if (!response.ok) throw new Error('Sessão expirada.');
  return response.json();
};

export const logoutAdmin = () => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
};

export interface MenuApiResponse {
  sucesso: boolean;
  totalItens: number;
  categorias: { id: string; nome: string; icon: string }[];
  produtos: MenuItem[];
  bordas: CrustOption[];
  adicionais: ExtraOption[];
  cupons: { code: string; description: string; minOrder: number }[];
}

export interface BairrosApiResponse {
  sucesso: boolean;
  regiaoAtendida: string;
  bairros: BairroDelivery[];
}

export const fetchMenuData = async (categoria?: string, busca?: string): Promise<MenuApiResponse> => {
  const params = new URLSearchParams();
  if (categoria && categoria !== 'todos') params.append('categoria', categoria);
  if (busca && busca.trim().length > 0) params.append('busca', busca.trim());

  const url = `/api/menu${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro ao buscar cardápio: ${response.statusText}`);
  }
  return response.json();
};

export const fetchBairrosData = async (): Promise<BairrosApiResponse> => {
  const response = await fetch('/api/bairros');
  if (!response.ok) {
    throw new Error(`Erro ao buscar bairros de entrega: ${response.statusText}`);
  }
  return response.json();
};

export const sendOrderToBackend = async (payload: OrderPayload): Promise<OrderResponse> => {
  const response = await fetch('/api/pedidos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.mensagem || data.erro || 'Falha ao processar pedido.');
  }
  return data;
};

export const fetchOrderStatus = async (pedidoId: string) => {
  const response = await fetch(`/api/pedidos/${pedidoId}/status`);
  if (!response.ok) {
    throw new Error('Falha ao obter status do pedido.');
  }
  return response.json();
};

// ==========================================
// --- ADMIN & KDS SERVICES ---
// ==========================================

export const fetchAdminOrders = async (status?: string) => {
  const url = status && status !== 'todos' ? `/api/admin/pedidos?status=${status}` : '/api/admin/pedidos';
  const response = await adminFetch(url);
  if (!response.ok) throw new Error('Falha ao carregar pedidos da cozinha.');
  return response.json();
};

export const updateOrderStatus = async (orderId: string, status: string, note?: string, motoboyNome?: string) => {
  const response = await adminFetch(`/api/admin/pedidos/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note, motoboyNome })
  });
  if (!response.ok) throw new Error('Falha ao atualizar status do pedido.');
  return response.json();
};

export const createMockOrder = async () => {
  const response = await adminFetch('/api/admin/pedidos/mock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) throw new Error('Falha ao gerar pedido simulado.');
  return response.json();
};

export const toggleProductAvailability = async (productId: string, available?: boolean) => {
  const response = await adminFetch(`/api/admin/menu/${productId}/toggle`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ available })
  });
  if (!response.ok) throw new Error('Falha ao alterar disponibilidade do produto.');
  return response.json();
};

export const updateProductDetails = async (productId: string, updates: Partial<MenuItem>) => {
  const response = await adminFetch(`/api/admin/menu/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!response.ok) throw new Error('Falha ao salvar produto.');
  return response.json();
};

export const createMenuItem = async (productData: Partial<MenuItem>) => {
  const response = await adminFetch('/api/admin/menu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.mensagem || 'Falha ao cadastrar novo produto/sabor.');
  }
  return response.json();
};

export const deleteMenuItem = async (productId: string) => {
  const response = await adminFetch(`/api/admin/menu/${encodeURIComponent(productId)}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Falha ao excluir produto.');
  return response.json();
};

export const toggleCrustAvailability = async (crustId: string, available?: boolean) => {
  const response = await adminFetch(`/api/admin/bordas/${crustId}/toggle`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ available })
  });
  if (!response.ok) throw new Error('Falha ao alterar status da borda.');
  return response.json();
};

export const updateCrustDetails = async (crustId: string, updates: Partial<CrustOption>) => {
  const response = await adminFetch(`/api/admin/bordas/${crustId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!response.ok) throw new Error('Falha ao atualizar borda.');
  return response.json();
};

export const fetchAdminCoupons = async () => {
  const response = await adminFetch('/api/admin/cupons');
  if (!response.ok) throw new Error('Falha ao buscar cupons.');
  return response.json();
};

export const saveAdminCoupon = async (coupon: {
  code: string;
  description: string;
  discountPercent?: number;
  discountAmount?: number;
  minOrder: number;
  active: boolean;
}) => {
  const response = await adminFetch('/api/admin/cupons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(coupon)
  });
  if (!response.ok) throw new Error('Falha ao salvar cupom.');
  return response.json();
};

export const deleteAdminCoupon = async (code: string) => {
  const response = await adminFetch(`/api/admin/cupons/${encodeURIComponent(code)}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Falha ao excluir cupom.');
  return response.json();
};

export const toggleAdminCoupon = async (code: string, active?: boolean) => {
  const response = await adminFetch(`/api/admin/cupons/${encodeURIComponent(code)}/toggle`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active })
  });
  if (!response.ok) throw new Error('Falha ao alternar status do cupom.');
  return response.json();
};

export const fetchAdminBairros = async () => {
  const response = await adminFetch('/api/admin/bairros');
  if (!response.ok) throw new Error('Falha ao buscar bairros de entrega.');
  return response.json();
};

export const createAdminBairro = async (bairro: {
  nome: string;
  taxaEntrega: number;
  tempoMin: number;
  tempoMax: number;
  freteGratisMin?: number;
  ativo: boolean;
}) => {
  const response = await adminFetch('/api/admin/bairros', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bairro)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.mensagem || 'Falha ao cadastrar nova região do DF.');
  }
  return response.json();
};

export const updateAdminBairro = async (id: string, updates: Partial<BairroDelivery>) => {
  const response = await adminFetch(`/api/admin/bairros/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!response.ok) throw new Error('Falha ao salvar taxa do bairro.');
  return response.json();
};

export const deleteAdminBairro = async (id: string) => {
  const response = await adminFetch(`/api/admin/bairros/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Falha ao excluir região.');
  return response.json();
};

export const toggleAdminBairro = async (id: string, ativo?: boolean) => {
  const response = await adminFetch(`/api/admin/bairros/${id}/toggle`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ativo })
  });
  if (!response.ok) throw new Error('Falha ao alterar atendimento do bairro.');
  return response.json();
};

export const fetchAdminStats = async () => {
  const response = await adminFetch('/api/admin/stats');
  if (!response.ok) throw new Error('Falha ao obter estatísticas.');
  return response.json();
};

// ==========================================
// GATEWAYS DE PAGAMENTO API (PASSO 2)
// ==========================================

export const fetchGatewaysConfig = async () => {
  const response = await adminFetch('/api/admin/gateways');
  if (!response.ok) throw new Error('Falha ao obter configuração de gateways de pagamento.');
  return response.json();
};

export const saveGatewaysConfig = async (config: any) => {
  const response = await adminFetch('/api/admin/gateways', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.mensagem || 'Falha ao salvar configurações de pagamento.');
  }
  return response.json();
};

export const testGatewayConnection = async (provider: string) => {
  const response = await adminFetch('/api/admin/gateways/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider })
  });
  if (!response.ok) throw new Error('Falha ao testar conexão com o gateway.');
  return response.json();
};

export const createPixPayment = async (data: {
  orderId: string;
  paymentToken: string;
  amount: number;
  customerName: string;
  customerEmail?: string;
  customerCpf?: string;
}) => {
  const response = await fetch('/api/payments/pix/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.mensagem || 'Falha ao gerar cobrança PIX.');
  }
  return response.json();
};

export const processCardPayment = async (data: {
  orderId: string;
  paymentToken: string;
  demoToken: string;
  cardLast4: string;
  cardBrand: string;
  installments: number;
}) => {
  const response = await fetch('/api/payments/card/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.mensagem || 'Falha ao processar pagamento com cartão.');
  }
  return response.json();
};

export const fetchPaymentStatus = async (transactionId: string, orderId: string, paymentToken: string) => {
  const params = new URLSearchParams({ orderId, paymentToken });
  const response = await fetch(`/api/payments/status/${encodeURIComponent(transactionId)}?${params}`);
  if (!response.ok) throw new Error('Falha ao verificar status da transação.');
  return response.json();
};

export const simulatePaymentApproval = async (transactionId: string, orderId: string, paymentToken: string) => {
  const response = await fetch(`/api/payments/simulate-paid/${encodeURIComponent(transactionId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, paymentToken })
  });
  if (!response.ok) throw new Error('Falha ao simular aprovação do pagamento.');
  return response.json();
};


// ==========================================
// IMPRESSORAS TÉRMICAS ESC/POS
// ==========================================

import type { PrintersSettings, PrintJobResult, KitchenOrder } from '../types/index.ts';

const PRINTERS_STORAGE_KEY = 'gordeixos_printers_config';

/** Retorna configuração padrão de impressoras */
export const getDefaultPrintersSettings = (): PrintersSettings => ({
  balcao: {
    enabled: false,
    ip: '',
    port: 9100,
    paperWidth: '80mm',
    name: 'Balcao / Atendimento',
    autoCut: true
  },
  cozinha: {
    enabled: false,
    ip: '',
    port: 9100,
    paperWidth: '80mm',
    name: 'Cozinha / Forno',
    autoCut: true
  },
  autoprint: false,
  autoprintTarget: 'cozinha'
});

/** Carrega configuração de impressoras do localStorage */
export const loadPrintersSettings = (): PrintersSettings => {
  try {
    const raw = localStorage.getItem(PRINTERS_STORAGE_KEY);
    if (!raw) return getDefaultPrintersSettings();
    return { ...getDefaultPrintersSettings(), ...JSON.parse(raw) };
  } catch {
    return getDefaultPrintersSettings();
  }
};

/** Salva configuração de impressoras no localStorage */
export const savePrintersSettings = (settings: PrintersSettings): void => {
  localStorage.setItem(PRINTERS_STORAGE_KEY, JSON.stringify(settings));
};

/** Envia job de impressão para a API /api/print (que abre socket TCP para a impressora) */
export const sendToPrinter = async (
  target: 'balcao' | 'cozinha',
  order: KitchenOrder
): Promise<PrintJobResult> => {
  const settings = loadPrintersSettings();
  const printerCfg = target === 'balcao' ? settings.balcao : settings.cozinha;

  if (!printerCfg.enabled) {
    return {
      sucesso: false,
      mensagem: `Impressora de ${target === 'balcao' ? 'Balcão' : 'Cozinha'} está desabilitada. Ative-a nas configurações.`,
      target
    };
  }

  if (!printerCfg.ip || !printerCfg.ip.trim()) {
    return {
      sucesso: false,
      mensagem: `IP da impressora de ${target === 'balcao' ? 'Balcão' : 'Cozinha'} não configurado.`,
      target
    };
  }

  const response = await fetch('/api/print', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target,
      order,
      paperWidth: printerCfg.paperWidth,
      printerIp: printerCfg.ip,
      printerPort: printerCfg.port,
      autoCut: printerCfg.autoCut
    })
  });

  return response.json();
};

/** Envia uma página de teste para a impressora */
export const testPrinterConnection = async (
  target: 'balcao' | 'cozinha'
): Promise<PrintJobResult> => {
  const settings = loadPrintersSettings();
  const printerCfg = target === 'balcao' ? settings.balcao : settings.cozinha;

  if (!printerCfg.ip || !printerCfg.ip.trim()) {
    return {
      sucesso: false,
      mensagem: 'Configure o IP da impressora antes de testar.',
      target
    };
  }

  const response = await fetch('/api/print', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target,
      isTest: true,
      printerName: printerCfg.name,
      paperWidth: printerCfg.paperWidth,
      printerIp: printerCfg.ip,
      printerPort: printerCfg.port,
      autoCut: printerCfg.autoCut
    })
  });

  return response.json();
};

