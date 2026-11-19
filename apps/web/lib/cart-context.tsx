'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from './api';
import { useAuth } from './auth-context';

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number | string;
    minimumQuantity: number;
    images?: { url: string }[];
    seller: {
      id: string;
      storeName: string;
      slug: string;
      city: string;
    };
  };
  lineTotal?: number;
}

export interface SellerGroup {
  seller: {
    id: string;
    storeName: string;
    slug: string;
    city: string;
  };
  items: CartItem[];
  subtotal: number;
}

interface CartContextType {
  items: CartItem[];
  groupedBySeller: SellerGroup[];
  totalAmount: number;
  itemCount: number;
  isLoading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isCustomer } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [groupedBySeller, setGroupedBySeller] = useState<SellerGroup[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = async () => {
    if (!isAuthenticated || !isCustomer) {
      setItems([]);
      setGroupedBySeller([]);
      setTotalAmount(0);
      return;
    }

    try {
      setIsLoading(true);
      const data = await apiClient<{
        items: CartItem[];
        groupedBySeller: SellerGroup[];
        totalAmount: number;
      }>('/cart');

      setItems(data?.items || []);
      setGroupedBySeller(data?.groupedBySeller || []);
      setTotalAmount(data?.totalAmount || 0);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [isAuthenticated, isCustomer]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/products/${productId}`;
      return;
    }

    await apiClient('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
    await refreshCart();
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    await apiClient(`/cart/items/${cartItemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
    await refreshCart();
  };

  const removeFromCart = async (cartItemId: string) => {
    await apiClient(`/cart/items/${cartItemId}`, {
      method: 'DELETE',
    });
    await refreshCart();
  };

  const clearCart = async () => {
    await apiClient('/cart', {
      method: 'DELETE',
    });
    setItems([]);
    setGroupedBySeller([]);
    setTotalAmount(0);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        groupedBySeller,
        totalAmount,
        itemCount,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

