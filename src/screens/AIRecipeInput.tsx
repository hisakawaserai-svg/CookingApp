import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { formatIngredient, formatTimer } from '../utils/format'
import { getTotalTime } from '../utils/recipeTime'
import { analyzeRecipeText } from '../services/gemini'
import { saveRecipe } from '../database/recipeRepository'
import { Recipe, Ingredient, Step, ServingsUnit, Tag } from '../types/recipe'
import { commonStyles } from '../styles/common'
import { theme } from '../styles/theme'
import { ScreenMotion } from '../components/ui/ScreenMotion'
import { getRecipeValidationMessage } from '../utils/recipeValidation'
import { TagSelector } from '../components/Tags/TagSelector'

type Props = {
  navigation: NativeStackNavigationProp<any>
  analyzedRecipe: Recipe | null
  editingIngredients: Ingredient[]
  editingPrepSteps: Step[]
  editingCookSteps: Step[]
  setAnalyzedRecipe: React.Dispatch<React.SetStateAction<Recipe | null>>
  setEditingIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>
  setEditingPrepSteps: React.Dispatch<React.SetStateAction<Step[]>>
  setEditingCookSteps: React.Dispatch<React.SetStateAction<Step[]>>

  editingServings: number
  setEditingServings: React.Dispatch<React.SetStateAction<number>>
  editingServingsUnit: ServingsUnit
  setEditingServingsUnit: React.Dispatch<React.SetStateAction<ServingsUnit>>
  editingCustomServingsUnit: string
  setEditingCustomServingsUnit: React.Dispatch<React.SetStateAction<string>>
  selectedTags: Tag[]
  setSelectedTags: React.Dispatch<React.SetStateAction<Tag[]>>
}

