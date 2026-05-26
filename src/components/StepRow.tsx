import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal, Vibration, Alert, StyleSheet } from 'react-native'

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { ScaleDecorator } from 'react-native-draggable-flatlist'
import  WheelPicker from 'react-native-wheely'

import { Step } from '../types/recipe'
import { commonStyles } from '../styles/common'
import { theme } from '../styles/theme'

type StepProps = {
  title: string
  steps: Step[]
  step: Step
  index: number
  drag: () => void
  setSteps: React.Dispatch<React.SetStateAction<Step[]>>
  openId: string | null
  setOpenId: React.Dispatch<React.SetStateAction<string | null>>
}

export const StepRow = ({ title, steps, step, index, drag, setSteps, openId, setOpenId }: StepProps) => {
  // ステップ（prepStep | cookStep）削除
  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(item => item.id !== id))
  }
  const confirmDelete = (id: string) => {
    Alert.alert(
      '削除確認',
      'この手順を削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => removeStep(id),
        },
      ]
    )
  }

  const totalSeconds = step.timer ?? 0
  const minuteValue = Math.min(Math.floor(totalSeconds / 60), 59)
  const secondValue = Math.min(totalSeconds % 60, 59)

  const isRemoveDisabled = title === '調理手順' && steps.length < 2

  // タイマーホイールの中身
  const timeOptions = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, '0')
  )

  const [pickerOpen, setPickerOpen] = useState(false)
  const [tempMinute, setTempMinute] = useState(minuteValue)
  const [tempSecond, setTempSecond] = useState(secondValue)

  const openPicker = () => {
    console.log({
      minuteValue,
      secondValue,
      tempMinute,
      tempSecond,
    })

    setTempMinute(minuteValue)
    setTempSecond(secondValue)
    setPickerOpen(true)
  }
  const applyTime = () => {
    setSteps(prev =>
      prev.map((item, i) => {
        if (i !== index) return item
        return {
          ...item,
          timer: tempMinute * 60 + tempSecond
        }
      })
    )
    setPickerOpen(false)
  }

  return (
    <ScaleDecorator>
      <View style={styles.wrapper}>
        {/* 上段　メニューボタン・インデックス・削除ボタン */}
          <View style={[styles.itemHeader, commonStyles.bottomBorder]}>
            <TouchableOpacity onLongPress={() => {
              Vibration.vibrate()
              drag()
              }}>
                <Icon name={openId === step.id ? 'menu-open' : 'menu'} size={20} />
            </TouchableOpacity>
            
            <View>
                <Text style={styles.indexText}>{title}：{index + 1}</Text>
            </View>

          <TouchableOpacity
            style={isRemoveDisabled && styles.disabledButton}
            onPress={() => confirmDelete(step.id)}
            disabled={isRemoveDisabled}
            activeOpacity={0.8}
          >
            <Icon name="minus-circle" size={20} color="red" />
          </TouchableOpacity>
        </View>

        {/* 中段　text入力 */}
        <TextInput
            style={[commonStyles.input, commonStyles.stepLikeInput, styles.stepInput]}
            value={step.text}
            onChangeText={text => setSteps(prev => prev.map((item, i) => (i === index ? { ...item, text } : item)))}
            placeholder="手順を入力"
            placeholderTextColor={theme.colors.mutedText}
            multiline={true}
          />

        {/* 下段　タイマー */}
        <View style={styles.timerBarRow}>
          <TouchableOpacity 
            style={[styles.timerButton, totalSeconds > 0 && styles.timerButtonActive]} 
            onPress={openPicker}
            activeOpacity={0.7}
          >
            <Icon 
              name={totalSeconds > 0 ? "clock" : "clock-outline"} 
              size={18} 
              color={totalSeconds > 0 ? theme.colors.primary : theme.colors.mutedText} 
            />
            <Text style={[styles.timerButtonText, totalSeconds > 0 && styles.timerButtonTextActive]}>
              {totalSeconds > 0 ? `タイマー：${minuteValue}分 ${secondValue}秒` : 'タイマーを設定'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ホイールピッカーのモーダル */}
        <Modal visible={pickerOpen} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>タイマー設定</Text>

              <View style={styles.pickerContainer}>
                <WheelPicker
                  options={timeOptions}
                  selectedIndex={tempMinute}
                  onChange={(index) => setTempMinute(index)}
                  itemTextStyle={{ color: 'black', fontSize: 24 }}
                />
                <Text style={styles.unitLabel}>分</Text>

                <WheelPicker
                  options={timeOptions}
                  selectedIndex={tempSecond}
                  onChange={(index) => setTempSecond(index)}
                  itemTextStyle={{ color: 'black', fontSize: 24 }}
                />
                <Text style={styles.unitLabel}>秒</Text>
              </View>
              
              <View style={styles.modalActionRow}>
                <TouchableOpacity style={[styles.modalButton, styles.submitButton]} onPress={applyTime}>
                  <Text style={styles.submitButtonText}>決定</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setPickerOpen(false)}>
                  <Text style={styles.cancelButtonText}>キャンセル</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScaleDecorator>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  itemHeader: {
    justifyContent: 'space-between', 
    alignItems: 'center', 
    flexDirection: 'row',
    paddingBottom: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  indexText: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  stepInput: {
    flex: 1,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  disabledButton: {
    opacity: 0.4,
  },
  
  // タイマー表示行のスタイル
  timerBarRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.xs,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timerButtonActive: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  timerButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.mutedText,
  },
  timerButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },

  // モーダル周りのリデザイン
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', 
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    width: '100%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  unitLabel: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    color: theme.colors.mutedText,
    fontWeight: '700',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '800',
  }
})

export default StepRow
