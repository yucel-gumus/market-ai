'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { STORAGE_KEYS } from '@/constants';
import { findOptimalDepot, calculateOptimization, optimizeRoute, enrichProductDepots, itemQuantity } from '@/lib/shoppingUtils';
import { restoreCart } from '@/lib/cartStorage';
import { logger } from '@/lib/logger';
import { ProductService } from '@/services/productService';
import type { Product, CartItem, RouteStep, SearchSettings, ShoppingMode } from '@/types';

const MODE_KEY = 'shopping-mode';

export function useShoppingCart(settings?: SearchSettings | null) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [mode, setMode] = useState<ShoppingMode>('cheapest');
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const refreshingRef = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHOPPING_CART);
      setCartItems(saved ? restoreCart(JSON.parse(saved)) : []);
      const savedMode = localStorage.getItem(MODE_KEY);
      if (savedMode === 'single' || savedMode === 'two' || savedMode === 'cheapest') setMode(savedMode);
    } catch (error) { logger.error('cart', 'Sepet okunamadı', error); }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SHOPPING_CART, JSON.stringify(cartItems));
      localStorage.setItem(MODE_KEY, mode);
    } catch (error) { logger.error('cart', 'Sepet yazılamadı', error); }
  }, [cartItems, mode, isHydrated]);

  const enrichedItems = useMemo(() => cartItems.map(item => ({ ...item,
    product: enrichProductDepots(settings ? { ...item.product, productDepotInfoList: item.product.productDepotInfoList.filter(depot => settings.depots.includes(depot.depotId)) } : item.product, settings?.selectedMarkets ?? []),
  })), [cartItems, settings]);
  const optimization = useMemo(() => isHydrated && enrichedItems.length
    ? calculateOptimization(enrichedItems, mode, settings ?? undefined) : null,
  [enrichedItems, mode, settings, isHydrated]);

  const addProducts = useCallback((products: Product[], increment: boolean, quantities?: Record<string, number>) => {
    setRefreshMessage(null);
    setCartItems(prev => {
      const next = [...prev];
      for (const product of products) {
        const depot = findOptimalDepot(product, next);
        if (!depot) continue;
        const index = next.findIndex(item => item.product.id === product.id);
        const requested = quantities?.[product.id];
        const planned = requested && Number.isInteger(requested) && requested >= 1 && requested <= 999 ? requested : 1;
        const quantity = index >= 0 ? Math.max(planned, itemQuantity(next[index]) + (increment ? 1 : 0)) : planned;
        const item: CartItem = { product, selectedDepot: depot, quantity, addedAt: index >= 0 ? next[index].addedAt : new Date() };
        if (index >= 0) next[index] = item;
        else next.push(item);
      }
      return next;
    });
  }, []);
  const addToCart = useCallback((product: Product) => addProducts([product], true), [addProducts]);
  const addManyToCart = useCallback((products: Product[], quantities?: Record<string, number>) => addProducts(products, false, quantities), [addProducts]);
  const removeFromCart = useCallback((id: string) => setCartItems(prev => prev.filter(item => item.product.id !== id)), []);
  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) return;
    setCartItems(prev => prev.map(item => item.product.id === id ? { ...item, quantity } : item));
  }, []);
  const clearCart = useCallback(() => { setCartItems([]); setRefreshMessage(null); }, []);
  const generateRoute = useCallback((lat: number, lon: number): RouteStep[] => {
    if (!optimization) return [];
    const route = optimizeRoute(lat, lon, optimization.marketGroups);
    // Eksik koordinat varsa kısmi rotayı tüm alışveriş rotası olarak sunma.
    return route.length === optimization.marketGroups.length ? route : [];
  }, [optimization]);

  const refreshPrices = useCallback(async () => {
    if (!settings || !cartItems.length || refreshingRef.current) return;
    refreshingRef.current = true;
    setIsRefreshing(true);
    setRefreshMessage(null);
    try {
      let results: Product[] = [];
      try { results = await ProductService.syncProducts(cartItems.map(item => item.product.id), settings); }
      catch { /* Preserve the entire previous basket when synchronization fails. */ }
      const updates = new Map(results.filter(p => findOptimalDepot(p, [])).map(p => [p.id, p]));
      setCartItems(prev => prev.map(item => {
        const product = updates.get(item.product.id);
        return product ? { ...item, product, selectedDepot: findOptimalDepot(product, [])! } : item;
      }));
      const failed = cartItems.filter(item => !updates.has(item.product.id)).length;
      setRefreshMessage(failed
        ? `${failed} ürünün fiyatı doğrulanamadı; önceki kayıtları korundu. Alışverişten önce kontrol edin.`
        : 'Sepetteki tüm ürünlerin fiyatları yeniden kontrol edildi.');
    } finally { refreshingRef.current = false; setIsRefreshing(false); }
  }, [settings, cartItems]);

  return {
    cartItems, optimization, mode, setMode, isHydrated, addToCart, addManyToCart, removeFromCart,
    updateQuantity, clearCart, generateRoute, refreshPrices, isRefreshing, refreshMessage,
    isProductInCart: (id: string) => cartItems.some(item => item.product.id === id),
    getCartItemByProductId: (id: string) => cartItems.find(item => item.product.id === id),
    marketCount: optimization?.marketCount ?? 0, totalCost: optimization?.totalCost ?? 0,
    totalSavings: optimization?.totalSavings,
  };
}
