import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { CartItem, BairroDelivery, OrderResponse, MenuItem, CrustOption, ExtraOption } from '../types/index.ts';
import { fetchBairrosData, fetchMenuData } from '../services/api.ts';

interface CouponData {
  code: string;
  discountPercent?: number;
  discountAmount?: number;
  minOrder: number;
  description: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'cartId'>) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  removeItem: (cartId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isConfirmationOpen: boolean;
  setIsConfirmationOpen: (open: boolean) => void;
  activeOrder: OrderResponse['pedido'] | null;
  setActiveOrder: (order: OrderResponse['pedido'] | null) => void;
  deliveryType: 'delivery' | 'retirada';
  setDeliveryType: (type: 'delivery' | 'retirada') => void;
  bairrosList: BairroDelivery[];
  selectedBairroId: string;
  setSelectedBairroId: (bairroId: string) => void;
  selectedBairro: BairroDelivery | undefined;
  appliedCoupon: CouponData | null;
  availableCoupons: CouponData[];
  couponInput: string;
  setCouponInput: (code: string) => void;
  couponError: string | null;
  applyCoupon: (code?: string) => boolean;
  removeCoupon: () => void;
  itemCount: number;
  subtotal: number;
  desconto: number;
  taxaEntrega: number;
  total: number;
  customizingProduct: MenuItem | null;
  setCustomizingProduct: (product: MenuItem | null) => void;
  isRegionsModalOpen: boolean;
  setIsRegionsModalOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'gordeixos_cart_v1';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isRegionsModalOpen, setIsRegionsModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderResponse['pedido'] | null>(null);
  const [customizingProduct, setCustomizingProduct] = useState<MenuItem | null>(null);

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'retirada'>('delivery');
  const [bairrosList, setBairrosList] = useState<BairroDelivery[]>([]);
  const [selectedBairroId, setSelectedBairroId] = useState<string>('asa-norte');

  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<CouponData[]>([]);

  // Carregar lista de bairros do backend
  useEffect(() => {
    fetchBairrosData()
      .then((res) => {
        if (res && res.bairros) {
          setBairrosList(res.bairros);
          if (!selectedBairroId && res.bairros.length > 0) {
            setSelectedBairroId(res.bairros[0].id);
          }
        }
      })
      .catch((err) => {
        console.error('Falha ao carregar bairros:', err);
      });
    fetchMenuData()
      .then((res) => setAvailableCoupons((res.cupons || []) as CouponData[]))
      .catch((err) => console.error('Falha ao sincronizar cupons:', err));
  }, []);

  // Sincronizar carrinho com localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Erro ao salvar carrinho no storage:', e);
    }
  }, [items]);

  const selectedBairro = useMemo(() => {
    return bairrosList.find((b) => b.id === selectedBairroId);
  }, [bairrosList, selectedBairroId]);

  const itemCount = useMemo(() => {
    return items.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, curr) => acc + curr.unitPrice * curr.quantity, 0);
  }, [items]);

  const taxaEntrega = useMemo(() => {
    if (deliveryType === 'retirada' || items.length === 0) return 0;
    if (!selectedBairro) return 7.90;
    if (selectedBairro.freteGratisMin && subtotal >= selectedBairro.freteGratisMin) {
      return 0;
    }
    return selectedBairro.taxaEntrega;
  }, [deliveryType, selectedBairro, subtotal, items.length]);

  const desconto = useMemo(() => {
    if (!appliedCoupon || items.length === 0) return 0;
    if (subtotal < appliedCoupon.minOrder) return 0;

    if (appliedCoupon.discountPercent) {
      return (subtotal * appliedCoupon.discountPercent) / 100;
    }
    if (appliedCoupon.discountAmount) {
      return Math.min(appliedCoupon.discountAmount, subtotal);
    }
    return 0;
  }, [appliedCoupon, subtotal, items.length]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - desconto + taxaEntrega);
  }, [subtotal, desconto, taxaEntrega]);

  const addItem = (newItem: Omit<CartItem, 'cartId'>) => {
    const cartId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fullItem: CartItem = { ...newItem, cartId };

    setItems((prev) => {
      // Se não for pizza customizada (ex: bebida idêntica), agrupamos
      if (!fullItem.isPizza && !fullItem.observations && (!fullItem.extras || fullItem.extras.length === 0)) {
        const existingIndex = prev.findIndex((p) => p.productId === fullItem.productId && !p.observations);
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex].quantity += fullItem.quantity;
          return updated;
        }
      }
      return [fullItem, ...prev];
    });

    setIsCartOpen(true);
  };

  const updateQuantity = (cartId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.cartId === cartId ? { ...item, quantity } : item))
    );
  };

  const removeItem = (cartId: string) => {
    setItems((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  const applyCoupon = (codeToApply?: string): boolean => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    setCouponError(null);

    if (!code) {
      setCouponError('Digite o código do cupom.');
      return false;
    }

    const found = availableCoupons.find((c) => c.code.toUpperCase() === code);
    if (!found) {
      setCouponError('Cupom inválido ou expirado.');
      return false;
    }

    if (subtotal < found.minOrder) {
      setCouponError(`Pedido mínimo para este cupom é R$ ${found.minOrder.toFixed(2).replace('.', ',')}.`);
      return false;
    }

    setAppliedCoupon(found);
    setCouponInput(code);
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isConfirmationOpen,
        setIsConfirmationOpen,
        activeOrder,
        setActiveOrder,
        deliveryType,
        setDeliveryType,
        bairrosList,
        selectedBairroId,
        setSelectedBairroId,
        selectedBairro,
        appliedCoupon,
        availableCoupons,
        couponInput,
        setCouponInput,
        couponError,
        applyCoupon,
        removeCoupon,
        itemCount,
        subtotal,
        desconto,
        taxaEntrega,
        total,
        customizingProduct,
        setCustomizingProduct,
        isRegionsModalOpen,
        setIsRegionsModalOpen
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
};
