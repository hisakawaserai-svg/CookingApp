import { useEffect, useState, useCallback } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useFocusEffect } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { getRecipes, getIngredients, getSteps } from '../database/recipeRepository'
import { Recipe, Ingredient, Step } from '../types/recipe'
import { formatIngredient, formatTimer } from '../utils/format'
import { commonStyles } from '../styles/common'
import { theme } from '../styles/theme'

type Props = {
  navigation: NativeStackNavigationProp<any>
}

type StepResult = {
  prepSteps: Step[]
  cookSteps: Step[]
}

export const HomeScreen = ({ navigation }: Props) => {
  const [searchText, setSearchText] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [openRecipe, setOpenRecipe] = useState<string | null>(null)
  const [openIngredients, setOpenIngredients] = useState<Ingredient[]>([])
  const [openSteps, setOpenSteps] = useState<StepResult | null>(null)

  useEffect(() => {
    const loadRecipes = async () => {
      const data = await getRecipes()
      setRecipes(data)
    }
    loadRecipes()
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (openRecipe) {
        const loadData = async (recipeId: string) => {
          const ingData = await getIngredients(recipeId)
          const stepData = await getSteps(recipeId)
          setOpenIngredients(ingData)
          setOpenSteps(stepData)
        }
        loadData(openRecipe)
        return () => {}
      }
    }, [openRecipe]),
  )

  return (
    <View style={commonStyles.screen}>
      <View style={styles.searchRow}>
        <Icon name="text-box-search-outline" size={24} color={theme.colors.primary} />
        <TextInput
          style={[commonStyles.input, styles.searchInput]}
          placeholder="レシピを検索..."
          placeholderTextColor={theme.colors.mutedText}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={recipes.filter(item => item.dishName.includes(searchText))}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={commonStyles.card}>
            <TouchableOpacity style={styles.recipeRow} onPress={() => setOpenRecipe(openRecipe === item.id ? null : item.id)}>
              <Text style={styles.recipeTitle}>{item.dishName}</Text>
              <Icon
                name={openRecipe === item.id ? 'minus-circle' : 'plus-circle-outline'}
                size={22}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
            {openRecipe === item.id && (
              <View style={styles.detailBody}>
                {openIngredients.map(ing => (
                  <Text key={ing.id} style={commonStyles.bodyText}>
                    {ing.name} {formatIngredient(ing.num, ing.unit)}
                  </Text>
                ))}
                {openSteps?.prepSteps && <Text style={styles.sectionLabel}>前処理</Text>}
                {openSteps?.prepSteps.map((step, index) => (
                  <Text key={step.id} style={commonStyles.bodyText}>
                    {index + 1} {step.text}
                    {formatTimer(step.timer)}
                  </Text>
                ))}
                {openSteps?.cookSteps && <Text style={styles.sectionLabel}>調理手順</Text>}
                {openSteps?.cookSteps.map((step, index) => (
                  <Text key={step.id} style={commonStyles.bodyText}>
                    {index + 1} {step.text}
                    {formatTimer(step.timer)}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      />

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
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: theme.radius.md,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 110,
    gap: theme.spacing.sm,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recipeTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  detailBody: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  sectionLabel: {
    marginTop: theme.spacing.sm,
    fontWeight: '700',
    color: theme.colors.primary,
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
    fontWeight: '600',
  },
  centerButton: {
    flex: 1.5,
    flexDirection: 'row',
    gap: 6,
  },
})

export default HomeScreen
