// データ型定義のファイル

// 材料の単位
type Unit = 'g' | 'ml' | '個' | '小さじ' | '中さじ' | '大さじ' | '少々' | '適量';

// 材料の型
export interface Ingredient {
    id: string;
    name: string;
    num: number | null;
    unit: Unit;
}

// 下準備と調理手順の型
export interface Step {
    id: string;
    text: string;
    timer: number | null;
    type: 'prep' | 'cook';
    stepOrder: number;
}

// レシピの型
export interface Recipe {
    id: string;
    dishName: string;
    ingredients: Ingredient[];
    prepSteps: Step[];
    cookSteps: Step[];
}