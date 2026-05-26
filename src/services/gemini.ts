// Geminiへの通信を行うサービスクラス
import { GEMINI_API_KEY } from '../config/secrets'
import { Recipe } from "../types/recipe";

import { v4 as uuidv4 } from 'uuid'

export const analyzeRecipeText = async (recipeText: string): Promise<Recipe> => {
    const prompt = `
        以下のレシピテキストを解析して、
        必ずこのJSON形式のみで返してください。
        他の文章は一切含めないでください。
        idは含めないでください。
        単位がない場合、少々→0.3g、ひとつまみ→0.5g。
        適量→文脈でg/mlを推測、無理なら"適量"。
        各ステップは「1つの動作」で完結するように細かく分割してください。
        1つのステップが30文字を超える場合は、2つ以上のステップに分けてください。
        例：「玉ねぎを炒める。冷ます。」ではなく、ステップ1「玉ねぎを炒める」、ステップ2「炒めた玉ねぎを冷ます」に分けて出力してください。
        10~15分などの曖昧な指示の場合、より長い方の時間をtimerに入れてください。

        unitが一覧にない場合は必ず「その他」にし、
        customUnitに元の単位をそのまま入れてください
        例：
        "カップ" → unit: "その他", customUnit: "カップ"
        "ひとつまみ" → unit: "少々" または "その他"

        {
            "dishName": "料理名",
            "servings": 数量,
            "servingsUnit": "人前" | "個分" | "台分" | "その他",
            "customServingsUnit": string | null,
            "ingredients": [
            {"name": "材料名", "num": 数量 | null, "unit": 'g' | 'ml' | '個' | '小さじ' | '中さじ' | '大さじ' | '少々' | '適量' | 'その他', "costomUnit": string | null}
            ],
            "prepSteps": [
            {"text": "手順", "timer": 秒数 | null}
            ],
            "cookSteps": [
            {"text": "手順", "timer": 秒数 | null}
            ],
            
        }
        
        以下に該当しない場合は必ず空のJSONを返してください：
            - 料理の作り方が明確に含まれている
            - 調理手順がある
            - 食材と調理行為がセットで存在する

            該当しない場合：
            {
            "error": "NOT_RECIPE"
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
    const text = data?.candidates?.[0]?.content?.parts[0]?.text
    if (data?.error) {
        const status = data.error.code
        if (status === 503) {
            throw new Error('AIが混雑中です。しばらく待ってから再試行してください。')
        }
        throw new Error(`APIエラー: ${data.error.message}`)
    }

    // バッククォートとjsonを除去
    const cleanText = text.replace(/```json\n?/g, '').replace(/```/g, '').trim()

    let raw: unknown

    try {
      raw = JSON.parse(cleanText)
    } catch {
      throw new Error('JSONの形式が不正です')
    }
    
    if (!isRecipe(raw)) {
      throw new Error('Recipe形式ではありません')
    }
    
    return {
        ...raw,
        ingredients: raw.ingredients.map(i => ({
          ...i,
          id: uuidv4(),
        })),
        prepSteps: raw.prepSteps.map(s => ({
          ...s,
          id: uuidv4(),
        })),
        cookSteps: raw.cookSteps.map(s => ({
          ...s,
          id: uuidv4(),
        })),
      }
// #endregion
    } catch (error) {
        console.error('Gemini API エラー：', error)
        throw error
    }

    function isRecipe(obj: any): obj is Recipe {
        return (
          obj?.dishName &&
          Array.isArray(obj?.ingredients) &&
          Array.isArray(obj?.prepSteps) &&
          Array.isArray(obj?.cookSteps)
        )
      }
}