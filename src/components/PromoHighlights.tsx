import React, { useState } from 'react';
import { Check, Copy, Flame, Percent, Sparkles, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

export const PromoHighlights: React.FC = () => {
  const { applyCoupon, availableCoupons, setCouponInput } = useCart();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyAndApply = async (code: string) => {
    await navigator.clipboard.writeText(code).catch(() => undefined);
    setCouponInput(code);
    if (applyCoupon(code)) {
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  return (
    <section id="promocoes-section" className="py-8 bg-slate-900/60 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider"><Sparkles className="w-4 h-4" />Vantagens & Cupons Ativos</div>
            <h2 className="text-2xl font-black text-white font-serif tracking-tight mt-0.5">Promoções Especiais de Brasília</h2>
          </div>
          <p className="text-xs text-slate-400">Cupons sincronizados em tempo real com o painel</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableCoupons.slice(0, 2).map((coupon) => (
            <div key={coupon.code} className="p-5 rounded-2xl bg-gradient-to-br from-red-950/50 to-slate-900 border border-red-800/40 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                    <Percent className="w-3 h-3" />{coupon.discountPercent ? `${coupon.discountPercent}% OFF` : `R$ ${(coupon.discountAmount || 0).toFixed(2).replace('.', ',')} OFF`}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2">{coupon.description}</h3>
                  <p className="text-xs text-slate-300 mt-1">Pedido mínimo de R$ {coupon.minOrder.toFixed(2).replace('.', ',')}.</p>
                </div>
                <Tag className="w-6 h-6 text-amber-400" />
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <span className="font-mono font-bold text-amber-400 text-sm bg-black/40 px-2.5 py-1 rounded border border-amber-500/30">{coupon.code}</span>
                <button onClick={() => handleCopyAndApply(coupon.code)} className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5">
                  {copiedCode === coupon.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copiedCode === coupon.code ? 'Aplicado!' : 'Aplicar'}
                </button>
              </div>
            </div>
          ))}

          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-700/40 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div><span className="inline-flex items-center gap-1 text-emerald-300 text-[11px] font-bold"><Flame className="w-3 h-3" />Economia Direta</span><h3 className="text-lg font-bold text-white mt-2">5% OFF no PIX</h3><p className="text-xs text-slate-300 mt-1">Desconto automático no checkout quando não houver outro cupom aplicado.</p></div>
              <Percent className="w-6 h-6 text-emerald-400" />
            </div>
            <button onClick={() => document.getElementById('cardapio-section')?.scrollIntoView({ behavior: 'smooth' })} className="mt-4 self-end px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black">Ver Cardápio</button>
          </div>
        </div>
      </div>
    </section>
  );
};
