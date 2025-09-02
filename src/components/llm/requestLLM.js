'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';
import prompt from './productListPrompt';
import promptKategoriSelect from './selectCategoriesPromt';
import promturunadlari from './productNameFindPrompt';
import recipeAndCaloriePrompt from './recipeAndCaloriePrompt';

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
  } catch {
    data = { success: false, message: "Bilinmeyen tarif veya format" };
  }
  return data;
}



const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

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
  } catch {
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
  } catch {
    data = { success: false, message: "Bilinmeyen tarif" };
  }
  return data;
}


export async function tamurunbul(urunadlari, ingredients, recipeName) {
  const ingredientsStr = Array.isArray(ingredients)
    ? ingredients.join(", ")
    : ingredients;

  const content = promturunadlari
    .replace('URUNADLARI_PLACEHOLDER', JSON.stringify(urunadlari, null, 2))
    .replace(/INGREDIENTS_PLACEHOLDER/g, ingredientsStr)
    .replace(/RECIPE_NAME_PLACEHOLDER/g, recipeName);

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
        .replace(/,\s*}/g, '}') 
        .replace(/,\s*]/g, ']')
        .trim();

      data = JSON.parse(cleaned);
      break;
    } catch {
      if (attempt === maxAttempts) {
        data = { success: false, message: "Batch ilem hatas" };
      }
    }
  }
  return data;
}


const llmExports = { generateRecipeList, generateCategory, tamurunbul };
export default llmExports;
