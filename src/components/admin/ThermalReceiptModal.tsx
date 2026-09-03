import React, { useState } from 'react';
import { KitchenOrder } from '../../types/index.ts';
import { sendToPrinter } from '../../services/api.ts';
import { Printer, X, Scissors, Wifi, CheckCircle2, XCircle, Loader2, ChefHat, Store } from 'lucide-react';

interface ThermalReceiptModalProps {
  order: KitchenOrder | null;
  onClose: () => void;
}

export function ThermalReceiptModal({ order, onClose }: ThermalReceiptModalProps) {
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [receiptType, setReceiptType] = useState<'completo' | 'cozinha' | 'expedicao'>('completo');
  const [networkStatus, setNetworkStatus] = useState<Record<string, { loading: boolean; result: { ok: boolean; msg: string } | null }>>({});

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleNetworkPrint = async (target: 'balcao' | 'cozinha') => {
    setNetworkStatus(prev => ({ ...prev, [target]: { loading: true, result: null } }));
    try {
      const result = await sendToPrinter(target, order);
      setNetworkStatus(prev => ({
        ...prev,
        [target]: { loading: false, result: { ok: result.sucesso, msg: result.mensagem } }
      }));
    } catch (err: any) {
      setNetworkStatus(prev => ({
        ...prev,
        [target]: { loading: false, result: { ok: false, msg: err.message || 'Erro ao enviar para impressora.' } }
      }));
    }
  };

  return (
    <div
      id="thermal-print-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static"
    >
      <div
        id="thermal-print-dialog"
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 print:border-none print:shadow-none print:bg-white print:text-black print:max-w-none print:w-auto"
      >
        {/* Header (Hidden on Print) */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Impressão de Comanda Térmica</h3>
              <p className="text-xs text-slate-400">
                Pedido {order.numeroPedido} • {order.cliente.nome}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar (Hidden on Print) */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Largura Térmica:</span>
            <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setPaperWidth('80mm')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  paperWidth === '80mm' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm (Padrão)
              </button>
              <button
                onClick={() => setPaperWidth('58mm')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  paperWidth === '58mm' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                58mm (Compacto)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Tipo:</span>
            <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setReceiptType('completo')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  receiptType === 'completo' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Completo
              </button>
              <button
                onClick={() => setReceiptType('cozinha')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  receiptType === 'cozinha' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Só Forno/Cozinha
              </button>
              <button
                onClick={() => setReceiptType('expedicao')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  receiptType === 'expedicao' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Só Entrega/Bag
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Imprimir via Navegador */}
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Via Navegador</span>
            </button>

            {/* Enviar para Cozinha via IP */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleNetworkPrint('cozinha')}
                disabled={networkStatus['cozinha']?.loading}
                className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs inline-flex items-center gap-2 cursor-pointer shadow active:scale-95 transition disabled:opacity-60"
                title="Envia ESC/POS diretamente para IP da cozinha"
              >
                {networkStatus['cozinha']?.loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <ChefHat className="w-4 h-4" />}
                <span>Cozinha (IP)</span>
              </button>
              {networkStatus['cozinha']?.result && (
                <div className={`text-[10px] flex items-center gap-1 px-2 ${networkStatus['cozinha'].result.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {networkStatus['cozinha'].result.ok
                    ? <CheckCircle2 className="w-3 h-3" />
                    : <XCircle className="w-3 h-3" />}
                  <span className="truncate max-w-[140px]" title={networkStatus['cozinha'].result.msg}>
                    {networkStatus['cozinha'].result.msg}
                  </span>
                </div>
              )}
            </div>

            {/* Enviar para Balcão via IP */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleNetworkPrint('balcao')}
                disabled={networkStatus['balcao']?.loading}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs inline-flex items-center gap-2 cursor-pointer shadow active:scale-95 transition disabled:opacity-60"
                title="Envia ESC/POS diretamente para IP do balcão"
              >
                {networkStatus['balcao']?.loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Store className="w-4 h-4" />}
                <span>Balcão (IP)</span>
              </button>
              {networkStatus['balcao']?.result && (
                <div className={`text-[10px] flex items-center gap-1 px-2 ${networkStatus['balcao'].result.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {networkStatus['balcao'].result.ok
                    ? <CheckCircle2 className="w-3 h-3" />
                    : <XCircle className="w-3 h-3" />}
                  <span className="truncate max-w-[140px]" title={networkStatus['balcao'].result.msg}>
                    {networkStatus['balcao'].result.msg}
                  </span>
                </div>
              )}
            </div>
          </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-6 bg-slate-950 flex justify-center overflow-x-auto max-h-[70vh] print:p-0 print:max-h-none print:bg-white print:overflow-visible">
          <div
            id="printable-thermal-receipt"
            className={`bg-white text-black font-mono text-[13px] leading-relaxed p-4 shadow-xl border border-slate-300 rounded-lg print:shadow-none print:border-none print:p-0 print:m-0 ${
              paperWidth === '80mm' ? 'w-[320px] max-w-[320px]' : 'w-[240px] max-w-[240px] text-[11px]'
            }`}
            style={{ fontFamily: '"Courier New", Courier, monospace' }}
          >
            {/* Header */}
            <div className="text-center pb-2 border-b-2 border-dashed border-black">
              <h2 className="text-base font-black uppercase tracking-wider">GORDEIXO'S PIZZARIA</h2>
              <p className="text-[11px] font-bold">TRADIÇÃO DE BRASÍLIA • DESDE 1986</p>
              <p className="text-[10px]">CLN 302 Bloco B - Asa Norte, DF</p>
              <p className="text-[10px]">WhatsApp: (61) 99999-8686</p>
            </div>

            {/* Order Title & Time */}
            <div className="py-2 text-center border-b border-dashed border-black">
              <div className="text-lg font-black tracking-widest">{order.numeroPedido}</div>
              <div className="text-[11px] font-bold mt-0.5">
                {order.cliente.tipoEntrega === 'delivery' ? '🛵 *** ENTREGA DELIVERY ***' : '🏪 *** RETIRADA BALCÃO ***'}
              </div>
              <div className="text-[10px] text-gray-700 mt-0.5">Data/Hora: {order.dataHora}</div>
            </div>

            {/* Customer Info (Included in Completo & Expedição) */}
            {receiptType !== 'cozinha' && (
              <div className="py-2 border-b border-dashed border-black text-[11px]">
                <div className="font-bold uppercase mb-0.5">CLIENTE:</div>
                <div className="font-black text-[13px]">{order.cliente.nome}</div>
                <div>Tel: {order.cliente.whatsapp}</div>

                {order.cliente.tipoEntrega === 'delivery' && (
                  <div className="mt-1 bg-gray-100 p-1 rounded">
                    <div className="font-bold text-[11px] uppercase">
                      📍 {order.cliente.bairroNome || 'Distrito Federal'}
                    </div>
                    {order.cliente.cep && <div>CEP: {order.cliente.cep}</div>}
                    <div className="font-bold">
                      {order.cliente.endereco}
                      {order.cliente.numero ? `, nº ${order.cliente.numero}` : ''}
                    </div>
                    {order.cliente.complemento && <div>Compl: {order.cliente.complemento}</div>}
                    {order.cliente.referencia && <div className="italic">Ref: {order.cliente.referencia}</div>}
                  </div>
                )}
              </div>
            )}

            {/* Items List (Cozinha & Completo) */}
            <div className="py-2 border-b-2 border-dashed border-black">
              <div className="font-black text-center text-xs uppercase mb-1.5 pb-1 border-b border-black">
                {receiptType === 'cozinha' ? '🍕 PEDIDOS PARA O FORNO A LENHA 🍕' : 'ITENS DO PEDIDO'}
              </div>

              <div className="space-y-2">
                {order.itens.map((item, idx) => (
                  <div key={idx} className="pb-1 border-b border-dotted border-gray-400 last:border-none">
                    <div className="flex justify-between font-black text-[13px]">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      {receiptType !== 'cozinha' && (
                        <span>R$ {((item.unitPrice ?? 0) * (item.quantity ?? 1)).toFixed(2).replace('.', ',')}</span>
                      )}
                    </div>

                    {item.isHalfHalf && item.secondFlavorName && (
                      <div className="font-bold pl-3 text-[11px]">↳ 1/2 {item.secondFlavorName}</div>
                    )}

                    {item.sizeName && <div className="pl-3 text-[11px]">↳ Tam: {item.sizeName}</div>}

                    {item.crustName && item.crustName !== 'Massa Tradicional (Sem recheio extra)' && (
                      <div className="pl-3 font-bold text-[11px] bg-gray-100 inline-block px-1">
                        ↳ Borda: {item.crustName}
                      </div>
                    )}

                    {item.extras && item.extras.length > 0 && (
                      <div className="pl-3 text-[10px]">↳ Extras: {item.extras.map((e) => e.name).join(', ')}</div>
                    )}

                    {item.observations && (
                      <div className="pl-3 font-bold text-[11px] text-red-700 bg-red-50 p-0.5 rounded mt-0.5">
                        ⚠️ OBS: {item.observations}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary (Completo & Expedicao) */}
            {receiptType !== 'cozinha' && (
              <div className="py-2 border-b border-dashed border-black text-[12px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {(order.subtotal ?? 0).toFixed(2).replace('.', ',')}</span>
                </div>
                {(order.desconto ?? 0) > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>Desconto:</span>
                    <span>-R$ {(order.desconto ?? 0).toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                {order.cliente.tipoEntrega === 'delivery' && (
                  <div className="flex justify-between">
                    <span>Taxa de Entrega:</span>
                    <span>
                      {(order.taxaEntrega ?? 0) === 0 ? 'GRÁTIS' : `R$ ${(order.taxaEntrega ?? 0).toFixed(2).replace('.', ',')}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-black text-[15px] pt-1 border-t border-black">
                  <span>TOTAL A PAGAR:</span>
                  <span>R$ {(order.total ?? 0).toFixed(2).replace('.', ',')}</span>
                </div>

                <div className="mt-2 pt-1 bg-gray-100 p-1.5 rounded text-[11px]">
                  <div className="font-bold uppercase">PAGAMENTO:</div>
                  <div className="font-black">
                    {order.cliente.formaPagamento === 'pix' && 'PIX (Chave Cadastrada)'}
                    {order.cliente.formaPagamento === 'cartao_credito' && 'CARTÃO CRÉDITO (Levar Maquininha)'}
                    {order.cliente.formaPagamento === 'cartao_debito' && 'CARTÃO DÉBITO (Levar Maquininha)'}
                    {order.cliente.formaPagamento === 'dinheiro' && 'DINHEIRO'}
                  </div>
                  {order.cliente.formaPagamento === 'dinheiro' && order.cliente.trocoPara && (
                    <div className="font-bold text-red-600">
                      Troco p/ R$ {(order.cliente.trocoPara ?? 0).toFixed(2).replace('.', ',')} (Levar R${' '}
                      {((order.cliente.trocoPara ?? 0) - (order.total ?? 0)).toFixed(2).replace('.', ',')} de troco)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 text-center text-[10px] space-y-1">
              <div className="font-bold">Estimativa: {order.tempoEstimado}</div>
              <p className="italic">Gordeixo's Pizzaria agradece a preferência!</p>
              <div className="text-[9px] text-gray-500 flex items-center justify-center gap-1">
                <Scissors className="w-3 h-3 inline" />
                <span>--------------------------------</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
