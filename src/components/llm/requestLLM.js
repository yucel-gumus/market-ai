'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';
import prompt from './productListPrompt';
import promptKategoriSelect from './selectCategoriesPromt';
import promturunadlari from './productNameFindPrompt';
import recipeAndCaloriePrompt from './recipeAndCaloriePrompt';

// Yemek tarifi ve kalori bilgisi getiren fonksiyon
export async function generateRecipeAndCalorie(recipeName) {
  const content = recipeAndCaloriePrompt(recipeName);
  const result = await model.generateContent(content);
  const raw = result.response.text().trim();

  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  let data;
  try {
    data = JSON.parse(cleaned);
  } catch (error) {
    data = { success: false, message: "Bilinmeyen tarif veya format" };
  }
  return data;
}



const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function generateRecipeList(recipeName) {
  const content = prompt.replace('${recipeName}', recipeName);

  const result = await model.generateContent(content);
  const raw = result.response.text().trim();

  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  let data;
  try {
    data = JSON.parse(cleaned);
  } catch (error) {
    data = { success: false, message: "Bilinmeyen tarif" };
  }
  return data;
}


export async function generateCategory(ingredients, categorylist) {
  const content = promptKategoriSelect
    .replace('${ingredients}', ingredients)
    .replace('${categorylist}', categorylist);
  const result = await model.generateContent(content);
  const raw = result.response.text().trim();

  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  let data;
  try {
    data = JSON.parse(cleaned);
  } catch (error) {
    data = { success: false, message: "Bilinmeyen tarif" };
  }
  return data;
}


export async function tamurunbul(urunadlari, ingredients, recipeName) {
  // ingredients array'ini string'e çevir
  const ingredientsStr = Array.isArray(ingredients) 
    ? ingredients.join(", ") 
    : ingredients;
  
  const content = promturunadlari
    .replace('URUNADLARI_PLACEHOLDER', JSON.stringify(urunadlari, null, 2))
    .replace(/INGREDIENTS_PLACEHOLDER/g, ingredientsStr)
    .replace('RECIPE_NAME_PLACEHOLDER', recipeName);

  let attempt = 0;
  const maxAttempts = 3;
  let data;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const result = await model.generateContent(content);
      const raw = result.response.text().trim();

      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();

      data = JSON.parse(cleaned);
      break;
    } catch (error) {
      console.error(`Deneme ${attempt} başarısız:`, error);
      if (attempt === maxAttempts) {
        data = { success: false, message: "Batch işlem hatası" };
      }
    }
  }
    return data;
}


export default { generateRecipeList, generateCategory, tamurunbul };
