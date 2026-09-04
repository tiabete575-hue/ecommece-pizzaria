export interface ProductSize {
  id: 'broto' | 'media' | 'grande' | 'familia';
  name: string;
  slices: number;
  price: number;
  description: string;
}

export interface CrustOption {
  id: string;
  name: string;
  price: number;
  category: 'salgada' | 'doce' | 'especial';
  description?: string;
  available?: boolean;
}

export interface ExtraOption {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'tradicionais' | 'especiais' | 'doces' | 'parmegianas' | 'bebidas' | 'combos';
  description: string;
  basePrice: number;
  image: string;
  isPizza: boolean;
  sizes?: ProductSize[];
  popular?: boolean;
  isNew?: boolean;
  vegetarian?: boolean;
  tags?: string[];
  available?: boolean;
}

export interface AdminCoupon {
  code: string;
  description: string;
  discountPercent?: number;
  discountAmount?: number;
  minOrder: number;
  active: boolean;
}

export type KitchenStatus = 'pending_payment' | 'recebido' | 'preparando' | 'saiu_entrega' | 'pronto_retirada' | 'concluido' | 'cancelado';

export interface KitchenOrder {
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
  status: KitchenStatus;
  statusHistory?: { status: KitchenStatus; timestamp: number; note?: string }[];
  pixChave?: string;
  pixQrPayload?: string;
  motoboyNome?: string;
  observacoesInternas?: string;
}

export interface BairroDelivery {
  id: string;
  nome: string;
  regiao: string;
  taxaEntrega: number;
  tempoMin: number;
  tempoMax: number;
  freteGratisMin?: number;
  ativo: boolean;
}

export interface CartItem {
  cartId: string;
  productId: string;
  name: string;
  category: string;
  isPizza: boolean;
  size?: ProductSize;
  isHalfHalf?: boolean;
  secondFlavor?: {
    id: string;
    name: string;
    basePrice: number;
    description: string;
  };
  crust?: CrustOption;
  extras?: ExtraOption[];
  observations?: string;
  unitPrice: number;
  quantity: number;
  image: string;
}

export interface OrderItemPayload {
  productId: string;
  name: string;
  category: string;
  sizeId?: string;
  sizeName?: string;
  isHalfHalf?: boolean;
  secondFlavorId?: string;
  secondFlavorName?: string;
  crustId?: string;
  crustName?: string;
  extras?: { id: string; name: string; price: number }[];
  observations?: string;
  unitPrice: number;
  quantity: number;
}

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'cartao_online';

export interface OrderCustomer {
  nome: string;
  whatsapp: string;
  tipoEntrega: 'delivery' | 'retirada';
  cep?: string;
  bairroId?: string;
  bairroNome?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  referencia?: string;
  formaPagamento: PaymentMethod;
  trocoPara?: number;
  cupom?: string;
}

export interface OrderPayload {
  cliente: OrderCustomer;
  itens: OrderItemPayload[];
}

export type GatewayProvider = 'simulated' | 'mercadopago' | 'efi_gerencianet' | 'asaas' | 'infinitepay';

export interface MercadoPagoCredentials {
  accessToken: string;
  publicKey: string;
  clientId?: string;
  clientSecret?: string;
  webhookSecret?: string;
}

export interface EfiCredentials {
  clientId: string;
  clientSecret: string;
  pixKey: string;
  certBase64?: string;
}

export interface AsaasCredentials {
  apiKey: string;
  walletId?: string;
  webhookSecret?: string;
}

export interface InfinitePayCredentials {
  apiKey: string;
  handle?: string;
  merchantId?: string;
}

export interface GatewaysConfig {
  activeGateway: GatewayProvider;
  sandboxMode: boolean;
  mercadopago: MercadoPagoCredentials;
  efi: EfiCredentials;
  asaas: AsaasCredentials;
  infinitepay: InfinitePayCredentials;
  autoApproveMinutes?: number;
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded' | 'expired';

export interface PaymentTransaction {
  id: string;
  orderId: string;
  gateway: GatewayProvider;
  method: 'pix' | 'credit_card';
  amount: number;
  status: PaymentStatus;
  createdAt: number;
  updatedAt: number;
  paidAt?: number;
  pixCopiaECola?: string;
  pixQrCodeBase64?: string;
  pixExpirationDate?: string;
  cardLast4?: string;
  cardBrand?: string;
  installments?: number;
  gatewayTransactionId?: string;
  errorMessage?: string;
}

export interface PixPaymentResponse {
  sucesso: boolean;
  mensagem: string;
  transactionId: string;
  orderId: string;
  status: PaymentStatus;
  amount: number;
  pixCopiaECola: string;
  pixQrCodeBase64: string;
  expiresAt: number; // timestamp
  gateway: GatewayProvider;
  isSandbox: boolean;
}

export interface CardPaymentPayload {
  orderId: string;
  demoToken: string;
  cardLast4: string;
  cardBrand: string;
  installments: number;
}

export interface CardPaymentResponse {
  sucesso: boolean;
  mensagem: string;
  transactionId: string;
  orderId: string;
  status: PaymentStatus;
  amount: number;
  cardBrand?: string;
  cardLast4?: string;
  installments?: number;
  gateway: GatewayProvider;
  isSandbox: boolean;
  erro?: string;
}

// ==========================================
// CONFIGURAÇÃO DE IMPRESSORAS TÉRMICAS ESC/POS
// ==========================================

export interface PrinterConfig {
  enabled: boolean;
  ip: string;
  port: number;           // padrão: 9100 (RAW/ESC-POS)
  paperWidth: '80mm' | '58mm';
  name: string;
  autoCut: boolean;       // comando GS V (guilhotina automática)
}

export interface PrintersSettings {
  balcao: PrinterConfig;   // Impressora do balcão/expedição (cupom completo)
  cozinha: PrinterConfig;  // Impressora da cozinha (comanda sem valores)
  autoprint: boolean;      // Imprimir automaticamente ao receber novo pedido
  autoprintTarget: 'cozinha' | 'ambas'; // Para qual impressora enviar automaticamente
}

export interface PrintJobPayload {
  target: 'balcao' | 'cozinha';
  order: KitchenOrder;
  paperWidth: '80mm' | '58mm';
  printerIp: string;
  printerPort: number;
  autoCut: boolean;
}

export interface PrintJobResult {
  sucesso: boolean;
  mensagem: string;
  target: 'balcao' | 'cozinha';
  ip?: string;
}

export interface OrderResponse {
  sucesso: boolean;
  mensagem: string;
  pedido?: {
    id: string;
    numeroPedido: string;
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
    status: 'pending_payment' | 'recebido' | 'preparando' | 'saiu_entrega' | 'pronto_retirada' | 'concluido' | 'cancelado';
    pago?: boolean;
    statusPagamento?: 'pendente' | 'pago' | 'cancelado';
    isPagoOnline?: boolean;
    formaPagamento?: PaymentMethod;
    pixChave?: string;
    pixQrPayload?: string;
    pixTransactionId?: string;
    /** Token secreto devolvido ao cliente na criação do pedido.
     *  Obrigatório para todas as operações de pagamento (PIX, cartão, simulate).
     *  Presente apenas em pedidos com pagamento online (PIX / cartão_online).
     */
    paymentToken?: string;
  };
  erro?: string;
}

