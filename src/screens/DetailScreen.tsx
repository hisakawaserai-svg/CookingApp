import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, StyleSheet } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { StepSection } from '../components/StepSection'
import { getTotalTime } from '../utils/recipeTime'
import { getRecipe, getIngredients, getSteps, updateRecipe, deleteRecipe, getRecipeTags } from '../database/recipeRepository'
import { Recipe, Ingredient, Step, ServingsUnit, Tag } from '../types/recipe'
import { formatIngredient, formatTimer } from '../utils/format'
import { commonStyles } from '../styles/common'
import { theme } from '../styles/theme'
import { ScreenMotion } from '../components/ui/ScreenMotion'
import IngredientsForm from '../components/ui/IngredientForm'
import { getRecipeValidationMessage } from '../utils/recipeValidation'
import ServingsInput from '../components/ServingsInput'
import { TagSelector } from '../components/Tags/TagSelector'

type Props = {
  navigation: NativeStackNavigationProp<any>
  route: RouteProp<{ Detail: { recipeId: string } }, 'Detail'>
}

type StepResult = {
  prepSteps: Step[]
  cookSteps: Step[]
}

export const DetailScreen = ({ navigation, route }: Props) => {
  const { recipeId } = route.params

  const [ openRecipe, setOpenRecipe] = useState<Recipe | null>(null)
  const [ openIngredients, setOpenIngredients] = useState<Ingredient[]>([])
  const [ openSteps, setOpenSteps] = useState<StepResult | null>(null)
  const [ isEditing, setIsEditing] = useState(false)
  const [ editingName, setEditingName] = useState('')
  const [ editingIngredients, setEditingIngredients] = useState<Ingredient[]>([])
  const [ editingPrepSteps, setEditingPrepSteps] = useState<Step[]>([])
  const [ editingCookSteps, setEditingCookSteps] = useState<Step[]>([])
  const [ editingServings, setEditingServings] = useState(2)
  const [ editingServingsUnit, setEditingServingsUnit] = useState<ServingsUnit>('人前')
  const [ editingCustomServingsUnit, setEditingCustomServingsUnit] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // カラーピッカー
  const [ openTags, setOpenTags] = useState<Tag[]>([])
  const [ selectedTags, setSelectedTags] = useState<Tag[]>([])

  useEffect(() => {
    let isActive = true

    const loadRecipes = async () => {
      setIsLoading(true)
      try {
        const [data, ingData, stepData, tagData] = await Promise.all([
          getRecipe(recipeId),
          getIngredients(recipeId),
          getSteps(recipeId),
          getRecipeTags(recipeId),
        ])

        if (!isActive) return
        setOpenRecipe(data ?? null)
        setOpenIngredients(Array.isArray(ingData) ? ingData : [])
        setOpenSteps(stepData ?? { prepSteps: [], cookSteps: [] })
        setOpenTags(Array.isArray(tagData) ? tagData : [])
        setSelectedTags(Array.isArray(tagData) ? tagData : [])
      } catch (error) {
        if (!isActive) return
        console.error('詳細画面の読み込みエラー', error)
        setOpenRecipe(null)
        setOpenIngredients([])
        setOpenSteps({ prepSteps: [], cookSteps: [] })
        setOpenTags([])
        setSelectedTags([])
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    loadRecipes()

    return () => {
      isActive = false
    }
  }, [recipeId])

  const handleEditing = async () => {
    if (isEditing) {
      const validationMessage = getRecipeValidationMessage(
        editingName,
        editingIngredients,
        editingPrepSteps,
        editingCookSteps,
      )
      if (validationMessage) {
        Alert.alert('入力エラー', validationMessage)
        return
      }

      try {
        await updateRecipe(recipeId, editingName, editingServings, editingServingsUnit, editingCustomServingsUnit, editingIngredients, editingPrepSteps, editingCookSteps, selectedTags.map(tag => tag.id))
        setOpenRecipe(prev => (prev ? { ...prev, dishName: editingName } : null))
        setOpenIngredients(editingIngredients)
        setOpenSteps({ prepSteps: editingPrepSteps, cookSteps: editingCookSteps })
        setOpenTags(selectedTags)
        setIsEditing(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : '保存に失敗しました。入力内容を確認して再度お試しください。'
        Alert.alert('保存エラー', message)
        console.error('更新エラー', error)
      }
    } else {
      setEditingName(openRecipe?.dishName ?? '')
      setEditingIngredients(openIngredients ?? [])
      setEditingPrepSteps(openSteps?.prepSteps ?? [])
      setEditingCookSteps(openSteps?.cookSteps ?? [])
      setSelectedTags(openTags)
      setIsEditing(true)
    }
  }

  const handleDelete = () => {
    Alert.alert(
      '削除確認',
      '本当にこのレシピを削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe(recipeId)
              navigation.goBack()
            } catch (error) {
              const message = error instanceof Error ? error.message : '削除に失敗しました。'
              Alert.alert('削除エラー', message)
              console.error('削除エラー', error)
            }
          }
        }
      ]
    )
  }

  return (
    <View style={commonStyles.screen}>
      <View style={commonStyles.decorTop} />
      <View style={commonStyles.decorBottom} />
      <ScreenMotion style={commonStyles.pageWrap}>
        <ScrollView contentContainerStyle={commonStyles.content}>
          {isEditing ? (
            <View style={commonStyles.card}>
              <View>
                <TextInput
                  style={[commonStyles.input, commonStyles.stepLikeInput, styles.titleInput]}
                  placeholder={'料理名'}
                  placeholderTextColor={theme.colors.mutedText}
                  value={editingName}
                  onChangeText={setEditingName}
                  multiline={true}
                />   
                <TagSelector 
                  selectedTags={selectedTags}
                  setSelectedTags={setSelectedTags}
                />
                <ServingsInput servings={editingServings} setServings={setEditingServings} servingsUnit={editingServingsUnit} setServingsUnit={setEditingServingsUnit} customServingsUnit={editingCustomServingsUnit} setCustomServingsUnit={setEditingCustomServingsUnit} />
              </View>
              <IngredientsForm ingredients={editingIngredients} setIngredients={setEditingIngredients}/>

              <StepSection title="下準備" steps={editingPrepSteps} setEditingSteps={setEditingPrepSteps} />
              <StepSection title="調理手順" steps={editingCookSteps} setEditingSteps={setEditingCookSteps} />
            </View>
          ) : isLoading ? (
            <View style={commonStyles.card}>
              <View style={styles.headerRow}>
                <View style={styles.skeletonTitle} />
                <View style={styles.headerActions}>
                  <View style={styles.skeletonBadge} />
                  <View style={styles.deleteButton}>
                    <View style={styles.skeletonIcon} />
                  </View>
                </View>
              </View>
              <View style={[styles.sectionGroup, commonStyles.bottomBorder]}>
                <View style={styles.skeletonSubTitle} />
                <View style={styles.skeletonLine} />
                <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
              </View>
              <View style={[styles.sectionGroup, commonStyles.bottomBorder]}>
                <View style={styles.skeletonSubTitle} />
                <View style={styles.skeletonLine} />
                <View style={[styles.skeletonLine, styles.skeletonLineMedium]} />
              </View>
            </View>
          ) : (
            <View style={[commonStyles.card]}>
              <View style={styles.headerBlock}>
                <View style={styles.headerRow}>
                  <Text style={[commonStyles.sectionTitle, styles.headerTitle]}>{openRecipe?.dishName}</Text>
                  <View style={styles.headerActions}>
                    <Text style={styles.servingsBadge}>{openRecipe?.servings}{openRecipe?.servingsUnit}</Text>
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                      <Icon name="trash-can-outline" size={30} color={'red'} />
                    </TouchableOpacity>
                  </View>
                </View>
                {openTags.length > 0 && (
                  <View style={styles.tagWrap}>
                    {openTags.map(tag => (
                      <View key={tag.id} style={styles.tagChip}>
                        <View style={[styles.colorDot, { backgroundColor: tag.tagColor }]} />
                        <Text style={styles.tagText}>{tag.name}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              
              <View style={[styles.sectionGroup, commonStyles.bottomBorder]}>
                <Text style={styles.subTitle}>材料</Text>
                {openIngredients.map(ing => (
                  <Text key={ing.id} style={commonStyles.bodyText}>
                    {ing.name} {formatIngredient(ing.num, ing.unit, ing.customUnit)}
                  </Text>
                ))}
              </View>

              {(openSteps?.prepSteps.length ?? [].length) > 0 && (
                <View>
                  <Text style={styles.subTitle}>下準備</Text>
                  {openSteps?.prepSteps.map((step, index) => (
                    <View key={step.id} style={[styles.stepRow, commonStyles.bottomBorder]}>
                      <Text style={commonStyles.bodyText}>
                        {index + 1}. {step.text}
                      </Text>
                      <Text style={styles.stepTimer}>
                        {formatTimer(step.timer)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View>
                <Text style={styles.subTitle}>調理手順</Text>
                {openSteps?.cookSteps.map((step, index) => (
                  <View key={step.id} style={[styles.stepRow, commonStyles.bottomBorder]}>
                    <Text style={commonStyles.bodyText}>
                      {index + 1}. {step.text}
                    </Text>
                    <Text style={styles.stepTimer}>
                      {formatTimer(step.timer)}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.recipeRow}>
                <Text style={styles.totalLabel}>合計時間：</Text>
                <Text style={styles.totalTime}>{formatTimer(getTotalTime(openSteps?.prepSteps ?? [], openSteps?.cookSteps ?? []))}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </ScreenMotion>

      <View style={commonStyles.bottomBar}>
        <View style={styles.edgeArea}>
          <TouchableOpacity style={[commonStyles.primaryButton, styles.mainAction]} onPress={handleEditing}>
            <Icon name={isEditing ? 'clipboard-arrow-down-outline' : 'pencil-plus-outline'} size={20} color={'#FFF'} />
            <Text style={commonStyles.primaryButtonText}>{isEditing ? '保存' : '編集'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.edgeArea, styles.rightAlign]}>
          {isEditing ? (
            <TouchableOpacity
              style={commonStyles.secondaryButton}
              onPress={() => {
                setSelectedTags(openTags)
                setIsEditing(false)
              }}
            >
              <Text style={commonStyles.secondaryButtonText}>キャンセル</Text>
            </TouchableOpacity>
          ) : (
            <View>
              {openRecipe && (
                <TouchableOpacity style={[commonStyles.primaryButton, styles.mainAction]} onPress={() => navigation.navigate('Cooking', { recipeId: recipeId })}>
                  <Icon name="chef-hat" size={20} color={'#FFF'} />
                  <Text style={commonStyles.primaryButtonText}>調理開始</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerBlock: {
    marginBottom: theme.spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
    marginBottom: 0,
    paddingRight: theme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
    flexShrink: 0,
    minWidth: 140,
    justifyContent: 'flex-end',
  },
  servingsBadge: {
    marginRight: 8,
    color: theme.colors.mutedText,
    fontWeight: '700',
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 72,
    textAlign: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInput: {
    marginBottom: theme.spacing.md,
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
  sectionGroup: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.xs,
  },
  ingredientCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSoft,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
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
  ingredientNameInput: {
    minHeight: 48,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing.xs,
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
  mainAction: {
    alignSelf: 'flex-start',
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  stepRow: {
    width: '100%',
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
  stepTimer: {
    textAlign: 'right',
    color: theme.colors.mutedText,
    fontWeight: '600',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: theme.spacing.xs,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tagText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  skeletonTitle: {
    height: 28,
    width: '55%',
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceSoft,
  },
  skeletonBadge: {
    width: 72,
    height: 28,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSoft,
    marginRight: 8,
  },
  skeletonIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSoft,
  },
  skeletonSubTitle: {
    width: 90,
    height: 18,
    borderRadius: 6,
    backgroundColor: theme.colors.surfaceSoft,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  skeletonLine: {
    width: '100%',
    height: 16,
    borderRadius: 6,
    backgroundColor: theme.colors.surfaceSoft,
    marginBottom: 8,
  },
  skeletonLineShort: {
    width: '72%',
  },
  skeletonLineMedium: {
    width: '84%',
  },
})

export default DetailScreen
