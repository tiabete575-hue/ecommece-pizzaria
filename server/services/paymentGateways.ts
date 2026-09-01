import QRCode from 'qrcode';
import crypto from 'crypto';
import type {
  GatewaysConfig,
  GatewayProvider,
  PaymentTransaction,
  PaymentStatus,
  PixPaymentResponse,
  CardPaymentPayload,
  CardPaymentResponse
} from '../../src/types/index.ts';
import { restaurantStore } from '../data/store.ts';
import { supabaseRest } from '../lib/supabase.ts';

// Helper to calculate Pix CRC16-CCITT according to BCB EMVCo standard
export function calculatePixCRC16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    const byte = payload.charCodeAt(i);
    for (let bit = 0; bit < 8; bit++) {
      const bitVal = (byte >> (7 - bit)) & 1;
      const c15 = (crc >> 15) & 1;
      crc <<= 1;
      if ((c15 ^ bitVal) !== 0) {
        crc ^= polynomial;
      }
    }
  }

  crc &= 0xffff;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Generate valid EMVCo BR Code (Pix Copia e Cola)
export function generatePixCopiaECola(
  chave: string,
  beneficiario: string,
  cidade: string,
  valor: number,
  txid: string
): string {
  const cleanChave = chave.trim();
  const cleanBeneficiario = beneficiario.substring(0, 25).trim();
  const cleanCidade = cidade.substring(0, 15).trim();
  const cleanTxid = txid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || '***';
  const formattedValor = valor.toFixed(2);

  // Field 26: Merchant Account Information
  const gui = '0014br.gov.bcb.pix';
  const keyField = `01${cleanChave.length.toString().padStart(2, '0')}${cleanChave}`;
  const f26Content = `${gui}${keyField}`;
  const f26 = `26${f26Content.length.toString().padStart(2, '0')}${f26Content}`;

  // Field 52: Merchant Category Code (0000 = general)
  const f52 = '52040000';
  // Field 53: Transaction Currency (986 = BRL)
  const f53 = '5303986';
  // Field 54: Transaction Amount
  const f54 = `54${formattedValor.length.toString().padStart(2, '0')}${formattedValor}`;
  // Field 58: Country Code (BR)
  const f58 = '5802BR';
  // Field 59: Merchant Name
  const f59 = `59${cleanBeneficiario.length.toString().padStart(2, '0')}${cleanBeneficiario}`;
  // Field 60: Merchant City
  const f60 = `60${cleanCidade.length.toString().padStart(2, '0')}${cleanCidade}`;
  // Field 62: Additional Data Field (TXID)
  const f62Content = `05${cleanTxid.length.toString().padStart(2, '0')}${cleanTxid}`;
  const f62 = `62${f62Content.length.toString().padStart(2, '0')}${f62Content}`;

  // Base payload without CRC
  const rawPayload = `000201${f26}${f52}${f53}${f54}${f58}${f59}${f60}${f62}6304`;
  const checksum = calculatePixCRC16(rawPayload);

  return `${rawPayload}${checksum}`;
}

export class PaymentGatewayService {
  private config: GatewaysConfig;

  constructor() {
    // Initial configuration loaded from environment or defaults
    this.config = {
      activeGateway: (process.env.PAYMENT_ACTIVE_GATEWAY as GatewayProvider) || 'simulated',
      sandboxMode: process.env.PAYMENT_SANDBOX_MODE !== 'false',
      mercadopago: {
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
        publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
        clientId: process.env.MERCADOPAGO_CLIENT_ID || '',
        clientSecret: process.env.MERCADOPAGO_CLIENT_SECRET || '',
        webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || ''
      },
      efi: {
        clientId: process.env.EFI_CLIENT_ID || '',
        clientSecret: process.env.EFI_CLIENT_SECRET || '',
        pixKey: process.env.EFI_PIX_KEY || 'financeiro@gordeixosbrasilia.com.br',
        certBase64: process.env.EFI_CERT_BASE64 || ''
      },
      asaas: {
        apiKey: process.env.ASAAS_API_KEY || '',
        walletId: process.env.ASAAS_WALLET_ID || '',
        webhookSecret: process.env.ASAAS_WEBHOOK_SECRET || ''
      },
      infinitepay: {
        apiKey: process.env.INFINITEPAY_API_KEY || '',
        handle: process.env.INFINITEPAY_HANDLE || '',
        merchantId: process.env.INFINITEPAY_MERCHANT_ID || ''
      },
      autoApproveMinutes: 0.25 // For demo mode
    };
  }