export const AIRecipeInput = ({ 
  navigation, 
  analyzedRecipe, 
  editingIngredients, 
  editingPrepSteps, 
  editingCookSteps, 
  setAnalyzedRecipe, 
  setEditingIngredients, 
  setEditingPrepSteps, 
  setEditingCookSteps,

  editingServings,
  setEditingServings,
  editingServingsUnit,
  setEditingServingsUnit,
  editingCustomServingsUnit,
  setEditingCustomServingsUnit,
  selectedTags,
  setSelectedTags,
}: Props) => {
  const [ recipeText, setRecipeText] = useState('')
  const [ isSending, setIsSending] = useState(false)

  const [ editingName, setEditingName] = useState('')

  const validationMessage = getRecipeValidationMessage(
    editingName,
    editingIngredients,
    editingPrepSteps,
    editingCookSteps,
  )
  const canSave = validationMessage === null

  // データを解析
  const handleAnalyze = async () => {
    if (recipeText === '') return
    setIsSending(true)
    try {
      const result = await analyzeRecipeText(recipeText)

      setAnalyzedRecipe(result)
      setEditingName(result.dishName)
      setEditingIngredients(result.ingredients)
      setEditingPrepSteps(result.prepSteps)
      setEditingCookSteps(result.cookSteps)

      console.log('ingredients:', result.ingredients)
      navigation.navigate('手入力')
    } catch (error) {
      const message = error instanceof Error ? error.message : '解析に失敗しました'
      Alert.alert('エラー', message)
    } finally {
      setIsSending(false)
    }
  }

  // 3. 保存ボタンの処理
  const handleSave = async () => {
    const currentValidationMessage = getRecipeValidationMessage(
      editingName,
      editingIngredients,
      editingPrepSteps,
      editingCookSteps,
    )
    if (currentValidationMessage) {
      Alert.alert('入力エラー', currentValidationMessage)
      return
    }

    const recipeToSave: Omit<Recipe, 'id'> = {
      dishName: editingName,
      servings: editingServings,
      servingsUnit: editingServingsUnit,
      customServingsUnit: editingCustomServingsUnit,
      ingredients: editingIngredients,
      prepSteps: editingPrepSteps,
      cookSteps: editingCookSteps,
      tagIds: selectedTags
    }

    try {
      await saveRecipe(recipeToSave)
      navigation.goBack()  // ← ホームに戻る
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存に失敗しました。入力内容を確認して再度お試しください。'
      Alert.alert('保存エラー', message)
      console.error('データ保存エラー', error)
    }
  }

  return (
    <View style={commonStyles.screen}>
      <View style={commonStyles.decorTop} />
      <View style={commonStyles.decorBottom} />
      <ScreenMotion style={commonStyles.pageWrap}>
        <ScrollView contentContainerStyle={commonStyles.content}>
          <View style={[commonStyles.card, styles.guideCard]}>
            <Text style={styles.guideTitle}>AI入力の流れ</Text>
            <Text style={styles.guideText}>1. レシピ本文を貼り付ける</Text>
            <Text style={styles.guideText}>2. 「AIで解析」を押す</Text>
            <Text style={styles.guideText}>3. 内容を確認して保存する</Text>
          </View>

          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>レシピ本文を入力</Text>
            <Text style={styles.helperText}>メモの文章をそのまま貼り付けできます。</Text>
            <TextInput
              style={[commonStyles.input, styles.textArea]}
              placeholder={'例）\n料理名：鶏肉と野菜の炒め物\n材料：鶏肉200g、ピーマン2個\n下準備：鶏肉を一口大に切る\n調理：①炒める3分 ②醤油で味付け1分'}
              value={recipeText}
              onChangeText={setRecipeText}
              multiline={true}
              numberOfLines={10}
              editable={!isSending}
              placeholderTextColor={theme.colors.mutedText}
            />
            <Text style={styles.countText}>{recipeText.length}文字</Text>
          </View>

          {analyzedRecipe && (
              <View style={styles.detailBody}>
                <Text style={styles.resultTitle}>解析結果（保存前に編集できます）</Text>
                <TagSelector
                  selectedTags={selectedTags}
                  setSelectedTags={setSelectedTags}
                />
                <View style={[commonStyles.bottomBorder, styles.sectionGroup]}>
                {editingIngredients && <Text style={styles.sectionLabel}>材料</Text>}
                {editingIngredients.map(ing => (
                  <Text key={ing.id} style={commonStyles.bodyText}>
                    {ing.name} {formatIngredient(ing.num, ing.unit)}
                  </Text>
                ))}
                </View>
                {editingPrepSteps && <Text style={styles.sectionLabel}>前処理</Text>}
                {editingPrepSteps.map((step, index) => (
                  <View key={step.id} style={commonStyles.bottomBorder}>
                    <Text style={styles.stepText}>{index + 1}. {step.text}</Text>
                    <Text style={styles.stepTimer}>{formatTimer(step.timer)}</Text>
                  </View>
                ))}
                {editingCookSteps && <Text style={styles.sectionLabel}>調理手順</Text>}
                {editingCookSteps.map((step, index) => (
                  <View key={step.id} style={commonStyles.bottomBorder}>
                    <Text style={styles.stepText}>{index + 1}. {step.text}</Text>
                    <Text style={styles.stepTimer}>{formatTimer(step.timer)}</Text>
                  </View>
                ))}
                <View style={styles.recipeRow}>
                  <Text style={styles.totalLabel}>合計時間：</Text>
                  <Text style={styles.totalTime}>{formatTimer(getTotalTime(editingPrepSteps ?? [], editingCookSteps ?? []))}</Text>
                </View>
            </View>
          )}
          {!analyzedRecipe && (
            <View style={styles.emptyHint}>
              <Icon name="lightbulb-on-outline" size={18} color={theme.colors.mutedText}></Icon>
              <Text style={styles.emptyHintText}>解析すると、ここに材料・手順の編集画面が表示されます。</Text>
            </View>
          )}
        </ScrollView>
      </ScreenMotion>

      <View style={commonStyles.bottomBar}>
        <View style={styles.edgeArea}>
          <TouchableOpacity style={[commonStyles.primaryButton, styles.mainAction]} onPress={handleAnalyze} disabled={isSending}>
            <Icon name="plus-box-multiple-outline" size={20} color="#fff"></Icon>
            <Text style={commonStyles.primaryButtonText}>{isSending ? '解析中...' : 'AIで解析'}</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.edgeArea, styles.rightAlign]}>
          <TouchableOpacity
            style={[commonStyles.primaryButton, !canSave && styles.disabledButton]}
            onPress={handleSave}
            disabled={!canSave}
          >
            <Icon name={'clipboard-arrow-down-outline'} size={20} color={'#FFF'}></Icon>
            <Text style={commonStyles.primaryButtonText}>この内容で保存</Text>
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
    lineHeight: 22,
  },
  helperText: {
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.sm,
  },
  textArea: {
    minHeight: 210,
    textAlignVertical: 'top',
  },
  countText: {
    textAlign: 'right',
    color: theme.colors.mutedText,
    marginTop: theme.spacing.xs,
    fontSize: 12,
  },
  fullButton: {
    flex: 1,
  },
  titleInput: {
    marginBottom: theme.spacing.md,
    fontWeight: '700',
    fontSize: 18,
  },
  subTitle: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ingredientName: {
    flex: 2,
  },
  ingredientNum: {
    flex: 1,
  },
  picker: {
    flex: 1.4,
    color: theme.colors.text,
  },
  edgeArea: {
    flex: 1,
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  mainAction: {
    alignSelf: 'flex-start',
  },
  detailBody: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.shadow,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  sectionLabel: {
    marginTop: theme.spacing.xs,
    fontWeight: '800',
    color: theme.colors.primary,
    fontSize: 15,
  },
  sectionGroup: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.xs,
  },
  stepText: {
    color: theme.colors.text,
    lineHeight: 22,
  },
  stepTimer: {
    textAlign: 'right',
    color: theme.colors.mutedText,
    fontWeight: '700',
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontWeight: '800',
    color: theme.colors.primary,
    fontSize: 16,
  },
  totalTime: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  emptyHintText: {
    color: theme.colors.mutedText,
    flex: 1,
  },
  disabledButton: {
    opacity: 0.45,
  },
})

export default AIRecipeInput
