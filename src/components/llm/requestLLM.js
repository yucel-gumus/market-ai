"use client";

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

async function tryWithApiKeysAndModels(contentBuilder, parseFn) {
  let lastError;
  for (let apiKeyIdx = 0; apiKeyIdx < API_KEYS.length; apiKeyIdx++) {
    const apiKey = API_KEYS[apiKeyIdx];
    const genAI = new (await import('@google/generative-ai')).GoogleGenerativeAI(apiKey);
    let modelIdx = 0;
    while (modelIdx < MODEL_LIST.length) {
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
        if (
          msg.includes('429') ||
          msg.includes('overload') ||
          msg.includes('rate limit')
        ) {
          modelIdx++;
          continue;
        } else if (
          msg.includes('quota') ||
          msg.includes('token') ||
          msg.includes('api key') ||
          msg.includes('permission')
        ) {
          break;
        } else {
          return { success: false, message: err?.message || 'Bilinmeyen hata' };
        }
      }
    }
  }
  return { success: false, message: 'Tüm API anahtarları ve modellerde hata oluştu: ' + (lastError?.message || 'Bilinmeyen hata') };
}
import { GoogleGenerativeAI } from '@google/generative-ai';
import prompt from './productListPrompt';
import promptKategoriSelect from './selectCategoriesPromt';
import promturunadlari from './productNameFindPrompt';
import recipeAndCaloriePrompt from './recipeAndCaloriePrompt';


export async function generateRecipeAndCalorie(recipeName) {
  return await tryWithApiKeysAndModels(
    () => recipeAndCaloriePrompt(recipeName),
    (raw) => {
      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      let data;
      try {
        data = JSON.parse(cleaned);
      } catch {
        data = { success: false, message: "Bilinmeyen tarif veya format" };
      }
      return data;
    }
  );
}



const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });


export async function generateRecipeList(recipeName) {
  return await tryWithApiKeysAndModels(
    () => prompt.replace('${recipeName}', recipeName),
    (raw) => {
      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      let data;
      try {
        data = JSON.parse(cleaned);
      } catch {
        data = { success: false, message: "Bilinmeyen tarif" };
      }
      return data;
    }
  );
}



export async function generateCategory(ingredients, categorylist) {
  return await tryWithApiKeysAndModels(
    () => promptKategoriSelect
      .replace('${ingredients}', ingredients)
      .replace('${categorylist}', categorylist),
    (raw) => {
      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      let data;
      try {
        data = JSON.parse(cleaned);
      } catch {
        data = { success: false, message: "Bilinmeyen tarif" };
      }
      return data;
    }
  );
}



export async function tamurunbul(urunadlari, ingredients, recipeName) {
  const ingredientsStr = Array.isArray(ingredients)
    ? ingredients.join(", ")
    : ingredients;

  return await tryWithApiKeysAndModels(
    () => promturunadlari
      .replace('URUNADLARI_PLACEHOLDER', JSON.stringify(urunadlari, null, 2))
      .replace(/INGREDIENTS_PLACEHOLDER/g, ingredientsStr)
      .replace(/RECIPE_NAME_PLACEHOLDER/g, recipeName),
    (raw) => {
      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .replace(/,\s*}/g, '}') 
        .replace(/,\s*]/g, ']')
        .trim();
      let data;
      try {
        data = JSON.parse(cleaned);
      } catch {
        data = { success: false, message: "Batch işlem hatası" };
      }
      return data;
    }
  );
}


const llmExports = { generateRecipeList, generateCategory, tamurunbul };
export default llmExports;
