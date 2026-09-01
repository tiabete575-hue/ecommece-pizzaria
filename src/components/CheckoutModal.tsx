import React, { useState } from 'react';
import { useCart } from '../context/CartContext.tsx';
import { OrderPayload, OrderResponse, PaymentMethod, PixPaymentResponse } from '../types/index.ts';
import { sendOrderToBackend, createPixPayment, processCardPayment } from '../services/api.ts';
import { PixDynamicPaymentModal } from './PixDynamicPaymentModal.tsx';
import { OnlineCardForm } from './OnlineCardForm.tsx';
import {
  X,
  ArrowLeft,
  MapPin,
  Clock,
  CreditCard,
  QrCode,
  Banknote,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Phone,
  User,
  Home,
  Search,
  Check,
  Building,
  Zap,
  Lock,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CheckoutModal: React.FC = () => {
  const {
    items,
    deliveryType,
    setDeliveryType,
    bairrosList,
    selectedBairroId,
    setSelectedBairroId,
    selectedBairro,
    appliedCoupon,
    subtotal,
    desconto,
    taxaEntrega,
    total,
    isCheckoutOpen,
    setIsCheckoutOpen,
    setIsConfirmationOpen,
    setActiveOrder,
    clearCart
  } = useCart();

  // Form states
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cep, setCep] = useState('');
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [referencia, setReferencia] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<PaymentMethod>('pix');
  const [precisaTroco, setPrecisaTroco] = useState(false);
  const [trocoPara, setTrocoPara] = useState<string>('');

  // Online Card Data State
  const [cardData, setCardData] = useState<{
    cardNumber: string;
    cardholderName: string;
    cardExpMonth: string;
    cardExpYear: string;
    cardCvv: string;
    cpf: string;
    installments: number;
    isValid: boolean;
  }>({
    cardNumber: '',
    cardholderName: '',
    cardExpMonth: '',
    cardExpYear: '',
    cardCvv: '',
    cpf: '',
    installments: 1,
    isValid: false
  });

  // Pix Dynamic State
  const [pixModalData, setPixModalData] = useState<{
    pixData: PixPaymentResponse;
    orderData: OrderResponse['pedido'];
  } | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isCheckoutOpen) return null;

  // Phone masking helper
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);

    if (val.length > 10) {
      val = val.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (val.length > 6) {
      val = val.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    } else if (val.length > 2) {
      val = val.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    }
    setWhatsapp(val);
  };

  // CEP Lookup helper (ViaCEP)
  const lookupCep = async (cleanCep: string) => {
    if (cleanCep.length !== 8) return;
    setIsSearchingCep(true);
    setCepFeedback(null);

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();

      if (data.erro) {
        setCepFeedback({
          type: 'error',
          message: 'CEP não encontrado. Você pode preencher seu endereço manualmente abaixo.'
        });
        return;
      }

      // Preenche logradouro / endereço se disponível
      if (data.logradouro) {
        setEndereco(data.logradouro);
      }
      if (data.complemento && !complemento) {
        setComplemento(data.complemento);
      }

      // Mapeia Bairro / Região do DF correspondente
      const bairroViaCep = (data.bairro || '').toLowerCase();
      const localidadeViaCep = (data.localidade || '').toLowerCase();

      const matchedBairro = bairrosList.find((b) => {
        const bNome = b.nome.toLowerCase();
        const bRegiao = b.regiao.toLowerCase();
        return (
          (bairroViaCep && (bNome.includes(bairroViaCep) || bRegiao.includes(bairroViaCep))) ||
          (bairroViaCep.includes('asa norte') && b.id === 'asa-norte') ||
          (bairroViaCep.includes('asa sul') && b.id === 'asa-sul') ||
          (bairroViaCep.includes('sudoeste') && b.id === 'sudoeste') ||
          (bairroViaCep.includes('octogonal') && b.id === 'sudoeste') ||
          (bairroViaCep.includes('noroeste') && b.id === 'noroeste') ||
          ((bairroViaCep.includes('águas claras') || bairroViaCep.includes('aguas claras')) && b.id === 'aguas-claras') ||
          ((bairroViaCep.includes('guará') || bairroViaCep.includes('guara')) && b.id === 'guara-1-2') ||
          (bairroViaCep.includes('taguatinga') && b.id === 'taguatinga') ||
          (bairroViaCep.includes('vicente pires') && b.id === 'vicente-pires') ||
          (bairroViaCep.includes('lago norte') && b.id === 'lago-norte') ||
          (bairroViaCep.includes('lago sul') && b.id === 'lago-sul') ||
          (bairroViaCep.includes('cruzeiro') && b.id === 'cruzeiro') ||
          (bairroViaCep.includes('park sul') && b.id === 'park-sul') ||
          (bairroViaCep.includes('vila planalto') && b.id === 'vila-planalto')
        );
      });

      if (matchedBairro) {
        setSelectedBairroId(matchedBairro.id);
        setCepFeedback({
          type: 'success',
          message: `Endereço localizado via CEP (${data.bairro || matchedBairro.nome}). Todos os campos continuam editáveis.`
        });
      } else {
        setCepFeedback({
          type: 'info',
          message: `Endereço preenchido (${data.bairro || data.localidade || 'DF'}). Selecione a Região Administrativa correspondente abaixo.`
        });
      }
    } catch {
      setCepFeedback({
        type: 'error',
        message: 'Não foi possível consultar o CEP. Você pode preencher os campos manualmente.'
      });
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.slice(0, 8);

    if (val.length > 5) {
      val = val.replace(/^(\d{5})(\d{1,3})$/, '$1-$2');
    }
    setCep(val);
    setCepFeedback(null);

    const clean = val.replace(/\D/g, '');
    if (clean.length === 8) {
      lookupCep(clean);
    }
  };

  const handleManualCepSearch = () => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length === 8) {
      lookupCep(clean);
    } else {
      setCepFeedback({
        type: 'error',
        message: 'Por favor, digite os 8 números do CEP (ex: 70730-020).'
      });
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validações
    if (!nome.trim() || nome.trim().length < 2) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }

    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Por favor, informe um WhatsApp válido com DDD (ex: (61) 98888-7777).');
      return;
    }

    if (deliveryType === 'delivery') {
      if (!selectedBairroId) {
        setErrorMessage('Selecione a Região Administrativa / Bairro no DF.');
        return;
      }
      if (!endereco.trim() || endereco.trim().length < 4) {
        setErrorMessage('Por favor, preencha o seu endereço no DF (Quadra, Rua ou Avenida).');
        return;
      }
    }

    if (formaPagamento === 'cartao_online' && !cardData.isValid) {
      setErrorMessage('Por favor, preencha todos os dados do cartão de crédito corretamente (Número, Titular, Validade, CVV e CPF).');
      return;
    }

    if (formaPagamento === 'dinheiro' && precisaTroco) {
      const valorTroco = parseFloat(trocoPara.replace(',', '.'));
      if (isNaN(valorTroco) || valorTroco < total) {
        setErrorMessage(`O valor para troco deve ser maior que o total do pedido (R$ ${total.toFixed(2).replace('.', ',')}).`);
        return;
      }
    }

    setIsLoading(true);

    try {
      const orderPayload: OrderPayload = {
        cliente: {
          nome: nome.trim(),
          whatsapp: whatsapp.trim(),
          tipoEntrega: deliveryType,
          cep: cep.trim() ? cep.trim() : undefined,
          bairroId: deliveryType === 'delivery' ? selectedBairroId : undefined,
          bairroNome: deliveryType === 'delivery' ? selectedBairro?.nome : undefined,
          endereco: deliveryType === 'delivery' ? endereco.trim() : undefined,
          numero: deliveryType === 'delivery' ? numero.trim() : undefined,
          complemento: deliveryType === 'delivery' ? complemento.trim() : undefined,
          referencia: deliveryType === 'delivery' ? referencia.trim() : undefined,
          formaPagamento,
          trocoPara: formaPagamento === 'dinheiro' && precisaTroco ? parseFloat(trocoPara.replace(',', '.')) : undefined,
          cupom: appliedCoupon ? appliedCoupon.code : undefined
        },
        itens: items.map((it) => ({
          productId: it.productId,
          name: it.name,
          category: it.category,
          sizeId: it.size?.id,
          sizeName: it.size?.name,
          isHalfHalf: it.isHalfHalf,
          secondFlavorId: it.secondFlavor?.id,
          secondFlavorName: it.secondFlavor?.name,
          crustId: it.crust?.id,
          crustName: it.crust?.name,
          extras: it.extras?.map((e) => ({ id: e.id, name: e.name, price: e.price })),
          observations: it.observations,
          unitPrice: it.unitPrice,
          quantity: it.quantity
        }))
      };

      const response: OrderResponse = await sendOrderToBackend(orderPayload);

      if (!response.sucesso || !response.pedido) {
        setErrorMessage(response.mensagem || 'Falha ao processar pedido.');
        setIsLoading(false);
        return;
      }

      const createdOrder = response.pedido;

      // CASE 1: PIX AUTOMÁTICO DINÂMICO
      if (formaPagamento === 'pix') {
        try {
          const pixRes: PixPaymentResponse = await createPixPayment({
            orderId: createdOrder.id,
            amount: createdOrder.total,
            customerName: createdOrder.cliente.nome,
            customerEmail: 'cliente@gordeixosbrasilia.com.br',
            customerCpf: '00000000000'
          });

          if (pixRes.sucesso) {
            setPixModalData({
              pixData: pixRes,
              orderData: createdOrder
            });
            clearCart();
            setIsLoading(false);
            return;
          }
        } catch (pixErr: any) {
          console.error('Erro ao gerar PIX:', pixErr);
          // Fallback gracefully
        }
      }

      // CASE 2: CARTÃO ONLINE
      if (formaPagamento === 'cartao_online') {
        try {
          const cleanCard = cardData.cardNumber.replace(/\D/g, '');
          const cardBrand = /^4/.test(cleanCard) ? 'Visa' : /^5[1-5]/.test(cleanCard) ? 'Mastercard' : /^3[47]/.test(cleanCard) ? 'American Express' : 'Cartão Demo';
          const cardRes = await processCardPayment({
            orderId: createdOrder.id,
            demoToken: `demo_${crypto.randomUUID()}`,
            cardLast4: cleanCard.slice(-4),
            cardBrand,
            installments: cardData.installments
          });

          cardData.cardNumber = '';
          cardData.cardCvv = '';

          if (cardRes.sucesso && cardRes.status === 'approved') {
            try {
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            } catch {}

            setActiveOrder({
              ...createdOrder,
              statusPagamento: 'pago',
              isPagoOnline: true
            });
            setIsCheckoutOpen(false);
            setIsConfirmationOpen(true);
            clearCart();
            setIsLoading(false);
            return;
          } else {
            setErrorMessage(cardRes.mensagem || 'Pagamento com cartão recusado pela operadora.');
            setIsLoading(false);
            return;
          }
        } catch (cardErr: any) {
          setErrorMessage(cardErr.message || 'Erro ao processar cartão de crédito online.');
          setIsLoading(false);
          return;
        }
      }

      // CASE 3: CARTÃO NA ENTREGA / DINHEIRO / PADRÃO
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      setActiveOrder(createdOrder);
      setIsCheckoutOpen(false);
      setIsConfirmationOpen(true);
      clearCart();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar pedido para o servidor.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="checkout-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        id="checkout-modal-panel"
        className="relative w-full max-w-2xl bg-[#0F172A] border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Voltar ao carrinho"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-black text-white font-serif tracking-tight">
                Finalizar Pedido • Gordeixo's
              </h2>
              <p className="text-xs text-slate-400">
                Preencha seus dados para envio direto ao WhatsApp da pizzaria
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Fechar checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-700 text-red-200 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Modalidade de Entrega */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span>🛵 1. Modalidade de Atendimento</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryType('delivery')}
                className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                  deliveryType === 'delivery'
                    ? 'bg-[#8B1E1E]/40 border-amber-500 text-white ring-1 ring-amber-500/30'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="p-2 rounded-lg bg-red-950 text-amber-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Delivery em Casa</p>
                  <p className="text-[11px] text-slate-400">Entregamos no seu endereço</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType('retirada')}
                className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                  deliveryType === 'retirada'
                    ? 'bg-[#8B1E1E]/40 border-amber-500 text-white ring-1 ring-amber-500/30'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="p-2 rounded-lg bg-red-950 text-amber-400">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Retirada no Balcão</p>
                  <p className="text-[11px] text-slate-400">CLN 302 Bloco B (Asa Norte)</p>
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: Dados Pessoais do Cliente */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <User className="w-4 h-4" /> 2. Seus Dados de Contato
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">
                  Nome Completo *
                </label>
                <input
                  id="checkout-nome-input"
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silveira"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">
                  WhatsApp com DDD *
                </label>
                <div className="relative">
                  <input
                    id="checkout-phone-input"
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={handlePhoneChange}
                    placeholder="(61) 98888-7777"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: Endereço de Entrega (se Delivery) */}
          {deliveryType === 'delivery' && (
            <div className="space-y-3.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> 3. Endereço de Entrega no DF
                </span>
                <span className="text-[11px] text-emerald-400 font-normal">
                  {taxaEntrega === 0 ? 'Frete Grátis!' : `Taxa: R$ ${taxaEntrega.toFixed(2).replace('.', ',')}`}
                </span>
              </label>

              {/* Optional CEP Lookup Feature */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="checkout-cep-input" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-amber-400" />
                    <span>Preencher por CEP</span>
                    <span className="text-[10px] text-slate-400 font-normal px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                      Opcional
                    </span>
                  </label>
                  <span className="text-[11px] text-slate-400">Ou preencha manualmente abaixo</span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="checkout-cep-input"
                      type="text"
                      value={cep}
                      onChange={handleCepChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleManualCepSearch();
                        }
                      }}
                      placeholder="Ex: 70730-020 (8 dígitos)"
                      maxLength={9}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    {isSearchingCep && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 animate-spin" />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleManualCepSearch}
                    disabled={isSearchingCep || cep.replace(/\D/g, '').length < 8}
                    className="px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSearchingCep ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>Buscar CEP</span>
                  </button>
                </div>

                {/* Feedback message */}
                {cepFeedback && (
                  <div
                    className={`text-xs px-3 py-2 rounded-lg flex items-start gap-2 ${
                      cepFeedback.type === 'success'
                        ? 'bg-emerald-950/60 border border-emerald-700/60 text-emerald-300'
                        : cepFeedback.type === 'error'
                        ? 'bg-red-950/60 border border-red-700/60 text-red-300'
                        : 'bg-blue-950/60 border border-blue-700/60 text-blue-300'
                    }`}
                  >
                    {cepFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                    {cepFeedback.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                    {cepFeedback.type === 'info' && <Building className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
                    <span>{cepFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Bairro Selector */}
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">
                  Região Administrativa / Bairro *
                </label>
                <select
                  id="checkout-bairro-select"
                  value={selectedBairroId}
                  onChange={(e) => setSelectedBairroId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {bairrosList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nome} — R$ {b.taxaEntrega.toFixed(2).replace('.', ',')} ({b.tempoMin}-{b.tempoMax} min)
                    </option>
                  ))}
                </select>
              </div>

              {/* Street Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">
                    Endereço (Quadra, Rua, Bloco) *
                  </label>
                  <input
                    type="text"
                    required
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Ex: SQN 302 Bloco B ou Rua 12 Sul"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">
                    Número / Lote
                  </label>
                  <input
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="Ex: 402 ou Lote 3"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Complement & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">
                    Apto / Sala / Bloco
                  </label>
                  <input
                    type="text"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    placeholder="Ex: Apto 304 Entrada A"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">
                    Ponto de Referência
                  </label>
                  <input
                    type="text"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    placeholder="Ex: Próximo à padaria / portaria 2"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Forma de Pagamento */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
              <span>💳 4. Forma de Pagamento</span>
              {formaPagamento === 'pix' && !appliedCoupon && (
                <span className="text-[11px] text-emerald-400 font-bold">
                  ⚡ 5% de Desconto aplicado no PIX!
                </span>
              )}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* PIX Dinâmico Instantâneo */}
              <button
                type="button"
                onClick={() => setFormaPagamento('pix')}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  formaPagamento === 'pix'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500/30'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-900/60 text-emerald-300">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white">PIX Automático</p>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">Instantâneo</span>
                    </div>
                    <p className="text-[10px] text-emerald-300 font-semibold">QR Code Dinâmico • 5% OFF</p>
                  </div>
                </div>
                {formaPagamento === 'pix' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </button>

              {/* Cartão de Crédito Online */}
              <button
                type="button"
                onClick={() => setFormaPagamento('cartao_online')}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  formaPagamento === 'cartao_online'
                    ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500/30'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-800 text-amber-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white">Cartão Online</p>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">Pagar Agora</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Crédito direto no site (até 3x)</p>
                  </div>
                </div>
                {formaPagamento === 'cartao_online' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </button>

              {/* Cartão Crédito Maquininha */}
              <button
                type="button"
                onClick={() => setFormaPagamento('cartao_credito')}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  formaPagamento === 'cartao_credito'
                    ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500/30'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-800 text-amber-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Cartão de Crédito</p>
                    <p className="text-[10px] text-slate-400">Maquininha na entrega</p>
                  </div>
                </div>
                {formaPagamento === 'cartao_credito' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </button>

              {/* Cartão Débito Maquininha */}
              <button
                type="button"
                onClick={() => setFormaPagamento('cartao_debito')}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  formaPagamento === 'cartao_debito'
                    ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500/30'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-800 text-amber-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Cartão de Débito</p>
                    <p className="text-[10px] text-slate-400">Maquininha na entrega</p>
                  </div>
                </div>
                {formaPagamento === 'cartao_debito' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </button>

              {/* Dinheiro */}
              <button
                type="button"
                onClick={() => setFormaPagamento('dinheiro')}
                className={`sm:col-span-2 p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  formaPagamento === 'dinheiro'
                    ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500/30'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-800 text-amber-400">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Dinheiro</p>
                    <p className="text-[10px] text-slate-400">Pagamento em espécie na entrega</p>
                  </div>
                </div>
                {formaPagamento === 'dinheiro' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </button>

            </div>

            {/* Online Card Form embed */}
            {formaPagamento === 'cartao_online' && (
              <OnlineCardForm totalAmount={total} onCardDataChange={setCardData} />
            )}

            {/* Troco para dinheiro */}
            {formaPagamento === 'dinheiro' && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="precisa-troco-checkbox"
                    checked={precisaTroco}
                    onChange={(e) => setPrecisaTroco(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950"
                  />
                  <label htmlFor="precisa-troco-checkbox" className="text-xs text-white font-medium cursor-pointer">
                    Precisa de troco?
                  </label>
                </div>

                {precisaTroco && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-400">Troco para: R$</span>
                    <input
                      type="text"
                      value={trocoPara}
                      onChange={(e) => setTrocoPara(e.target.value)}
                      placeholder="Ex: 100,00"
                      className="w-32 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Summary Recap */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
              Resumo do Pedido ({items.length} itens)
            </h4>
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            {desconto > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Desconto ({appliedCoupon ? appliedCoupon.code : 'PIX'}):</span>
                <span>- R$ {desconto.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            {deliveryType === 'delivery' && (
              <div className="flex justify-between text-slate-400">
                <span>Taxa de Entrega ({selectedBairro?.nome}):</span>
                <span className={taxaEntrega === 0 ? 'text-emerald-400 font-bold' : ''}>
                  {taxaEntrega === 0 ? 'GRÁTIS' : `R$ ${taxaEntrega.toFixed(2).replace('.', ',')}`}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black text-white">
              <span>Total Final:</span>
              <span className="text-amber-400 text-base font-mono">
                R$ {total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="submit-order-checkout-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#8B1E1E] via-[#A82828] to-[#8B1E1E] hover:from-[#9E2222] hover:to-[#8B1E1E] text-white font-bold text-sm sm:text-base shadow-xl shadow-red-950/80 border border-amber-500/30 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                <span>Processando seu pedido...</span>
              </>
            ) : formaPagamento === 'pix' ? (
              <>
                <QrCode className="w-5 h-5 text-amber-300" />
                <span>Gerar PIX Instantâneo & Concluir</span>
              </>
            ) : formaPagamento === 'cartao_online' ? (
              <>
                <Lock className="w-5 h-5 text-amber-300" />
                <span>Pagar R$ {total.toFixed(2).replace('.', ',')} Agora com Cartão</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5 text-amber-300" />
                <span>Confirmar & Enviar Pedido via WhatsApp</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-500">
            🔒 Transação segura com criptografia de ponta a ponta e integração direta aos servidores bancários.
          </p>

        </form>

      </div>

      {/* Pix Dynamic Modal Popover */}
      {pixModalData && (
        <PixDynamicPaymentModal
          pixData={pixModalData.pixData}
          orderData={pixModalData.orderData}
          onPaymentApproved={() => {
            setActiveOrder({
              ...pixModalData.orderData,
              statusPagamento: 'pago',
              isPagoOnline: true
            });
            setPixModalData(null);
            setIsCheckoutOpen(false);
            setIsConfirmationOpen(true);
          }}
          onClose={() => {
            setActiveOrder(pixModalData.orderData);
            setPixModalData(null);
            setIsCheckoutOpen(false);
            setIsConfirmationOpen(true);
          }}
        />
      )}
    </div>
  );
};
