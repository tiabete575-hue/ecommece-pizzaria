import React from 'react';
import { Flame, Sparkles, Clock, ShieldCheck, ChevronRight, Award, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface HeroProps {
  onExploreMenu: () => void;
  onSelectCategory: (category: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreMenu, onSelectCategory }) => {
  const { setIsRegionsModalOpen } = useCart();

  return (
    <section
      id="hero-section"
      className="relative overflow-hidden bg-[#0F172A] pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-slate-800/60"
    >
      {/* Background Pizza Image with High Visibility */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=2000&q=90"
          alt="Pizza de calabresa com queijo derretido no forno a lenha"
          className="w-full h-full object-cover object-center opacity-75 sm:opacity-80 transform scale-100 transition-opacity duration-700 filter brightness-95 contrast-105"
          referrerPolicy="no-referrer"
        />
        {/* Soft, targeted gradient overlay to highlight the pizza while preserving crisp text readability */}
        <div className="absolute inset-0 bg-[#0F172A]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/85 via-[#0F172A]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-[#0F172A]/50" />
      </div>

      {/* Subtle background glow effect */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-red-900/20 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[250px] bg-amber-600/15 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            
            {/* Heritage Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-semibold shadow-inner">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Pizzaria Tradicional de Brasília • Desde 1986</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-serif leading-[1.1]">
              A verdadeira pizza no{' '}
              <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
                forno a lenha
              </span>{' '}
              do Planalto Central.
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Massa artesanal de fermentação lenta 48h, molho de tomate pelati italiano e queijos nobres gratinados a 450°C. Entregamos quentinha em todo o Distrito Federal.
            </p>

            {/* Main Action CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                id="hero-order-now-btn"
                onClick={onExploreMenu}
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-gradient-to-r from-[#8B1E1E] via-[#A82828] to-[#8B1E1E] hover:from-[#9E2222] hover:to-[#7A1919] text-white font-bold text-base shadow-xl shadow-red-950/70 border border-amber-400/30 transition-all transform hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>Fazer Meu Pedido Agora</span>
                <ChevronRight className="w-5 h-5 text-amber-300" />
              </button>

              <button
                id="hero-view-promos-btn"
                onClick={() => {
                  const el = document.getElementById('promocoes-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-amber-300 hover:text-amber-200 font-bold text-base border border-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Promoções & Combos</span>
              </button>
            </div>

            {/* Highlights Bar */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-red-950/60 text-red-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Forno a Lenha</p>
                  <p className="text-[11px] text-slate-400">450°C autêntico</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Massa 48h</p>
                  <p className="text-[11px] text-slate-400">Leve e crocante</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Desde 1986</p>
                  <p className="text-[11px] text-slate-400">Tradição Candanga</p>
                </div>
              </div>

              <div 
                onClick={() => setIsRegionsModalOpen(true)}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 flex items-center gap-2.5 cursor-pointer transition"
              >
                <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Entrega DF</p>
                  <p className="text-[11px] text-amber-400 font-medium">Ver bairros & taxas</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer decorative ring */}
              <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-tr from-[#8B1E1E] via-amber-500/40 to-slate-800 blur-sm opacity-70" />
              
              {/* Main Visual Container */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-amber-500/30 shadow-2xl shadow-black/80">
                <img
                  src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1000&q=80"
                  alt="Pizza artesanal no forno a lenha Gordeixo's"
                  className="w-full h-80 sm:h-96 object-cover object-center transform hover:scale-105 transition duration-700"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Floating Badge on Image */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-amber-500/30 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Destaque Especial da Casa</span>
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">
                      Calabresa Especial & Filé ao Catupiry®
                    </h2>
                    <p className="text-xs text-slate-300">Montagem meio-a-meio liberada</p>
                  </div>

                  <button
                    onClick={onExploreMenu}
                    className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition transform active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    Montar Agora
                  </button>
                </div>
              </div>

              {/* Floating review card */}
              <div className="absolute -top-4 -right-2 sm:-right-4 px-4 py-2.5 rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl flex items-center gap-2.5">
                <div className="flex text-amber-400 text-sm">★★★★★</div>
                <div className="text-[11px] leading-tight text-right">
                  <p className="font-bold text-white">4.9 / 5.0 no DF</p>
                  <p className="text-slate-400">+15.000 clientes felizes</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
