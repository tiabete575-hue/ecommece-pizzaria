import React, { useEffect, useState } from 'react';
import { ArrowRight, Loader2, Lock, ShieldAlert, X } from 'lucide-react';
import { loginAdmin } from '../../services/api.ts';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginAdmin(email, password, remember);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <form onSubmit={submit} className="relative w-full max-w-md bg-[#0F172A] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 space-y-6">
        <button type="button" onClick={onClose} className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800" aria-label="Fechar">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white font-serif">Acesso da equipe</h2>
          <p className="text-xs text-slate-400">Entre com o usuário cadastrado no Supabase da pizzaria.</p>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-300">
            E-mail
            <input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full h-12 rounded-xl bg-slate-900 border border-slate-700 px-4 text-sm text-white outline-none focus:border-amber-500" />
          </label>
          <label className="block text-xs font-bold text-slate-300">
            Senha
            <input type="password" required minLength={8} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full h-12 rounded-xl bg-slate-900 border border-slate-700 px-4 text-sm text-white outline-none focus:border-amber-500" />
          </label>
        </div>

        {error && <div className="flex gap-2 text-xs text-red-300 bg-red-950/50 border border-red-900/60 p-3 rounded-xl"><ShieldAlert className="w-4 h-4 shrink-0" />{error}</div>}

        <label className="flex items-center gap-2.5 text-xs text-slate-400 cursor-pointer">
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="w-4 h-4 rounded" />
          Manter conectado neste terminal da equipe
        </label>

        <button type="submit" disabled={loading || !email || !password} className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Acessar painel
        </button>
      </form>
    </div>
  );
};
