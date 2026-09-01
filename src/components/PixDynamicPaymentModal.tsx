import React, { useState, useEffect } from 'react';
import {
  PixPaymentResponse,
  OrderResponse
} from '../types/index.ts';
import {
  fetchPaymentStatus,
  simulatePaymentApproval
} from '../services/api.ts';
import {
  QrCode,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Zap,
  ArrowRight,
  Sparkles,
  X,
  RefreshCw,
  Flame,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PixDynamicPaymentModalProps {
  pixData: PixPaymentResponse;
  orderData: OrderResponse['pedido'];
  onPaymentApproved: (transactionId: string) => void;
  onClose: () => void;
}

export function PixDynamicPaymentModal({
  pixData,
  orderData,
  onPaymentApproved,
  onClose
}: PixDynamicPaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 min in seconds
  const [isApproved, setIsApproved] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Polling for automated payment approval (every 2.5 seconds)
  useEffect(() => {
    if (isApproved) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        setPollCount((c) => c + 1);
        const res = await fetchPaymentStatus(pixData.transactionId);
        if (isMounted && (res.isPaid || res.transaction?.status === 'approved')) {
          setIsApproved(true);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
          setTimeout(() => {
            onPaymentApproved(pixData.transactionId);
          }, 3000);
        }
      } catch (err) {
        // silent fail on network hiccups
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pixData.transactionId, isApproved, onPaymentApproved]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pixData.pixCopiaECola);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    try {
      const res = await simulatePaymentApproval(pixData.transactionId);
      if (res.sucesso) {
        setIsApproved(true);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 }
        });
        setTimeout(() => {
          onPaymentApproved(pixData.transactionId);
        }, 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const formatMinutes = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-slate-800 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base">PIX Dinâmico Instantâneo</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Autodetecção Ativa
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pedido {orderData?.numeroPedido || '#GDX'} • Total: <strong className="text-white">R$ {pixData.amount.toFixed(2).replace('.', ',')}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {/* STATE 1: APPROVED BANNER */}
          {isApproved ? (
            <div className="p-6 rounded-3xl bg-emerald-950/60 border border-emerald-500/80 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/40">
                  Pagamento Confirmado!
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-white mt-2">
                  Recebemos seu PIX com Sucesso!
                </h4>
                <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 max-w-sm mx-auto">
                  Seu pedido já foi liberado automaticamente no sistema da cozinha e está entrando no forno a lenha!
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onPaymentApproved(pixData.transactionId)}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950"
                >
                  <Flame className="w-4 h-4" />
                  <span>Acompanhar Preparo do Pedido</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* STATE 2: PENDING PAYMENT QR CODE VIEW */
            <>
              {/* Countdown & Live Status Indicator */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Expira em:</span>
                  <strong className="text-amber-400 font-mono text-sm">{formatMinutes(timeLeft)}</strong>
                </div>

                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-[11px]">Aguardando pagamento...</span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-white text-slate-950 shadow-xl border border-slate-200">
                {pixData.pixQrCodeBase64 ? (
                  <img
                    src={pixData.pixQrCodeBase64}
                    alt="QR Code Pix"
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-xl">
                    <QrCode className="w-16 h-16 text-slate-400 animate-pulse" />
                  </div>
                )}
                <p className="text-[11px] font-bold text-slate-600 mt-2 text-center">
                  Abra o app do seu banco e aponte a câmera para o QR Code
                </p>
              </div>

              {/* Copia e Cola Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Ou pague com o Pix Copia e Cola:</span>
                  <span className="text-[10px] text-amber-400">Clique para copiar</span>
                </label>

                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={pixData.pixCopiaECola}
                    onClick={handleCopy}
                    className="w-full px-3.5 py-3 pr-28 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono text-xs focus:outline-none cursor-pointer truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Instant WhatsApp Backup Button */}
              {orderData?.linkWhatsApp && (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[11px] text-slate-300">Quer avisar a pizzaria pelo WhatsApp?</span>
                  </div>
                  <a
                    href={orderData.linkWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    <span>Abrir Zap</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* DEMO / SANDBOX INSTANT APPROVAL BUTTON */}
              {pixData.isSandbox && (
                <div className="pt-2 border-t border-slate-800 text-center space-y-2">
                  <p className="text-[11px] text-slate-400">
                    Modo Sandbox Ativo: Deseja testar a autodetecção de pagamento agora?
                  </p>
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    disabled={isSimulating}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {isSimulating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>⚡ Simular Pagamento PIX Aprovado (Demonstração)</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
