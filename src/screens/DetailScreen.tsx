import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { Picker } from '@react-native-picker/picker'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { getRecipe, getIngredients, getSteps, updateRecipe } from '../database/recipeRepository'
import { Recipe, Ingredient, Step } from '../types/recipe'
import { formatIngredient, formatTimer, resetStepOrder } from '../utils/format'
import { commonStyles } from '../styles/common'
import { theme } from '../styles/theme'

type Props = {
  navigation: NativeStackNavigationProp<any>
  route: RouteProp<{ Detail: { recipeId: string } }, 'Detail'>
}

type StepResult = {
  prepSteps: Step[]
  cookSteps: Step[]
}

type StepsProps = {
  title: string
  steps: Step[]
  setEditingSteps: React.Dispatch<React.SetStateAction<Step[]>>
}

type StepProps = {
  step: Step
  index: number
  setSteps: React.Dispatch<React.SetStateAction<Step[]>>
}

const moveStep = (steps: Step[], index: number, direction: 'up' | 'down') => {
  const newSteps = [...steps]
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= steps.length) return steps
  ;[newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]]
  return resetStepOrder(newSteps)
}

const StepRow = ({ step, index, setSteps }: StepProps) => {
  return (
    <View style={styles.stepRow}>
      <Text style={styles.indexText}>{step.stepOrder ? step.stepOrder + 1 : index + 1}</Text>
      <TextInput
        style={[commonStyles.input, styles.stepInput]}
        value={step.text}
        onChangeText={text => setSteps(prev => prev.map((item, i) => (i === index ? { ...item, text } : item)))}
        multiline={true}
      />
      <TextInput
        style={[commonStyles.input, styles.timerInput]}
        value={step.timer ? String(step.timer) : ''}
        placeholder="時間なし"
        placeholderTextColor={theme.colors.mutedText}
        keyboardType="numeric"
        onChangeText={time =>
          setSteps(prev => prev.map((item, i) => (i === index ? { ...item, timer: time === '' ? 0 : Number(time) } : item)))
        }
      />
      <View style={styles.arrowWrap}>
        <TouchableOpacity onPress={() => setSteps(prev => moveStep(prev, index, 'up'))}>
          <Text style={styles.arrowText}>↑</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSteps(prev => moveStep(prev, index, 'down'))}>
          <Text style={styles.arrowText}>↓</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const StepSection = ({ title, steps, setEditingSteps }: StepsProps) => {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.subTitle}>{title}</Text>
      {steps.map((step, index) => (
        <StepRow key={step.id} step={step} index={index} setSteps={setEditingSteps} />
      ))}
    </View>
  )
}

