'use client';

import { useRef } from 'react';
import { ChefHat, Clock, Flame, Package, Users, Utensils, X } from 'lucide-react';
import { formatNutritionValue, isNutritionNote, nutritionLabel } from '@/lib/nutritionLabels';
import { useModalDialog } from '@/lib/useModalDialog';
import type { RecipeWithCaloriesResponse } from '@/services/llmService';

/**
 * Tarif/kalori sonucu, ÜRETİLDİĞİ yemek adı ve kişi sayısıyla birlikte saklanır.
 * Aksi halde kullanıcı kişi sayısını değiştirdiğinde ekrandaki tarif eski kalır ama
 * başlık yeni sayıyı gösterir (ölçü ve porsiyon çelişkisi).
 */
export interface RecipeResult {
  data: RecipeWithCaloriesResponse;
  foodName: string;
  servings: number;
  request: string;
}

interface RecipeCalorieModalProps {
  isOpen: boolean;
  recipeResult: RecipeResult | null;
  fallbackServings: number;
  onClose: () => void;
}

export function RecipeCalorieModal({
  isOpen,
  recipeResult,
  fallbackServings,
  onClose,
}: RecipeCalorieModalProps) {
  const recipeDialogRef = useRef<HTMLDialogElement>(null);
  const recipeData = recipeResult?.data ?? null;
  const closeRecipeDialog = useModalDialog(
    recipeDialogRef,
    Boolean(isOpen && recipeData),
    onClose
  );

  return (
    <dialog
      ref={recipeDialogRef}
      aria-labelledby="recipe-modal-title"
      {...({ closedby: 'any' } as Record<string, string>)}
      className="mwg-dialog mwg-dialog-scale m-auto w-[calc(100%-2rem)] max-w-5xl rounded-3xl shadow-2xl"
    >
      {isOpen && recipeData ? (
        <div className="max-h-[90vh] w-full overflow-hidden rounded-3xl bg-[#EDF3EE] border border-[#BCC7D2]">
          <div className="relative bg-[#DCE3EA] p-6 border-b border-[#BCC7D2] text-[#253341]">
            <button
              type="button"
              onClick={closeRecipeDialog}
              className="absolute right-4 top-4 rounded-full bg-[#EDF3EE] p-2 text-[#253341] hover:bg-[#DBE6DD] border border-[#BCC7D2] transition-colors"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-4 flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#EC7D55] text-[#253341]">
                <ChefHat className="h-8 w-8 stroke-[2.5]" aria-hidden />
              </div>
              <div>
                <h2 id="recipe-modal-title" className="text-2xl font-bold font-heading text-[#253341]">
                  {recipeData.name}
                </h2>
                <p className="mt-0.5 text-xs font-semibold text-[#3E5164]">
                  {recipeData.description}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-[#EDF3EE] p-3.5 border border-[#BCC7D2]">
              <div className="flex items-center gap-2.5">
                <Flame className="h-5 w-5 text-[#AB421C]" aria-hidden />
                <div>
                  <div className="text-lg font-bold font-heading text-[#253341]">{recipeData.calories}</div>
                  <div className="text-[11px] font-semibold text-[#3E5164]">kcal/porsiyon</div>
                </div>
              </div>
              <div className="h-6 w-px bg-[#BCC7D2]" />
              <div className="flex items-center gap-2.5">
                <Users className="h-5 w-5 text-[#253341]" aria-hidden />
                <div>
                  {/* Sonucun üretildiği kişi sayısı gösterilir, ekrandaki güncel girdi değil. */}
                  <div className="text-base font-bold text-[#253341]">
                    {recipeResult?.servings ?? fallbackServings} Kişilik
                  </div>
                  <div className="text-[11px] font-semibold text-[#3E5164]">Standart porsiyon</div>
                </div>
              </div>
              {typeof recipeData.prepTime === 'string' && recipeData.prepTime.trim() && (
                <>
                  <div className="h-6 w-px bg-[#BCC7D2]" />
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-5 w-5 text-[#253341]" aria-hidden />
                    <div>
                      <div className="text-base font-bold text-[#253341]">{recipeData.prepTime.trim()}</div>
                      <div className="text-[11px] font-semibold text-[#3E5164]">Hazırlık süresi</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="max-h-[calc(90vh-220px)] overflow-y-auto overscroll-contain custom-scrollbar p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-[#BCC7D2] bg-[#DCE3EA] p-5 space-y-3">
                <h3 className="flex items-center gap-2 text-lg font-bold font-heading text-[#253341]">
                  <Package className="h-5 w-5 text-[#AB421C] stroke-[2.5]" /> Gerekli Malzemeler
                </h3>
                <ul className="space-y-2">
                  {recipeData.ingredients?.map((item: string, idx: number) => (
                    <li
                      key={idx}
                      className="rounded-xl bg-[#EDF3EE] p-3 text-sm font-semibold text-[#253341] border border-[#BCC7D2] flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#EC7D55]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-[#BCC7D2] bg-[#DCE3EA] p-5 space-y-3">
                <h3 className="flex items-center gap-2 text-lg font-bold font-heading text-[#253341]">
                  <Utensils className="h-5 w-5 text-[#AB421C] stroke-[2.5]" /> Hazırlanışı
                </h3>
                <ol className="space-y-3">
                  {recipeData.steps?.map((step: string, idx: number) => (
                    <li
                      key={idx}
                      className="flex gap-3 rounded-xl bg-[#EDF3EE] p-3 text-sm font-medium text-[#253341] border border-[#BCC7D2]"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#EC7D55] text-xs font-bold text-[#253341]">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {recipeData.nutrition && (
              <div className="rounded-2xl border border-[#BCC7D2] bg-[#DCE3EA] p-5 space-y-3">
                <h3 className="text-lg font-bold font-heading text-[#253341]">
                  Besin Değerleri ve Diyetisyen Değerlendirmesi
                </h3>
                {typeof recipeData.nutrition === 'object' && recipeData.nutrition !== null ? (
                  <div className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-3">
                      {Object.entries(recipeData.nutrition as Record<string, unknown>)
                        .filter(([key]) => !isNutritionNote(key))
                        .map(([key, val]) => (
                          <div
                            key={key}
                            className="rounded-xl bg-[#EDF3EE] p-3 border border-[#BCC7D2]"
                          >
                            <span className="text-xs font-bold text-[#3E5164] block mb-1">
                              {nutritionLabel(key)}
                            </span>
                            <span className="text-xs font-medium text-[#253341] leading-snug block">
                              {formatNutritionValue(val)}
                            </span>
                          </div>
                        ))}
                    </div>
                    {Object.entries(recipeData.nutrition as Record<string, unknown>)
                      .filter(([key]) => isNutritionNote(key))
                      .map(([key, val]) => (
                        <div key={key} className="rounded-xl bg-[#F5F9F5] p-3.5 border border-[#BCC7D2]">
                          <span className="text-xs font-bold text-[#253341] block mb-1">
                            💡 Beslenme ve Diyet Notu:
                          </span>
                          <p className="text-xs font-medium leading-relaxed text-[#3E5164]">
                            {formatNutritionValue(val)}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium leading-relaxed text-[#3E5164]">
                    {formatNutritionValue(recipeData.nutrition)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
