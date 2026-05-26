import React, { useState } from 'react'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'

import { AIRecipeInput } from '../screens/AIRecipeInput'
import { RecipeForm } from '../screens/RecipeForm'
import { Recipe, Ingredient, Step, ServingsUnit, Tag } from '../types/recipe'
import { theme } from '../styles/theme'

const Tab = createMaterialTopTabNavigator()

export default function AddRecipeTopTab() {
    const [ analyzedRecipe, setAnalyzedRecipe] = useState<Recipe | null>(null)
    const [ editingIngredients, setEditingIngredients] = useState<Ingredient[]>([])
    const [ editingPrepSteps, setEditingPrepSteps] = useState<Step[]>([])
    const [ editingCookSteps, setEditingCookSteps] = useState<Step[]>([])
    const [ servings, setServings] = useState(2)
    const [ servingsUnit, setServingsUnit] = useState<ServingsUnit>('人前')
    const [ customServingsUnit, setCustomServingsUnit] = useState('')
    const [selectedTags, setSelectedTags] = useState<Tag[]>([])

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          shadowOpacity: 0,
          elevation: 0,
        },
        tabBarIndicatorStyle: {
          height: 3,
          borderRadius: 999,
          backgroundColor: theme.colors.primary,
        },
        tabBarItemStyle: {
          borderRadius: 14,
          marginHorizontal: 6,
          marginVertical: 4,
        },
        tabBarLabelStyle: {
          fontWeight: '800',
          letterSpacing: 0.2,
        },
        tabBarPressColor: theme.colors.primarySoft,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedText,
      }}
    >
      <Tab.Screen name="AI入力" options={{ tabBarLabel: 'AIで作成' }}>
        {(props) => (
          <AIRecipeInput
            {...props}
            analyzedRecipe={analyzedRecipe}
            editingIngredients={editingIngredients}
            editingPrepSteps={editingPrepSteps}
            editingCookSteps={editingCookSteps}
            setAnalyzedRecipe={setAnalyzedRecipe}
            setEditingIngredients={setEditingIngredients}
            setEditingPrepSteps={setEditingPrepSteps}
            setEditingCookSteps={setEditingCookSteps}
            editingServings={servings}
            setEditingServings={setServings}
            editingServingsUnit={servingsUnit}
            setEditingServingsUnit={setServingsUnit}
            editingCustomServingsUnit={customServingsUnit}
            setEditingCustomServingsUnit={setCustomServingsUnit}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            />
        )}
      </Tab.Screen>

      <Tab.Screen name="手入力" options={{ tabBarLabel: '手入力で作成' }}>
        {(props) => (
            <RecipeForm
                {...props}
                analyzedRecipe={analyzedRecipe}
                editingIngredients={editingIngredients}
                editingPrepSteps={editingPrepSteps}
                editingCookSteps={editingCookSteps}
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
            />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  )
}
