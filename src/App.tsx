'use client';

import React, { useState, useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { PromoHighlights } from './components/PromoHighlights.tsx';
import { MenuSection } from './components/MenuSection.tsx';
import { ProductModal } from './components/ProductModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { OrderConfirmationModal } from './components/OrderConfirmationModal.tsx';
import { DeliveryRegionsModal } from './components/DeliveryRegionsModal.tsx';
import { AboutSection } from './components/AboutSection.tsx';
import { Footer } from './components/Footer.tsx';
import { AdminPanel } from './components/admin/AdminPanel.tsx';
import { AdminAuthModal } from './components/admin/AdminAuthModal.tsx';
import { ADMIN_SESSION_KEY, fetchMenuData, logoutAdmin, validateAdminSession } from './services/api.ts';
import { MenuItem, CrustOption, ExtraOption } from './types/index.ts';
import { Loader2, AlertTriangle, RefreshCw, ShoppingBag, ChefHat } from 'lucide-react';

function MainAppContent() {
  const { customizingProduct, setCustomizingProduct, itemCount, subtotal, setIsCartOpen } = useCart();

  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; nome: string; icon: string }[]>([]);
  const [crustOptions, setCrustOptions] = useState<CrustOption[]>([]);
  const [extraOptions, setExtraOptions] = useState<ExtraOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleRequestStaffAccess = async () => {
    const hasSession = localStorage.getItem(ADMIN_SESSION_KEY) || sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!hasSession) return setIsAuthModalOpen(true);
    try {
      await validateAdminSession();
      setIsAdminOpen(true);
    } catch {
      logoutAdmin();
      setIsAuthModalOpen(true);
    }
  };

  // Check URL hash (#admin, #cozinha, #kds) & Keyboard shortcut (Ctrl+Alt+K)
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin' || hash === '#cozinha' || hash === '#kds') {
        handleRequestStaffAccess();
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        handleRequestStaffAccess();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const loadCatalog = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchMenuData();
      if (data && data.produtos) {
        setProducts(data.produtos);
        setCategories(data.categorias || []);
        setCrustOptions(data.bordas || []);
        setExtraOptions(data.adicionais || []);
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar cardápio:', err);
      const msg = err instanceof Error ? err.message : 'Falha na conexão com o servidor.';
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleExploreMenu = () => {
    const el = document.getElementById('cardapio-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isAdminOpen) {
    return (
      <AdminPanel
        onBackToStore={() => {
          setIsAdminOpen(false);
          loadCatalog();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Sticky Navbar */}
      <Navbar
        onOpenMenu={handleExploreMenu}
        onOpenAbout={() => {
          const el = document.getElementById('sobre-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Hero Section */}
      <Hero
        onExploreMenu={handleExploreMenu}
        onSelectCategory={(_cat) => {
          handleExploreMenu();
        }}
      />

      {/* Promo Highlights & Cupons */}
      <PromoHighlights />

      {/* Main Content: Cardápio */}
      <main id="main-content">
        {isLoading ? (
          <div className="py-24 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-amber-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">
              Aquecendo o forno a lenha e carregando o cardápio da Gordeixo's...
            </p>
          </div>
        ) : loadError ? (
          <div className="max-w-md mx-auto my-16 p-6 rounded-2xl bg-red-950/60 border border-red-800 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-white">Não foi possível carregar o cardápio</h3>
              <p className="text-xs text-red-200 mt-1">{loadError}</p>
            </div>
            <button
              onClick={loadCatalog}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        ) : (
          <MenuSection
            products={products}
            categories={categories}
            onCustomizeProduct={(product) => setCustomizingProduct(product)}
          />
        )}
      </main>

      {/* History & Story Section */}
      <AboutSection />

      {/* Footer */}
      <Footer onOpenAdmin={handleRequestStaffAccess} />

      {/* Floating Bottom Cart Bar for Mobile */}
      {itemCount > 0 && (
        <aside aria-label="Aviso do carrinho" className="fixed bottom-4 left-4 right-4 z-30 md:hidden animate-in slide-in-from-bottom duration-300">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#8B1E1E] to-[#A82828] text-white shadow-2xl border border-amber-400/40 flex items-center justify-between font-bold cursor-pointer active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center">
                {itemCount}
              </span>
              <span className="text-sm">Ver Carrinho</span>
            </div>
            <span className="text-amber-300 font-mono font-black text-base">
              R$ {subtotal.toFixed(2).replace('.', ',')}
            </span>
          </button>
        </aside>
      )}

      {/* Modals & Drawers */}
      <ProductModal
        product={customizingProduct}
        allProducts={products}
        crustOptions={crustOptions}
        extraOptions={extraOptions}
        onClose={() => setCustomizingProduct(null)}
      />

      <CartDrawer />
      <CheckoutModal />
      <OrderConfirmationModal />
      <DeliveryRegionsModal />

      {/* Staff Authentication PIN Modal */}
      <AdminAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          setIsAdminOpen(true);
        }}
      />

    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <MainAppContent />
    </CartProvider>
  );
}
