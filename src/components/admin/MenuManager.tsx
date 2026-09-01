import React, { useState, useEffect } from 'react';
import { MenuItem, CrustOption } from '../../types/index.ts';
import {
  fetchMenuData,
  createMenuItem,
  updateProductDetails,
  deleteMenuItem,
  toggleProductAvailability,
  toggleCrustAvailability,
  updateCrustDetails
} from '../../services/api.ts';
import {
  Utensils,
  Search,
  Check,
  X,
  Edit2,
  Trash2,
  AlertCircle,
  Eye,
  EyeOff,
  Flame,
  Plus,
  RefreshCw,
  Sparkles,
  Save,
  Image as ImageIcon,
  Tag
} from 'lucide-react';

interface MenuManagerProps {
  onMenuUpdated?: () => void;
}

export function MenuManager({ onMenuUpdated }: MenuManagerProps) {
  const [activeTab, setActiveTab] = useState<'produtos' | 'bordas'>('produtos');
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [crusts, setCrusts] = useState<CrustOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [editingCrust, setEditingCrust] = useState<CrustOption | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // New Product State
  const [isCreatingProduct, setIsCreatingProduct] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'tradicionais' | 'especiais' | 'doces' | 'parmegianas' | 'combos' | 'bebidas'>('tradicionais');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newImage, setNewImage] = useState<string>('https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80');
  const [newMediaPrice, setNewMediaPrice] = useState<number>(49.90);
  const [newGrandePrice, setNewGrandePrice] = useState<number>(69.90);
  const [newFamiliaPrice, setNewFamiliaPrice] = useState<number>(84.90);
  const [newBasePrice, setNewBasePrice] = useState<number>(49.90);
  const [newTags, setNewTags] = useState<string>('Brasília, Forno a Lenha');
  const [newIsSpecialty, setNewIsSpecialty] = useState<boolean>(false);
  const [newIsPopular, setNewIsPopular] = useState<boolean>(false);
  const [newIsVegetarian, setNewIsVegetarian] = useState<boolean>(false);
  const [newIsSpicy, setNewIsSpicy] = useState<boolean>(false);
  const [isSubmittingNewProduct, setIsSubmittingNewProduct] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMenuData();
      if (data) {
        setProducts(data.produtos || []);
        setCrusts(data.bordas || []);
      }
    } catch (err) {
      console.error('Erro ao carregar menu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleProduct = async (product: MenuItem) => {
    const nextState = product.available === false ? true : false;
    try {
      await toggleProductAvailability(product.id, nextState);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, available: nextState } : p))
      );
      showFeedback(`"${product.name}" agora está ${nextState ? 'ATIVO' : 'PAUSADO (Esgotado)'}`);
      if (onMenuUpdated) onMenuUpdated();
    } catch (err) {
      console.error('Erro ao alternar produto:', err);
    }
  };

  const handleToggleCrust = async (crust: CrustOption) => {
    const nextState = crust.available === false ? true : false;
    try {
      await toggleCrustAvailability(crust.id, nextState);
      setCrusts((prev) =>
        prev.map((c) => (c.id === crust.id ? { ...c, available: nextState } : c))
      );
      showFeedback(`Borda "${crust.name}" agora está ${nextState ? 'ATIVA' : 'PAUSADA'}`);
      if (onMenuUpdated) onMenuUpdated();
    } catch (err) {
      console.error('Erro ao alternar borda:', err);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmittingNewProduct(true);
    try {
      const isPizza = ['tradicionais', 'especiais', 'doces'].includes(newCategory);
      const tagsArray = newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: Partial<MenuItem> = {
        name: newName.trim(),
        category: newCategory,
        description: newDescription.trim(),
        image: newImage.trim() || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
        basePrice: isPizza ? newMediaPrice : newBasePrice,
        isPizza,
        popular: newIsPopular,
        vegetarian: newIsVegetarian,
        tags: tagsArray,
        sizes: isPizza
          ? [
              { id: 'media', name: 'Média (6 fatias - 30cm)', slices: 6, description: '6 fatias (30cm)', price: Number(newMediaPrice) },
              { id: 'grande', name: 'Grande (8 fatias - 35cm)', slices: 8, description: '8 fatias (35cm)', price: Number(newGrandePrice) },
              { id: 'familia', name: 'Família (12 fatias - 40cm)', slices: 12, description: '12 fatias (40cm)', price: Number(newFamiliaPrice) }
            ]
          : undefined,
        available: true
      };

      const res = await createMenuItem(payload);
      if (res && res.produto) {
        setProducts((prev) => [...prev.filter((p) => p.id !== res.produto.id), res.produto]);
      } else {
        await loadData();
      }

      setIsCreatingProduct(false);
      setNewName('');
      setNewDescription('');
      showFeedback(`Novo sabor/produto "${payload.name}" adicionado com sucesso ao cardápio!`);
      if (onMenuUpdated) onMenuUpdated();
    } catch (err: any) {
      console.error('Erro ao criar produto:', err);
      alert(err.message || 'Erro ao criar novo sabor/produto.');
    } finally {
      setIsSubmittingNewProduct(false);
    }
  };

  const handleDeleteProduct = async (product: MenuItem) => {
    if (!confirm(`Tem certeza que deseja excluir "${product.name}" do cardápio?`)) return;

    try {
      await deleteMenuItem(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showFeedback(`Item "${product.name}" removido do cardápio.`);
      if (onMenuUpdated) onMenuUpdated();
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
      alert('Falha ao excluir produto.');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSaving(true);
    try {
      await updateProductDetails(editingProduct.id, editingProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? editingProduct : p))
      );
      setEditingProduct(null);
      showFeedback(`Item "${editingProduct.name}" atualizado com sucesso!`);
      if (onMenuUpdated) onMenuUpdated();
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCrust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCrust) return;

    setIsSaving(true);
    try {
      await updateCrustDetails(editingCrust.id, editingCrust);
      setCrusts((prev) =>
        prev.map((c) => (c.id === editingCrust.id ? editingCrust : c))
      );
      setEditingCrust(null);
      showFeedback(`Borda "${editingCrust.name}" atualizada com sucesso!`);
      if (onMenuUpdated) onMenuUpdated();
    } catch (err) {
      console.error('Erro ao salvar borda:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'todos' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="p-3.5 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header & Tabs (Produtos vs Bordas) */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('produtos')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'produtos'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Pizzas & Pratos ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bordas')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'bordas'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Bordas Recheadas ({crusts.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'produtos' && (
            <button
              onClick={() => setIsCreatingProduct(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Sabor / Item</span>
            </button>
          )}

          <button
            onClick={loadData}
            className="p-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
            title="Recarregar Cardápio"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CREATE PRODUCT MODAL */}
      {isCreatingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>Cadastrar Novo Sabor ou Produto</span>
                </h3>
                <p className="text-xs text-slate-400">Adicione uma nova pizza, bebida, parmegiana ou combo ao cardápio</p>
              </div>
              <button
                onClick={() => setIsCreatingProduct(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nome do Item / Sabor:</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Pizza Burrata com Pesto"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-400 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Categoria do Cardápio:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-400 text-xs"
                  >
                    <option value="tradicionais">Pizzas Tradicionais</option>
                    <option value="especiais">Pizzas Especiais / Premium</option>
                    <option value="doces">Pizzas Doces</option>
                    <option value="parmegianas">Parmegianas do Forno</option>
                    <option value="combos">Combos & Promoções</option>
                    <option value="bebidas">Bebidas & Refrigerantes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Descrição / Ingredientes detalhados:</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ex: Molho de tomate artesanal pelati, mozzarella fresca, burrata de búfala, pesto de manjericão genovês e pinolis tostados."
                  rows={3}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400 text-xs resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">URL da Foto do Item:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400 text-xs"
                  />
                  {newImage && (
                    <img
                      src={newImage}
                      alt="Preview"
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-slate-800 flex-shrink-0"
                    />
                  )}
                </div>
              </div>

              {/* Price Fields for Pizzas (Média, Grande, Família) vs Single Price */}
              {['tradicionais', 'especiais', 'doces'].includes(newCategory) ? (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <span className="font-bold text-amber-400 uppercase tracking-wider block">
                    Preços da Pizza por Tamanho:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <label className="block text-slate-400 font-bold mb-1">Média (6 fatias):</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                        <input
                          type="number"
                          step="0.50"
                          value={newMediaPrice}
                          onChange={(e) => setNewMediaPrice(parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-amber-400 text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <label className="block text-slate-400 font-bold mb-1">Grande (8 fatias):</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                        <input
                          type="number"
                          step="0.50"
                          value={newGrandePrice}
                          onChange={(e) => setNewGrandePrice(parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-amber-400 text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <label className="block text-slate-400 font-bold mb-1">Família (12 fatias):</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                        <input
                          type="number"
                          step="0.50"
                          value={newFamiliaPrice}
                          onChange={(e) => setNewFamiliaPrice(parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-amber-400 text-xs"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-slate-400 font-semibold mb-1">Preço Unitário (R$):</label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.50"
                      value={newBasePrice}
                      onChange={(e) => setNewBasePrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-400 text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Tags & Badges */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-slate-400 font-semibold">Tags (separadas por vírgula):</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Ex: Forno a Lenha, Artesanal, Brasília"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400 text-xs"
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsSpecialty}
                      onChange={(e) => setNewIsSpecialty(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span className="text-slate-300">Especial</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsPopular}
                      onChange={(e) => setNewIsPopular(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span className="text-slate-300">Mais Pedido</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsVegetarian}
                      onChange={(e) => setNewIsVegetarian(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span className="text-slate-300">Vegetariano</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsSpicy}
                      onChange={(e) => setNewIsSpicy(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span className="text-slate-300">Picante</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingProduct(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewProduct}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar e Ativar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 1: PRODUTOS */}
      {activeTab === 'produtos' && (
        <div className="space-y-4">
          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por nome de pizza, bebida ou ingrediente..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'tradicionais', label: 'Tradicionais' },
                { id: 'especiais', label: 'Especiais' },
                { id: 'doces', label: 'Doces' },
                { id: 'parmegianas', label: 'Parmegianas' },
                { id: 'combos', label: 'Combos' },
                { id: 'bebidas', label: 'Bebidas' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Table/Card List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="divide-y divide-slate-800">
              {filteredProducts.map((product) => {
                const isAvailable = product.available !== false;

                return (
                  <div
                    key={product.id}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${
                      !isAvailable ? 'bg-slate-950/60 opacity-75' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Image & Main Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                        <img
                          src={product.image}
                          alt={product.name}
                          className={`w-full h-full object-cover ${!isAvailable ? 'grayscale' : ''}`}
                        />
                        {!isAvailable && (
                          <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center text-[10px] font-black text-red-300">
                            PAUSADO
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{product.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold uppercase">
                            {product.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 max-w-xl">
                          {product.description}
                        </p>
                        {/* Price Preview */}
                        <div className="text-xs font-mono font-bold text-amber-400">
                          {product.isPizza && product.sizes && product.sizes.length > 0 ? (
                            <span>
                              M: R$ {(product.sizes.find((s) => s.id === 'media')?.price ?? product.basePrice ?? 0).toFixed(2).replace('.', ',')} • 
                              G: R$ {(product.sizes.find((s) => s.id === 'grande')?.price ?? product.basePrice ?? 0).toFixed(2).replace('.', ',')} • 
                              Família: R$ {(product.sizes.find((s) => s.id === 'familia')?.price ?? product.basePrice ?? 0).toFixed(2).replace('.', ',')}
                            </span>
                          ) : (
                            <span>R$ {(product.basePrice ?? 0).toFixed(2).replace('.', ',')}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Pause/Resume Toggle, Edit Button & Delete Button */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {/* Availability Switch */}
                      <button
                        onClick={() => handleToggleProduct(product)}
                        className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer border ${
                          isAvailable
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/50'
                            : 'bg-red-950/60 text-red-300 border-red-800 hover:bg-red-900/60'
                        }`}
                        title={isAvailable ? 'Clique para pausar este item' : 'Clique para ativar no cardápio'}
                      >
                        {isAvailable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{isAvailable ? 'Ativo' : 'Pausado'}</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => setEditingProduct(JSON.parse(JSON.stringify(product)))}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
                        title="Editar Detalhes e Preços"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Editar</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/70 text-red-400 hover:text-red-200 transition cursor-pointer border border-red-800/60"
                        title={`Excluir ${product.name} do cardápio`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BORDAS RECHEADAS */}
      {activeTab === 'bordas' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800">
            <h4 className="font-bold text-white text-sm">Gestão de Bordas & Recheios</h4>
            <p className="text-xs text-slate-400">
              Pause ou ative bordas com 1 clique (ex: caso acabe o estoque de Catupiry ou Chocolate Belga hoje).
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {crusts.map((crust) => {
              const isAvailable = crust.available !== false;

              return (
                <div
                  key={crust.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${
                    !isAvailable ? 'bg-slate-950/60 opacity-75' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{crust.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-amber-400 font-bold uppercase">
                        {crust.category}
                      </span>
                    </div>
                    {crust.description && (
                      <p className="text-xs text-slate-400">{crust.description}</p>
                    )}
                    <div className="text-xs font-mono font-bold text-amber-400">
                      R$ {crust.price.toFixed(2).replace('.', ',')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleToggleCrust(crust)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer border ${
                        isAvailable
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/50'
                          : 'bg-red-950/60 text-red-300 border-red-800 hover:bg-red-900/60'
                      }`}
                    >
                      {isAvailable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{isAvailable ? 'Ativa' : 'Pausada (Esgotada)'}</span>
                    </button>

                    <button
                      onClick={() => setEditingCrust(JSON.parse(JSON.stringify(crust)))}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Editar Preço</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: EDIT PRODUCT */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Editar Produto & Preços</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nome do Item:</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Descrição / Ingredientes:</label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400 text-xs resize-none"
                  required
                />
              </div>

              {/* Price Fields for Pizza Sizes or Single Price */}
              {editingProduct.isPizza && editingProduct.sizes && editingProduct.sizes.length > 0 ? (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <span className="font-bold text-amber-400 uppercase tracking-wider block">
                    Preço por Tamanho (R$):
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {editingProduct.sizes.map((size, idx) => (
                      <div key={size.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <label className="block text-slate-400 font-bold mb-1 truncate">
                          {size.id === 'media' ? 'Média (6 fat)' : size.id === 'grande' ? 'Grande (8 fat)' : 'Família (12 fat)'}:
                        </label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                          <input
                            type="number"
                            step="0.10"
                            value={size.price}
                            onChange={(e) => {
                              const newSizes = [...editingProduct.sizes!];
                              newSizes[idx] = { ...newSizes[idx], price: parseFloat(e.target.value) || 0 };
                              setEditingProduct({ ...editingProduct, sizes: newSizes });
                            }}
                            className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-amber-400 text-xs"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-slate-400 font-semibold mb-1">Preço Unitário (R$):</label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.10"
                      value={editingProduct.basePrice}
                      onChange={(e) => setEditingProduct({ ...editingProduct, basePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-400 text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteProduct(editingProduct);
                    setEditingProduct(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 font-bold transition cursor-pointer flex items-center gap-1.5 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir do Cardápio</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CRUST */}
      {editingCrust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Editar Preço da Borda</h3>
              <button
                onClick={() => setEditingCrust(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCrust} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nome da Borda:</label>
                <input
                  type="text"
                  value={editingCrust.name}
                  onChange={(e) => setEditingCrust({ ...editingCrust, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Valor Adicional da Borda (R$):</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.10"
                    value={editingCrust.price}
                    onChange={(e) => setEditingCrust({ ...editingCrust, price: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-400 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCrust(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Borda</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
