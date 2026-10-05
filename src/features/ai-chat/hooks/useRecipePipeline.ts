'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toErrorMessage } from '@/lib/errorUtils';
import { LlmService } from '@/services/llmService';
import { buildIngredientMatches, type IngredientMatch } from '@/lib/ingredientSelection';
import { branchForProduct } from '@/lib/branchSelection';
import { recipePackageQuantity, type IngredientRequirement } from '@/lib/recipeQuantity';
import { normalizeString } from '@/lib/stringUtils';
import { useAppStore } from '@/store/useAppStore';
import type { Product } from '@/types';

export type PipelineStep = 'input' | 'ingredients' | 'processing' | 'complete';
interface Options { addManyToCart: (products: Product[], quantities?: Record<string, number>) => void }

export function useRecipePipeline({ addManyToCart }: Options) {
  const [foodName, setFoodName] = useState('');
  const [servings, setServings] = useState(4);
  const [currentStep, setCurrentStep] = useState<PipelineStep>('input');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<IngredientRequirement[]>([]);
  const [matches, setMatches] = useState<IngredientMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => { runRef.current++; abortRef.current?.abort(); }, []);
  const recipeRequest = `${foodName.trim()} (${servings} kişilik)`;

  // Market adımında seçilen konum ve şubeler, ürünlerin doğru marketlerden gelmesi için sunucuya iletilir.
  const selectedAddress = useAppStore(state => state.selectedAddress);
  const selectedDistance = useAppStore(state => state.selectedDistance);
  const selectedMarkets = useAppStore(state => state.marketSession?.selectedMarkets);
  const marketSession = useAppStore(state => state.marketSession);
  const saveMarketSelection = useAppStore(state => state.saveMarketSelection);
  const location = useMemo(
    () =>
      selectedAddress
        ? {
            latitude: selectedAddress.latitude,
            longitude: selectedAddress.longitude,
            distance: selectedDistance,
            // Yalnızca kullanıcının seçtiği şubeler aransın; aksi halde seçili olmayan
            // marketlerden ürün gelir ve fiyat/rota karşılaştırması kilitlenir.
            depots: selectedMarkets?.length ? selectedMarkets.map(m => m.id) : undefined,
          }
        : undefined,
    [selectedAddress, selectedDistance, selectedMarkets]
  );

  const resetForm = useCallback(() => {
    runRef.current++; abortRef.current?.abort();
    setFoodName(''); setCurrentStep('input'); setIngredients([]); setRequirements([]); setMatches([]); setError(null); setIsLoading(false);
    // Yeni tarif başlatmak mevcut alışveriş listesini silmez.
  }, []);
  const removeIngredient = useCallback((ingredient: string) => setIngredients(prev => prev.filter(i => i !== ingredient)), []);

  const handleSubmit = useCallback(async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    if (!foodName.trim() || isLoading) return;
    const run = ++runRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true); setError(null); setMatches([]);
    try {
      const data = await LlmService.generateRecipeList(recipeRequest, controller.signal);
      if (run !== runRef.current) return;
      if (!data.success || !Array.isArray(data.ingredients)) throw new Error('Malzeme listesi alınamadı.');
      const seen = new Set<string>();
      const list = data.ingredients.filter(i => typeof i === 'string' && i.trim())
        .map(i => i.trim()).filter(i => { const key = normalizeString(i); if (seen.has(key)) return false; seen.add(key); return true; });
      if (!list.length) throw new Error('Malzeme bulunamadı.');
      setIngredients(list);
      setRequirements((data.ingredientDetails ?? []).filter(d => list.includes(d.name) && Number.isFinite(d.amount) && d.amount > 0 && ['g', 'ml', 'adet'].includes(d.unit)));
      setCurrentStep('ingredients');
    } catch (err) { if (run === runRef.current) setError(toErrorMessage(err, 'Malzeme listesi alınamadı')); }
    finally { if (run === runRef.current) setIsLoading(false); }
  }, [foodName, recipeRequest, isLoading]);

  const confirmIngredients = useCallback(async () => {
    if (isLoading || !ingredients.length) return;
    const run = ++runRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true); setCurrentStep('processing'); setError(null);
    const warnings: string[] = [];
    try {
      // Malzeme onayından sonrası tamamen sunucuda: arama + seçim + doğrulama.
      // İstemci yalnızca tarif, malzeme ve konum gönderir; aday ürün göndermez.
      const response = await LlmService.selectProducts(ingredients, recipeRequest, location, controller.signal);
      if (run !== runRef.current) return;
      if (!response.success || !Array.isArray(response.selections)) throw new Error('Ürün seçimi alınamadı.');
      // Sözleşme nöbeti: başarılı denip kimliksiz ürün dönerse sessizce devam etme.
      if (response.selections.some(s => s.success && !s.product?.id)) {
        throw new Error('AI backend ürün kimliği döndürmedi; sunucu sözleşmesi güncel değil.');
      }
      const resolved = buildIngredientMatches(ingredients, response.selections).map(match => {
        const requiredAmount = requirements.find(r => r.name === match.ingredient);
        return {
          ...match,
          requiredAmount,
          packageQuantity: match.product ? recipePackageQuantity(match.product, requiredAmount) : undefined,
        };
      });
      setMatches(resolved);
      addManyToCart(
        resolved.flatMap(match => match.product ? [match.product] : []),
        Object.fromEntries(resolved.filter(m => m.product && m.packageQuantity).map(m => [m.product!.id, m.packageQuantity!]))
      );
      const noProduct = resolved.filter(m => !m.product);
      // Ayrım önemli: "başka şubede var" bir çıkmaz sokak değil, tek dokunuşluk seçim;
      // "hiç bulunamadı" ise gerçek katalog boşluğu.
      const elsewhere = noProduct.filter(m => m.candidates.length).map(m => m.ingredient);
      const notFound = noProduct.filter(m => !m.candidates.length).map(m => m.ingredient);
      if (elsewhere.length) {
        warnings.push(`Şu malzemeler seçtiğiniz şubelerde yok, yakınınızdaki şubelerde bulundu: ${elsewhere.join(', ')}. Aşağıdan seçebilirsiniz.`);
      }
      if (notFound.length) {
        warnings.push(`Şu malzemeler için ürün bulunamadı: ${notFound.join(', ')}. Ürün aramasından ekleyebilirsiniz.`);
      }
      if (response.message) warnings.push(response.message);
      setError(warnings.length ? [...new Set(warnings)].join(' ') : null);
      setCurrentStep('complete');
    } catch (err) {
      if (run !== runRef.current) return;
      setError(toErrorMessage(err, 'Ürün araması tamamlanamadı.'));
      setMatches(ingredients.map(ingredient => ({ ingredient, candidates: [] })));
      setCurrentStep('complete');
    } finally { if (run === runRef.current) setIsLoading(false); }
  }, [isLoading, ingredients, requirements, recipeRequest, addManyToCart, location]);

  const chooseProduct = useCallback((ingredient: string, productId: string) => {
    const match = matches.find(m => m.ingredient === ingredient);
    const product = match?.candidates.find(p => p.id === productId);
    if (!product) return;
    // Ürün seçili marketlerde satılmıyorsa (örn. yalnızca başka bir şubede varsa), o şubeyi
    // seçime ekle. Aksi halde fiyatı "seçili şubelerde geçersiz" sayılır ve kullanıcının
    // kendi seçimiyle tüm sepet karşılaştırması kilitlenir.
    const branch = marketSession
      ? branchForProduct(product, marketSession.selectedMarkets.map(m => m.id), marketSession.selectedAddress)
      : null;
    if (branch && marketSession) {
      saveMarketSelection({
        distance: marketSession.distance,
        selectedAddress: marketSession.selectedAddress,
        selectedMarkets: [...marketSession.selectedMarkets, branch],
        totalMarkets: marketSession.totalMarkets ?? marketSession.selectedMarkets.length + 1,
      });
    }
    const requiredAmount = requirements.find(r => r.name === ingredient);
    const packageQuantity = recipePackageQuantity(product, requiredAmount);
    addManyToCart([product], packageQuantity ? { [product.id]: packageQuantity } : undefined);
    setMatches(prev => prev.map(m => m.ingredient === ingredient ? { ...m, product, source: 'manual', requiredAmount, packageQuantity } : m));
    if (branch) {
      const label = branch.brand && branch.brand !== branch.name ? `${branch.brand} (${branch.name})` : branch.brand ?? branch.name;
      setError(`${label} şubesi seçili marketlere eklendi: "${product.title}" yalnızca orada bulundu. İstemezseniz Konum & Marketler sayfasından çıkarabilirsiniz.`);
    }
  }, [matches, requirements, addManyToCart, marketSession, saveMarketSelection]);

  const forgetProduct = useCallback((productId: string) => {
    setMatches(prev => prev.map(match => match.product?.id === productId ? { ...match, product: undefined, source: undefined, reasoning: undefined } : match));
  }, []);
  const clearSelections = useCallback(() => {
    setMatches(prev => prev.map(match => ({ ...match, product: undefined, source: undefined, reasoning: undefined })));
  }, []);

  return {
    forgetProduct, clearSelections,
    foodName, setFoodName, servings, setServings, recipeRequest, currentStep, ingredients, setIngredients,
    matches, isLoading, error, setError, handleSubmit, confirmIngredients, removeIngredient, resetForm, chooseProduct,
    // Eski sonuç bileşenleri için yalnızca doğrulanmış seçimleri sun.
    results: { missingProducts: matches.filter(m => !m.product).map(m => m.ingredient),
      selectedProducts: matches.flatMap(m => m.product ? [m.product] : []) },
  };
}
