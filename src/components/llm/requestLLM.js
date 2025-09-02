"use client";

import prompt from './productListPrompt';
import promptKategoriSelect from './selectCategoriesPromt';
import promturunadlari from './productNameFindPrompt';
import recipeAndCaloriePrompt from './recipeAndCaloriePrompt';

const MODEL_LIST = [
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite'
];

const API_KEYS = [
  process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY,
  process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY_RESTRICTED,
  process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY_RESTRICTED_2
].filter(Boolean);

function cleanAndParseJSON(raw, defaultErrorMessage = "JSON parse hatası") {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .replace(/,\s*}/g, '}') 
    .replace(/,\s*]/g, ']')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    return { success: false, message: defaultErrorMessage };
  }
}

async function tryWithApiKeysAndModels(contentBuilder, parseFn) {
  let lastError;
  
  for (let apiKeyIdx = 0; apiKeyIdx < API_KEYS.length; apiKeyIdx++) {
    const apiKey = API_KEYS[apiKeyIdx];
    
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      
      for (let modelIdx = 0; modelIdx < MODEL_LIST.length; modelIdx++) {
        const modelName = MODEL_LIST[modelIdx];
        
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const content = typeof contentBuilder === 'function' ? contentBuilder(modelName) : contentBuilder;
          const result = await model.generateContent(content);
          const raw = result.response.text().trim();
          return parseFn(raw);
          
        } catch (err) {
          lastError = err;
          const msg = err?.message?.toLowerCase() || '';
          
          if (msg.includes('429') || msg.includes('overload') || msg.includes('rate limit')) {
            continue;
          } 
          else if (msg.includes('quota') || msg.includes('token') || msg.includes('api key') || msg.includes('permission')) {
            break;
          } 
          else {
            return { success: false, message: err?.message || 'Bilinmeyen hata' };
          }
        }
      }
    } catch (importError) {
      lastError = importError;
      continue;
    }
  }
  
  return { 
    success: false, 
    message: 'Tüm API anahtarları ve modellerde hata oluştu: ' + (lastError?.message || 'Bilinmeyen hata') 
  };
}

export async function generateRecipeAndCalorie(recipeName) {
  if (!recipeName || typeof recipeName !== 'string') {
    return { success: false, message: "Geçerli bir tarif adı gerekli" };
  }
  
  return await tryWithApiKeysAndModels(
    () => recipeAndCaloriePrompt(recipeName),
    (raw) => cleanAndParseJSON(raw, "Bilinmeyen tarif veya format")
  );
}

export async function generateRecipeList(recipeName) {
  if (!recipeName || typeof recipeName !== 'string') {
    return { success: false, message: "Geçerli bir tarif adı gerekli" };
  }
  
  return await tryWithApiKeysAndModels(
    () => prompt.replace('${recipeName}', recipeName),
    (raw) => cleanAndParseJSON(raw, "Bilinmeyen tarif")
  );
}

export async function generateCategory(ingredients, categorylist) {
  if (!ingredients || !categorylist) {
    return { success: false, message: "Malzemeler ve kategori listesi gerekli" };
  }
  
  return await tryWithApiKeysAndModels(
    () => promptKategoriSelect
      .replace('${ingredients}', ingredients)
      .replace('${categorylist}', categorylist),
    (raw) => cleanAndParseJSON(raw, "Kategori seçim hatası")
  );
}

export async function tamurunbul(urunadlari, ingredients, recipeName) {
  if (!urunadlari || !ingredients || !recipeName) {
    return { success: false, message: "Tüm parametreler gerekli" };
  }
  
  const ingredientsStr = Array.isArray(ingredients)
    ? ingredients.join(", ")
    : ingredients;

  let lastError;
  
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await tryWithApiKeysAndModels(
        () => promturunadlari
          .replace('URUNADLARI_PLACEHOLDER', JSON.stringify(urunadlari, null, 2))
          .replace(/INGREDIENTS_PLACEHOLDER/g, ingredientsStr)
          .replace(/RECIPE_NAME_PLACEHOLDER/g, recipeName),
        (raw) => cleanAndParseJSON(raw, "Batch işlem hatası")
      );
      
      if (result.success !== false) {
        return result;
      }
      
      lastError = new Error(result.message);
      
    } catch (err) {
      lastError = err;
    }
    
    if (attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return { 
    success: false, 
    message: "Batch işlem hatası (3 deneme başarısız): " + (lastError?.message || "Bilinmeyen hata") 
  };
}

const llmExports = { 
  generateRecipeList, 
  generateCategory, 
  tamurunbul, 
  generateRecipeAndCalorie 
};

export default llmExports;