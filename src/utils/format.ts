// 材料の単位
type Unit = 'g' | 'ml' | '個' | '小さじ' | '中さじ' | '大さじ' | '少々' | '適量';
export const formatIngredient = (num: number | null, unit: Unit): string => {
    if (unit === '小さじ' || unit === '中さじ' || unit === '大さじ'){
        return `${unit}${num}`
    }
    else if (unit === 'g' || unit === 'ml' || unit === '個'){
        return `${num}${unit}`
    } else {
        return `${unit}`
    }
}

// タイマー表示処理
export const formatTimer = (timer: number | null): string => {
    if (timer === null) return '時間なし'
    if (timer < 60) return `${timer}秒`
    const min = Math.floor(timer / 60)
    const sec = timer % 60
    return sec > 0 ? `${min}分/${sec}秒` : `${min}分`
}

// stepOrderを更新
import { Step } from "../types/recipe";
export const resetStepOrder = (steps: Step[]) => {
    return steps.map((step, index) => ({
        ...step,
        stepOrder: index,
    }))
}