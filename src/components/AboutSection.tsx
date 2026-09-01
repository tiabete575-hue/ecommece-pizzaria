import React from 'react';
import { Award, Flame, Clock, Heart, MapPin, Users, Sparkles, CheckCircle2 } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="sobre-section" className="py-16 bg-slate-950 border-t border-slate-800 text-slate-300 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Story & Highlights */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/80 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Tradição Candanga Desde 1986</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-serif tracking-tight leading-tight">
              Quatro décadas honrando o autêntico sabor do{' '}
              <span className="text-amber-400">forno a lenha</span> em Brasília.
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Fundada em 1986, a <strong>Pizzaria Gordeixo's</strong> nasceu no coração de Brasília com um propósito simples: servir a melhor pizza artesanal da capital, assada em forno a lenha tradicional com massa de fermentação lenta e molho de tomates frescos.
            </p>

            <p className="text-sm text-slate-400 leading-relaxed font-normal">
              Ao longo de quase 40 anos, nossas receitas tornaram-se parte da história afetiva de milhares de famílias brasilienses. Além das nossas consagradas pizzas, criamos pratos icônicos como a nossa inconfundível <strong>Parmegiana de Filé Mignon</strong>, um clássico da gastronomia candanga.
            </p>

            {/* Key Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Flame className="w-4 h-4" /> Forno a Lenha a 450°C
                </div>
                <p className="text-xs text-slate-400">
                  Lenha de reflorestamento selecionada para garantir defumação sutil e borda crocante.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Clock className="w-4 h-4" /> Fermentação Lenta 48h
                </div>
                <p className="text-xs text-slate-400">
                  Massa maturada a frio para máxima leveza, digestibilidade e sabor inigualável.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Heart className="w-4 h-4" /> Ingredientes Nobres
                </div>
                <p className="text-xs text-slate-400">
                  Catupiry® original, farinha especial tipo 00 e queijos frescos da região.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <MapPin className="w-4 h-4" /> Entrega Ágil no DF
                </div>
                <p className="text-xs text-slate-400">
                  Frota própria com bags aquecidas para chegar como se saísse do forno agora.
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Imagery & Milestone Numbers */}
          <div className="lg:col-span-5 space-y-6">
            <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=800&q=80"
                alt="Pizzaiolo preparando massa no forno a lenha"
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Unidade Asa Norte</p>
                <p className="text-sm font-bold text-white mt-0.5">CLN 302 Bloco B • Brasília, DF</p>
                <p className="text-xs text-slate-400">Atendimento no salão e delivery para todo o DF</p>
              </div>
            </div>

            {/* Numbers Strip */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                <p className="text-2xl font-black text-amber-400 font-serif">1986</p>
                <p className="text-[11px] text-slate-400 font-medium">Ano de Fundação</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                <p className="text-2xl font-black text-white font-serif">+1M</p>
                <p className="text-[11px] text-slate-400 font-medium">Pizzas Assadas</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                <p className="text-2xl font-black text-amber-400 font-serif">4.9★</p>
                <p className="text-[11px] text-slate-400 font-medium">Avaliação no DF</p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
