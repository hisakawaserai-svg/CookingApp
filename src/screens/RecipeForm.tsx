import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import 'react-native-get-random-values'
import { v4 as uuidv4 } from 'uuid'

import { saveRecipe } from '../database/recipeRepository'
import { StepSection } from '../components/StepSection'
import { Recipe, Ingredient, Step, ServingsUnit, Tag } from '../types/recipe'
import { commonStyles } from '../styles/common'
import { theme } from '../styles/theme'
import { ScreenMotion } from '../components/ui/ScreenMotion'
import { getRecipeValidationMessage } from '../utils/recipeValidation'
import IngredientsForm from '../components/ui/IngredientForm'
import { ServingsInput } from '../components/ServingsInput'
import { TagSelector } from '../components/Tags/TagSelector'

type Props = {
  navigation: any
  analyzedRecipe: Recipe | null
  editingIngredients: Ingredient[]
  editingPrepSteps: Step[]
  editingCookSteps: Step[]
  selectedTags: Tag[]
  setSelectedTags: React.Dispatch<React.SetStateAction<Tag[]>>
}

export const RecipeForm = ({
  navigation,
  analyzedRecipe,
  editingIngredients,
  editingPrepSteps,
  editingCookSteps,
  selectedTags,
  setSelectedTags,
}: Props) => {
  const [ dishName, setDishName] = useState('')
  const [ servings, setServings] = useState(2)
  const [ servingsUnit, setServingsUnit] = useState<ServingsUnit>('人前')
  const [ customServingsUnit, setCustomServingsUnit] = useState('')
  const [ ingredients, setIngredients] = useState<Ingredient[]>([{
    id: uuidv4(),
    name: '',
    num: 0,
    unit: 'g',
    customUnit: '',
  }])
  const [ prepSteps, setPrepSteps] = useState<Step[]>([])
  const [ cookSteps, setCookSteps] = useState<Step[]>([])

  // 保存ボタンの処理
  const handleSave = async () => {
    const currentValidationMessage = getRecipeValidationMessage(dishName, ingredients, prepSteps, cookSteps)
    if (currentValidationMessage) {
      Alert.alert('入力エラー', currentValidationMessage)
      return
    }

    const recipeToSave: Omit<Recipe, 'id'> = {
      dishName: dishName,
      servings: servings,
      servingsUnit: servingsUnit,
      customServingsUnit: customServingsUnit ?? null,
      ingredients: ingredients,
      prepSteps: prepSteps,
      cookSteps: cookSteps,
      tagIds: selectedTags
    }

    try {
      await saveRecipe(recipeToSave)
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home'}]
      })  // ← ホームに戻る
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存に失敗しました。入力内容を確認して再度お試しください。'
      Alert.alert('保存エラー', message)
      console.error('データ保存エラー', error)
    }
  }

  // 引数代入
  useEffect(() => {
    setDishName(analyzedRecipe?.dishName ?? '')

    if (editingIngredients.length > 0) {
      setIngredients(editingIngredients)
    }

    if (editingPrepSteps.length > 0) {
      setPrepSteps(editingPrepSteps)
    }

    if (editingCookSteps.length > 0) {
      setCookSteps(editingCookSteps)
    }
  }, [analyzedRecipe, editingIngredients, editingPrepSteps, editingCookSteps])

  return (
    <View style={commonStyles.screen}>
      <View style={commonStyles.decorTop} />
      <View style={commonStyles.decorBottom} />
      <ScreenMotion style={commonStyles.pageWrap}>
        <ScrollView contentContainerStyle={commonStyles.content}>
            <View style={[commonStyles.card, styles.guideCard]}>
              <Text style={styles.guideTitle}>手入力の流れ</Text>
              <Text style={styles.guideText}>1. 料理名を入力</Text>
              <Text style={styles.guideText}>2. 材料と分量を追加</Text>
              <Text style={styles.guideText}>3. 下準備・調理手順を入力して保存</Text>
            </View>
            <View style={commonStyles.card}>
              <View>
                <View>
                  <Text style={styles.fieldLabel}>料理名</Text>
                  
                </View>
                <TextInput
                  style={[commonStyles.input, commonStyles.stepLikeInput, styles.titleInput]}
                  placeholder={'料理名'}
                  placeholderTextColor={theme.colors.mutedText}
                  value={dishName}
                  onChangeText={setDishName}
                  multiline={true}
                />
                <TagSelector 
                  selectedTags={selectedTags}
                  setSelectedTags={setSelectedTags}
                />
                <ServingsInput servings={servings} setServings={setServings} servingsUnit={servingsUnit} setServingsUnit={setServingsUnit} customServingsUnit={customServingsUnit} setCustomServingsUnit={setCustomServingsUnit} />
              </View>

              <IngredientsForm ingredients={ingredients} setIngredients={setIngredients} />

              <StepSection title="下準備" steps={prepSteps} setEditingSteps={setPrepSteps} />
              <StepSection title="調理手順" steps={cookSteps} setEditingSteps={setCookSteps} />
            </View>
        </ScrollView>
      </ScreenMotion>

      <View style={commonStyles.bottomBar}>
        <View style={[styles.edgeArea, styles.rightAlign]}>
          <TouchableOpacity style={[commonStyles.primaryButton]} onPress={handleSave}>
            <Icon name={'clipboard-arrow-down-outline'} size={20} color={'#FFF'}></Icon>
            <Text style={commonStyles.primaryButtonText}>レシピを保存</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  guideCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: '#FFF3E6',
    borderColor: '#F5D4B8',
  },
  guideTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.accent,
    marginBottom: theme.spacing.xs,
  },
  guideText: {
    color: theme.colors.text,
    lineHeight: 23,
  },
  fieldLabel: {
    color: theme.colors.primary,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },
  fieldHint: {
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.xs,
  },
  titleInput: {
    marginBottom: theme.spacing.md,
    backgroundColor: '#FFFDF9',
  },
  subTitle: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  sectionHint: {
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.sm,
  },
  ingredientCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSoft,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  ingredientHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ingredientBadge: {
    alignSelf: 'flex-start',
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: theme.spacing.xs,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing.xs,
  },
  ingredientNameInput: {
    flex: 1,
  },
  ingredientNumInput: {
    width: 90,
    textAlign: 'center',
  },
  pickerWrap: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: {
    color: theme.colors.text,
    minHeight: 48,
  },
  customUnitInput: {
    marginTop: theme.spacing.xs,
  },
  edgeArea: {
    flex: 1,
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
})

export default RecipeForm
