import React, { useState } from 'react';
import { useCart } from '../context/CartContext.tsx';
import { X, MapPin, Clock, Check, Search, Sparkles } from 'lucide-react';

export const DeliveryRegionsModal: React.FC = () => {
  const { isRegionsModalOpen, setIsRegionsModalOpen, bairrosList, selectedBairroId, setSelectedBairroId } = useCart();
  const [search, setSearch] = useState('');

  if (!isRegionsModalOpen) return null;

  const filteredBairros = bairrosList.filter((b) =>
    b.nome.toLowerCase().includes(search.toLowerCase().trim()) ||
    b.regiao.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div
      id="regions-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={() => setIsRegionsModalOpen(false)}
    >
      <div
        id="regions-modal-panel"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-[#0F172A] border border-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-950 text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-serif tracking-tight">
                Regiões & Taxas de Entrega no DF
              </h2>
              <p className="text-xs text-slate-400">
                Atendimento express para Brasília e Regiões Administrativas
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsRegionsModalOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por Asa Norte, Sudoeste, Águas Claras..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* List of Regions */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar">
          {filteredBairros.map((b) => {
            const isSelected = selectedBairroId === b.id;
            return (
              <div
                key={b.id}
                onClick={() => {
                  setSelectedBairroId(b.id);
                  setIsRegionsModalOpen(false);
                }}
                className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{b.nome}</h4>
                    {isSelected && (
                      <span className="px-2 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                        Selecionado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" /> {b.tempoMin}-{b.tempoMax} min
                    </span>
                    {b.freteGratisMin && (
                      <span className="text-emerald-400 text-[11px] font-medium">
                        • Frete Grátis acima de R$ {b.freteGratisMin},00
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-amber-400">
                    R$ {b.taxaEntrega.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center shrink-0">
          <p className="text-xs text-slate-400">
            🚚 Todas as entregas são transportadas em bags térmicas aquecidas para manter a crocância da massa.
          </p>
        </div>

      </div>
    </div>
  );
};
