import React, { useState, useEffect } from 'react';
import {
  GatewaysConfig,
  GatewayProvider,
  MercadoPagoCredentials,
  EfiCredentials,
  AsaasCredentials,
  InfinitePayCredentials
} from '../../types/index.ts';
import {
  fetchGatewaysConfig,
  saveGatewaysConfig,
  testGatewayConnection
} from '../../services/api.ts';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Save,
  RefreshCw,
  Zap,
  Globe,
  HelpCircle,
  Sparkles,
  Info,
  Server,
  Layers,
  ArrowRight
} from 'lucide-react';

export function PaymentGatewaysManager() {
  const [config, setConfig] = useState<GatewaysConfig>({
    activeGateway: 'simulated',
    sandboxMode: true,
    mercadopago: { accessToken: '', publicKey: '', clientId: '', clientSecret: '', webhookSecret: '' },
    efi: { clientId: '', clientSecret: '', pixKey: 'financeiro@gordeixosbrasilia.com.br', certBase64: '' },
    asaas: { apiKey: '', walletId: '', webhookSecret: '' },
    infinitepay: { apiKey: '', handle: '', merchantId: '' },
    autoApproveMinutes: 0.25
  });

  const [activeTab, setActiveTab] = useState<GatewayProvider>('mercadopago');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const data = await fetchGatewaysConfig();
      if (data && data.config) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error('Erro ao carregar configurações de gateway:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await saveGatewaysConfig(config);
      if (res && res.sucesso) {
        setConfig(res.config);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações de pagamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async (provider: GatewayProvider) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testGatewayConnection(provider);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || 'Falha ao comunicar com o gateway.' });
    } finally {
      setIsTesting(false);
    }
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://seusite.com.br';

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
        <p className="font-semibold text-sm">Carregando credenciais e configurações de pagamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Gateway Selector Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Meios de Pagamento Diretos & Gateways PIX/Cartão
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Configure as chaves e credenciais oficiais de API (Mercado Pago, EFI/Gerencianet, Asaas, InfinitePay).
              O sistema gera QR Code Pix Dinâmico e detecta pagamentos automaticamente via Webhook em tempo real.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Salvar Todas as Keys</span>
            </button>
          </div>
        </div>

        {/* Global Control: Gateway Ativo & Modo Sandbox */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Gateway Choice */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Gateway Ativo para o Checkout do Cliente:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'mercadopago', name: 'Mercado Pago', badge: 'Mais Usado' },
                { id: 'efi_gerencianet', name: 'EFI / Gerencianet', badge: 'Pix Bacen' },
                { id: 'asaas', name: 'Asaas', badge: 'Pix + Cartão' },
                { id: 'infinitepay', name: 'InfinitePay', badge: 'Taxas Baixas' },
                { id: 'simulated', name: 'Sandbox / Simulado', badge: 'Demonstração' }
              ].map((gw) => (
                <button
                  key={gw.id}
                  type="button"
                  onClick={() => setConfig({ ...config, activeGateway: gw.id as GatewayProvider })}
                  className={`p-2.5 rounded-xl text-left border transition cursor-pointer relative flex flex-col justify-between ${
                    config.activeGateway === gw.id
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate text-white">{gw.name}</span>
                    {config.activeGateway === gw.id && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1">{gw.badge}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sandbox Toggle & Auto Approve */}
          <div className="space-y-3 flex flex-col justify-center">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Modo Sandbox (Ambiente de Testes)
                </span>
                <p className="text-[11px] text-slate-400">
                  {config.sandboxMode
                    ? 'Ativo: Simula cobranças e QR Codes sem movimentação real de dinheiro.'
                    : 'Desativado: Cobranças REAIS em ambiente de produção.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfig({ ...config, sandboxMode: !config.sandboxMode })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  config.sandboxMode ? 'bg-amber-500' : 'bg-emerald-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                    config.sandboxMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {saveSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Credenciais salvas com sucesso! O sistema está pronto para receber pagamentos.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs for Individual Gateways */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        {[
          { id: 'mercadopago', name: 'Mercado Pago', icon: QrCode },
          { id: 'efi_gerencianet', name: 'EFI / Gerencianet', icon: Zap },
          { id: 'asaas', name: 'Asaas', icon: CreditCard },
          { id: 'infinitepay', name: 'InfinitePay', icon: Globe },
          { id: 'simulated', name: 'Modo Simulado / Teste', icon: Sparkles }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isCurrentActiveProvider = config.activeGateway === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as GatewayProvider);
                setTestResult(null);
              }}
              className={`flex-1 min-w-[160px] py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
              {isCurrentActiveProvider && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                  isActive ? 'bg-slate-950 text-amber-300' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  ATIVO
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Form for Selected Gateway */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        {/* TAB 1: MERCADO PAGO */}
        {activeTab === 'mercadopago' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-400"></span>
                  Credenciais Mercado Pago (PIX Dinâmico + Cartão)
                </h3>
                <p className="text-xs text-slate-400">
                  Ideal para receber PIX com baixa latência e aprovação automática em 2 a 5 segundos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://www.mercadopago.com.br/developers/panel/app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-sky-950/40 border border-sky-800/60 hover:bg-sky-900/60 text-sky-300 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <span>Painel Desenvolvedor MP</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => handleTestConnection('mercadopago')}
                  disabled={isTesting}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>Testar Conexão</span>
                </button>
              </div>
            </div>

            {testResult && (
              <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2.5 ${
                testResult.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                {testResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Access Token */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    Access Token (Produção ou Teste):
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Inicia com APP_USR-... ou TEST-...</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecrets['mp_token'] ? 'text' : 'password'}
                    value={config.mercadopago.accessToken}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        mercadopago: { ...config.mercadopago, accessToken: e.target.value }
                      })
                    }
                    placeholder="Ex: APP_USR-1234567890123456-..."
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('mp_token')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showSecrets['mp_token'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Public Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  Public Key (Chave Pública):
                </label>
                <input
                  type="text"
                  value={config.mercadopago.publicKey}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      mercadopago: { ...config.mercadopago, publicKey: e.target.value }
                    })
                  }
                  placeholder="Ex: APP_USR-..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Webhook Secret */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Webhook Secret (Assinatura de Notificação):
                </label>
                <input
                  type="text"
                  value={config.mercadopago.webhookSecret || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      mercadopago: { ...config.mercadopago, webhookSecret: e.target.value }
                    })
                  }
                  placeholder="Ex: d41d8cd98f00b204e9800998ecf8427e"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Webhook URL Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-400" />
                  URL do Webhook para cadastrar no Mercado Pago:
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Endpoint Ativo
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${baseUrl}/api/webhooks/mercadopago`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${baseUrl}/api/webhooks/mercadopago`, 'mp_webhook')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedKey === 'mp_webhook' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'mp_webhook' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Eventos a marcar no painel do MP: <strong>payment</strong> e <strong>payment.updated</strong>.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: EFI / GERENCIANET */}
        {activeTab === 'efi_gerencianet' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                  Credenciais EFI / Gerencianet (Pix Direto Bacen)
                </h3>
                <p className="text-xs text-slate-400">
                  Solução oficial para Pix Dinâmico com cobranças imediatas (`/v2/cob`).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://app.sejaefi.com.br/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-orange-950/40 border border-orange-800/60 hover:bg-orange-900/60 text-orange-300 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <span>Painel API EFI</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => handleTestConnection('efi_gerencianet')}
                  disabled={isTesting}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>Testar Conexão</span>
                </button>
              </div>
            </div>

            {testResult && (
              <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2.5 ${
                testResult.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                {testResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Client_Id (EFI):
                </label>
                <input
                  type="text"
                  value={config.efi.clientId}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      efi: { ...config.efi, clientId: e.target.value }
                    })
                  }
                  placeholder="Client_Id_..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Client Secret */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Client_Secret (EFI):
                </label>
                <div className="relative">
                  <input
                    type={showSecrets['efi_secret'] ? 'text' : 'password'}
                    value={config.efi.clientSecret}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        efi: { ...config.efi, clientSecret: e.target.value }
                      })
                    }
                    placeholder="Client_Secret_..."
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('efi_secret')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showSecrets['efi_secret'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Chave Pix */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  Chave Pix Cadastrada na Conta EFI (EVP, CNPJ, Email ou Telefone):
                </label>
                <input
                  type="text"
                  value={config.efi.pixKey}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      efi: { ...config.efi, pixKey: e.target.value }
                    })
                  }
                  placeholder="Ex: financeiro@gordeixosbrasilia.com.br ou chave EVP aleatória"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Webhook URL Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-400" />
                  URL do Webhook Pix EFI:
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Endpoint Ativo
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${baseUrl}/api/webhooks/efi`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${baseUrl}/api/webhooks/efi`, 'efi_webhook')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedKey === 'efi_webhook' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'efi_webhook' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ASAAS */}
        {activeTab === 'asaas' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                  Credenciais Asaas (PIX Dinâmico + Cartão + Boletos)
                </h3>
                <p className="text-xs text-slate-400">
                  Plataforma completa de pagamentos com gestão de recebíveis e split.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://www.asaas.com/config/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <span>Configurações API Asaas</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => handleTestConnection('asaas')}
                  disabled={isTesting}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>Testar Conexão</span>
                </button>
              </div>
            </div>

            {testResult && (
              <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2.5 ${
                testResult.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                {testResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* API Key */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  API Key / Chave de Acesso (Asaas):
                </label>
                <div className="relative">
                  <input
                    type={showSecrets['asaas_key'] ? 'text' : 'password'}
                    value={config.asaas.apiKey}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        asaas: { ...config.asaas, apiKey: e.target.value }
                      })
                    }
                    placeholder="$aact_YTU5YTE0M2M6N2Zl..."
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('asaas_key')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showSecrets['asaas_key'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Wallet ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  Wallet ID (Opcional):
                </label>
                <input
                  type="text"
                  value={config.asaas.walletId || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      asaas: { ...config.asaas, walletId: e.target.value }
                    })
                  }
                  placeholder="ID da Carteira (se houver subcontas)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Webhook Secret */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Webhook Secret Token (Asaas):
                </label>
                <input
                  type="text"
                  value={config.asaas.webhookSecret || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      asaas: { ...config.asaas, webhookSecret: e.target.value }
                    })
                  }
                  placeholder="Token de verificação do Webhook"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Webhook URL Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-400" />
                  URL do Webhook para cadastrar no Asaas:
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Endpoint Ativo
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${baseUrl}/api/webhooks/asaas`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${baseUrl}/api/webhooks/asaas`, 'asaas_webhook')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedKey === 'asaas_webhook' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'asaas_webhook' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INFINITEPAY */}
        {activeTab === 'infinitepay' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  Credenciais InfinitePay (Pix + Link de Pagamento)
                </h3>
                <p className="text-xs text-slate-400">
                  Excelente taxa para recebimento no PIX e cartão com liquidação rápida.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://infinitepay.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-800/60 hover:bg-purple-900/60 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <span>Portal InfinitePay</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => handleTestConnection('infinitepay')}
                  disabled={isTesting}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>Testar Conexão</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* API Key */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  API Token / Secret Key (InfinitePay):
                </label>
                <div className="relative">
                  <input
                    type={showSecrets['infinite_key'] ? 'text' : 'password'}
                    value={config.infinitepay.apiKey}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        infinitepay: { ...config.infinitepay, apiKey: e.target.value }
                      })
                    }
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('infinite_key')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showSecrets['infinite_key'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Handle / Tag */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  Handle da Loja / InfiniteTag:
                </label>
                <input
                  type="text"
                  value={config.infinitepay.handle || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      infinitepay: { ...config.infinitepay, handle: e.target.value }
                    })
                  }
                  placeholder="gordeixospizzaria"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Merchant ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Merchant ID:
                </label>
                <input
                  type="text"
                  value={config.infinitepay.merchantId || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      infinitepay: { ...config.infinitepay, merchantId: e.target.value }
                    })
                  }
                  placeholder="ID do Comerciante"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Webhook URL Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-400" />
                  URL do Webhook InfinitePay:
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Endpoint Ativo
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${baseUrl}/api/webhooks/infinitepay`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${baseUrl}/api/webhooks/infinitepay`, 'infinite_webhook')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedKey === 'infinite_webhook' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'infinite_webhook' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SIMULATED / DEMO SANDBOX */}
        {activeTab === 'simulated' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                <Sparkles className="w-5 h-5" />
                <span>Modo de Demonstração & Simulação Inteligente (Sandbox Ativo)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Este modo permite apresentar e testar o fluxo de PIX Automático e Cartão de Crédito <strong>sem precisar de nenhuma chave de API ou contrato bancário no momento</strong>.
                Ao gerar um pedido com PIX, a tela exibe o QR Code dinâmico em alta definição com código Copia e Cola compatível e um botão para simular a aprovação instantânea!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Vantagens para Fechamento com o Cliente / Dono da Pizzaria:
              </h4>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">1.</span>
                  <span>Você pode demonstrar o sistema 100% funcional imediatamente para o cliente.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">2.</span>
                  <span>Quando o cliente escolher o gateway preferido (ex: Mercado Pago, Gerencianet ou Asaas), basta colar as chaves acima e salvar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">3.</span>
                  <span>A transição para produção é imediata, sem necessidade de alterar código!</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Save Floating Footer */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Todas as credenciais são criptografadas e mantidas de forma segura no servidor.</span>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Salvar Configurações</span>
        </button>
      </div>
    </div>
  );
}
