// 材料の単位
type Unit = 'g' | 'ml' | '個' | '小さじ' | '中さじ' | '大さじ' | '少々' | '適量' | 'その他';

// 数量の表示
export const formatIngredient = (
    num: number | null,
    unit: Unit,
    customUnit?: string | null
): string => {
    if (unit == 'その他') return formatUnit(num, customUnit ?? null)

    if (unit === '小さじ' || unit === '中さじ' || unit === '大さじ') {
    return `${unit}${num}`
    }

    if (unit === 'g' || unit === 'ml' || unit === '個') {
    return `${num}${unit}`
    }

    return unit
}
// 単位の表示
export const formatUnit = (
    num: number | null,
    customUnit: string | null
): string => {
    if (!num) return customUnit ?? ''
    return `${num}${customUnit ?? ''}`

}

// タイマー表示処理
export const formatTimer = (timer: number | null, timeNone: boolean = true): string => {
    if (timer === null) {
        return (timeNone ? '' : '時間なし')
    }
    if (timer < 0) return '0秒'
    if (timer < 60) return `${timer}秒`
    const min = Math.floor(timer / 60)
    const sec = String(timer % 60).padStart(2, '0')
    return  `${min}分${sec}秒`
}

// stepOrderを更新
import { Step } from "../types/recipe";
export const resetStepOrder = (steps: Step[]) => {
    return steps.map((step, index) => ({
        ...step,
        stepOrder: index,
    }))
}

export const formatNumber = (str: string | null) => {
    if (!str) return ''

    return str
        .replace(/[^0-9.]/g, '')
        .replace(/(\..*)\./g, '$1')
}
