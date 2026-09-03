import React, { useState, useEffect } from 'react';
import { KitchenDisplayBoard } from './KitchenDisplayBoard.tsx';
import { MenuManager } from './MenuManager.tsx';
import { CouponsAndDeliveryManager } from './CouponsAndDeliveryManager.tsx';
import { PaymentGatewaysManager } from './PaymentGatewaysManager.tsx';
import { PrintersManager } from './PrintersManager.tsx';
import { fetchAdminStats, logoutAdmin } from '../../services/api.ts';
import {
  ChefHat,
  Flame,
  UtensilsCrossed,
  Ticket,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Store,
  ArrowLeft,
  Activity,
  Layers,
  Sparkles,
  LogOut,
  CreditCard,
  Printer
} from 'lucide-react';

interface AdminPanelProps {
  onBackToStore: () => void;
}

export function AdminPanel({ onBackToStore }: AdminPanelProps) {
  const [activeView, setActiveView] = useState<'kds' | 'menu' | 'coupons' | 'gateways' | 'printers'>('kds');
  const [stats, setStats] = useState({
    totalPedidos: 0,
    pedidosHoje: 0,
    faturamentoTotal: 0,
    ticketMedio: 0,
    pedidosNoForno: 0,
    pedidosNovos: 0
  });

  const loadStats = async () => {
    try {
      const data = await fetchAdminStats();
      if (data && data.stats) {
        const s = data.stats;
        setStats({
          totalPedidos: s.totalOrders ?? s.totalPedidos ?? 0,
          pedidosHoje: s.totalOrders ?? s.pedidosHoje ?? 0,
          faturamentoTotal: s.totalRevenue ?? s.faturamentoTotal ?? 0,
          ticketMedio: s.avgTicket ?? s.ticketMedio ?? 0,
          pedidosNoForno: s.byStatus?.preparando ?? s.pedidosNoForno ?? 0,
          pedidosNovos: s.byStatus?.recebido ?? s.pedidosNovos ?? 0
        });
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas do admin:', err);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-white text-base sm:text-lg tracking-wide">
                  GORDEIXO'S ADMIN
                </h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  KDS Cozinha Online
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gestão em Tempo Real de Pedidos, Cardápio & Entregas DF
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToStore}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-700 active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Voltar à Loja</span>
            </button>

            <button
              onClick={() => {
                logoutAdmin();
                if (window.location.hash) {
                  window.location.hash = '';
                }
                onBackToStore();
              }}
              className="px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 hover:text-red-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              title="Encerrar sessão de funcionário e bloquear painel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bloquear / Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Wrapper */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Real-time KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Faturamento */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">Faturamento Total</div>
              <div className="text-lg sm:text-xl font-mono font-black text-white">
                R$ {(stats.faturamentoTotal ?? 0).toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>

          {/* Card 2: Pedidos do Dia */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">Pedidos Cadastrados</div>
              <div className="text-lg sm:text-xl font-mono font-black text-white">
                {stats.totalPedidos ?? 0} pedidos
              </div>
            </div>
          </div>

          {/* Card 3: No Forno / Em Produção */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">No Forno / Em Fila</div>
              <div className="text-lg sm:text-xl font-mono font-black text-orange-400">
                {(stats.pedidosNoForno ?? 0) + (stats.pedidosNovos ?? 0)} pedidos
              </div>
            </div>
          </div>

          {/* Card 4: Ticket Médio */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">Ticket Médio</div>
              <div className="text-lg sm:text-xl font-mono font-black text-white">
                R$ {(stats.ticketMedio ?? 0).toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs — grid responsivo, todas as abas visíveis sem scroll */}
        <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-2xl">
          {/* Linha 1: 3 abas principais */}
          <div className="grid grid-cols-3 gap-1.5 mb-1.5">
            <button
              onClick={() => setActiveView('kds')}
              className={`py-3 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeView === 'kds'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Flame className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">KDS &amp; Pedidos</span>
              {stats.pedidosNovos > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-red-600 text-white animate-pulse flex-shrink-0">
                  {stats.pedidosNovos}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveView('menu')}
              className={`py-3 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeView === 'menu'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Cardápio</span>
            </button>

            <button
              onClick={() => setActiveView('coupons')}
              className={`py-3 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeView === 'coupons'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Ticket className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Cupons &amp; Taxas</span>
            </button>
          </div>

          {/* Linha 2: 2 abas secundárias */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setActiveView('gateways')}
              className={`py-3 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeView === 'gateways'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Gateways de Pagamento</span>
            </button>

            <button
              onClick={() => setActiveView('printers')}
              className={`py-3 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeView === 'printers'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Printer className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">🖨️ Impressoras Térmicas</span>
            </button>
          </div>
        </div>

        {/* Render Active View */}
        {activeView === 'kds' && <KitchenDisplayBoard onRefreshStats={loadStats} />}
        {activeView === 'menu' && <MenuManager onMenuUpdated={loadStats} />}
        {activeView === 'coupons' && <CouponsAndDeliveryManager />}
        {activeView === 'gateways' && <PaymentGatewaysManager />}
        {activeView === 'printers' && <PrintersManager />}
      </main>
    </div>
  );
}
