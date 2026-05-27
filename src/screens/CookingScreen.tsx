import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, TextInput, ScrollView, Vibration, StyleSheet, Platform, UIManager, Animated } from 'react-native'

import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { activateKeepAwake, deactivateKeepAwake } from '@sayem314/react-native-keep-awake'

import { Ingredient, Recipe } from '../types/recipe'
import { Step } from '../types/recipe'
import { getRecipe, getIngredients, getSteps } from '../database/recipeRepository'
import { formatIngredient, formatTimer } from '../utils/format'
import { commonStyles } from '../styles/common'
import { theme } from '../styles/theme'
import { ScreenMotion } from '../components/ui/ScreenMotion'

const COLLAPSED_INGREDIENTS_HEIGHT = 0

type Props = {
  navigation: NativeStackNavigationProp<any>
  route: RouteProp<{ Cooking: { recipeId: string } }, 'Cooking'>
}

// 1. 料理の進捗バー
export const RecipeProgressBar = ({ currentIndex, totalSteps, step }: { currentIndex: number, totalSteps: number, step: string }) => {
  const total = totalSteps > 0 ? totalSteps : 1
  const recipeProgress = Math.min(Math.max((currentIndex + 1) / total, 0), 1)

  return (
    <View style={{ width: '100%' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 4 }}>
        <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: '700' }}>{step}の進み具合</Text>
        <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: '700' }}>{currentIndex + 1} / {total}</Text>
      </View>
      
      {/* バー本体 */}
      <View style={{ height: 6, backgroundColor: theme.colors.primarySoft }}>
        <View style={{ height: 6, backgroundColor: theme.colors.primary, width: `${recipeProgress * 100}%` }} />
      </View>
    </View>
  )
}

// 2. 純粋なタイマー数字
export const SimpleTimer = ({ timer, elapsed }: { timer: number, elapsed: number }) => {
  const remaining = timer - elapsed

  return (
    <View style={{ justifyContent: 'center', alignItems: 'center', minHeight: 100, paddingVertical: 8 }}>
      <Text 
        adjustsFontSizeToFit 
        numberOfLines={1} 
        style={{ fontSize: 120, color: theme.colors.primary, fontWeight: '800', textAlign: 'center' }}
      >
        {formatTimer(remaining)}
      </Text>
    </View>
  )
}