export const DetailScreen = ({ route }: Props) => {
  const { recipeId } = route.params

  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null)
  const [openIngredients, setOpenIngredients] = useState<Ingredient[]>([])
  const [openSteps, setOpenSteps] = useState<StepResult | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingName, setEditingName] = useState('')
  const [editingIngredients, setEditingIngredients] = useState<Ingredient[]>([])
  const [editingPrepSteps, setEditingPrepSteps] = useState<Step[]>([])
  const [editingCookSteps, setEditingCookSteps] = useState<Step[]>([])

  const loadRecipes = async () => {
    const data = await getRecipe(recipeId)
    const ingData = await getIngredients(recipeId)
    const stepData = await getSteps(recipeId)

    setOpenRecipe(data)
    setOpenIngredients(ingData)
    setOpenSteps(stepData)
  }

  useEffect(() => {
    loadRecipes()
  }, [])

  const handleEditing = async () => {
    if (isEditing) {
      await updateRecipe(recipeId, editingName, editingIngredients, editingPrepSteps, editingCookSteps)
      setOpenRecipe(prev => (prev ? { ...prev, dishName: editingName } : null))
      setOpenIngredients(editingIngredients)
      setOpenSteps({ prepSteps: editingPrepSteps, cookSteps: editingCookSteps })
      setIsEditing(false)
    } else {
      setEditingName(openRecipe?.dishName ?? '')
      setEditingIngredients(openIngredients ?? [])
      setEditingPrepSteps(openSteps?.prepSteps ?? [])
      setEditingCookSteps(openSteps?.cookSteps ?? [])
      setIsEditing(true)
    }
  }

  return (
    <View style={commonStyles.screen}>
      <ScrollView contentContainerStyle={commonStyles.content}>
        {isEditing ? (
          <View style={commonStyles.card}>
            <TextInput
              style={[commonStyles.input, styles.titleInput]}
              placeholder={'料理名'}
              placeholderTextColor={theme.colors.mutedText}
              value={editingName}
              onChangeText={setEditingName}
              multiline={true}
            />
            <Text style={styles.subTitle}>材料</Text>
            {editingIngredients.map((ing, index) => (
              <View key={ing.id} style={styles.ingredientRow}>
                <TextInput
                  style={[commonStyles.input, styles.ingredientName]}
                  placeholder="材料名"
                  placeholderTextColor={theme.colors.mutedText}
                  value={ing.name}
                  onChangeText={text =>
                    setEditingIngredients(prev => prev.map((item, i) => (i === index ? { ...item, name: text } : item)))
                  }
                  multiline={true}
                />
                <TextInput
                  style={[commonStyles.input, styles.ingredientNum]}
                  value={String(ing.num)}
                  keyboardType="numeric"
                  onChangeText={text =>
                    setEditingIngredients(prev => prev.map((item, i) => (i === index ? { ...item, num: Number(text) } : item)))
                  }
                />
                <Picker
                  style={styles.picker}
                  selectedValue={ing.unit}
                  onValueChange={value =>
                    setEditingIngredients(prev => prev.map((item, i) => (i === index ? { ...item, unit: value } : item)))
                  }
                >
                  <Picker.Item label="g" value="g" />
                  <Picker.Item label="ml" value="ml" />
                  <Picker.Item label="個" value="個" />
                  <Picker.Item label="小さじ" value="小さじ" />
                  <Picker.Item label="中さじ" value="中さじ" />
                  <Picker.Item label="大さじ" value="大さじ" />
                </Picker>
              </View>
            ))}

            <StepSection title="前処理" steps={editingPrepSteps} setEditingSteps={setEditingPrepSteps} />
            <StepSection title="調理手順" steps={editingCookSteps} setEditingSteps={setEditingCookSteps} />
          </View>
        ) : (
          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>{openRecipe?.dishName}</Text>
            <Text style={styles.subTitle}>材料</Text>
            {openIngredients.map(ing => (
              <Text key={ing.id} style={commonStyles.bodyText}>
                {ing.name} {formatIngredient(ing.num, ing.unit)}
              </Text>
            ))}

            <Text style={styles.subTitle}>前処理</Text>
            {openSteps?.prepSteps.map((step, index) => (
              <Text key={step.id} style={commonStyles.bodyText}>
                {index + 1} {step.text}
                {formatTimer(step.timer)}
              </Text>
            ))}

            <Text style={styles.subTitle}>調理手順</Text>
            {openSteps?.cookSteps.map((step, index) => (
              <Text key={step.id} style={commonStyles.bodyText}>
                {index + 1} {step.text}
                {formatTimer(step.timer)}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={commonStyles.bottomBar}>
        <View style={styles.edgeArea}>
          <TouchableOpacity style={[commonStyles.primaryButton, styles.mainAction]} onPress={handleEditing}>
            <Icon name={isEditing ? 'clipboard-arrow-down-outline' : 'pencil-plus-outline'} size={20} color={'#FFF'}></Icon>
            <Text style={commonStyles.primaryButtonText}>{isEditing ? '保存' : '編集'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.edgeArea, styles.rightAlign]}>
          {isEditing && (
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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
  sectionBlock: {
    marginTop: theme.spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  indexText: {
    width: 24,
    textAlign: 'center',
    color: theme.colors.text,
    fontWeight: '700',
  },
  stepInput: {
    flex: 2,
  },
  timerInput: {
    flex: 1,
  },
  arrowWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  cancelText: {
    color: theme.colors.text,
    fontWeight: '700',
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
})

export default DetailScreen
