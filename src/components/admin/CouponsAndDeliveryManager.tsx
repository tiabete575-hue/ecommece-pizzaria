import React, { useState, useEffect } from 'react';
import { AdminCoupon, BairroDelivery } from '../../types/index.ts';
import {
  fetchAdminCoupons,
  saveAdminCoupon,
  deleteAdminCoupon,
  toggleAdminCoupon,
  fetchAdminBairros,
  createAdminBairro,
  updateAdminBairro,
  deleteAdminBairro,
  toggleAdminBairro
} from '../../services/api.ts';
import {
  Ticket,
  MapPin,
  Plus,
  Trash2,
  Check,
  X,
  Edit2,
  Save,
  Clock,
  DollarSign,
  Gift,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

export function CouponsAndDeliveryManager() {
  const [activeTab, setActiveTab] = useState<'cupons' | 'bairros'>('cupons');
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [bairros, setBairros] = useState<BairroDelivery[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // New Coupon Form State
  const [isCreatingCoupon, setIsCreatingCoupon] = useState<boolean>(false);
  const [newCouponCode, setNewCouponCode] = useState<string>('');
  const [newCouponDesc, setNewCouponDesc] = useState<string>('');
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderValue, setMinOrderValue] = useState<number>(50);

  // Editing Bairro State
  const [editingBairro, setEditingBairro] = useState<BairroDelivery | null>(null);
  const [isSavingBairro, setIsSavingBairro] = useState<boolean>(false);

  // New Bairro Form State
  const [isCreatingBairro, setIsCreatingBairro] = useState<boolean>(false);
  const [newBairroNome, setNewBairroNome] = useState<string>('');
  const [newBairroTaxa, setNewBairroTaxa] = useState<number>(8.90);
  const [newBairroTempoMin, setNewBairroTempoMin] = useState<number>(30);
  const [newBairroTempoMax, setNewBairroTempoMax] = useState<number>(50);
  const [newBairroFreteGratis, setNewBairroFreteGratis] = useState<string>('');
  const [isSubmittingBairro, setIsSubmittingBairro] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cRes, bRes] = await Promise.all([fetchAdminCoupons(), fetchAdminBairros()]);
      if (cRes && cRes.cupons) setCoupons(cRes.cupons);
      if (bRes && bRes.bairros) setBairros(bRes.bairros);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Coupon Actions
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    try {
      const payload: AdminCoupon = {
        code: newCouponCode.trim().toUpperCase(),
        description: newCouponDesc || 'Cupom Promocional',
        discountPercent: discountType === 'percent' ? Number(discountValue) : undefined,
        discountAmount: discountType === 'amount' ? Number(discountValue) : undefined,
        minOrder: Number(minOrderValue || 0),
        active: true
      };

      await saveAdminCoupon(payload);
      setCoupons((prev) => [...prev.filter((c) => c.code !== payload.code), payload]);
      setIsCreatingCoupon(false);
      setNewCouponCode('');
      setNewCouponDesc('');
      showFeedback(`Cupom ${payload.code} criado e ativado com sucesso!`);
    } catch (err) {
      console.error('Erro ao criar cupom:', err);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`Deseja excluir o cupom ${code}?`)) return;
    try {
      await deleteAdminCoupon(code);
      setCoupons((prev) => prev.filter((c) => c.code !== code));
      showFeedback(`Cupom ${code} excluído.`);
    } catch (err) {
      console.error('Erro ao excluir cupom:', err);
    }
  };

  const handleToggleCoupon = async (coupon: AdminCoupon) => {
    const nextActive = !coupon.active;
    try {
      await toggleAdminCoupon(coupon.code, nextActive);
      setCoupons((prev) =>
        prev.map((c) => (c.code === coupon.code ? { ...c, active: nextActive } : c))
      );
      showFeedback(`Cupom ${coupon.code} agora está ${nextActive ? 'ATIVO' : 'DESATIVADO'}`);
    } catch (err) {
      console.error('Erro ao alternar cupom:', err);
    }
  };

  // Bairro Actions
  const handleToggleBairro = async (bairro: BairroDelivery) => {
    const nextAtivo = !bairro.ativo;
    try {
      await toggleAdminBairro(bairro.id, nextAtivo);
      setBairros((prev) =>
        prev.map((b) => (b.id === bairro.id ? { ...b, ativo: nextAtivo } : b))
      );
      showFeedback(`Região "${bairro.nome}" agora está ${nextAtivo ? 'HABILITADA' : 'DESABILITADA'}`);
    } catch (err) {
      console.error('Erro ao alternar bairro:', err);
    }
  };

  const handleSaveBairro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBairro) return;

    setIsSavingBairro(true);
    try {
      await updateAdminBairro(editingBairro.id, editingBairro);
      setBairros((prev) =>
        prev.map((b) => (b.id === editingBairro.id ? editingBairro : b))
      );
      setEditingBairro(null);
      showFeedback(`Taxas e prazos da região "${editingBairro.nome}" salvos com sucesso!`);
    } catch (err) {
      console.error('Erro ao salvar bairro:', err);
    } finally {
      setIsSavingBairro(false);
    }
  };

  const handleCreateBairro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBairroNome.trim()) return;

    setIsSubmittingBairro(true);
    try {
      const payload = {
        nome: newBairroNome.trim(),
        taxaEntrega: Number(newBairroTaxa || 0),
        tempoMin: Number(newBairroTempoMin || 25),
        tempoMax: Number(newBairroTempoMax || 45),
        freteGratisMin: newBairroFreteGratis ? parseFloat(newBairroFreteGratis) : undefined,
        ativo: true
      };

      const res = await createAdminBairro(payload);
      if (res && res.bairro) {
        setBairros((prev) => [...prev.filter((b) => b.id !== res.bairro.id), res.bairro]);
      } else {
        await loadData();
      }
      setIsCreatingBairro(false);
      setNewBairroNome('');
      setNewBairroTaxa(8.90);
      setNewBairroTempoMin(30);
      setNewBairroTempoMax(50);
      setNewBairroFreteGratis('');
      showFeedback(`Região "${payload.nome}" cadastrada com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao criar bairro:', err);
      alert(err.message || 'Falha ao cadastrar região.');
    } finally {
      setIsSubmittingBairro(false);
    }
  };

  const handleDeleteBairro = async (bairro: BairroDelivery) => {
    if (!confirm(`Tem certeza que deseja excluir a região "${bairro.nome}" do DF?`)) return;
    try {
      await deleteAdminBairro(bairro.id);
      setBairros((prev) => prev.filter((b) => b.id !== bairro.id));
      showFeedback(`Região "${bairro.nome}" excluída com sucesso.`);
    } catch (err) {
      console.error('Erro ao excluir região:', err);
      alert('Erro ao excluir região.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3.5 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('cupons')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'cupons'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Cupons Promocionais ({coupons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bairros')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'bairros'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Taxas & Regiões do DF ({bairros.length})</span>
          </button>
        </div>

        <button
          onClick={loadData}
          className="p-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
          title="Recarregar Dados"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* SECTION 1: CUPONS */}
      {activeTab === 'cupons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-400" />
                <span>Cupons de Desconto & Campanhas</span>
              </h3>
              <p className="text-xs text-slate-400">
                Crie cupons de porcentagem ou valor em R$ com valor mínimo de pedido para atrair clientes.
              </p>
            </div>

            <button
              onClick={() => setIsCreatingCoupon(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Novo Cupom</span>
            </button>
          </div>

          {/* Create Coupon Drawer/Modal */}
          {isCreatingCoupon && (
            <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  <span>Cadastrar Novo Cupom Promocional</span>
                </h4>
                <button
                  onClick={() => setIsCreatingCoupon(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Código do Cupom:</label>
                  <input
                    type="text"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    placeholder="Ex: QUINTA15, CANDANGO"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-amber-300 font-mono font-bold uppercase focus:outline-none focus:border-amber-400 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Tipo de Desconto:</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percent' | 'amount')}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-amber-400 text-xs"
                  >
                    <option value="percent">Porcentagem (% OFF)</option>
                    <option value="amount">Valor Fixo (R$ OFF)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Valor do Desconto ({discountType === 'percent' ? '%' : 'R$'}):
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-400 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Pedido Mínimo (R$):</label>
                  <input
                    type="number"
                    step="5"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-400 text-xs"
                    required
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-slate-400 font-bold mb-1">Descrição / Frase:</label>
                  <input
                    type="text"
                    value={newCouponDesc}
                    onChange={(e) => setNewCouponDesc(e.target.value)}
                    placeholder="Ex: 15% de desconto especial na quinta-feira da pizza"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>

                <div className="flex items-end justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCoupon(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition cursor-pointer"
                  >
                    Salvar Cupom
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Coupons List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.code}
                className={`bg-slate-900 border rounded-3xl p-5 shadow-xl space-y-3 transition ${
                  coupon.active ? 'border-slate-800' : 'border-slate-800/40 opacity-60 bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-mono font-black text-sm rounded-xl border border-amber-500/30">
                      {coupon.code}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        coupon.active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {coupon.active ? 'Ativo' : 'Pausado'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteCoupon(coupon.code)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition"
                    title="Excluir cupom"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs space-y-1">
                  <div className="font-bold text-white">
                    {coupon.discountPercent
                      ? `${coupon.discountPercent}% de desconto`
                      : `R$ ${(coupon.discountAmount ?? 0).toFixed(2).replace('.', ',')} OFF`}
                  </div>
                  <p className="text-slate-400 text-[11px] line-clamp-2">{coupon.description}</p>
                  <div className="text-slate-400 text-[11px] pt-1">
                    Válido para pedidos acima de{' '}
                    <span className="font-bold text-amber-400">
                      R$ {(coupon.minOrder ?? 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleToggleCoupon(coupon)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      coupon.active
                        ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        : 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/40'
                    }`}
                  >
                    {coupon.active ? 'Desativar Cupom' : 'Ativar Cupom'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: REGIÕES & TAXAS DE ENTREGA DO DF */}
      {activeTab === 'bairros' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-400" />
                <span>Regiões Administrativas & Taxas do Distrito Federal</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure os valores de taxa de entrega, tempo estimado em minutos e valor para frete grátis por região do DF.
              </p>
            </div>

            <button
              onClick={() => setIsCreatingBairro(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl inline-flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Nova Região / Bairro</span>
            </button>
          </div>

          {/* Create Bairro Modal/Card */}
          {isCreatingBairro && (
            <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Cadastrar Nova Região ou Cidade Satélite do DF</span>
                </h4>
                <button
                  onClick={() => setIsCreatingBairro(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateBairro} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-bold mb-1">
                      Nome da Região / Bairro do DF:
                    </label>
                    <input
                      type="text"
                      value={newBairroNome}
                      onChange={(e) => setNewBairroNome(e.target.value)}
                      placeholder="Ex: Noroeste, Lago Norte, Vicente Pires..."
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Taxa de Entrega (R$):</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                      <input
                        type="number"
                        step="0.50"
                        value={newBairroTaxa}
                        onChange={(e) => setNewBairroTaxa(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">
                      Frete Grátis A Partir De (Opcional):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                      <input
                        type="number"
                        step="5"
                        value={newBairroFreteGratis}
                        onChange={(e) => setNewBairroFreteGratis(e.target.value)}
                        placeholder="Ex: 95.00"
                        className="w-full pl-8 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Tempo Mínimo Estimado (min):</label>
                    <input
                      type="number"
                      value={newBairroTempoMin}
                      onChange={(e) => setNewBairroTempoMin(parseInt(e.target.value) || 20)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Tempo Máximo Estimado (min):</label>
                    <input
                      type="number"
                      value={newBairroTempoMax}
                      onChange={(e) => setNewBairroTempoMax(parseInt(e.target.value) || 45)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingBairro(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBairro}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Salvar e Habilitar Região</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/90 text-[11px] font-black uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Região / Bairro do DF</th>
                    <th className="py-3.5 px-4">Taxa de Entrega</th>
                    <th className="py-3.5 px-4">Tempo Estimado</th>
                    <th className="py-3.5 px-4">Frete Grátis A Partir De</th>
                    <th className="py-3.5 px-4">Status de Atendimento</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {bairros.map((b) => (
                    <tr
                      key={b.id}
                      className={`hover:bg-slate-800/40 transition ${
                        !b.ativo ? 'bg-slate-950/60 opacity-60' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <span>{b.nome}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        R$ {(b.taxaEntrega ?? 0).toFixed(2).replace('.', ',')}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {b.tempoMin} a {b.tempoMax} min
                      </td>

                      <td className="py-3.5 px-4">
                        {b.freteGratisMin ? (
                          <span className="text-emerald-400 font-mono font-bold">
                            Acima de R$ {(b.freteGratisMin ?? 0).toFixed(2).replace('.', ',')}
                          </span>
                        ) : (
                          <span className="text-slate-500">Sem frete grátis</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleBairro(b)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-black cursor-pointer border transition ${
                            b.ativo
                              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                              : 'bg-red-950/60 text-red-300 border-red-800 hover:bg-red-900/70'
                          }`}
                        >
                          {b.ativo ? '🟢 Habilitado' : '🔴 Desabilitado'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingBairro(JSON.parse(JSON.stringify(b)))}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer text-xs"
                            title="Editar Região"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Editar</span>
                          </button>

                          <button
                            onClick={() => handleDeleteBairro(b)}
                            className="p-1.5 bg-red-950/40 hover:bg-red-900/70 border border-red-800/60 text-red-400 hover:text-red-200 rounded-xl transition cursor-pointer"
                            title={`Excluir região ${b.nome}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BAIRRO */}
      {editingBairro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Editar Região de Entrega</h3>
                <p className="text-xs text-amber-400 font-semibold">{editingBairro.nome}</p>
              </div>
              <button
                onClick={() => setEditingBairro(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBairro} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nome da Região / Bairro:</label>
                <input
                  type="text"
                  value={editingBairro.nome}
                  onChange={(e) => setEditingBairro({ ...editingBairro, nome: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-400 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Taxa de Entrega (R$):</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.50"
                    value={editingBairro.taxaEntrega}
                    onChange={(e) => setEditingBairro({ ...editingBairro, taxaEntrega: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-400 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tempo Mínimo (min):</label>
                  <input
                    type="number"
                    value={editingBairro.tempoMin}
                    onChange={(e) => setEditingBairro({ ...editingBairro, tempoMin: parseInt(e.target.value) || 20 })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-400 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tempo Máximo (min):</label>
                  <input
                    type="number"
                    value={editingBairro.tempoMax}
                    onChange={(e) => setEditingBairro({ ...editingBairro, tempoMax: parseInt(e.target.value) || 40 })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-400 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Pedido Mínimo p/ Frete Grátis (R$) (Opcional):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                  <input
                    type="number"
                    step="5"
                    value={editingBairro.freteGratisMin || ''}
                    onChange={(e) => setEditingBairro({ ...editingBairro, freteGratisMin: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="Ex: 95.00 (deixe em branco se não houver)"
                    className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteBairro(editingBairro);
                    setEditingBairro(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 font-bold transition cursor-pointer flex items-center gap-1.5 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBairro(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingBairro}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Região</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
