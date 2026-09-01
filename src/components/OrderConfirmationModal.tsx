import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext.tsx';
import {
  CheckCircle2,
  X,
  MessageSquare,
  Copy,
  Check,
  Flame,
  Clock,
  MapPin,
  QrCode,
  Truck,
  Pizza,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { fetchOrderStatus } from '../services/api.ts';

export const OrderConfirmationModal: React.FC = () => {
  const { activeOrder, isConfirmationOpen, setIsConfirmationOpen } = useCart();
  const [copiedPix, setCopiedPix] = useState(false);
  const [liveStatus, setLiveStatus] = useState<{ step: number; statusKey: string; percent: number; info: { titulo: string; desc: string } } | null>(null);

  // Poll status do pedido
  useEffect(() => {
    if (!activeOrder || !isConfirmationOpen) return;

    let isMounted = true;

    const checkStatus = async () => {
      try {
        const res = await fetchOrderStatus(activeOrder.id);
        if (isMounted && res.sucesso) {
          setLiveStatus(res);
        }
      } catch (e) {
        // fallback
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // 10s poll

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeOrder, isConfirmationOpen]);

  if (!isConfirmationOpen || !activeOrder) return null;

  const handleCopyPix = () => {
    if (activeOrder.pixChave) {
      navigator.clipboard.writeText(activeOrder.pixChave);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  const currentStep = liveStatus ? liveStatus.step : 1;

  return (
    <div
      id="order-confirmation-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300"
    >
      <div
        id="order-confirmation-panel"
        className="relative w-full max-w-2xl bg-[#0F172A] border border-emerald-500/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Success Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-950 via-[#0F172A] to-emerald-950 border-b border-emerald-800/40 text-center relative shrink-0">
          <button
            onClick={() => setIsConfirmationOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
            aria-label="Fechar confirmação"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-400 mb-3 shadow-lg shadow-emerald-950/60">
            <CheckCircle2 className="w-10 h-10 animate-pulse" />
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 uppercase tracking-widest">
            Pedido Gerado com Sucesso!
          </span>

          {activeOrder.statusPagamento === 'pago' || activeOrder.isPagoOnline ? (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[11px] font-black uppercase">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pagamento Aprovado Online</span>
            </div>
          ) : (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[11px] font-black uppercase">
              <span>Pagamento na Entrega / Retirada</span>
            </div>
          )}

          <h2 className="text-2xl sm:text-3xl font-black text-white font-serif mt-2">
            {activeOrder.numeroPedido}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-1">
            Tempo estimado: <strong className="text-amber-400">{activeOrder.tempoEstimado}</strong>
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* PRIMARY ACTION: Enviar WhatsApp */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900/60 via-emerald-800/40 to-emerald-900/60 border border-emerald-500/60 shadow-xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Envie a mensagem pré-formatada para nosso WhatsApp!
                </h3>
                <p className="text-xs text-emerald-200">
                  Clique no botão verde abaixo para abrir o WhatsApp da Pizzaria Gordeixo's com todos os itens já digitados.
                </p>
              </div>
            </div>

            <a
              id="btn-whatsapp-redirect"
              href={activeOrder.linkWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/80 active:scale-98 cursor-pointer"
            >
              <span>📲 Abrir no WhatsApp & Confirmar Pedido</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* PIX Payment Box (se PIX) */}
          {activeOrder.cliente.formaPagamento === 'pix' && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <QrCode className="w-4 h-4" /> Pagamento via PIX (5% OFF Aplicado)
                </div>
                <span className="text-sm font-black text-white font-mono">
                  R$ {activeOrder.total.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <p className="text-xs text-slate-300">
                Transfira para a chave PIX da pizzaria e envie o comprovante no WhatsApp:
              </p>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-mono text-xs text-amber-300 font-bold flex-1 truncate">
                  {activeOrder.pixChave}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedPix ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar Chave
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* LIVE ORDER TRACKER */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> Acompanhamento em Tempo Real
              </h4>
              <span className="text-[11px] text-amber-400 font-semibold animate-pulse">
                • Atualizando ao vivo
              </span>
            </div>

            {/* Stepper Visual */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              
              {/* Step 1 */}
              <div className="space-y-1.5 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                  currentStep >= 1 ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}>
                  1
                </div>
                <span className={`text-[10px] font-bold ${currentStep >= 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  Recebido
                </span>
              </div>

              {/* Step 2 */}
              <div className="space-y-1.5 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                  currentStep >= 2 ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}>
                  <Flame className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-bold ${currentStep >= 2 ? 'text-amber-400' : 'text-slate-500'}`}>
                  No Forno
                </span>
              </div>

              {/* Step 3 */}
              <div className="space-y-1.5 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                  currentStep >= 3 ? 'bg-blue-500 text-slate-950 border-blue-400' : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}>
                  <Truck className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-bold ${currentStep >= 3 ? 'text-blue-400' : 'text-slate-500'}`}>
                  Em Rota
                </span>
              </div>

              {/* Step 4 */}
              <div className="space-y-1.5 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                  currentStep >= 4 ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-bold ${currentStep >= 4 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  Entregue
                </span>
              </div>

            </div>

            {/* Current Step Description */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <p className="font-bold text-white">
                {liveStatus ? liveStatus.info.titulo : 'Pedido Recebido pela Cozinha'}
              </p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {liveStatus ? liveStatus.info.desc : 'Seu pedido foi registrado e encaminhado aos pizzaiolos.'}
              </p>
            </div>
          </div>

          {/* Itemized Order Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Detalhes do Pedido
            </h4>

            <div className="space-y-2 text-xs">
              {activeOrder.itens.map((it, idx) => (
                <div key={idx} className="flex justify-between items-start border-b border-slate-800/80 pb-2">
                  <div>
                    <span className="font-bold text-white">{it.quantity}x {it.name}</span>
                    {it.isHalfHalf && it.secondFlavorName && (
                      <p className="text-[11px] text-amber-200">↳ 1/2 {it.secondFlavorName}</p>
                    )}
                    {it.sizeName && (
                      <p className="text-[11px] text-slate-400">↳ {it.sizeName}</p>
                    )}
                    {it.crustName && it.crustName !== 'Massa Tradicional (Sem recheio extra)' && (
                      <p className="text-[11px] text-emerald-300">↳ Borda: {it.crustName}</p>
                    )}
                  </div>
                  <span className="font-bold text-slate-200">
                    R$ {(it.unitPrice * it.quantity).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>

            {/* Financials */}
            <div className="pt-2 space-y-1 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {activeOrder.subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              {activeOrder.desconto > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Desconto:</span>
                  <span>- R$ {activeOrder.desconto.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {activeOrder.cliente.tipoEntrega === 'delivery' && (
                <div className="flex justify-between">
                  <span>Taxa de Entrega:</span>
                  <span>{activeOrder.taxaEntrega === 0 ? 'GRÁTIS' : `R$ ${activeOrder.taxaEntrega.toFixed(2).replace('.', ',')}`}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black text-white">
                <span>Total:</span>
                <span className="text-amber-400 text-base font-mono">
                  R$ {activeOrder.total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-400">
            Dúvidas? Ligue para (61) 99999-8686
          </span>
          <button
            onClick={() => setIsConfirmationOpen(false)}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Fechar Janela
          </button>
        </div>

      </div>
    </div>
  );
};