  public async loadPersistedConfig(): Promise<void> {
    const rows = await supabaseRest<any[]>('gateway_settings', {
      query: 'select=provider,active,sandbox,public_config&active=eq.true&limit=1'
    });
    const saved = rows[0];
    if (!saved) return;

    this.config.activeGateway = saved.provider as GatewayProvider;
    this.config.sandboxMode = saved.sandbox !== false;
    const publicConfig = saved.public_config || {};
    if (Number.isFinite(Number(publicConfig.autoApproveMinutes))) {
      this.config.autoApproveMinutes = Number(publicConfig.autoApproveMinutes);
    }
    if (publicConfig.efiPixKey) this.config.efi.pixKey = String(publicConfig.efiPixKey);
    if (publicConfig.infinitepayHandle) this.config.infinitepay.handle = String(publicConfig.infinitepayHandle);
  }

  private async persistPublicConfig(): Promise<void> {
    const stores = await supabaseRest<any[]>('stores', { query: 'select=id&slug=eq.gordeixos-brasilia&limit=1' });
    const storeId = stores[0]?.id;
    if (!storeId) throw new Error('Loja principal não encontrada para salvar o gateway.');

    await supabaseRest('gateway_settings', {
      method: 'PATCH',
      query: `store_id=eq.${encodeURIComponent(storeId)}`,
      body: { active: false }
    });
    await supabaseRest('gateway_settings', {
      method: 'POST',
      query: 'on_conflict=store_id,provider',
      prefer: 'resolution=merge-duplicates,return=representation',
      body: {
        store_id: storeId,
        provider: this.config.activeGateway,
        active: true,
        sandbox: this.config.sandboxMode,
        public_config: {
          autoApproveMinutes: this.config.autoApproveMinutes,
          efiPixKey: this.config.efi.pixKey,
          infinitepayHandle: this.config.infinitepay.handle
        }
      }
    });
  }

  // Get Safe Config (Mask Sensitive Keys for UI)
  public getSafeConfig(): GatewaysConfig {
    const mask = (str?: string) => {
      if (!str || str.length < 8) return str ? '••••••••' : '';
      return `${str.substring(0, 4)}••••••••${str.substring(str.length - 4)}`;
    };

    return {
      activeGateway: this.config.activeGateway,
      sandboxMode: this.config.sandboxMode,
      autoApproveMinutes: this.config.autoApproveMinutes,
      mercadopago: {
        accessToken: mask(this.config.mercadopago.accessToken),
        publicKey: mask(this.config.mercadopago.publicKey),
        clientId: mask(this.config.mercadopago.clientId),
        clientSecret: mask(this.config.mercadopago.clientSecret),
        webhookSecret: mask(this.config.mercadopago.webhookSecret)
      },
      efi: {
        clientId: mask(this.config.efi.clientId),
        clientSecret: mask(this.config.efi.clientSecret),
        pixKey: this.config.efi.pixKey,
        certBase64: this.config.efi.certBase64 ? 'CERTIFICADO_CONFIGURADO' : ''
      },
      asaas: {
        apiKey: mask(this.config.asaas.apiKey),
        walletId: mask(this.config.asaas.walletId),
        webhookSecret: mask(this.config.asaas.webhookSecret)
      },
      infinitepay: {
        apiKey: mask(this.config.infinitepay.apiKey),
        handle: this.config.infinitepay.handle,
        merchantId: mask(this.config.infinitepay.merchantId)
      }
    };
  }

