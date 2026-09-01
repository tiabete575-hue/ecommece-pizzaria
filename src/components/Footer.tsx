import React from 'react';
import { Pizza, Phone, MapPin, Clock, Heart, ShieldCheck, MessageSquare, Instagram, Facebook, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface FooterProps {
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  const { setIsRegionsModalOpen } = useCart();

  return (
    <footer className="bg-[#0B1120] border-t border-slate-800 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B1E1E] to-red-950 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Pizza className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-black text-white font-serif">GORDEIXO'S</span>
                <p className="text-[11px] text-amber-400 font-bold">Desde 1986 em Brasília</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Tradição no forno a lenha, massas de fermentação lenta 48h e as autênticas parmegianas candangas. Entregas em todo o Distrito Federal.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <a
                href="https://api.whatsapp.com/send?phone=5561999998686"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white transition"
                title="WhatsApp Oficial"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
              <a
                href="tel:61999998686"
                className="p-2 rounded-lg bg-slate-800 hover:bg-amber-600 hover:text-white transition"
                title="Ligar para a Pizzaria"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Unidades e Endereços no DF */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-serif">
              Nossas Unidades no DF
            </h4>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Unidade Asa Norte</p>
                  <p className="text-slate-400">CLN 302 Bloco B Loja 14 • Plano Piloto</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Unidade Sudoeste</p>
                  <p className="text-slate-400">CLSW 300 Bloco A Loja 08 • Sudoeste</p>
                </div>
              </div>

              <button
                onClick={() => setIsRegionsModalOpen(true)}
                className="text-amber-400 hover:underline font-bold text-[11px] pt-1 cursor-pointer flex items-center gap-1"
              >
                <span>Ver todas as regiões de entrega no DF →</span>
              </button>
            </div>
          </div>

          {/* Column 3: Horários de Atendimento */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-serif">
              Horário de Atendimento
            </h4>

            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Terça a Domingo</p>
                  <p className="text-slate-400">18:00 às 23:30 (Salão e Delivery)</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-300">Segunda-feira</p>
                  <p className="text-slate-500">Descanso da equipe</p>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-[11px] font-semibold">
              🟢 Forno a lenha aquecido e pronto para seu pedido!
            </div>
          </div>

          {/* Column 4: Pagamento & Segurança */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-serif">
              Pagamentos Aceitos
            </h4>

            <p className="text-xs text-slate-400">
              PIX (com 5% OFF), Cartão de Crédito e Débito (todas as bandeiras) e Dinheiro na entrega.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-bold">
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400">PIX</span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">Visa</span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">Mastercard</span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">Elo</span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">Alelo/VR</span>
            </div>

            <div className="pt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Ambiente 100% Seguro & Protegido</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-slate-500 text-[11px]">
          <p>
            © 1986 - 2026 Pizzaria Gordeixo's Ltda. CNPJ: 14.892.405/0001-86. Brasília, DF. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            {onOpenAdmin && (
              <button
                id="footer-staff-login-btn"
                onClick={onOpenAdmin}
                className="text-slate-500 hover:text-slate-300 transition flex items-center gap-1 cursor-pointer"
                title="Acesso restrito para funcionários e equipe da cozinha (PIN)"
              >
                <Lock className="w-3 h-3 text-slate-500" />
                <span>Acesso da Equipe (KDS)</span>
              </button>
            )}
            <p className="flex items-center gap-1">
              Feito com <Heart className="w-3 h-3 text-red-500 fill-red-500" /> para a comunidade candanga.
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};
