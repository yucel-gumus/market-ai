'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';
import prompt from './productListPrompt';
import promptKategoriSelect from './selectCategoriesPromt';
import promturunadlari from './productNameFindPrompt'



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


export async function generateCategory(ingredients,categorylist) {
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
  const content = promturunadlari
    .replace('${urunadlari}', urunadlari)
    .replace('${ingredients}', ingredients)
    .replace('${recipname}', recipeName);

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
      if (attempt === maxAttempts) {
        data = { success: false, message: "Bilinmeyen malzeme" };
      }
    }
  }
  return data;
}


export default { generateRecipeList, generateCategory, tamurunbul };
