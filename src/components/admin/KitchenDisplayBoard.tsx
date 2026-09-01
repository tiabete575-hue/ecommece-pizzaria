import React, { useState, useEffect, useRef } from 'react';
import { KitchenOrder, KitchenStatus } from '../../types/index.ts';
import {
  fetchAdminOrders,
  updateOrderStatus,
  createMockOrder
} from '../../services/api.ts';
import { soundManager } from '../../utils/soundEffects.ts';
import { ThermalReceiptModal } from './ThermalReceiptModal.tsx';
import {
  Flame,
  Clock,
  Printer,
  Phone,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Plus,
  RefreshCw,
  Search,
  Bike,
  Store,
  ChefHat,
  Eye,
  Check,
  ChevronRight,
  Filter,
  XCircle
} from 'lucide-react';

interface KitchenDisplayBoardProps {
  onRefreshStats?: () => void;
}

export function KitchenDisplayBoard({ onRefreshStats }: KitchenDisplayBoardProps) {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<KitchenOrder | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  const previousOrderCountRef = useRef<number>(0);

  const loadOrders = async (silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetchAdminOrders(filterStatus);
      if (res && res.pedidos) {
        const fetchedOrders: KitchenOrder[] = res.pedidos;

        // Check if a new order arrived compared to previous count
        if (
          previousOrderCountRef.current > 0 &&
          fetchedOrders.length > previousOrderCountRef.current
        ) {
          const hasNewPending = fetchedOrders.some(
            (o) => o.status === 'recebido' && Date.now() - o.createdAt < 20000
          );
          if (hasNewPending && isSoundOn) {
            soundManager.playNewOrderChime();
          }
        }
        previousOrderCountRef.current = fetchedOrders.length;
        setOrders(fetchedOrders);
        if (onRefreshStats) onRefreshStats();
      }
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // Auto-polling every 6 seconds to capture live customer orders
    const interval = setInterval(() => {
      loadOrders(true);
      setNowTimestamp(Date.now());
    }, 6000);

    return () => clearInterval(interval);
  }, [filterStatus, isSoundOn]);

  const handleStatusChange = async (orderId: string, newStatus: KitchenStatus) => {
    try {
      soundManager.playStatusSuccessBeep();
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const handleMockOrder = async () => {
    setIsSimulating(true);
    try {
      soundManager.playNewOrderChime();
      await createMockOrder();
      await loadOrders(true);
    } catch (err) {
      console.error('Erro ao criar pedido simulado:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const toggleSound = () => {
    const nextState = !isSoundOn;
    setIsSoundOn(nextState);
    soundManager.setEnabled(nextState);
    if (nextState) {
      soundManager.playStatusSuccessBeep();
    }
  };

  // Filtered list
  const filteredOrders = orders.filter((o) => {
    if (filterStatus !== 'todos' && o.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = o.cliente.nome.toLowerCase().includes(q);
      const matchNum = o.numeroPedido.toLowerCase().includes(q);
      const matchPhone = o.cliente.whatsapp.includes(q);
      const matchItem = o.itens.some((it) => it.name.toLowerCase().includes(q));
      if (!matchName && !matchNum && !matchPhone && !matchItem) return false;
    }
    return true;
  });

  const getStatusBadge = (status: KitchenStatus) => {
    switch (status) {
      case 'recebido':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            NOVO PEDIDO
          </span>
        );
      case 'preparando':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-orange-500/20 text-orange-300 border border-orange-500/40 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400 animate-bounce" />
            NO FORNO A LENHA
          </span>
        );
      case 'saiu_entrega':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5 text-blue-400" />
            SAIU P/ ENTREGA
          </span>
        );
      case 'pronto_retirada':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-purple-400" />
            PRONTO NO BALCÃO
          </span>
        );
      case 'concluido':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            CONCLUÍDO
          </span>
        );
      case 'cancelado':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            CANCELADO
          </span>
        );
      default:
        return null;
    }
  };

  const getElapsedTime = (createdAt: number) => {
    const elapsedMinutes = Math.floor((nowTimestamp - createdAt) / (1000 * 60));
    if (elapsedMinutes < 1) return 'Agora mesmo';
    if (elapsedMinutes === 1) return '1 min atrás';
    return `${elapsedMinutes} min atrás`;
  };

  const isOrderLate = (order: KitchenOrder) => {
    if (order.status === 'concluido' || order.status === 'cancelado') return false;
    const elapsedMinutes = Math.floor((nowTimestamp - order.createdAt) / (1000 * 60));
    return elapsedMinutes >= 20; // Highlight if over 20 min in kitchen
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente, pedido #GDX, fone ou sabor..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'recebido', label: 'Novos' },
            { id: 'preparando', label: 'No Forno' },
            { id: 'saiu_entrega', label: 'Em Rota' },
            { id: 'pronto_retirada', label: 'Balcão' },
            { id: 'concluido', label: 'Concluídos' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Actions (Sound, Mock Order, Refresh) */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            title={isSoundOn ? 'Som de Pedidos Ativado' : 'Som Silenciado'}
            className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              isSoundOn
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{isSoundOn ? 'Alerta Sonoro ON' : 'Mudo'}</span>
          </button>

          <button
            onClick={handleMockOrder}
            disabled={isSimulating}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Simular Novo Pedido</span>
          </button>

          <button
            onClick={() => loadOrders()}
            className="p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
            title="Atualizar Pedidos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Carregando pedidos da cozinha...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
          <ChefHat className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Nenhum pedido encontrado nesta seção</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Assim que novos pedidos forem realizados no cardápio ou simulados, eles aparecerão aqui com alerta sonoro instantâneo.
          </p>
          <button
            onClick={handleMockOrder}
            className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Inserir Pedido de Teste</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const isLate = isOrderLate(order);

            return (
              <div
                key={order.id}
                className={`bg-slate-900 border rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition hover:border-slate-700 ${
                  isLate
                    ? 'border-red-500/70 shadow-red-950/30 ring-1 ring-red-500/40'
                    : order.status === 'recebido'
                    ? 'border-amber-500/60 shadow-amber-950/20 ring-1 ring-amber-500/30'
                    : 'border-slate-800'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-400 text-base">
                      {order.numeroPedido}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      ({order.cliente.tipoEntrega === 'delivery' ? '🛵 Delivery' : '🏪 Balcão'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3.5 flex-1">
                  {/* Time & Warning */}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {getElapsedTime(order.createdAt)}
                    </span>
                    {isLate && (
                      <span className="text-[11px] font-bold text-red-400 flex items-center gap-1 bg-red-950/80 px-2 py-0.5 rounded-md border border-red-800">
                        <AlertCircle className="w-3 h-3" />
                        Atraso &gt; 20m
                      </span>
                    )}
                  </div>

                  {/* Customer Information */}
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm truncate">{order.cliente.nome}</span>
                      <a
                        href={`https://api.whatsapp.com/send?phone=${order.cliente.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 text-[11px] bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-800/60"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Whats</span>
                      </a>
                    </div>

                    {order.cliente.tipoEntrega === 'delivery' ? (
                      <div className="text-slate-300 text-[11px] leading-tight">
                        <span className="text-amber-400/90 font-medium">📍 {order.cliente.bairroNome || 'DF'}</span>
                        <p className="text-slate-400 truncate">
                          {order.cliente.endereco}{order.cliente.numero ? `, nº ${order.cliente.numero}` : ''}
                          {order.cliente.complemento ? ` (${order.cliente.complemento})` : ''}
                        </p>
                      </div>
                    ) : (
                      <div className="text-purple-300 font-medium text-[11px]">
                        🏪 Retirada no Balcão Asa Norte
                      </div>
                    )}
                  </div>

                  {/* Items for the Kitchen */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Itens do Pedido ({order.itens.length}):
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {order.itens.map((it, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 space-y-1"
                        >
                          <div className="flex items-start justify-between font-black text-white">
                            <span>
                              <span className="text-amber-400 font-mono mr-1.5">{it.quantity}x</span>
                              {it.name}
                            </span>
                          </div>

                          {it.isHalfHalf && it.secondFlavorName && (
                            <div className="text-amber-300/90 pl-3 font-semibold text-[11px]">
                              ↳ Meio a Meio: {it.secondFlavorName}
                            </div>
                          )}

                          {it.sizeName && (
                            <div className="text-slate-400 pl-3 text-[11px]">
                              ↳ {it.sizeName}
                            </div>
                          )}

                          {it.crustName && it.crustName !== 'Massa Tradicional (Sem recheio extra)' && (
                            <div className="text-amber-400 pl-3 font-bold text-[11px] bg-amber-500/10 inline-block px-1.5 py-0.5 rounded border border-amber-500/20">
                              ↳ {it.crustName}
                            </div>
                          )}

                          {it.extras && it.extras.length > 0 && (
                            <div className="text-slate-400 pl-3 text-[10px]">
                              ↳ Extras: {it.extras.map((e) => e.name).join(', ')}
                            </div>
                          )}

                          {it.observations && (
                            <div className="text-red-300 font-bold text-[11px] pl-2 border-l-2 border-red-500 bg-red-950/30 p-1 rounded-r">
                              OBS: "{it.observations}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment & Values Summary */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">
                      Total ({order.cliente?.formaPagamento?.toUpperCase() || 'PAGAMENTO'}):
                    </span>
                    <span className="text-amber-400 font-mono font-black text-sm">
                      R$ {(order.total ?? 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Card Footer: 1-Click Status Transitions & Thermal Print */}
                <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
                  {/* Status Progression Buttons */}
                  <div className="grid grid-cols-1 gap-1.5">
                    {order.status === 'recebido' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'preparando')}
                        className="w-full py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                      >
                        <Flame className="w-4 h-4 animate-bounce" />
                        <span>1-Clique: Colocar no Forno</span>
                      </button>
                    )}

                    {order.status === 'preparando' && (
                      <div className="grid grid-cols-2 gap-1.5">
                        {order.cliente.tipoEntrega === 'delivery' ? (
                          <button
                            onClick={() => handleStatusChange(order.id, 'saiu_entrega')}
                            className="w-full py-2 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <Bike className="w-3.5 h-3.5" />
                            <span>Saiu p/ Entrega</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(order.id, 'pronto_retirada')}
                            className="w-full py-2 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <Store className="w-3.5 h-3.5" />
                            <span>Pronto Balcão</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleStatusChange(order.id, 'concluido')}
                          className="w-full py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Finalizar</span>
                        </button>
                      </div>
                    )}

                    {(order.status === 'saiu_entrega' || order.status === 'pronto_retirada') && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'concluido')}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Marcar como Entregue / Concluído</span>
                      </button>
                    )}

                    {order.status === 'concluido' && (
                      <div className="text-center py-1 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Pedido Finalizado com Sucesso</span>
                      </div>
                    )}
                  </div>

                  {/* Thermal Comanda Print & Cancel Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-900 text-xs">
                    <button
                      onClick={() => setSelectedPrintOrder(order)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                      title="Imprimir Comanda Térmica (80mm / 58mm)"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Imprimir Comanda</span>
                    </button>

                    {order.status !== 'cancelado' && order.status !== 'concluido' && (
                      <button
                        onClick={() => {
                          if (confirm(`Deseja realmente cancelar o pedido ${order.numeroPedido}?`)) {
                            handleStatusChange(order.id, 'cancelado');
                          }
                        }}
                        className="text-slate-500 hover:text-red-400 text-[11px] font-semibold transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Thermal Receipt Print Modal */}
      {selectedPrintOrder && (
        <ThermalReceiptModal
          order={selectedPrintOrder}
          onClose={() => setSelectedPrintOrder(null)}
        />
      )}
    </div>
  );
}