  // Update Config (Preserve unedited masked keys)
  public async updateConfig(newConfig: Partial<GatewaysConfig>) {
    if (newConfig.activeGateway) this.config.activeGateway = newConfig.activeGateway;
    if (newConfig.sandboxMode !== undefined) this.config.sandboxMode = newConfig.sandboxMode;
    if (newConfig.autoApproveMinutes !== undefined) this.config.autoApproveMinutes = newConfig.autoApproveMinutes;

    const unmask = (newVal?: string, oldVal?: string) => {
      if (!newVal) return '';
      if (newVal.includes('••••')) return oldVal || '';
      return newVal;
    };

    if (newConfig.mercadopago) {
      this.config.mercadopago = {
        accessToken: unmask(newConfig.mercadopago.accessToken, this.config.mercadopago.accessToken),
        publicKey: unmask(newConfig.mercadopago.publicKey, this.config.mercadopago.publicKey),
        clientId: unmask(newConfig.mercadopago.clientId, this.config.mercadopago.clientId),
        clientSecret: unmask(newConfig.mercadopago.clientSecret, this.config.mercadopago.clientSecret),
        webhookSecret: unmask(newConfig.mercadopago.webhookSecret, this.config.mercadopago.webhookSecret)
      };
    }

    if (newConfig.efi) {
      this.config.efi = {
        clientId: unmask(newConfig.efi.clientId, this.config.efi.clientId),
        clientSecret: unmask(newConfig.efi.clientSecret, this.config.efi.clientSecret),
        pixKey: newConfig.efi.pixKey || this.config.efi.pixKey,
        certBase64: newConfig.efi.certBase64 === 'CERTIFICADO_CONFIGURADO' ? this.config.efi.certBase64 : (newConfig.efi.certBase64 || '')
      };
    }

    if (newConfig.asaas) {
      this.config.asaas = {
        apiKey: unmask(newConfig.asaas.apiKey, this.config.asaas.apiKey),
        walletId: unmask(newConfig.asaas.walletId, this.config.asaas.walletId),
        webhookSecret: unmask(newConfig.asaas.webhookSecret, this.config.asaas.webhookSecret)
      };
    }

    if (newConfig.infinitepay) {
      this.config.infinitepay = {
        apiKey: unmask(newConfig.infinitepay.apiKey, this.config.infinitepay.apiKey),
        handle: newConfig.infinitepay.handle || this.config.infinitepay.handle,
        merchantId: unmask(newConfig.infinitepay.merchantId, this.config.infinitepay.merchantId)
      };
    }

    await this.persistPublicConfig();
    return this.getSafeConfig();
  }

  // Test Gateway Connection with provider API
  public async testGatewayConnection(provider: GatewayProvider): Promise<{ ok: boolean; message: string; details?: any }> {
    try {
      if (provider === 'simulated') {
        return {
          ok: true,
          message: 'Modo Simulação & Sandbox está ativo e funcionando com aprovação instantânea.'
        };
      }

      if (provider === 'mercadopago') {
        const token = this.config.mercadopago.accessToken;
        if (!token) {
          return { ok: false, message: 'Access Token do Mercado Pago não informado.' };
        }
        // Test call to Mercado Pago users/me or payment_methods
        const res = await fetch('https://api.mercadopago.com/v1/payment_methods', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const methods = await res.json();
          return { ok: true, message: `Mercado Pago conectado com sucesso! ${methods.length || 0} métodos de pagamento disponíveis.` };
        } else {
          const errData = await res.json().catch(() => ({}));
          return { ok: false, message: `Erro ao autenticar no Mercado Pago: ${errData.message || res.statusText}` };
        }
      }

      if (provider === 'asaas') {
        const apiKey = this.config.asaas.apiKey;
        if (!apiKey) {
          return { ok: false, message: 'API Key do Asaas não configurada.' };
        }
        const baseUrl = this.config.sandboxMode ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';
        const res = await fetch(`${baseUrl}/finance/balance`, {
          headers: { access_token: apiKey }
        });
        if (res.ok) {
          return { ok: true, message: `Asaas (${this.config.sandboxMode ? 'Sandbox' : 'Produção'}) conectado com sucesso!` };
        } else {
          const err = await res.json().catch(() => ({}));
          return { ok: false, message: `Erro ao conectar ao Asaas: ${err.errors?.[0]?.description || res.statusText}` };
        }
      }

      if (provider === 'efi_gerencianet') {
        if (!this.config.efi.clientId || !this.config.efi.clientSecret) {
          return { ok: false, message: 'Client ID ou Client Secret da EFI/Gerencianet não configurados.' };
        }
        return {
          ok: true,
          message: 'Credenciais EFI/Gerencianet salvas. Para ambiente de produção Pix, certifique-se de configurar a Chave Pix e Certificado.'
        };
      }

      if (provider === 'infinitepay') {
        if (!this.config.infinitepay.apiKey) {
          return { ok: false, message: 'API Key da InfinitePay não configurada.' };
        }
        return { ok: true, message: 'Credenciais InfinitePay salvas e prontas para processamento.' };
      }

      return { ok: true, message: 'Gateway pronto para uso.' };
    } catch (err: any) {
      return { ok: false, message: `Erro ao testar gateway: ${err.message || 'Falha na comunicação'}` };
    }
  }

