import { Ingredient, Step } from '../types/recipe'

const hasText = (value: string | null | undefined) => typeof value === 'string' && value.trim().length > 0

export const getRecipeValidationMessage = (
  dishName: string,
  ingredients: Ingredient[],
  prepSteps: Step[],
  cookSteps: Step[],
): string | null => {
  const safeIngredients = Array.isArray(ingredients) ? ingredients : []
  const safePrepSteps = Array.isArray(prepSteps) ? prepSteps : []
  const safeCookSteps = Array.isArray(cookSteps) ? cookSteps : []

  if (!hasText(dishName)) {
    return '料理名を入力してください。'
  }

  if (safeIngredients.length === 0) {
    return '材料を1つ以上入力してください。'
  }

  const invalidIngredientIndex = safeIngredients.findIndex(item => !hasText(item?.name))
  if (invalidIngredientIndex >= 0) {
    return `材料${invalidIngredientIndex + 1}の名前を入力してください。`
  }

  const invalidCustomUnitIndex = safeIngredients.findIndex(
    item => item?.unit === 'その他' && !hasText(item?.customUnit),
  )
  if (invalidCustomUnitIndex >= 0) {
    return `材料${invalidCustomUnitIndex + 1}の単位（その他）を入力してください。`
  }

  if (safeCookSteps.length === 0) {
    return '調理手順を1つ以上入力してください。'
  }

  const invalidPrepStepIndex = safePrepSteps.findIndex(step => !hasText(step?.text))
  if (invalidPrepStepIndex >= 0) {
    return `下準備${invalidPrepStepIndex + 1}の内容を入力してください。`
  }

  const invalidCookStepIndex = safeCookSteps.findIndex(step => !hasText(step?.text))
  if (invalidCookStepIndex >= 0) {
    return `調理手順${invalidCookStepIndex + 1}の内容を入力してください。`
  }

  return null
}

export const isRecipeValid = (
  dishName: string,
  ingredients: Ingredient[],
  prepSteps: Step[],
  cookSteps: Step[],
) => getRecipeValidationMessage(dishName, ingredients, prepSteps, cookSteps) === null
