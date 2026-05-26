import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, TextInput, ScrollView, Vibration, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native'

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

type Props = {
  navigation: NativeStackNavigationProp<any>
  route: RouteProp<{ Cooking: { recipeId: string } }, 'Cooking'>
}

// カウントダウン
export const TimerDisplay = ({ timer, elapsed}: { timer: number, elapsed: number }) => {
  const remaining = timer - elapsed
  const progress = Math.min(Math.max(elapsed / timer, 0), 1)

  console.log('remaining:', remaining, 'progress:', progress)
  
  return (
    <View style={{padding: 16, gap: 8, minHeight: 120 }}>
      {/* プログレスバー */}
      <View style={{ height: 10, borderRadius: 999, backgroundColor: theme.colors.primarySoft }}>
        <View style={{ height: 10, borderRadius: 999, backgroundColor: theme.colors.primary, width: `${progress * 100}%` }} />
      </View>
      {/* 数字 */}
      <View style={{justifyContent: 'flex-start', alignItems: 'center' ,paddingTop: 8 }}>
        <Text adjustsFontSizeToFit numberOfLines={1} style={{ fontSize: 120, color: theme.colors.primary, fontWeight: '800', textAlign: 'center' }}>
          {formatTimer(remaining)}
        </Text>
      </View>
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

  const [ currentServings, setCurrentServings] = useState(recipe?.servings ?? 2)
  // 人数・個数倍率
  const ratio = currentServings / (recipe?.servings ?? 2)
  const ratioIngredients = ingredients.map(item => ({
    ...item,
    num: (item?.num ?? 0)* ratio
  }))

  // タイマー
  const [isPaused, setIsPaused] = useState(true)
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

  const startTimerAlarm = () => {
    // パターン：[待機, 振動, 待機, 振動, ...] （ミリ秒単位）
    const PATTERN = [
      0,   // すぐに開始
      400, // ブッ（0.4秒）
      200, // 待機（0.2秒）
      400, // ブッ（0.4秒）
      600, // 少し長めの待機（0.6秒）
    ]
  
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

  // コンポーネントが消える時にバイブを絶対に止める「保険」
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
  }, [phase, phasePreps, phaseCooks])

  // isPaused と isFinishでもなければ画面が消えないようにする
  const isRunning = !isPaused && !isFinish
  useEffect(() => {
    if (isRunning) activateKeepAwake()
    else deactivateKeepAwake()

    return () => deactivateKeepAwake()
  }, [isRunning])

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

  return (
    <View style={commonStyles.screen}>
      <View style={commonStyles.decorTop} />
        <View style={commonStyles.decorBottom} />
          <ScreenMotion key={`${phase}-${phasePreps}-${phaseCooks}`} style={[commonStyles.pageWrap, { paddingBottom: 100 }]} delay={40}>
        {phase === 0 && (
          <ScrollView contentContainerStyle={commonStyles.content}>
            {/* 材料表示 */}
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

                  <TouchableOpacity onPress={() => setCurrentServings(prev => Math.max(prev - 1, 0))}>
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

        {(phase === 1 || phase === 2) && (
          <View style={styles.phaseWrap}>
            {/* 1. スクロールエリア (テキスト) */}
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
              {/* テキストが短い場合でも、タイマーとの間に余白を作るためのスペーサー（任意） */}
              <View style={{ height: 20 }} />
            </ScrollView>

            {/* 2. タイマー固定エリア */}
            {(phase === 1 ? prepSteps[phasePreps] : cookSteps[phaseCooks])?.timer ? (
              <View style={styles.timerArea}>
                <TimerDisplay 
                  timer={(phase === 1 ? prepSteps[phasePreps] : cookSteps[phaseCooks]).timer!} 
                  elapsed={elapsed} 
                />
              </View>
            ) : null}
          </View>
        )}

        {phase === 3 && (
          <View style={[commonStyles.content, styles.finishWrap]}>
            {/* 完成表示 */}
            <View style={commonStyles.card}>
              <Text style={styles.finishText}>完成!!</Text>
              <Text style={styles.recipeName}>{recipe?.dishName}</Text>
            </View>
          </View>
        )}
      </ScreenMotion>

      <View style={commonStyles.bottomBar}>
        <View style={styles.edgeArea}>
          {phase !== 0 && (
            <TouchableOpacity style={styles.actionInline} onPress={() => moveButton('prev')}>
              <Icon name="chevron-left" size={30} color={theme.colors.primary} />
              <Text style={styles.actionText}>戻る</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 中央エリア：初期状態・終了状態・タイマー操作の出し分け */}
        {phase === 0 ? (
          <TouchableOpacity style={[commonStyles.primaryButton, styles.centerButton]} onPress={() => setPhase(2)}>
            <Text style={commonStyles.primaryButtonText}>準備完了</Text>
          </TouchableOpacity>
        ) : phase === 3 ? (
          <TouchableOpacity style={[commonStyles.primaryButton, styles.centerButton]} onPress={() => navigation.popToTop()}>
            <Text style={commonStyles.primaryButtonText}>ホームに戻る</Text>
          </TouchableOpacity>
        ) : (
          /* 調理中（phase 1, 2）の中央ボタン管理 */
          <View style={styles.edgeArea}>
            {isFinish ? (
              // タイマーが鳴り終わったら、最優先で「アラームを止めて次へ進む」デカボタンを出す
              <TouchableOpacity style={commonStyles.primaryButton} onPress={() => moveButton('next')}>
                <Icon name="bell-off" size={24} color={'#FFF'} />
                <Text style={commonStyles.primaryButtonText}>止めて次へ</Text>
              </TouchableOpacity>
            ) : hasTimer ? (
              // タイマーがあるステップの時だけ、再生・一時停止ボタンを出す
              <TouchableOpacity style={commonStyles.primaryButton} onPress={() => setIsPaused(!isPaused)}>
                <Icon name={isPaused ? "play" : "pause"} size={30} color={'#FFF'} />
              </TouchableOpacity>
            ) : (
              // タイマーがないステップなら、中央はスッキリ何も出さない
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