  public verifyWebhookSignature(provider: GatewayProvider, rawBody: Buffer, headers: Record<string, any>, payload: any): boolean {
    if (provider === 'simulated') return false;
    if (provider === 'asaas') return this.safeCompare(String(headers['asaas-access-token'] || ''), this.config.asaas.webhookSecret || '');

    let secret = '';
    let received = '';
    let signedPayload = rawBody.toString('utf8');
    if (provider === 'mercadopago') {
      secret = this.config.mercadopago.webhookSecret || '';
      const signature = String(headers['x-signature'] || '');
      const parts = Object.fromEntries(signature.split(',').map((part) => part.trim().split('=')));
      const requestId = String(headers['x-request-id'] || '');
      const dataId = String(payload?._queryDataId || payload?.data?.id || payload?.id || '').toLowerCase();
      const timestamp = Number(parts.ts || 0);
      if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
      signedPayload = `id:${dataId};request-id:${requestId};ts:${parts.ts || ''};`;
      received = parts.v1 || '';
    } else if (provider === 'efi_gerencianet' || provider === 'infinitepay') return false;
    if (!secret || !received) return false;
    const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
    return this.safeCompare(received, expected);
  }

  private safeCompare(left: string, right: string) {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
  }

  // 1. CREATE DYNAMIC PIX PAYMENT
  public async createPixPayment(
    orderId: string,
    amount: number,
    customerName: string,
    customerEmail?: string,
    customerCpf?: string
  ): Promise<PixPaymentResponse> {
    const txid = `GDX${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`;
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const activeGateway = this.config.activeGateway;
    const isSandbox = this.config.sandboxMode || activeGateway === 'simulated';
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes expiration

    let pixCopiaECola = '';
    let pixQrCodeBase64 = '';

    try {
      // MERCADO PAGO INTEGRATION
      if (activeGateway === 'mercadopago' && this.config.mercadopago.accessToken && !isSandbox) {
        const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.mercadopago.accessToken}`,
            'X-Idempotency-Key': transactionId
          },
          body: JSON.stringify({
            transaction_amount: Number(amount.toFixed(2)),
            description: `Pedido ${orderId} - Gordeixo's Pizzaria Brasília`,
            payment_method_id: 'pix',
            payer: {
              email: customerEmail || 'cliente@gordeixosbrasilia.com.br',
              first_name: customerName.split(' ')[0] || 'Cliente',
              last_name: customerName.split(' ').slice(1).join(' ') || 'Brasília',
              identification: customerCpf ? { type: 'CPF', number: customerCpf.replace(/\D/g, '') } : undefined
            },
            notification_url: `${process.env.APP_URL || ''}/api/webhooks/mercadopago`
          })
        });

        if (mpRes.ok) {
          const mpData = await mpRes.json();
          pixCopiaECola = mpData.point_of_interaction?.transaction_data?.qr_code || '';
          pixQrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64
            ? `data:image/png;base64,${mpData.point_of_interaction.transaction_data.qr_code_base64}`
            : '';
        }
      }

      // ASAAS INTEGRATION
      if (activeGateway === 'asaas' && this.config.asaas.apiKey && !isSandbox) {
        const asaasUrl = 'https://api.asaas.com/v3';
        const asaasRes = await fetch(`${asaasUrl}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            access_token: this.config.asaas.apiKey
          },
          body: JSON.stringify({
            customer: 'cus_default_gordeixos',
            billingType: 'PIX',
            value: amount,
            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            description: `Pedido ${orderId} Pizzaria Gordeixo's`
          })
        });

        if (asaasRes.ok) {
          const asaasPayment = await asaasRes.json();
          const qrRes = await fetch(`${asaasUrl}/payments/${asaasPayment.id}/pixQrCode`, {
            headers: { access_token: this.config.asaas.apiKey }
          });
          if (qrRes.ok) {
            const qrData = await qrRes.json();
            pixCopiaECola = qrData.payload;
            pixQrCodeBase64 = `data:image/png;base64,${qrData.encodedImage}`;
          }
        }
      }

      // FALLBACK & SIMULATED / BR-CODE GENERATION
      if (!pixCopiaECola) {
        const chavePix = this.config.efi.pixKey || 'financeiro@gordeixosbrasilia.com.br';
        pixCopiaECola = generatePixCopiaECola(
          chavePix,
          "GORDEIXOS PIZZARIA",
          'BRASILIA',
          amount,
          txid
        );
      }

      if (!pixQrCodeBase64) {
        pixQrCodeBase64 = await QRCode.toDataURL(pixCopiaECola, {
          width: 320,
          margin: 2,
          color: { dark: '#020617', light: '#ffffff' },
          errorCorrectionLevel: 'M'
        });
      }

      const [payment] = await supabaseRest<any[]>('payments', { method: 'POST', body: {
        order_id: orderId,
        idempotency_key: transactionId,
        provider: activeGateway,
        provider_transaction_id: txid,
        method: 'pix', status: 'pending', amount,
        pix_copy_paste: pixCopiaECola,
        pix_expires_at: new Date(expiresAt).toISOString(),
        metadata: { demo: isSandbox }
      } });
      const transaction: PaymentTransaction = {
        id: payment.id,
        orderId,
        gateway: activeGateway,
        method: 'pix',
        amount,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pixCopiaECola,
        pixQrCodeBase64,
        pixExpirationDate: new Date(expiresAt).toISOString(),
        gatewayTransactionId: txid
      };

      return {
        sucesso: true,
        mensagem: 'Cobrança PIX Dinâmica gerada com sucesso!',
        transactionId: payment.id,
        orderId,
        status: 'pending',
        amount,
        pixCopiaECola,
        pixQrCodeBase64,
        expiresAt,
        gateway: activeGateway,
        isSandbox
      };
    } catch (err: any) {
      console.error('Erro ao gerar Pix Dinâmico:', err);
      // Generate guaranteed fallback so user experience is never broken
      const chavePix = this.config.efi.pixKey || 'financeiro@gordeixosbrasilia.com.br';
      pixCopiaECola = generatePixCopiaECola(chavePix, "GORDEIXOS PIZZARIA", 'BRASILIA', amount, txid);
      pixQrCodeBase64 = await QRCode.toDataURL(pixCopiaECola, { width: 320, margin: 2 });

      const [payment] = await supabaseRest<any[]>('payments', { method: 'POST', body: {
        order_id: orderId, idempotency_key: transactionId, provider: 'simulated', method: 'pix', status: 'pending', amount,
        pix_copy_paste: pixCopiaECola, pix_expires_at: new Date(expiresAt).toISOString(), metadata: { demo: true }
      } });
      const transaction: PaymentTransaction = {
        id: payment.id,
        orderId,
        gateway: 'simulated',
        method: 'pix',
        amount,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pixCopiaECola,
        pixQrCodeBase64,
        pixExpirationDate: new Date(expiresAt).toISOString()
      };

      return {
        sucesso: true,
        mensagem: 'PIX Instantâneo gerado com sucesso.',
        transactionId: payment.id,
        orderId,
        status: 'pending',
        amount,
        pixCopiaECola,
        pixQrCodeBase64,
        expiresAt,
        gateway: 'simulated',
        isSandbox: true
      };
    }
  }

  // 2. PROCESS ONLINE CARD PAYMENT
  public async processCardPayment(payload: CardPaymentPayload): Promise<CardPaymentResponse> {
    const { orderId, demoToken, cardLast4, cardBrand, installments } = payload;
    const order = restaurantStore.getOrderById(orderId);
    const amount = order?.total || 0;
    const transactionId = `tx_card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const activeGateway = this.config.activeGateway;
    const isSandbox = this.config.sandboxMode || activeGateway === 'simulated';

    if (!order || !demoToken.startsWith('demo_') || !/^\d{4}$/.test(cardLast4)) {
      return {
        sucesso: false,
        mensagem: 'Número de cartão inválido.',
        transactionId,
        orderId,
        status: 'rejected',
        amount,
        gateway: activeGateway,
        isSandbox,
        erro: 'CARTAO_INVALIDO'
      };
    }

    if (!isSandbox) {
      return { sucesso: false, mensagem: 'Cartão online real ainda não está habilitado. Ative o modo demonstração ou integre a tokenização do gateway.', transactionId, orderId, status: 'rejected', amount, gateway: activeGateway, isSandbox, erro: 'TOKENIZACAO_NAO_CONFIGURADA' };
    }

    // Approve transaction
    const transaction: PaymentTransaction = {
      id: transactionId,
      orderId,
      gateway: activeGateway,
      method: 'credit_card',
      amount,
      status: 'approved',
      paidAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      cardLast4,
      cardBrand,
      installments: installments || 1
    };

    const [payment] = await supabaseRest<any[]>('payments', { method: 'POST', body: {
      order_id: orderId, idempotency_key: transactionId, provider: activeGateway, method: 'credit_card', status: 'paid', amount,
      installments: installments || 1, card_last4: cardLast4, card_brand: cardBrand, paid_at: new Date().toISOString(), metadata: { demo: true, demo_token: demoToken }
    } });
    transaction.id = payment.id;

    // Update order in kitchen store
    await this.markOrderAsPaid(orderId, 'credit_card', payment.id);

    return {
      sucesso: true,
      mensagem: 'Pagamento no cartão de crédito aprovado com sucesso!',
      transactionId: payment.id,
      orderId,
      status: 'approved',
      amount,
      cardBrand,
      cardLast4,
      installments: installments || 1,
      gateway: activeGateway,
      isSandbox
    };
  }

  // 3. GET TRANSACTION STATUS (Polling or Check)
  public async getTransactionStatus(transactionId: string): Promise<PaymentTransaction | null> {
    const rows = await supabaseRest<any[]>('payments', { query: `select=*&id=eq.${encodeURIComponent(transactionId)}&limit=1` });
    return rows[0] ? this.mapPayment(rows[0]) : null;
  }

  // 4. SIMULATE APPROVAL (For immediate demo/testing in sandbox)
  public async simulateApprovePayment(transactionId: string): Promise<{ sucesso: boolean; mensagem: string; transaction?: PaymentTransaction }> {
    if (!this.config.sandboxMode && this.config.activeGateway !== 'simulated') return { sucesso: false, mensagem: 'Aprovação simulada disponível somente no modo demonstração.' };
    const tx = await this.getTransactionStatus(transactionId);
    if (!tx) {
      return { sucesso: false, mensagem: 'Transação não encontrada.' };
    }

    tx.status = 'approved';
    tx.paidAt = Date.now();
    tx.updatedAt = Date.now();
    await supabaseRest('payments', { method: 'PATCH', query: `id=eq.${encodeURIComponent(transactionId)}`, body: { status: 'paid', paid_at: new Date().toISOString() } });

    // Update the actual order status to 'recebido' and mark as paid
    await this.markOrderAsPaid(tx.orderId, tx.method, transactionId);

    return {
      sucesso: true,
      mensagem: 'Pagamento aprovado com sucesso via simulação Sandbox!',
      transaction: tx
    };
  }

  // Helper to mark order as paid and notify kitchen store
  public async markOrderAsPaid(orderId: string, method: string, transactionId: string) {
    try {
      const order = restaurantStore.getOrderById(orderId);
      if (order) {
        await supabaseRest('orders', { method: 'PATCH', query: `id=eq.${encodeURIComponent(order.id)}`, body: { payment_status: 'paid', status: 'received' } });
        (order as any).pago = true;
        (order as any).pagoEm = Date.now();
        (order as any).transacaoId = transactionId;
        (order as any).metodoPagamento = method;
        order.status = 'recebido';
        order.statusHistory.push({
          status: 'recebido',
          timestamp: Date.now(),
          note: `Pagamento ${method === 'pix' ? 'PIX' : 'Cartão'} confirmado pelo Gateway. Pedido liberado para o Forno!`
        });
      }
    } catch (e) {
      console.error('Erro ao atualizar status do pedido no store:', e);
    }
  }

  private mapPayment(payment: any): PaymentTransaction {
    const statusMap: Record<string, any> = { paid: 'approved', authorized: 'approved', pending: 'pending', failed: 'rejected', cancelled: 'rejected', expired: 'expired', refunded: 'refunded' };
    return { id: payment.id, orderId: payment.order_id, gateway: payment.provider, method: payment.method === 'pix' ? 'pix' : 'credit_card', amount: Number(payment.amount), status: statusMap[payment.status] || 'pending', createdAt: Date.parse(payment.created_at), updatedAt: Date.parse(payment.updated_at), paidAt: payment.paid_at ? Date.parse(payment.paid_at) : undefined, pixCopiaECola: payment.pix_copy_paste || undefined, pixExpirationDate: payment.pix_expires_at || undefined, cardLast4: payment.card_last4 || undefined, cardBrand: payment.card_brand || undefined, installments: payment.installments, gatewayTransactionId: payment.provider_transaction_id || undefined };
  }

  // 5. WEBHOOK HANDLER: MERCADO PAGO
  public async handleMercadoPagoWebhook(payload: any, query: any) {
    const id = payload?.data?.id || query?.['data.id'] || payload?.id;
    const type = payload?.type || query?.type || payload?.action;

    if (id && (type === 'payment' || type === 'payment.updated' || type === 'payment.created')) {
      if (this.config.mercadopago.accessToken) {
        try {
          const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
            headers: { Authorization: `Bearer ${this.config.mercadopago.accessToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'approved') {
              const orderRef = data.description?.match(/#?GDX-?[A-Za-z0-9_]+/)?.[0];
              await this.approveByReference(String(id), orderRef);
            }
          }
        } catch (err) {
          console.error('Erro ao consultar pagamento MP no webhook:', err);
        }
      }
    }
    return { received: true };
  }

  // 6. WEBHOOK HANDLER: EFI / GERENCIANET
  public async handleEfiWebhook(payload: any) {
    if (payload?.pix && Array.isArray(payload.pix)) {
      for (const item of payload.pix) {
        const txid = item.txid;
        await this.approveByReference(txid);
      }
    }
    return { received: true };
  }

  // 7. WEBHOOK HANDLER: ASAAS
  public async handleAsaasWebhook(payload: any) {
    if (payload?.event === 'PAYMENT_RECEIVED' || payload?.event === 'PAYMENT_CONFIRMED') {
      const asaasPaymentId = payload.payment?.id;
      await this.approveByReference(asaasPaymentId);
    }
    return { received: true };
  }

  // 8. WEBHOOK HANDLER: INFINITEPAY
  public async handleInfinitePayWebhook(payload: any) {
    if (payload?.status === 'paid' || payload?.event === 'payment.success') {
      const orderId = payload?.order_id || payload?.metadata?.orderId;
      await this.approveByReference(undefined, orderId);
    }
    return { received: true };
  }

  private async approveByReference(providerTransactionId?: string, orderId?: string) {
    const filters = providerTransactionId
      ? `provider_transaction_id=eq.${encodeURIComponent(providerTransactionId)}`
      : `order_id=eq.${encodeURIComponent(orderId || '')}`;
    const rows = await supabaseRest<any[]>('payments', { query: `select=id,order_id,method&${filters}&limit=1` });
    if (rows[0]) {
      await supabaseRest('payments', { method: 'PATCH', query: `id=eq.${rows[0].id}`, body: { status: 'paid', paid_at: new Date().toISOString() } });
      await this.markOrderAsPaid(rows[0].order_id, rows[0].method, rows[0].id);
    }
  }
}

// Global Singleton Instance
export const paymentGatewayService = new PaymentGatewayService();