export const CookingScreen = ({ navigation, route }: Props) => {
  if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true)
  }
  const { recipeId } = route.params

  const [phase, setPhase] = useState(0)
  const [recipe, setRecipe] = useState<Recipe>()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [prepSteps, setPrepSteps] = useState<Step[]>([])
  const [cookSteps, setCookSteps] = useState<Step[]>([])

  const [phasePreps, setPhasePreps] = useState(0)
  const [phaseCooks, setPhaseCooks] = useState(0)

  const [currentServings, setCurrentServings] = useState(recipe?.servings ?? 2)

  // アコーディオンメモ用のState
  const [isIngredientsExpanded, setIsIngredientsExpanded] = useState(false)
  const [contentHeight, setContentHeight] = useState(200)

  // 人数・個数倍率
  const ratio = currentServings / (recipe?.servings ?? 2)
  const ratioIngredients = ingredients.map(item => ({
    ...item,
    num: (item?.num ?? 0)* ratio
  }))

  // タイマー関連
  const [isPaused, setIsPaused] = useState(true)
  const [isFinish, setIsFinish] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  // アコーディオンのアニメーション設定
  const ingredientsAnim = useRef(new Animated.Value(0)).current

  const loadRecipes = async () => {
    try {
      const data = await getRecipe(recipeId)
      const ingData = await getIngredients(recipeId)
      const stepData = await getSteps(recipeId)

      setRecipe(data)
      setIngredients(ingData)
      setPrepSteps(stepData.prepSteps)
      setCookSteps(stepData.cookSteps)
    } catch (error) {
      console.error('データロードエラー：', error)
    }
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        if (phase === 1 || phase === 2) {
          return (
            <TouchableOpacity 
              style={{ marginRight: 10 }} 
              onPress={() => setIsIngredientsExpanded(prev => !prev)}
            >
              <Icon name="notebook-outline" size={28} color={theme.colors.primary} />
            </TouchableOpacity>
          )
        }
        return null
      },
    })
  }, [navigation, phase])

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

  const startTimerAlarm = () => {
    const PATTERN = [0, 400, 200, 400, 600]
    Vibration.vibrate(PATTERN, true)
  }

  // タイマー終了チェック
  useEffect(() => {
    if (isFinish) return
    const currentStep = phase === 1 ? prepSteps[phasePreps] : cookSteps[phaseCooks]

    if (currentStep?.timer && elapsed >= currentStep.timer + 1){
      setIsFinish(true)
      startTimerAlarm()
    }
  }, [elapsed, isFinish])

  useEffect(() => {
    return () => {
      Vibration.cancel()
    }
  }, [])

  // タイマーリセット
  useEffect(() => {
    setIsPaused(true)
    setIsFinish(false)
    setElapsed(0)
    Vibration.cancel()
    
    const currentStep = phase === 1 ? prepSteps[phasePreps] : cookSteps[phaseCooks]
  }, [phase, phasePreps, phaseCooks])

  // メモを開閉させるアニメーション
  useEffect(() => {
    Animated.timing(ingredientsAnim, {
      toValue: isIngredientsExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start(({ finished }) => {
      // 💡 追加：閉じるアニメーションが「完全に終わったら」、高さを0にする！
      if (finished && !isIngredientsExpanded) {
        setContentHeight(0)
      }
    })
  }, [isIngredientsExpanded])

  const isRunning = !isPaused && !isFinish
  useEffect(() => {
    if (isRunning) activateKeepAwake()
    else deactivateKeepAwake()

    return () => deactivateKeepAwake()
  }, [isRunning])

  // ボタン移動ロジック
  const moveButton = (direction: 'prev' | 'next') => {
    Vibration.cancel()
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
        if (prepSteps.length > 0) {
          setPhase(1)
        } else if (cookSteps.length > 0) {
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
  const hasTimer = Boolean((phase === 1 ? prepSteps[phasePreps] : cookSteps[phaseCooks])?.timer)

  // メモの高さ計算用補間
  const ingredientsHeight = ingredientsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLLAPSED_INGREDIENTS_HEIGHT, contentHeight + COLLAPSED_INGREDIENTS_HEIGHT],
  })

  return (
    <View style={commonStyles.screen}>
      <View style={commonStyles.decorTop} />
      {/* プログレスバー */}
      {(phase === 1 || phase === 2) && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          {/* 上のテキスト表示（今どっちをやってるか） */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: '700' }}>
              {phase === 1 ? '下準備の進み具合' : '調理の進み具合'}
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: '700' }}>
              {phase === 1 ? `${phasePreps + 1} / ${prepSteps.length}` : `${phaseCooks + 1} / ${cookSteps.length}`}
            </Text>
          </View>

          {/* バーを2つ横並びにする土台 */}
          <View style={{ flexDirection: 'row', gap: 6, height: 6 }}>
            
            {/* 左側：下準備のバー */}
            <View style={{ flex: 1, backgroundColor: theme.colors.primarySoft, borderRadius: 999, overflow: 'hidden' }}>
              <View style={{ 
                height: '100%', 
                backgroundColor: theme.colors.primary, 
                // 下準備中なら今の進捗、調理フェーズに入ってたら100%（満タン）
                width: phase === 1 ? `${((phasePreps + 1) / prepSteps.length) * 100}%` : '100%' 
              }} />
            </View>

            {/* 右側：調理のバー */}
            <View style={{ flex: 1, backgroundColor: theme.colors.primarySoft, borderRadius: 999, overflow: 'hidden' }}>
              <View style={{ 
                height: '100%', 
                backgroundColor: theme.colors.primary, 
                // 下準備中ならまだ0%、調理中なら今の進捗
                width: phase === 2 ? `${((phaseCooks + 1) / cookSteps.length) * 100}%` : '0%' 
              }} />
            </View>
          </View>
        </View>
      )}
      <View style={commonStyles.decorBottom} />
      
      <ScreenMotion key={`${phase}-${phasePreps}-${phaseCooks}`} style={[commonStyles.pageWrap, { paddingBottom: 100 }]} delay={40}>
        
        {/* phase 0: 材料調整 */}
        {phase === 0 && (
          <ScrollView contentContainerStyle={commonStyles.content}>
            <View style={commonStyles.card}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text style={commonStyles.sectionTitle}>材料</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <TouchableOpacity onPress={() => setCurrentServings(prev => prev + 1)}>
                    <Icon name='plus' size={30} />
                  </TouchableOpacity>

                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <TextInput
                      placeholder='量'
                      keyboardType='numeric'
                      value={String(currentServings)}
                      onChangeText={text => {
                        const n = Number(text.replace(/[^0-9]/g, ''))
                        if (Number.isFinite(n)) {
                          setCurrentServings(n)
                        }
                      }}
                      onBlur={() => {
                        setCurrentServings(prev => prev > 0 ? prev : 1)
                      }}
                    />
                    <Text>{recipe?.servingsUnit}</Text>
                  </View>

                  <TouchableOpacity onPress={() => setCurrentServings(prev => Math.max(prev - 1, 1))}>
                    <Icon name='minus' size={30} />
                  </TouchableOpacity>
                </View>
              </View>
              {ratioIngredients.map(ing => (
                <View key={ing.id} style={styles.ingredientRow}>
                  <Text style={commonStyles.bodyText}>{ing.name}</Text>
                  <Text style={styles.ingredientAmount}>{formatIngredient(ing.num, ing.unit)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* phase 1, 2: 調理中画面 */}
        {(phase === 1 || phase === 2) && (
          <View style={styles.phaseWrap}>
          {/* 💡 最終兵器：アニメーション中は表示し、完全に閉じきったら（高さ0になったら）要素ごと空間をゼロにする */}
          {(isIngredientsExpanded || contentHeight > 0) && (
            <Animated.View 
              style={[
                styles.ingredientsPanel, 
                { 
                  height: ingredientsHeight,
                  // 💡 開いている時だけ枠線と下のマージンをつける
                  borderWidth: isIngredientsExpanded ? 1 : 0,
                  marginBottom: isIngredientsExpanded ? 8 : 0,
                  overflow: 'hidden',
                }
              ]}
            > 
              <ScrollView 
                style={styles.ingredientsScroll}
                scrollEnabled={isIngredientsExpanded}
                showsVerticalScrollIndicator={false}
              >
                <View 
                  style={styles.ingredientsContent}
                  onLayout={(e) => {
                    const { height } = e.nativeEvent.layout
                    if (isIngredientsExpanded && height > 0) {
                      setContentHeight(Math.min(height, 250))
                    }
                  }}
                >
                  {ratioIngredients.map(ing => (
                    <View key={ing.id} style={styles.ingredientRowPanel}>
                      <Text style={commonStyles.bodyText}>{ing.name}</Text>
                      <Text style={styles.ingredientAmount}>{formatIngredient(ing.num, ing.unit)}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </Animated.View>
          )}


            {/* 調理手順テキスト表示 */}
            <ScrollView 
              style={styles.phaseContent} 
              contentContainerStyle={commonStyles.content}
            >
              <View style={commonStyles.card}>
                <Text style={[commonStyles.sectionTitle, styles.phaseTitle]}>
                  {phase === 1 ? '下準備' : '調理'} {(phase === 1 ? prepSteps[phasePreps] : cookSteps[phaseCooks])?.stepOrder + 1}
                </Text>
                <Text style={styles.stepText}>
                  {(phase === 1 ? prepSteps[phasePreps] : cookSteps[phaseCooks])?.text}
                </Text>
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>

            {/* 現在のフェーズに応じたステップ情報をTimerDisplayに渡す */}
            {(phase === 1 ? prepSteps[phasePreps] : cookSteps[phaseCooks])?.timer ? (
              <View style={styles.timerArea}>
                <SimpleTimer
                  timer={(phase === 1 ? prepSteps[phasePreps] : cookSteps[phaseCooks]).timer!} 
                  elapsed={elapsed} 
                />
              </View>
            ) : null}
          </View>
        )}

        {/* phase 3: 完成 */}
        {phase === 3 && (
          <View style={[commonStyles.content, styles.finishWrap]}>
            <View style={commonStyles.card}>
              <Text style={styles.finishText}>完成!!</Text>
              <Text style={styles.recipeName}>{recipe?.dishName}</Text>
            </View>
          </View>
        )}
      </ScreenMotion>

      {/* ボトムバー */}
      <View style={commonStyles.bottomBar}>
        <View style={styles.edgeArea}>
          {phase !== 0 && (
            <TouchableOpacity style={styles.actionInline} onPress={() => moveButton('prev')}>
              <Icon name="chevron-left" size={30} color={theme.colors.primary} />
              <Text style={styles.actionText}>戻る</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 中央エリアの出し分け */}
        {phase === 0 ? (
          <TouchableOpacity style={[commonStyles.primaryButton, styles.centerButton]} onPress={() => moveButton('next')}>
            <Text style={commonStyles.primaryButtonText}>準備完了</Text>
          </TouchableOpacity>
        ) : phase === 3 ? (
          <TouchableOpacity style={[commonStyles.primaryButton, styles.centerButton]} onPress={() => navigation.popToTop()}>
            <Text style={commonStyles.primaryButtonText}>ホームに戻る</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.edgeArea}>
            {isFinish ? (
              <TouchableOpacity style={commonStyles.primaryButton} onPress={() => moveButton('next')}>
                <Icon name="bell-off" size={24} color={'#FFF'} />
                <Text style={commonStyles.primaryButtonText}>止めて次へ</Text>
              </TouchableOpacity>
            ) : hasTimer ? (
              <TouchableOpacity style={commonStyles.primaryButton} onPress={() => setIsPaused(!isPaused)}>
                <Icon name={isPaused ? "play" : "pause"} size={30} color={'#FFF'} />
              </TouchableOpacity>
            ) : (
              <View />
            )}
          </View>
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
  phaseWrap: {
    flex: 1,
  },
  phaseContent: {
    flex: 1,
  },
  phaseTitle: {
    textAlign: 'center',
    color: theme.colors.primary,
  },
  timerTextWrap: {
    alignItems: 'center',
  },
  timerText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 999,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  timerWrap: {
    height: 80,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  ingredientsPanel: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderColor: theme.colors.border,
    overflow: 'hidden', // 必須
  },
  ingredientsToggle: {
    height: COLLAPSED_INGREDIENTS_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  ingredientsToggleText: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 15,
  },
  ingredientsScroll: {
    flex: 1,
  },
  ingredientsContent: {
    padding: 14,
    gap: 4,
  },
  ingredientRowPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '44',
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  ingredientAmount: {
    fontSize: 16,
    color: theme.colors.accent,
    fontWeight: '800',
  },
  stepText: {
    fontSize: 28,
    lineHeight: 40,
    color: theme.colors.text,
    fontWeight: '800',
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
    fontSize: 20,
    color: theme.colors.text,
    textAlign: 'center',
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
    gap: 6,
  },
  actionText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  centerButton: {
    flex: 1.5,
  },
  progressBackground: {
    height: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
  },
  progressFill: {
    height: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
  },
  timerArea: {
    backgroundColor: '#FFF5EA',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '66',
    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
  }
})

export default CookingScreen