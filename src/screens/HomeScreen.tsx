import { useEffect, useState, useCallback } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, LayoutAnimation } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useFocusEffect } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { getRecipes, getIngredients, getSteps, getTags } from '../database/recipeRepository'
import { getTotalTime } from '../utils/recipeTime'
import { Recipe, Ingredient, Step, Tag } from '../types/recipe'
import { formatIngredient, formatTimer } from '../utils/format'
import { commonStyles } from '../styles/common'
import { theme } from '../styles/theme'
import { ScreenMotion } from '../components/ui/ScreenMotion'
import { StaggerIn } from '../components/ui/StaggerIn'

type Props = {
  navigation: NativeStackNavigationProp<any>
}

type StepResult = {
  prepSteps: Step[]
  cookSteps: Step[]
}

export const HomeScreen = ({ navigation }: Props) => {
  const [ searchText, setSearchText] = useState('')
  const [ selectedFilterTags, setSelectedFilterTags] = useState<Tag[]>([])
  const [ allTags, setAllTags] = useState<Tag[]>([])
  const [ isShowFilter, setIsShowFilter] = useState(false)

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [openRecipe, setOpenRecipe] = useState<string | null>(null)
  const [openIngredients, setOpenIngredients] = useState<Ingredient[]>([])
  const [openSteps, setOpenSteps] = useState<StepResult | null>(null)

  const loadRecipes = useCallback(async () => {
    try {
      const data = await getRecipes()
      setRecipes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('レシピ取得エラー', error)
      setRecipes([])
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      const loadOnFocus = async () => {
        try {
          const tags = await getTags()
          setAllTags(Array.isArray(tags) ? tags : [])
        } catch (error) {
          console.error('タグ取得エラー', error)
          setAllTags([])
        }

        await loadRecipes()
      }

      loadOnFocus()
    }, [loadRecipes])
  )

  useEffect(() => {
    const loadRecipeDetails = async () => {
      if (!openRecipe) {
        setOpenIngredients([])
        setOpenSteps(null)
        return
      }

      try {
        const [ingData, stepData] = await Promise.all([
          getIngredients(openRecipe),
          getSteps(openRecipe),
        ])
        setOpenIngredients(Array.isArray(ingData) ? ingData : [])
        setOpenSteps(stepData ?? { prepSteps: [], cookSteps: [] })
      } catch (error) {
        console.error('レシピ詳細取得エラー', error)
        setOpenIngredients([])
        setOpenSteps({ prepSteps: [], cookSteps: [] })
      }
    }

    loadRecipeDetails()
  }, [openRecipe])

  useEffect(() => {
    if (!openRecipe) return

    const stillExists = recipes.some(item => item.id === openRecipe)
    if (stillExists) return

    setOpenRecipe(null)
    setOpenIngredients([])
    setOpenSteps(null)
  }, [recipes, openRecipe])

  const toggleRecipe = (recipeId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    if (openRecipe === recipeId) {
      setOpenRecipe(null)
      setOpenIngredients([])
      setOpenSteps(null)
      return
    }

    setOpenRecipe(recipeId)
  }

  // タグ選択/解除
  const toggleTag = (tag: Tag) => {
    const isSelected = selectedFilterTags.some(t => t.id === tag.id)
    if (isSelected) {
      // 選択済みなら外す -> filterを使う
      setSelectedFilterTags(prev => prev.filter(t => t.id !== tag.id))
    } else {
      // なければ追加 -> スプレッド演算子で追加
      setSelectedFilterTags(prev => [...prev, tag])
    }
  }

  // フィルター
  const filterRecipes = recipes.filter(recipe => {
    // 検索フィルター
    const matchSearch = recipe.dishName.includes(searchText)
    // タグフィルター
    const matchTag = selectedFilterTags.length === 0 || 
      selectedFilterTags.some(filterTag => 
        recipe.tagIds?.some(recipeTag => filterTag.id === recipeTag.id)
      )
    
    return matchSearch && matchTag
  }) 

  return (
    <View style={commonStyles.screen}>
      <View style={commonStyles.decorTop} />
      <View style={commonStyles.decorBottom} />

      <ScreenMotion style={commonStyles.pageWrap}>
        <View style={styles.searchRow}>
          <Icon name="text-box-search-outline" size={24} color={theme.colors.primary} />
          <TextInput
            style={[commonStyles.input, styles.searchInput]}
            placeholder="レシピを検索..."
            placeholderTextColor={theme.colors.mutedText}
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity onPress={() => setIsShowFilter(!isShowFilter)}>
            <Icon name={isShowFilter ? "filter-minus-outline" : "filter-plus-outline"} size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {isShowFilter && (
          <View style={styles.filterPanel}>
            <Text style={styles.filterTitle}>タグで絞り込み</Text>
            <View style={styles.filterWrap}>
              {allTags.map(tag => {
                const isSelected = selectedFilterTags.some(selected => selected.id === tag.id)
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.86}
                  >
                    <View style={[styles.filterDot, { backgroundColor: tag.tagColor }]} />
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>{tag.name}</Text>
                    <Icon
                      name={isSelected ? 'check-circle' : 'plus-circle-outline'}
                      size={16}
                      color={isSelected ? theme.colors.primary : theme.colors.mutedText}
                    />
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}

        <FlatList
          contentContainerStyle={styles.listContent}
          data={filterRecipes}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <StaggerIn index={index}>
              <View style={[commonStyles.card, openRecipe === item.id && styles.activeCard]}>
                <TouchableOpacity style={styles.recipeRow} onPress={() => toggleRecipe(item.id)} activeOpacity={0.84}>
                  <Text style={styles.recipeTitle}>{item.dishName}</Text>
                  <Text style={styles.servingsText}>{item.servings}{item.servingsUnit}</Text>
                  <Icon
                    name={openRecipe === item.id ? 'minus-circle' : 'plus-circle-outline'}
                    size={22}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
                {(item.tagIds?.length ?? 0) > 0 && (
                  <View style={styles.recipeTagWrap}>
                    {item.tagIds.slice(0, 2).map(tag => (
                      <View key={tag.id} style={styles.recipeTagChip}>
                        <View style={[styles.filterDot, { backgroundColor: tag.tagColor }]} />
                        <Text style={styles.recipeTagText}>{tag.name}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {openRecipe === item.id && (
                  <View style={styles.detailBody}>
                    <View style={[styles.sectionGroup, commonStyles.bottomBorder]}>
                      {openIngredients && <Text style={styles.sectionLabel}>材料</Text>}
                      {openIngredients.map(ing => (
                        <Text key={ing.id} style={commonStyles.bodyText}>
                          {ing.name} {formatIngredient(ing.num, ing.unit)}
                        </Text>
                      ))}
                    </View>
                    {(openSteps?.prepSteps.length ?? [].length) > 0 && <Text style={styles.sectionLabel}>下準備</Text>}
                    {openSteps?.prepSteps.map((step, stepIndex) => (
                      <View key={step.id} style={commonStyles.bottomBorder}>
                        <Text style={styles.stepText}>{stepIndex + 1}. {step.text}</Text>
                        <Text style={styles.stepTimer}>{formatTimer(step.timer)}</Text>
                      </View>
                    ))}
                    {openSteps?.cookSteps && <Text style={styles.sectionLabel}>調理手順</Text>}
                    {openSteps?.cookSteps.map((step, stepIndex) => (
                      <View key={step.id} style={commonStyles.bottomBorder}>
                        <Text style={styles.stepText}>{stepIndex + 1}. {step.text}</Text>
                        <Text style={styles.stepTimer}>{formatTimer(step.timer)}</Text>
                      </View>
                    ))}
                    <View style={styles.recipeRow}>
                      <Text style={styles.totalLabel}>合計時間：</Text>
                      <Text style={styles.totalTime}>{formatTimer(getTotalTime(openSteps?.prepSteps ?? [], openSteps?.cookSteps ?? []))}</Text>
                    </View>
                  </View>
                )}
              </View>
            </StaggerIn>
          )}
        />
      </ScreenMotion>

      <View style={commonStyles.bottomBar}>
        <View style={styles.edgeArea}>
          {openRecipe && (
            <TouchableOpacity style={styles.actionInline} onPress={() => navigation.navigate('Cooking', { recipeId: openRecipe })}>
              <Icon name="chef-hat" size={22} color={theme.colors.accent} />
              <Text style={styles.actionText}>調理開始</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={[commonStyles.primaryButton, styles.centerButton]} onPress={() => navigation.navigate('AddRecipe')}>
          <Icon name="book-plus-multiple-outline" size={20} color="#fff" />
          <Text style={commonStyles.primaryButtonText}>レシピを追加</Text>
        </TouchableOpacity>

        <View style={[styles.edgeArea, styles.rightAlign]}>
          {openRecipe && (
            <TouchableOpacity style={styles.actionInline} onPress={() => navigation.navigate('Detail', { recipeId: openRecipe })}>
              <Text style={styles.actionText}>詳細確認</Text>
              <Icon name="magnify" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  filterPanel: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    ...theme.shadow,
  },
  filterTitle: {
    color: theme.colors.primary,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },
  filterWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  filterChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  filterDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: theme.colors.primary,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 110,
    gap: theme.spacing.md,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recipeTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  servingsText: {
    marginRight: 10,
    color: theme.colors.mutedText,
    fontWeight: '700',
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  detailBody: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionLabel: {
    marginTop: theme.spacing.xs,
    fontWeight: '800',
    color: theme.colors.primary,
    fontSize: 15,
  },
  sectionGroup: {
    paddingTop: theme.spacing.xs,
  },
  stepText: {
    color: theme.colors.text,
    lineHeight: 22,
  },
  stepTimer: {
    textAlign: 'right',
    color: theme.colors.mutedText,
    fontWeight: '600',
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
  edgeArea: {
    flex: 1,
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  actionInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  centerButton: {
    flex: 1.5,
    flexDirection: 'row',
    gap: 8,
  },
  activeCard: {
    borderColor: theme.colors.accent,
    borderWidth: 2,
    backgroundColor: '#FFF6ED',
  },
  recipeTagWrap: {
    marginTop: theme.spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recipeTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recipeTagText: {
    color: theme.colors.mutedText,
    fontWeight: '700',
    fontSize: 12,
  },
})

export default HomeScreen
