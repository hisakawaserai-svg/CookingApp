// レシピ保存・保存レシピ取得ファイル
import { db } from './db'
import { Recipe, Ingredient, Step } from '../types/recipe'
import { v4 as uuidv4 } from 'uuid'

// #region -- レシピ保存 --
// 新規レシピ保存
export const saveRecipe = (recipe: Omit<Recipe, 'id'>) => {
    try {
        db.transaction(async (tx) => {
            const id = uuidv4()
            // レシピを保存
            tx.execute(
                `INSERT INTO recipes (id, dishName) VALUES (?, ?)`,
                [id, recipe.dishName]
            )
            // 材料を保存
            recipe.ingredients.forEach((ingredient) => {
                tx.execute(
                    `INSERT INTO ingredients (id, recipeId, name, num, unit) VALUES (?, ?, ?, ?, ?)`,
                    [uuidv4(), id, ingredient.name, ingredient.num, ingredient.unit]
                )
            });
            // 前処理を保存
            recipe.prepSteps.forEach((prep, index) => {
                tx.execute(
                    `INSERT INTO steps (id, recipeId, type, text, timer, stepOrder) VALUES (?, ?, ?, ?, ?, ?)`,
                    [uuidv4(), id, 'prep', prep.text, prep.timer, index]
                )
            })
            // 調理を保存
            recipe.cookSteps.forEach((cook, index) => {
                tx.execute(
                    `INSERT INTO steps (id, recipeId, type, text, timer, stepOrder) VALUES (?, ?, ?, ?, ?, ?)`,
                    [uuidv4(), id, 'cook', cook.text, cook.timer, index]
                )
            })
        })
    } catch (error) {
        console.error('レシピ保存エラー：', error)
        throw error
    }
}
// レシピ更新
export const updateRecipe = async (recipeId: string, dishName: string, ingredients: Ingredient[], prepSteps: Step[], cookSteps: Step[] ) => {
    try {
        db.transaction(async (tx) => {
            // レシピを更新
            tx.execute(
                `UPDATE recipes SET dishName = ? WHERE id = ?`,
                [dishName, recipeId]
            )
            // 材料を更新
            ingredients.forEach((ingredient) => {
                tx.execute(
                    `UPDATE ingredients SET name = ?, num = ?, unit = ? WHERE id = ? `,
                    [ingredient.name, ingredient.num, ingredient.unit, ingredient.id]
                )
            });
            // 前処理を更新
            prepSteps.forEach((prep) => {
                tx.execute(
                    `UPDATE steps SET text = ?, timer = ?, stepOrder = ? WHERE id = ?`,
                    [prep.text, prep.timer, prep.stepOrder, prep.id]
                )
            })
            // 調理を更新
            cookSteps.forEach((cook) => {
                tx.execute(
                    `UPDATE steps SET text = ?, timer = ?, stepOrder = ? WHERE id = ? `,
                    [cook.text, cook.timer, cook.stepOrder, cook.id]
                )
            })
        })
    } catch (error) {
        console.error('レシピ更新エラー：', error)
        throw error
    }
}
// #endregion

// #region -- 保存データ取得 --
export const getRecipes = async (): Promise<Recipe[]> => {
    try {
        const result = await db.execute(`SELECT * FROM recipes`)
        return result.rows as unknown as Recipe[]
    } catch (error) {
        console.error('データ読み込みエラー', error)
        throw error
    }
}

// 特定のレシピ取得
export const getRecipe = async (recipeId: string): Promise<Recipe> => {
    try {
        const result = await db.execute(`SELECT * FROM recipes WHERE id = ?`, [recipeId])
        return result.rows[0] as unknown as Recipe
    } catch (error) {
        console.error('データ:recipe,読み込みエラー', error)
        throw error
    }
}

// ingredients(材料)取得
export const getIngredients = async (recipeId: string): Promise<Ingredient[]> => {
    try {
        const result = await db.execute(`SELECT * FROM ingredients WHERE recipeId = ?`, [recipeId])
        return result.rows as unknown as Ingredient[]
    } catch (error) {
        console.error('データ:ingredients[],読み込みエラー', error)
        throw error
    }
}

// prepSteps(前処理) & cookSteps(調理手順)取得
type StepResult = {
    prepSteps: Step[]
    cookSteps: Step[]
}

export const getSteps = async (recipeId: string): Promise<StepResult> => {
    try {
        const result = await db.execute(`SELECT * FROM steps WHERE recipeId = ?`, [recipeId])

        const allSteps = result.rows as unknown as Step[]
        const prepSteps = allSteps.filter(item => item.type === 'prep').sort((a, b) => a.stepOrder - b.stepOrder)
        const cookSteps = allSteps.filter(item => item.type === 'cook').sort((a, b) => a.stepOrder - b.stepOrder)

        return { prepSteps, cookSteps }
    } catch (error) {
        console.error('データ:cookSteps[],読み込みエラー', error)
        throw error
    }
}

// #endregion