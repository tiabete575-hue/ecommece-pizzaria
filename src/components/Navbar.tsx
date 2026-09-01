import React, { useState } from 'react';
import { Pizza, ShoppingBag, PhoneCall, Clock, MapPin, Sparkles, Menu as MenuIcon, X, Flame } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface NavbarProps {
  onOpenMenu: () => void;
  onOpenAbout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMenu, onOpenAbout }) => {
  const { itemCount, subtotal, setIsCartOpen, setIsRegionsModalOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0F172A]/95 backdrop-blur-md transition-all">
      {/* Top micro banner */}
      <div id="top-announcement-bar" className="bg-gradient-to-r from-[#8B1E1E] via-[#A82828] to-[#8B1E1E] py-1.5 px-4 text-xs text-amber-100/90 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center p-0.5 rounded-full bg-amber-400/20 text-amber-300">
              <Flame className="w-3 h-3 text-amber-300 animate-pulse" />
            </span>
            <span>Tradição no forno a lenha em Brasília desde <strong>1986</strong></span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              Forno Aceso • Aberto até 23:30
            </span>
            <button
              onClick={() => setIsRegionsModalOpen(true)}
              className="hover:underline text-amber-200 cursor-pointer flex items-center gap-1 transition"
            >
              <MapPin className="w-3 h-3" />
              Entregamos em todo o DF
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <a
          href="#"
          id="brand-logo-link"
          className="flex items-center gap-3 group text-left focus:outline-none"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B1E1E] to-red-950 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-red-950/50 group-hover:scale-105 transition transform">
            <Pizza className="w-7 h-7 text-amber-400 group-hover:rotate-12 transition transform" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black tracking-tight text-white font-serif">
                GORDEIXO'S
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
                1986
              </span>
            </div>
            <p className="text-xs text-amber-200/80 font-medium tracking-wide">
              Pizzaria & Forno a Lenha • Brasília-DF
            </p>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav id="desktop-nav" className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            id="nav-link-cardapio"
            onClick={() => scrollToSection('cardapio-section')}
            className="px-3.5 py-2 text-sm font-semibold text-slate-200 hover:text-amber-400 hover:bg-slate-800/60 rounded-lg transition"
          >
            Cardápio Completo
          </button>

          <button
            id="nav-link-promocoes"
            onClick={() => scrollToSection('promocoes-section')}
            className="px-3.5 py-2 text-sm font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Promoções
          </button>

          <button
            id="nav-link-bairros"
            onClick={() => setIsRegionsModalOpen(true)}
            className="px-3.5 py-2 text-sm font-semibold text-slate-200 hover:text-amber-400 hover:bg-slate-800/60 rounded-lg transition flex items-center gap-1.5"
          >
            <MapPin className="w-4 h-4 text-red-400" />
            Taxas DF
          </button>

          <button
            id="nav-link-sobre"
            onClick={() => scrollToSection('sobre-section')}
            className="px-3.5 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition"
          >
            Nossa História
          </button>
        </nav>

        {/* Action Buttons: Phone & Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            id="phone-contact-btn"
            href="tel:61999998686"
            className="hidden lg:flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition"
            title="Ligue para nossa central"
          >
            <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
            <span>(61) 99999-8686</span>
          </a>

          {/* Cart Trigger Button */}
          <button
            id="open-cart-btn"
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B1E1E] to-[#6d1515] hover:from-[#9c2222] hover:to-[#8B1E1E] text-white shadow-lg shadow-red-950/60 border border-amber-500/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            aria-label="Abrir Carrinho de Compras"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-amber-300" />
              {itemCount > 0 && (
                <span
                  id="cart-badge-count"
                  className="absolute -top-2 -right-2.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center shadow-md animate-bounce"
                >
                  {itemCount}
                </span>
              )}
            </div>

            <div className="text-left leading-tight hidden xs:block sm:block">
              <p className="text-[10px] text-amber-200 uppercase font-bold tracking-wider">Meu Carrinho</p>
              <p className="text-sm font-extrabold text-white">
                {subtotal > 0 ? `R$ ${subtotal.toFixed(2).replace('.', ',')}` : 'R$ 0,00'}
              </p>
            </div>
          </button>

          {/* Mobile menu toggle */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700"
            aria-label="Menu Mobile"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="mobile-nav-menu" className="md:hidden border-t border-slate-800 bg-[#0F172A] px-4 pt-3 pb-6 space-y-2">
          <button
            onClick={() => scrollToSection('cardapio-section')}
            className="w-full text-left px-4 py-3 rounded-lg text-base font-semibold text-slate-200 hover:bg-slate-800 flex items-center justify-between"
          >
            <span>🍕 Cardápio Completo</span>
          </button>
          <button
            onClick={() => scrollToSection('promocoes-section')}
            className="w-full text-left px-4 py-3 rounded-lg text-base font-semibold text-amber-400 hover:bg-amber-500/10 flex items-center justify-between"
          >
            <span>⭐ Promoções do Dia</span>
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setIsRegionsModalOpen(true);
            }}
            className="w-full text-left px-4 py-3 rounded-lg text-base font-semibold text-slate-200 hover:bg-slate-800 flex items-center justify-between"
          >
            <span>📍 Regiões de Entrega DF</span>
          </button>
          <button
            onClick={() => scrollToSection('sobre-section')}
            className="w-full text-left px-4 py-3 rounded-lg text-base font-semibold text-slate-200 hover:bg-slate-800 flex items-center justify-between"
          >
            <span>🏛️ Sobre a Gordeixo's (1986)</span>
          </button>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 px-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Terça a Domingo: 18h às 23h30
            </span>
            <span className="text-amber-400 font-bold">(61) 99999-8686</span>
          </div>
        </div>
      )}
    </header>
  );
};
