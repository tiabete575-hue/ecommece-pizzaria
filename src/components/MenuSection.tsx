import React, { useState, useMemo } from 'react';
import { MenuItem } from '../types/index.ts';
import { ProductCard } from './ProductCard.tsx';
import { Search, X, UtensilsCrossed, Pizza, Sparkles, Cake, Flame, Gift, Wine, Filter, SlidersHorizontal } from 'lucide-react';

interface MenuSectionProps {
  products: MenuItem[];
  categories: { id: string; nome: string; icon: string }[];
  onCustomizeProduct: (product: MenuItem) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  products,
  categories,
  onCustomizeProduct
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'tradicionais':
        return <Pizza className="w-4 h-4" />;
      case 'especiais':
        return <Sparkles className="w-4 h-4" />;
      case 'doces':
        return <Cake className="w-4 h-4" />;
      case 'parmegianas':
        return <Flame className="w-4 h-4" />;
      case 'combos':
        return <Gift className="w-4 h-4" />;
      case 'bebidas':
        return <Wine className="w-4 h-4" />;
      default:
        return <UtensilsCrossed className="w-4 h-4" />;
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Filtro de Categoria
      if (selectedCategory !== 'todos' && product.category !== selectedCategory) {
        return false;
      }

      // Filtro de Tag
      if (selectedTag) {
        if (selectedTag === 'vegetarian' && !product.vegetarian) return false;
        if (selectedTag === 'popular' && !product.popular) return false;
        if (selectedTag === 'forno' && !product.tags?.includes('Forno a Lenha')) return false;
      }

      // Filtro de Busca
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        const matchesTags = product.tags?.some((t) => t.toLowerCase().includes(query));
        return matchesName || matchesDesc || matchesTags;
      }

      return true;
    });
  }, [products, selectedCategory, selectedTag, searchQuery]);

  return (
    <section id="cardapio-section" className="py-12 lg:py-16 bg-[#0F172A] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header of Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Pizza className="w-4 h-4" />
              <span>Cardápio Oficial Gordeixo's</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-serif tracking-tight mt-1">
              Escolha seu sabor favorito
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Pizzas artesanais, parmegianas famosas de Brasília e bebidas geladas.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="menu-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por sabor, ingrediente..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 custom-scrollbar scrollbar-none mb-6">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`tab-category-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#8B1E1E] to-[#A82828] text-white shadow-lg shadow-red-950/60 border border-amber-400/40 scale-105'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                <span className={isSelected ? 'text-amber-300' : 'text-slate-400'}>
                  {getCategoryIcon(cat.id)}
                </span>
                <span>{cat.nome}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Dietary / Attribute Filter Pills */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            Filtros rápidos:
          </span>

          <button
            onClick={() => setSelectedTag(selectedTag === 'popular' ? null : 'popular')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
              selectedTag === 'popular'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            ⭐ Mais Pedidos
          </button>

          <button
            onClick={() => setSelectedTag(selectedTag === 'vegetarian' ? null : 'vegetarian')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
              selectedTag === 'vegetarian'
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            🌱 Vegetarianas
          </button>

          <button
            onClick={() => setSelectedTag(selectedTag === 'forno' ? null : 'forno')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
              selectedTag === 'forno'
                ? 'bg-red-900 text-amber-200 border-red-700'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            🔥 Forno a Lenha
          </button>

          {(selectedTag || searchQuery || selectedCategory !== 'todos') && (
            <button
              onClick={() => {
                setSelectedTag(null);
                setSearchQuery('');
                setSelectedCategory('todos');
              }}
              className="text-xs text-amber-400 hover:underline ml-2 cursor-pointer"
            >
              Limpar todos os filtros
            </button>
          )}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onCustomize={onCustomizeProduct}
              />
            ))}
          </div>
        ) : (
          /* Empty search state */
          <div className="py-16 text-center bg-slate-900/50 rounded-3xl border border-slate-800 p-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500 mb-4">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Nenhum item encontrado</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
              Não encontramos resultados para sua busca. Tente buscar por outros termos como "calabresa", "queijo", "parmegiana" ou limpe os filtros.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('todos');
                setSelectedTag(null);
              }}
              className="mt-5 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition cursor-pointer"
            >
              Ver Todo o Cardápio
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
