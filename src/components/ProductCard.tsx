import React from 'react';
import { MenuItem } from '../types/index.ts';
import { Plus, Sparkles, Flame, Leaf, Utensils, Award } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface ProductCardProps {
  product: MenuItem;
  onCustomize: (product: MenuItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onCustomize }) => {
  const { addItem } = useCart();

  const handleDirectAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.isPizza || (product.sizes && product.sizes.length > 0)) {
      onCustomize(product);
      return;
    }

    // Direct add for drinks / fixed items
    addItem({
      productId: product.id,
      name: product.name,
      category: product.category,
      isPizza: false,
      unitPrice: product.basePrice,
      quantity: 1,
      image: product.image
    });
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onCustomize(product)}
      className="group relative rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-amber-500/50 shadow-lg hover:shadow-2xl hover:shadow-red-950/40 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer transform hover:-translate-y-1"
    >
      {/* Product Image & Badges */}
      <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-slate-950">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.popular && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black shadow-md">
              <Sparkles className="w-3 h-3" /> Mais Pedido
            </span>
          )}
          {product.vegetarian && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-md">
              <Leaf className="w-3 h-3" /> Vegetariana
            </span>
          )}
          {product.tags && product.tags.includes('Forno a Lenha') && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-800 text-amber-200 text-[11px] font-bold shadow-md border border-red-700">
              <Flame className="w-3 h-3 text-amber-400" /> Forno a Lenha
            </span>
          )}
        </div>

        {/* Category Pill on bottom right of image */}
        <div className="absolute bottom-2 right-3">
          <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm text-slate-300 text-[10px] font-bold border border-slate-700 uppercase tracking-wider">
            {product.category}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-400 transition font-serif line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 line-clamp-3 leading-relaxed font-normal">
            {product.description}
          </p>
        </div>

        {/* Price & Action Button */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              {product.isPizza ? 'A partir de' : 'Preço'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-amber-400">R$</span>
              <span className="text-xl font-black text-amber-400">
                {product.basePrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <button
            id={`btn-add-${product.id}`}
            onClick={handleDirectAdd}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B1E1E] to-[#A82828] hover:from-[#9E2222] hover:to-[#8B1E1E] text-white text-xs sm:text-sm font-bold shadow-md shadow-red-950/50 border border-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>{product.isPizza ? 'Montar' : 'Adicionar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
