'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { STORAGE_KEYS } from '@/constants';
import {
  findOptimalDepot,
  calculateOptimization,
  optimizeRoute,
  addDistanceToMarketGroups,
} from '@/lib/shoppingUtils';
import { logger } from '@/lib/logger';
import {
  Product,
  CartItem,
  OptimizedShopping,
  RouteStep,
  ProductDepotInfo,
} from '@/types';

function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOPPING_CART);
    if (!saved) return [];
    const parsed: CartItem[] = JSON.parse(saved);
    return parsed.map((item) => ({
      ...item,
      addedAt: new Date(item.addedAt),
    }));
  } catch (error) {
    logger.error('cart', 'Sepet localStorage okunamadı', error);
    return [];
  }
}

export function useShoppingCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [optimization, setOptimization] = useState<OptimizedShopping | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const items = loadCartFromStorage();
    setCartItems(items);
    hydratedRef.current = true;
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SHOPPING_CART, JSON.stringify(cartItems));
    } catch (error) {
      logger.error('cart', 'Sepet localStorage yazılamadı', error);
    }
  }, [cartItems]);

  useEffect(() => {
    if (!isHydrated) return;
    if (cartItems.length > 0) {
      setOptimization(calculateOptimization(cartItems));
    } else {
      setOptimization(null);
    }
  }, [cartItems, isHydrated]);

  const addToCart = useCallback((product: Product) => {
    setCartItems((prev) => {
      const optimalDepot = findOptimalDepot(product, prev);
      if (!optimalDepot) {
        logger.warn('cart', 'Ürünün depo/fiyat bilgisi yok', { id: product.id });
        return prev;
      }

      const newItem: CartItem = {
        product,
        selectedDepot: optimalDepot,
        addedAt: new Date(),
      };

      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newItem;
        return updated;
      }
      return [...prev, newItem];
    });
  }, []);

  /** Batch ekleme — stale closure yok */
  const addManyToCart = useCallback((products: Product[]) => {
    setCartItems((prev) => {
      let next = [...prev];
      for (const product of products) {
        const optimalDepot = findOptimalDepot(product, next);
        if (!optimalDepot) continue;

        const newItem: CartItem = {
          product,
          selectedDepot: optimalDepot,
          addedAt: new Date(),
        };

        const existingIndex = next.findIndex((item) => item.product.id === product.id);
        if (existingIndex >= 0) {
          next = [...next];
          next[existingIndex] = newItem;
        } else {
          next = [...next, newItem];
        }
      }
      return next;
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateProductDepot = useCallback(
    (productId: string, newDepot: ProductDepotInfo) => {
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === productId
            ? { ...item, selectedDepot: newDepot }
            : item
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    setOptimization(null);
  }, []);

  const generateRoute = useCallback(
    (userLat: number, userLon: number): RouteStep[] => {
      if (!optimization || optimization.marketGroups.length === 0) {
        return [];
      }
      const groupsWithDistance = addDistanceToMarketGroups(
        optimization.marketGroups,
        userLat,
        userLon
      );
      return optimizeRoute(userLat, userLon, groupsWithDistance);
    },
    [optimization]
  );

  const isProductInCart = useCallback(
    (productId: string): boolean => cartItems.some((item) => item.product.id === productId),
    [cartItems]
  );

  const getCartItemByProductId = useCallback(
    (productId: string): CartItem | undefined =>
      cartItems.find((item) => item.product.id === productId),
    [cartItems]
  );

  return {
    cartItems,
    optimization,
    isHydrated,
    addToCart,
    addManyToCart,
    removeFromCart,
    updateProductDepot,
    clearCart,
    generateRoute,
    isProductInCart,
    getCartItemByProductId,
    marketCount: optimization?.marketCount || 0,
    totalCost: optimization?.totalCost || 0,
    totalSavings: optimization?.totalSavings || 0,
  };
}
