// Geminiへの通信を行うサービスクラス
import { GEMINI_API_KEY } from '../config/secrets'
import { Recipe } from "../types/recipe";

export const analyzeRecipeText = async (recipeText: string): Promise<Recipe> => {
    const prompt = `
        以下のレシピテキストを解析して、
        必ずこのJSON形式のみで返してください。
        他の文章は一切含めないでください。
        idは含めないでください。
        単位がない場合、少々→0.3g、ひとつまみ→0.5g。
        適量→文脈でg/mlを推測、無理なら"適量"。

        {
            "dishName": "料理名",
            "ingredients": [
            {"name": "材料名", "num": 数量 | null, "unit": 'g' | 'ml' | '個' | '小さじ' | '中さじ' | '大さじ' | '少々' | '適量'}
            ],
            "prepSteps": [
            {"text": "手順", "timer": 秒数 | null}
            ],
            "cookSteps": [
            {"text": "手順", "timer": 秒数 | null}
            ]
        }

        レシピテキスト：
        ${recipeText}
    `
    // 送信
    try {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
            })
        }
    )
// #region -- responseをRecipe型に変換 --
    // JSON型に変換
    const data = await response.json()
    console.log('APIレスポンス全体:', JSON.stringify(data)) 

    // textを取得
    const text = data.candidates[0].content.parts[0].text

    // バッククォートとjsonを除去
    const cleanText = text.replace(/```json\n?/g, '').replace(/```/g, '').trim()

    // JSONをパースしてRecipe型に変換
    const recipe = JSON.parse(cleanText)

    return recipe
// #endregion
    } catch (error) {
        console.error('Gemini API エラー：', error)
        throw error
    }
}