import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { Ingredient, Recipe } from '../types/recipe'
import { Step } from '../types/recipe'
import { getRecipe, getIngredients, getSteps } from '../database/recipeRepository'
import { formatIngredient } from '../utils/format'
import { commonStyles } from '../styles/common'
import { theme } from '../styles/theme'
import { TimerCircle } from '../components/TimerCircle/TimerCircle'

type Props = {
  navigation: NativeStackNavigationProp<any>
  route: RouteProp<{ Cooking: { recipeId: string } }, 'Cooking'>
}

export const CookingScreen = ({ navigation, route }: Props) => {
  const { recipeId } = route.params

  const [phase, setPhase] = useState(0)
  const [recipe, setRecipe] = useState<Recipe>()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [prepSteps, setPrepSteps] = useState<Step[]>([])
  const [cookSteps, setCookSteps] = useState<Step[]>([])

  const [checkPreps, setCheckPreps] = useState<Boolean[]>([])
  const [phasePreps, setPhasePreps] = useState(0)
  const [phaseCooks, setPhaseCooks] = useState(0)

  // タイマー
  const [isPaused, setIsPaused] = useState(false)
  const [isFinish, setIsFinish] = useState(false)
  const [elapsed, setElapsed] = useState(0) // 経過時間

  const loadRecipes = async () => {
    try {
      const data = await getRecipe(recipeId)
      const ingData = await getIngredients(recipeId)
      const stepData = await getSteps(recipeId)

      setRecipe(data)
      setIngredients(ingData)
      setPrepSteps(stepData.prepSteps)
      setCheckPreps(new Array(prepSteps.length).fill(false))
      setCookSteps(stepData.cookSteps)
    } catch (error) {
      console.error('データロードエラー：', error)
    }
  }

  useEffect(() => {
    loadRecipes()
  }, [])

  // タイマーを進める
  useEffect(() => {
    if(isPaused || isFinish) return;

    const interval = setInterval(() => {
        setElapsed(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isPaused, isFinish])

  // タイマー終了チェック
  useEffect(() => {
    const currentStep = phase === 1 ? prepSteps[phasePreps] : cookSteps[phaseCooks]

    if (currentStep?.timer && elapsed >= currentStep.timer){
        setIsFinish(true)
    }
  }, [elapsed])

  // タイマーリセット
  useEffect(() => {
    setIsPaused(false)
    setIsFinish(false)
    setElapsed(0)
  }, [phase, phasePreps, phaseCooks])

  const moveButton = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (phase === 1) {
        if (phasePreps > 0) {
          setPhasePreps(prev => prev - 1)
        } else {
          setPhase(0)
        }
      } else if (phase === 2) {
        if (phaseCooks > 0) {
          setPhaseCooks(prev => prev - 1)
        } else if (prepSteps.length > 0) {
          setPhase(1)
          setPhasePreps(prepSteps.length - 1)
        } else {
          setPhase(0)
        }
      } else if (phase === 3) {
        if (cookSteps) {
          setPhase(2)
        }
      }
    } else {
      if (phase === 0) {
        if (prepSteps) {
          setPhase(1)
        } else if (cookSteps) {
          setPhase(2)
        } else {
          setPhase(3)
        }
      } else if (phase === 1) {
        if (prepSteps.length - 1 > phasePreps) {
          setPhasePreps(prev => prev + 1)
        } else {
          setPhase(2)
        }
      } else if (phase === 2) {
        if (cookSteps.length - 1 > phaseCooks) {
          setPhaseCooks(prev => prev + 1)
        } else {
          setPhase(3)
        }
      }
    }
  }

  return (
    <View style={commonStyles.screen}>
      {phase === 0 && (
        <ScrollView contentContainerStyle={commonStyles.content}>
          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>材料</Text>
            {ingredients.map(ing => (
              <View key={ing.id} style={styles.ingredientRow}>
                <Text style={commonStyles.bodyText}>{ing.name}</Text>
                <Text style={styles.ingredientAmount}>{formatIngredient(ing.num, ing.unit)}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {phase === 1 && (
        <View>
            <ScrollView contentContainerStyle={commonStyles.content}>
                <View style={commonStyles.card}>
                <Text style={commonStyles.sectionTitle}>下準備</Text>
                <Text style={styles.stepText}>
                    {prepSteps[phasePreps].stepOrder + 1} {prepSteps[phasePreps].text}
                </Text>
                </View>
            </ScrollView>
            {/* タイマー */}
            {prepSteps[phasePreps]?.timer && (
                <TimerCircle
                    time={prepSteps[phasePreps].timer!}
                    isFinish={isFinish}
                    isPaused={isPaused}
                    lap={Math.floor(elapsed / prepSteps[phasePreps].timer!)}
                />
            )}
        </View>
      )}

      {phase === 2 && (
        <ScrollView contentContainerStyle={commonStyles.content}>
          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>調理</Text>
            <Text style={styles.stepText}>
              {cookSteps[phaseCooks].stepOrder + 1} {cookSteps[phaseCooks].text}
            </Text>
          </View>
        </ScrollView>
      )}

      {phase === 3 && (
        <View style={[commonStyles.content, styles.finishWrap]}>
          <View style={commonStyles.card}>
            <Text style={styles.finishText}>完成!!</Text>
            <Text style={styles.recipeName}>{recipe?.dishName}</Text>
          </View>
        </View>
      )}

      <View style={commonStyles.bottomBar}>
        <View style={styles.edgeArea}>
          {phase !== 0 && (
            <TouchableOpacity style={styles.actionInline} onPress={() => moveButton('prev')}>
              <Icon name="chevron-left" size={30} color={theme.colors.primary} />
              <Text style={styles.actionText}>戻る</Text>
            </TouchableOpacity>
          )}
        </View>

        {(phase === 0 || phase === 1) && (
          <TouchableOpacity style={[commonStyles.primaryButton, styles.centerButton]} onPress={() => setPhase(2)}>
            <Text style={commonStyles.primaryButtonText}>準備完了</Text>
          </TouchableOpacity>
        )}
        {phase === 3 && (
          <TouchableOpacity style={[commonStyles.primaryButton, styles.centerButton]} onPress={() => navigation.popToTop()}>
            <Text style={commonStyles.primaryButtonText}>ホームに戻る</Text>
          </TouchableOpacity>
        )}

        <View style={[styles.edgeArea, styles.rightAlign]}>
          {phase !== 3 && (
            <TouchableOpacity style={styles.actionInline} onPress={() => moveButton('next')}>
              <Text style={styles.actionText}>進む</Text>
              <Icon name="chevron-right" size={30} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  ingredientAmount: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '600',
  },
  stepText: {
    fontSize: 24,
    lineHeight: 34,
    color: theme.colors.text,
    fontWeight: '700',
  },
  finishWrap: {
    justifyContent: 'center',
    flex: 1,
  },
  finishText: {
    fontSize: 34,
    color: theme.colors.accent,
    fontWeight: '800',
    textAlign: 'center',
  },
  recipeName: {
    marginTop: 8,
    fontSize: 18,
    color: theme.colors.text,
    textAlign: 'center',
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
  },
})

export default CookingScreen
