import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Sparkles, MapPin, AlertCircle, Flame } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

export const CartDrawer: React.FC = () => {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    deliveryType,
    setDeliveryType,
    selectedBairro,
    appliedCoupon,
    couponInput,
    setCouponInput,
    couponError,
    applyCoupon,
    removeCoupon,
    subtotal,
    desconto,
    taxaEntrega,
    total,
    setIsRegionsModalOpen
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div
      id="cart-drawer-overlay"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200"
      onClick={() => setIsCartOpen(false)}
    >
      <div
        id="cart-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0F172A] border-l border-slate-800 shadow-2xl h-full flex flex-col justify-between animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-950/80 border border-red-800/60 text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-serif tracking-tight">
                Seu Carrinho
              </h2>
              <p className="text-xs text-slate-400">
                {items.length} {items.length === 1 ? 'item selecionado' : 'itens selecionados'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] font-semibold text-red-400 hover:text-red-300 hover:underline px-2 py-1 cursor-pointer"
                title="Limpar todos os itens"
              >
                Limpar
              </button>
            )}
            <button
              id="close-cart-drawer-btn"
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Fechar carrinho"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        {items.length === 0 ? (
          /* Empty State */
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Carrinho Vazio</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Você ainda não adicionou nenhuma pizza ou prato saboroso da Gordeixo's.
              </p>
            </div>
            <button
              onClick={() => {
                setIsCartOpen(false);
                const el = document.getElementById('cardapio-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mt-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer"
            >
              Explorar Cardápio da Casa
            </button>
          </div>
        ) : (
          /* Item List */
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
            
            {/* Delivery Type Quick Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setDeliveryType('delivery')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  deliveryType === 'delivery'
                    ? 'bg-[#8B1E1E] text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🛵 Entrega Delivery</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType('retirada')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  deliveryType === 'retirada'
                    ? 'bg-[#8B1E1E] text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🏪 Retirada Balcão</span>
              </button>
            </div>

            {/* Delivery Region Info Alert */}
            {deliveryType === 'delivery' && (
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                  <div>
                    <span className="text-slate-300">Entregando em: </span>
                    <strong className="text-white">{selectedBairro?.nome || 'Distrito Federal'}</strong>
                  </div>
                </div>
                <button
                  onClick={() => setIsRegionsModalOpen(true)}
                  className="text-[11px] text-amber-400 hover:underline font-bold cursor-pointer"
                >
                  Alterar
                </button>
              </div>
            )}

            {/* Items */}
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.cartId}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-2.5"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-sm font-bold text-white leading-snug">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.cartId)}
                          className="text-slate-500 hover:text-red-400 p-1 transition cursor-pointer"
                          aria-label="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Customization Badges */}
                      <div className="text-[11px] text-slate-400 space-y-0.5 mt-1">
                        {item.size && (
                          <p className="text-amber-300 font-medium">
                            • Tamanho: {item.size.name}
                          </p>
                        )}
                        {item.isHalfHalf && item.secondFlavor && (
                          <p className="text-amber-200">
                            • 1/2 {item.secondFlavor.name}
                          </p>
                        )}
                        {item.crust && item.crust.id !== 'sem-borda' && (
                          <p className="text-emerald-300">
                            • Borda: {item.crust.name}
                          </p>
                        )}
                        {item.extras && item.extras.length > 0 && (
                          <p className="text-slate-300">
                            • Extras: {item.extras.map((e) => e.name).join(', ')}
                          </p>
                        )}
                        {item.observations && (
                          <p className="italic text-slate-400">
                            • Obs: "{item.observations}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Price Footer */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center border border-slate-700 rounded-lg bg-slate-950 p-0.5">
                      <button
                        onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                        className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                        aria-label="Diminuir"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                        className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                        aria-label="Aumentar"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-amber-400">
                        R$ {(item.unitPrice * item.quantity).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" /> Possui Cupom?
                </span>
                <span className="text-[10px] text-amber-400">Ex: GORDEIXO10</span>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-700 text-xs">
                  <div>
                    <span className="font-bold text-emerald-300 font-mono">
                      {appliedCoupon.code}
                    </span>
                    <p className="text-[10px] text-slate-300">{appliedCoupon.description}</p>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-[11px] text-red-400 hover:underline font-semibold cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Código do cupom"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => applyCoupon()}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
              )}

              {couponError && (
                <p className="text-[11px] text-red-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {couponError}
                </p>
              )}
            </div>

          </div>
        )}

        {/* Drawer Summary Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 space-y-3">
            
            {/* Financial Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>Subtotal dos itens:</span>
                <span className="text-slate-200 font-semibold">
                  R$ {subtotal.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {desconto > 0 && (
                <div className="flex items-center justify-between text-emerald-400 font-semibold">
                  <span>Desconto:</span>
                  <span>- R$ {desconto.toFixed(2).replace('.', ',')}</span>
                </div>
              )}

              {deliveryType === 'delivery' && (
                <div className="flex items-center justify-between">
                  <span>Taxa de entrega ({selectedBairro?.nome || 'DF'}):</span>
                  <span className={taxaEntrega === 0 ? 'text-emerald-400 font-bold' : 'text-slate-200 font-semibold'}>
                    {taxaEntrega === 0 ? 'GRÁTIS 🎉' : `R$ ${taxaEntrega.toFixed(2).replace('.', ',')}`}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-base font-black text-white">
                <span>Total:</span>
                <span className="text-xl text-amber-400 font-mono">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Advance to Checkout button */}
            <button
              id="btn-advance-checkout"
              onClick={() => {
                setIsCartOpen(false);
                setIsCheckoutOpen(true);
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#8B1E1E] via-[#A82828] to-[#8B1E1E] hover:from-[#9E2222] hover:to-[#8B1E1E] text-white font-bold text-sm shadow-xl shadow-red-950/80 border border-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Avançar para o Checkout</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
