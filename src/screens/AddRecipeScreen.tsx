import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { analyzeRecipeText } from '../services/gemini'
import { Recipe } from '../types/recipe'
import { saveRecipe } from '../database/recipeRepository'
import { formatIngredient, formatTimer } from '../utils/format'
import { commonStyles } from '../styles/common'
import { theme } from '../styles/theme'

export const AddRecipeScreen = () => {
  const [recipeText, setRecipeText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [analyzedRecipe, setAnalyzedRecipe] = useState<Recipe | null>(null)

  const handleAnalyze = async () => {
    if (recipeText === '') return
    setIsSending(true)
    const result = await analyzeRecipeText(recipeText)
    setAnalyzedRecipe(result)
    try {
      saveRecipe(result)
    } catch (error) {
      console.error('保存失敗：', error)
    }
    setIsSending(false)
  }

  return (
    <View style={commonStyles.screen}>
      <ScrollView contentContainerStyle={commonStyles.content}>
        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionTitle}>ここにレシピをコピペしてください</Text>
          <TextInput
            style={[commonStyles.input, styles.textArea]}
            placeholder={'料理名：鶏肉と野菜の炒め物\n材料：鶏肉200g、ピーマン2個\n下準備：鶏肉を一口大に切る\n調理：①炒める3分 ②醤油で味付け1分'}
            value={recipeText}
            onChangeText={setRecipeText}
            multiline={true}
            numberOfLines={10}
            editable={!isSending}
            placeholderTextColor={theme.colors.mutedText}
          />
        </View>

        {analyzedRecipe && (
          <View style={[commonStyles.card, styles.resultCard]}>
            <Text style={commonStyles.sectionTitle}>{`料理名：${analyzedRecipe.dishName}`}</Text>
            <Text style={styles.label}>材料：</Text>
            {analyzedRecipe.ingredients.map(ingredient => (
              <Text key={ingredient.name} style={commonStyles.bodyText}>
                {ingredient.name} {formatIngredient(ingredient.num, ingredient.unit)}
              </Text>
            ))}
            <Text style={styles.label}>前処理：</Text>
            {analyzedRecipe.prepSteps.map((prepStep, index) => (
              <Text key={prepStep.text} style={commonStyles.bodyText}>
                {index} {prepStep.text}
                {formatTimer(prepStep.timer)}
              </Text>
            ))}
            <Text style={styles.label}>調理手順：</Text>
            {analyzedRecipe.cookSteps.map((cookStep, index) => (
              <Text key={cookStep.text} style={commonStyles.bodyText}>
                {index} {cookStep.text}
                {formatTimer(cookStep.timer)}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={commonStyles.bottomBar}>
        <TouchableOpacity style={[{flexDirection: 'row'}, commonStyles.primaryButton, styles.fullButton]} onPress={handleAnalyze} disabled={isSending}>
          <Icon name="plus-box-multiple-outline" size={20} color="#fff"></Icon>
          <Text style={commonStyles.primaryButtonText}> {isSending ? '解析中...' : '追加'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  textArea: {
    minHeight: 180,
    textAlignVertical: 'top',
  },
  resultCard: {
    marginTop: theme.spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  fullButton: {
    flex: 1,
  },
})

export default AddRecipeScreen
