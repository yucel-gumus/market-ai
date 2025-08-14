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

  // Load cart from localStorage on mount
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

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('shopping-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Recalculate optimization when cart changes
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
    
    // Check if product already exists in cart
    const existingIndex = cartItems.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      // Update existing item with new optimal depot
      setCartItems(prev => {
        const updated = [...prev];
        updated[existingIndex] = newItem;
        return updated;
      });
    } else {
      // Add new item
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
    console.log('🛒 Rota Oluşturuluyor...');
    console.log('🏠 Kullanıcı Konumu:', { latitude: userLat, longitude: userLon });
    
    if (!optimization || optimization.marketGroups.length === 0) {
      console.log('❌ Optimizasyon bulunamadı veya market grubu yok');
      return [];
    }

    const groupsWithDistance = addDistanceToMarketGroups(
      optimization.marketGroups,
      userLat,
      userLon
    );

    console.log('📊 Market Grupları (Mesafeli):', groupsWithDistance.map(group => ({
      marketName: group.marketName,
      depotName: group.depotInfo.depotName,
      latitude: group.depotInfo.latitude,
      longitude: group.depotInfo.longitude,
      distance: group.distance,
      totalPrice: group.items.reduce((sum, item) => sum + item.selectedDepot.price, 0)
    })));

    const route = optimizeRoute(userLat, userLon, groupsWithDistance);
    console.log('🗺️ Optimize Edilmiş Rota:', route.map(step => ({
      stepNumber: step.stepNumber,
      marketName: step.marketName,
      depotName: step.depot.depotName,
      coordinates: step.coordinates,
      distanceFromPrevious: step.distanceFromPrevious,
      estimatedTime: step.estimatedTime
    })));

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
    totalSavings: 0 // Bu property şimdilik yok, ileride eklenebilir
  };
}