// レシピ保存・保存レシピ取得ファイル
import { db } from './db'
import { Recipe, Ingredient, Step, Tag } from '../types/recipe'
import { v4 as uuidv4 } from 'uuid'
import { getRecipeValidationMessage } from '../utils/recipeValidation'

const normalizeText = (value: string | null | undefined) => (value ?? '').trim()

const normalizeNumber = (value: number | null | undefined) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null
    return value
}

const normalizeTimer = (value: number | null | undefined) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null
    return Math.floor(value)
}

// #region -- レシピ保存 --
// 新規レシピ保存
export const saveRecipe = async (recipe: Omit<Recipe, 'id'>) => {
    const validationMessage = getRecipeValidationMessage(
        recipe.dishName,
        recipe.ingredients,
        recipe.prepSteps,
        recipe.cookSteps,
    )
    if (validationMessage) {
        throw new Error(validationMessage)
    }

    try {
        await db.transaction(async (tx) => {
            const recipeId = uuidv4()
            // レシピを保存
            await tx.execute(
                `INSERT INTO recipes (id, dishName, servings, servingsUnit, customServingsUnit) VALUES (?, ?, ?, ?, ?)`,
                [recipeId, normalizeText(recipe.dishName), recipe.servings, recipe.servingsUnit, recipe.customServingsUnit ?? null]
            )

            // 材料を保存
            for (const ingredient of recipe.ingredients) {
                const customUnit = ingredient.unit === 'その他'
                    ? normalizeText(ingredient.customUnit) || null
                    : null

                await tx.execute(
                    `INSERT INTO ingredients (id, recipeId, name, num, unit, customUnit) VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        uuidv4(),
                        recipeId,
                        normalizeText(ingredient.name),
                        normalizeNumber(ingredient.num),
                        ingredient.unit,
                        customUnit,
                    ]
                )
            }

            // 前処理を保存
            for (let index = 0; index < recipe.prepSteps.length; index++) {
                const prep = recipe.prepSteps[index]
                await tx.execute(
                    `INSERT INTO steps (id, recipeId, type, text, timer, stepOrder) VALUES (?, ?, ?, ?, ?, ?)`,
                    [uuidv4(), recipeId, 'prep', normalizeText(prep.text), normalizeTimer(prep.timer), index]
                )
            }

            // 調理を保存
            for (let index = 0; index < recipe.cookSteps.length; index++) {
                const cook = recipe.cookSteps[index]
                await tx.execute(
                    `INSERT INTO steps (id, recipeId, type, text, timer, stepOrder) VALUES (?, ?, ?, ?, ?, ?)`,
                    [uuidv4(), recipeId, 'cook', normalizeText(cook.text), normalizeTimer(cook.timer), index]
                )
            }
            // タグ紐付け保存
            if (recipe.tagIds) {
                for (const tagId of recipe.tagIds) {
                    await tx.execute(
                        `INSERT INTO recipeTags (recipeId, tagId) VALUES (?, ?)`,
                        [recipeId, tagId.id]
                    )
                }
            }
        })
    } catch (error) {
        console.error('レシピ保存エラー：', error)
        throw error
    }
}
export const updateRecipe = async (
    recipeId: string,
    dishName: string,
    servings: number,
    servingsUnit: string,
    customServingsUnit: string,
    ingredients: Ingredient[],
    prepSteps: Step[],
    cookSteps: Step[],
    tagIds: string[] = []
  ) => {
  
    const validationMessage = getRecipeValidationMessage(
      dishName,
      ingredients,
      prepSteps,
      cookSteps
    )
  
    if (validationMessage) {
      throw new Error(validationMessage)
    }
  
    const normalizedDishName = normalizeText(dishName)
  
    const normalizedIngredients = ingredients.map((ingredient) => ({
      id: normalizeText(ingredient.id) || uuidv4(),
      name: normalizeText(ingredient.name),
      num: normalizeNumber(ingredient.num),
      unit: ingredient.unit,
      customUnit:
        ingredient.unit === 'その他'
          ? normalizeText(ingredient.customUnit) || null
          : null,
    }))
  
    const normalizeSteps = (steps: Step[]) =>
      steps.map((step, index) => ({
        id: normalizeText(step.id) || uuidv4(),
        type: (step.type),
        text: normalizeText(step.text),
        timer: normalizeTimer(step.timer),
        stepOrder: index,
      }))
  
    const normalizedPrepSteps = normalizeSteps(prepSteps)
    const normalizedCookSteps = normalizeSteps(cookSteps)
  
    try {
      await db.transaction(async (tx) => {
  
        // ① recipe更新
        await tx.execute(
          `UPDATE recipes 
           SET dishName = ?, servings = ?, servingsUnit = ?, customServingsUnit = ?
           WHERE id = ?`,
          [normalizedDishName, servings, servingsUnit, customServingsUnit, recipeId]
        )
  
        // ② ingredients（全置換）
        await tx.execute(`DELETE FROM ingredients WHERE recipeId = ?`, [recipeId])
  
        for (const ingredient of normalizedIngredients) {
          await tx.execute(
            `INSERT INTO ingredients 
             (id, recipeId, name, num, unit, customUnit) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              ingredient.id,
              recipeId,
              ingredient.name,
              ingredient.num,
              ingredient.unit,
              ingredient.customUnit,
            ]
          )
        }
  
        // ③ steps（全置換）
        await tx.execute(`DELETE FROM steps WHERE recipeId = ?`, [recipeId])
  
        for (const step of [...normalizedPrepSteps, ...normalizedCookSteps]) {
          await tx.execute(
            `INSERT INTO steps 
             (id, recipeId, type, text, timer, stepOrder) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              step.id,
              recipeId,
              step.type ?? 'prep', // 必要なら分ける設計にする
              step.text,
              step.timer,
              step.stepOrder,
            ]
          )
        }
  
        // ④ tags（全置換）
        await tx.execute(`DELETE FROM recipeTags WHERE recipeId = ?`, [recipeId])
  
        for (const tagId of tagIds) {
          await tx.execute(
            `INSERT INTO recipeTags (recipeId, tagId) VALUES (?, ?)`,
            [recipeId, tagId]
          )
        }
      })
  
    } catch (error) {
      console.error('レシピ更新エラー：', error)
      throw error
    }
  }

// #region -- 保存データ取得 --
export const getRecipes = async (): Promise<Recipe[]> => {
    try {
        const result = await db.execute(`SELECT * FROM recipes`)
        const recipes = result.rows as unknown as Recipe[]

        const recipesWithTags = await Promise.all(
            recipes.map(async (recipe) => {
                const tagIds = await getRecipeTags(recipe.id)
                return { ...recipe, tagIds }
            })
        )

        return recipesWithTags
    } catch (error) {
        console.error('データ読み込みエラー', error)
        throw error
    }
}

// 特定のレシピ取得
export const getRecipe = async (recipeId: string): Promise<Recipe> => {
    try {
        const result = await db.execute(`SELECT * FROM recipes WHERE id = ?`, [recipeId])
        const recipe = result.rows[0] as unknown as Recipe
        const tagIds = await getRecipeTags(recipeId)
        return { ...recipe, tagIds }
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
        console.log('raw steps:', JSON.stringify(result.rows))
        const allSteps = (result.rows as unknown as Step[]).map(step => ({
            ...step,
            timer: step.timer ?? null
        }))
          
        const prepSteps = allSteps.filter(item => item.type === 'prep').sort((a, b) => a.stepOrder - b.stepOrder)
        const cookSteps = allSteps.filter(item => item.type === 'cook').sort((a, b) => a.stepOrder - b.stepOrder)

        return { prepSteps, cookSteps }
    } catch (error) {
        console.error('データ:cookSteps[],読み込みエラー', error)
        throw error
    }
}

// #endregion

export const deleteRecipe = async (recipeId: string) => {
    try {
        await db.transaction(async (tx) => {
            await tx.execute(`DELETE FROM recipes WHERE id = ?`, [recipeId])
        })
    } catch (error) {
        console.error('レシピ削除エラー', error)
        throw error
    }
}

// #region -- タグ取得・追加・削除 --
// タグ全取得
export const getTags = async (): Promise<Tag[]> => {
    try {
        const result = await db.execute(`SELECT * FROM tags`)
        return result.rows as unknown as Tag[]
    } catch (error) {
        console.error('タグ取得エラー', error)
        throw error
    }
}

export const getRecipeTags = async (recipeId: string): Promise<Tag[]> => {
    try {
        const result = await db.execute(
            `SELECT t.* 
             FROM tags t
             INNER JOIN recipeTags rt ON rt.tagId = t.id
             WHERE rt.recipeId = ?`,
            [recipeId]
        )
        return result.rows as unknown as Tag[]
    } catch (error) {
        console.error('レシピタグ取得エラー', error)
        throw error
    }
}

// タグ作成
export const createTag = async (name: string, tagColor: string): Promise<void> => {
    try {
        await db.execute(
            `INSERT INTO tags (id, name, tagColor) VALUES (?, ?, ?)`,
            [uuidv4(), name, tagColor]
        )
    } catch (error) {
        console.error('タグ作成エラー', error)
        throw error
    }
}

// タグ更新
export const updateTag = async (tag: Tag): Promise<void> => {
    try {
        await db.execute(
           `UPDATE tags SET name = ?, tagColor = ? WHERE id = ?`,
            [tag.name, tag.tagColor, tag.id]
        )
    } catch (error) {
        console.error('タグ更新エラー', error)
        throw error
    }
}

// タグ削除
export const deleteTag = async (tagId: string): Promise<void> => {
    try {
        await db.execute(`DELETE FROM tags WHERE id = ?`, [tagId])
    } catch (error) {
        console.error('タグ削除エラー', error)
        throw error
    }
}
// #endregion
