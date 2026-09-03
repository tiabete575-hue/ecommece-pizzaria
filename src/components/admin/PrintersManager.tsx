import React, { useState, useEffect } from 'react';
import {
  loadPrintersSettings,
  savePrintersSettings,
  testPrinterConnection,
  getDefaultPrintersSettings
} from '../../services/api.ts';
import type { PrintersSettings, PrinterConfig } from '../../types/index.ts';
import {
  Printer,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  Save,
  RotateCcw,
  Zap,
  Settings2,
  ChefHat,
  Store,
  AlertCircle,
  Info,
  Scissors
} from 'lucide-react';

interface PrinterCardProps {
  target: 'balcao' | 'cozinha';
  config: PrinterConfig;
  onChange: (updates: Partial<PrinterConfig>) => void;
}

function PrinterCard({ target, config, onChange }: PrinterCardProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testPrinterConnection(target);
      setTestResult({ ok: result.sucesso, msg: result.mensagem });
    } catch (err: any) {
      setTestResult({ ok: false, msg: err.message || 'Erro desconhecido.' });
    } finally {
      setIsTesting(false);
    }
  };

  const icon = target === 'cozinha'
    ? <ChefHat className="w-5 h-5" />
    : <Store className="w-5 h-5" />;

  const color = target === 'cozinha' ? 'orange' : 'blue';
  const colorClasses = {
    orange: {
      border: 'border-orange-500/40',
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      badge: 'bg-orange-500 text-slate-950',
      ring: 'ring-orange-500/20'
    },
    blue: {
      border: 'border-blue-500/40',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      badge: 'bg-blue-500 text-slate-950',
      ring: 'ring-blue-500/20'
    }
  }[color];

  return (
    <div className={`bg-slate-900 border ${config.enabled ? colorClasses.border : 'border-slate-800'} rounded-3xl overflow-hidden shadow-xl transition-all`}>
      {/* Card Header */}
      <div className={`p-4 ${config.enabled ? colorClasses.bg : 'bg-slate-950/60'} border-b border-slate-800 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl ${config.enabled ? colorClasses.bg : 'bg-slate-800'} ${config.enabled ? colorClasses.text : 'text-slate-500'} flex items-center justify-center border ${config.enabled ? colorClasses.border : 'border-slate-700'}`}>
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">
              {target === 'cozinha' ? '🍕 Impressora da Cozinha' : '🧾 Impressora do Balcão'}
            </h3>
            <p className="text-xs text-slate-400">
              {target === 'cozinha' ? 'Comanda sem valores — para o forno' : 'Cupom completo — para o cliente'}
            </p>
          </div>
        </div>

        {/* Toggle ON/OFF */}
        <button
          onClick={() => onChange({ enabled: !config.enabled })}
          className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${config.enabled ? (target === 'cozinha' ? 'bg-orange-500' : 'bg-blue-500') : 'bg-slate-700'}`}
          title={config.enabled ? 'Desabilitar impressora' : 'Habilitar impressora'}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nome da Impressora</label>
          <input
            type="text"
            value={config.name}
            onChange={e => onChange({ name: e.target.value })}
            placeholder="Ex: Epson TM-T20"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>

        {/* IP e Porta */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Endereço IP da Impressora
            </label>
            <input
              type="text"
              value={config.ip}
              onChange={e => onChange({ ip: e.target.value })}
              placeholder="192.168.1.100"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Porta TCP</label>
            <input
              type="number"
              value={config.port}
              onChange={e => onChange({ port: Number(e.target.value) })}
              placeholder="9100"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
            />
          </div>
        </div>

        {/* Largura do Papel */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Largura do Papel</label>
          <div className="flex gap-2">
            {(['80mm', '58mm'] as const).map(w => (
              <button
                key={w}
                onClick={() => onChange({ paperWidth: w })}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${config.paperWidth === w ? `${colorClasses.badge} border-transparent shadow` : 'border-slate-700 text-slate-400 bg-slate-950 hover:text-white'}`}
              >
                {w} {w === '80mm' ? '(Padrão)' : '(Compacto)'}
              </button>
            ))}
          </div>
        </div>

        {/* Corte Automático */}
        <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-xs font-semibold text-white">Corte Automático (GS V)</div>
              <div className="text-[11px] text-slate-500">Impressoras sem guilhotina ignoram este comando</div>
            </div>
          </div>
          <button
            onClick={() => onChange({ autoCut: !config.autoCut })}
            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${config.autoCut ? 'bg-amber-500' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.autoCut ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Botão de Teste */}
        <button
          onClick={handleTest}
          disabled={isTesting || !config.ip.trim()}
          className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          {isTesting ? (
            <>
              <Wifi className="w-4 h-4 animate-pulse text-amber-400" />
              <span>Enviando página de teste...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Testar Impressão (página de teste)</span>
            </>
          )}
        </button>

        {/* Resultado do Teste */}
        {testResult && (
          <div className={`flex items-start gap-2 p-3 rounded-xl text-xs border ${testResult.ok ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-red-950/40 border-red-800/60 text-red-300'}`}>
            {testResult.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            <span>{testResult.msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function PrintersManager() {
  const [settings, setSettings] = useState<PrintersSettings>(getDefaultPrintersSettings());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadPrintersSettings());
  }, []);

  const handleSave = () => {
    savePrintersSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    if (confirm('Resetar todas as configurações de impressoras para os valores padrão?')) {
      const defaults = getDefaultPrintersSettings();
      setSettings(defaults);
      savePrintersSettings(defaults);
    }
  };

  const updatePrinter = (target: 'balcao' | 'cozinha', updates: Partial<PrinterConfig>) => {
    setSettings(prev => ({
      ...prev,
      [target]: { ...prev[target], ...updates }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-white text-base">Impressoras Térmicas ESC/POS</h2>
            <p className="text-xs text-slate-400">Configurar impressão direta via rede (TCP/IP) e impressão via navegador</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Resetar
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-lg ${saved ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'}`}
          >
            {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? 'Salvo!' : 'Salvar Configurações'}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 p-4 bg-blue-950/30 border border-blue-800/50 rounded-2xl text-xs text-blue-200">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p><strong>Impressão via Navegador</strong> — funciona com qualquer impressora instalada no Windows ou Android. Use o botão "Imprimir via Navegador" no modal de comanda.</p>
          <p><strong>Impressão direta via IP</strong> — envio silencioso sem dialog. Funciona apenas quando o sistema roda localmente (<code className="bg-slate-800 px-1 rounded">npm run dev</code>) na mesma rede Wi-Fi/Ethernet das impressoras.</p>
        </div>
      </div>

      {/* Impressão Automática */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Impressão Automática</h3>
            <p className="text-xs text-slate-400">Imprime automaticamente ao receber um novo pedido</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Ativar impressão automática</div>
            <div className="text-xs text-slate-400 mt-0.5">Ao chegar novo pedido, envia direto para a impressora configurada</div>
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, autoprint: !prev.autoprint }))}
            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${settings.autoprint ? 'bg-purple-500' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.autoprint ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {settings.autoprint && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Enviar automaticamente para:</label>
            <div className="flex gap-2">
              {([
                { id: 'cozinha', label: '🍕 Só Cozinha', desc: 'Comanda para o forno' },
                { id: 'ambas', label: '🖨️ Ambas', desc: 'Cozinha + Balcão' }
              ] as const).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSettings(prev => ({ ...prev, autoprintTarget: opt.id }))}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${settings.autoprintTarget === opt.id ? 'bg-purple-500 text-white border-transparent shadow' : 'border-slate-700 text-slate-400 bg-slate-950 hover:text-white'}`}
                >
                  <div>{opt.label}</div>
                  <div className="font-normal text-[10px] opacity-70 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {settings.autoprint && (
          <div className="flex items-start gap-2 p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>A impressão automática funciona via rede/IP. Certifique-se que o IP da impressora está configurado e o sistema está rodando localmente.</span>
          </div>
        )}
      </div>

      {/* Cards de Impressoras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PrinterCard
          target="cozinha"
          config={settings.cozinha}
          onChange={updates => updatePrinter('cozinha', updates)}
        />
        <PrinterCard
          target="balcao"
          config={settings.balcao}
          onChange={updates => updatePrinter('balcao', updates)}
        />
      </div>

      {/* Protocolo Info */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-1">
        <div className="font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
          <Settings2 className="w-3.5 h-3.5" />
          Protocolo ESC/POS — Compatibilidade
        </div>
        <p>✅ Epson TM series (TM-T20, TM-T88, etc.) · Bematech MP-4200 · Daruma DR800 · Elgin i9 · Gertec G250 · Tanca TP-650</p>
        <p>✅ Genéricas 80mm e 58mm via USB, Serial ou Rede (porta TCP 9100)</p>
        <p>✅ Android (via Bluetooth ou Rede) com app de servidor ESC/POS instalado</p>
      </div>
    </div>
  );
}
