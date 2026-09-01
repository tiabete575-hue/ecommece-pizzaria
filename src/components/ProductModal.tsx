import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, ProductSize, CrustOption, ExtraOption, CartItem } from '../types/index.ts';
import { X, Pizza, Plus, Minus, Check, Sparkles, AlertCircle, Flame, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface ProductModalProps {
  product: MenuItem | null;
  allProducts: MenuItem[];
  crustOptions: CrustOption[];
  extraOptions: ExtraOption[];
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  allProducts,
  crustOptions,
  extraOptions,
  onClose
}) => {
  const { addItem } = useCart();

  if (!product) return null;

  // 1. Estado do Tamanho
  const [selectedSize, setSelectedSize] = useState<ProductSize>(() => {
    if (product.sizes && product.sizes.length > 0) {
      // Default to Grande if available, else first size
      const grande = product.sizes.find((s) => s.id === 'grande');
      return grande || product.sizes[0];
    }
    return {
      id: 'grande',
      name: 'Padrão',
      slices: 8,
      price: product.basePrice,
      description: 'Porção individual/padrão'
    };
  });

  // 2. Estado de Meio a Meio (apenas para pizzas)
  const [isHalfHalf, setIsHalfHalf] = useState(false);
  const [secondFlavorId, setSecondFlavorId] = useState<string>('');

  // 3. Estado da Borda Recheada
  const [selectedCrustId, setSelectedCrustId] = useState<string>('sem-borda');

  // 4. Estado de Adicionais / Extras
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  // 5. Observações
  const [observations, setObservations] = useState('');

  // 6. Quantidade
  const [quantity, setQuantity] = useState(1);

  // Lista de outros sabores de pizza disponíveis para o Meio a Meio
  const availableSecondFlavors = useMemo(() => {
    return allProducts.filter((p) => p.isPizza && p.id !== product.id);
  }, [allProducts, product.id]);

  const secondFlavorProduct = useMemo(() => {
    return availableSecondFlavors.find((p) => p.id === secondFlavorId);
  }, [availableSecondFlavors, secondFlavorId]);

  // Borda selecionada
  const selectedCrust = useMemo(() => {
    return crustOptions.find((c) => c.id === selectedCrustId) || crustOptions[0];
  }, [crustOptions, selectedCrustId]);

  // Lista de objetos de extras selecionados
  const selectedExtraObjects = useMemo(() => {
    return extraOptions.filter((e) => selectedExtras.includes(e.id));
  }, [extraOptions, selectedExtras]);

  // Cálculo do preço unitário em tempo real
  const unitPrice = useMemo(() => {
    let price = selectedSize.price;

    // Se for pizza meio a meio, o preço do tamanho passa a ser o maior valor entre os dois sabores
    if (isHalfHalf && secondFlavorProduct && secondFlavorProduct.sizes) {
      const secondSizePrice =
        secondFlavorProduct.sizes.find((s) => s.id === selectedSize.id)?.price || secondFlavorProduct.basePrice;
      price = Math.max(price, secondSizePrice);
    }

    // Adiciona valor da borda
    if (selectedCrust && selectedCrust.price > 0) {
      price += selectedCrust.price;
    }

    // Adiciona adicionais
    selectedExtraObjects.forEach((ext) => {
      price += ext.price;
    });

    return price;
  }, [selectedSize, isHalfHalf, secondFlavorProduct, selectedCrust, selectedExtraObjects]);

  const totalPrice = useMemo(() => {
    return unitPrice * quantity;
  }, [unitPrice, quantity]);

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddToCart = () => {
    if (isHalfHalf && !secondFlavorId) {
      alert('Por favor, selecione o 2º sabor da sua pizza meio-a-meio.');
      return;
    }

    const cartItemData: Omit<CartItem, 'cartId'> = {
      productId: product.id,
      name: product.name,
      category: product.category,
      isPizza: product.isPizza,
      size: product.isPizza ? selectedSize : undefined,
      isHalfHalf: product.isPizza && isHalfHalf,
      secondFlavor:
        product.isPizza && isHalfHalf && secondFlavorProduct
          ? {
              id: secondFlavorProduct.id,
              name: secondFlavorProduct.name,
              basePrice: secondFlavorProduct.basePrice,
              description: secondFlavorProduct.description
            }
          : undefined,
      crust: product.isPizza ? selectedCrust : undefined,
      extras: selectedExtraObjects,
      observations: observations.trim() || undefined,
      unitPrice,
      quantity,
      image: product.image
    };

    addItem(cartItemData);
    onClose();
  };

  return (
    <div
      id="product-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="product-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#0F172A] border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header with Image & Title */}
        <div className="relative h-44 sm:h-52 w-full bg-slate-950 shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent" />

          {/* Close button */}
          <button
            id="close-product-modal-btn"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title and Badge */}
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[11px] font-bold border border-amber-500/30 uppercase tracking-wider">
                {product.category}
              </span>
              {product.popular && (
                <span className="px-2 py-0.5 rounded bg-red-900/60 text-red-200 text-[11px] font-bold border border-red-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Mais Pedido
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-serif mt-1">
              {product.name}
            </h2>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Product Description */}
          <p className="text-sm text-slate-300 leading-relaxed font-normal bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            {product.description}
          </p>

          {/* STEP 1: TAMANHO (Se for pizza ou item com tamanhos) */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Pizza className="w-4 h-4" /> 1. Escolha o Tamanho
                </label>
                <span className="text-[11px] text-slate-400">Obrigatório</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {product.sizes.map((sz) => {
                  const isSelected = selectedSize.id === sz.id;
                  return (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-br from-red-950/60 to-slate-900 border-amber-500 ring-2 ring-amber-500/20 text-white'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-white capitalize">{sz.id}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400">{sz.slices} fatias • {sz.description}</p>
                      <div className="mt-2 text-sm font-black text-amber-400">
                        R$ {sz.price.toFixed(2).replace('.', ',')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: MEIO A MEIO (Para pizzas) */}
          {product.isPizza && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>🍕 Pizza Meio a Meio (2 Sabores)?</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Monte duas metades diferentes no mesmo disco.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHalfHalf}
                    onChange={(e) => {
                      setIsHalfHalf(e.target.checked);
                      if (e.target.checked && !secondFlavorId && availableSecondFlavors.length > 0) {
                        setSecondFlavorId(availableSecondFlavors[0].id);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {isHalfHalf && (
                <div className="pt-3 border-t border-slate-800 space-y-2 animate-in fade-in duration-200">
                  <label className="text-xs font-bold text-amber-300 block">
                    Selecione o 2º Sabor:
                  </label>
                  <select
                    value={secondFlavorId}
                    onChange={(e) => setSecondFlavorId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="" disabled>Escolha o segundo sabor...</option>
                    {availableSecondFlavors.map((p) => {
                      const pSizePrice = p.sizes?.find((s) => s.id === selectedSize.id)?.price || p.basePrice;
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} (R$ {pSizePrice.toFixed(2).replace('.', ',')})
                        </option>
                      );
                    })}
                  </select>

                  {secondFlavorProduct && (
                    <p className="text-[11px] text-slate-400 italic pt-1">
                      Metade 2: {secondFlavorProduct.description}
                    </p>
                  )}
                  <p className="text-[11px] text-amber-400/90 font-medium">
                    *Regra da casa: O valor cobrado é referente ao sabor de maior valor.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: BORDA RECHEADA (Para pizzas) */}
          {product.isPizza && crustOptions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" /> 2. Borda Recheada no Forno
                </label>
                <span className="text-[11px] text-slate-400">Opcional</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {crustOptions.map((crust) => {
                  const isSelected = selectedCrustId === crust.id;
                  return (
                    <button
                      key={crust.id}
                      type="button"
                      onClick={() => setSelectedCrustId(crust.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="pr-2">
                        <p className="text-xs font-bold text-white">{crust.name}</p>
                        {crust.description && (
                          <p className="text-[10px] text-slate-400">{crust.description}</p>
                        )}
                      </div>
                      <span className="text-xs font-black text-amber-400 shrink-0">
                        {crust.price === 0 ? 'Grátis' : `+ R$ ${crust.price.toFixed(2).replace('.', ',')}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: ADICIONAIS / EXTRAS */}
          {extraOptions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> 3. Ingredientes Adicionais
                </label>
                <span className="text-[11px] text-slate-400">Opcional</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {extraOptions.map((extra) => {
                  const isChecked = selectedExtras.includes(extra.id);
                  return (
                    <button
                      key={extra.id}
                      type="button"
                      onClick={() => toggleExtra(extra.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? 'bg-amber-500/15 border-amber-500 text-white'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="text-xs font-medium text-slate-200">{extra.name}</span>
                      <span className="text-xs font-bold text-amber-400 shrink-0">
                        + R$ {extra.price.toFixed(2).replace('.', ',')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: OBSERVAÇÕES */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Observações do Pedido
            </label>
            <textarea
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: Massa bem assadinha, sem cebola, cortar à francesa..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

        </div>

        {/* Footer with Quantity and Add Button */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          {/* Quantity Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
            <span className="text-xs font-bold text-slate-400 uppercase">Qtd:</span>
            <div className="flex items-center border border-slate-700 rounded-xl bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                aria-label="Diminuir quantidade"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-9 text-center text-sm font-black text-white">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                aria-label="Aumentar quantidade"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart Submit Button */}
          <button
            id="modal-submit-add-btn"
            type="button"
            onClick={handleAddToCart}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#8B1E1E] via-[#A82828] to-[#8B1E1E] hover:from-[#9E2222] hover:to-[#8B1E1E] text-white font-bold text-sm shadow-xl shadow-red-950/60 border border-amber-500/30 transition-all flex items-center justify-between sm:justify-center gap-4 cursor-pointer active:scale-98"
          >
            <span>Adicionar ao Carrinho</span>
            <span className="bg-black/30 px-2.5 py-1 rounded-lg text-amber-300 font-mono font-black text-sm">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
