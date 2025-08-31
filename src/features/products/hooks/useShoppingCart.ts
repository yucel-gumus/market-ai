import { useState, useCallback, useEffect } from 'react';
import { Product, CartItem, OptimizedShopping, RouteStep, ProductDepotInfo } from '@/types';
import { 
  findOptimalDepot, 
  calculateOptimization, 
  optimizeRoute,
  addDistanceToMarketGroups
} from '@/lib/shoppingUtils';

export function useShoppingCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [optimization, setOptimization] = useState<OptimizedShopping | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('shopping-cart');
    if (saved) {
      try {
        const parsed: CartItem[] = JSON.parse(saved);
        setCartItems(parsed.map((item) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        })));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('shopping-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (cartItems.length > 0) {
      const newOptimization = calculateOptimization(cartItems);
      setOptimization(newOptimization);
    } else {
      setOptimization(null);
    }
  }, [cartItems]);

  const addToCart = useCallback((product: Product) => {
    const optimalDepot = findOptimalDepot(product, cartItems);
    
    const newItem: CartItem = {
      product,
      selectedDepot: optimalDepot,
      addedAt: new Date()
    };
    
    const existingIndex = cartItems.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      setCartItems(prev => {
        const updated = [...prev];
        updated[existingIndex] = newItem;
        return updated;
      });
    } else {
      setCartItems(prev => [...prev, newItem]);
    }
  }, [cartItems]);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const updateProductDepot = useCallback((productId: string, newDepot: ProductDepotInfo) => {
    setCartItems(prev => 
      prev.map(item => 
        item.product.id === productId 
          ? { ...item, selectedDepot: newDepot }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setOptimization(null);
  }, []);

  const generateRoute = useCallback((userLat: number, userLon: number): RouteStep[] => {
    if (!optimization || optimization.marketGroups.length === 0) {
      return [];
    }
    const groupsWithDistance = addDistanceToMarketGroups(optimization.marketGroups);

    const route = optimizeRoute(userLat, userLon, groupsWithDistance);
    return route;
  }, [optimization]);

  const isProductInCart = useCallback((productId: string): boolean => {
    return cartItems.some(item => item.product.id === productId);
  }, [cartItems]);

  const getCartItemByProductId = useCallback((productId: string): CartItem | undefined => {
    return cartItems.find(item => item.product.id === productId);
  }, [cartItems]);

  return {
    cartItems,
    optimization,
    addToCart,
    removeFromCart,
    updateProductDepot,
    clearCart,
    generateRoute,
    isProductInCart,
    getCartItemByProductId,
    marketCount: optimization?.marketCount || 0,
    totalCost: optimization?.totalCost || 0,
    totalSavings: 0
  };
}