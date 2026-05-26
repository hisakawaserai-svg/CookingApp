import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import DraggableFlatList from 'react-native-draggable-flatlist'
import { Step } from '../types/recipe'
import { StepRow } from './StepRow'
import { theme } from '../styles/theme'
import { commonStyles } from '../styles/common'

type StepsProps = {
  title: string
  steps: Step[]
  setEditingSteps: React.Dispatch<React.SetStateAction<Step[]>>
}

export const StepSection = ({ title, steps, setEditingSteps }: StepsProps) => {
  const [openId, setOpenId] = useState<string | null>(null)

  const addStep = () => {
    const isPrep = title === '下準備' || title === '前処理'
    setEditingSteps(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: isPrep ? 'prep' : 'cook',
        text: '',
        timer: 0,
        stepOrder: prev.length,
      },
    ])
  }

  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <Text style={styles.subTitle}>{title}</Text>
        <Text style={styles.counter}>{steps.length}件</Text>
      </View>

      {steps.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>まだ手順がありません。下のボタンから追加してください。</Text>
        </View>
      ) : (
        <View style={styles.listWrap}>
          <DraggableFlatList
            data={steps}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item, drag, getIndex }) => {
                const index = getIndex() ?? 0
                return(
                  <StepRow key={item.id} title={title} steps={steps} step={item} index={index} drag={drag} setSteps={setEditingSteps} openId={openId} setOpenId={setOpenId} />
                )
            }}
            onDragEnd={({ data }) => 
              setEditingSteps(data)
            }
          />
        </View>
      )}

      <TouchableOpacity style={[commonStyles.primaryButton, styles.addButton]} onPress={addStep} activeOpacity={0.85}>
        <Icon name="tray-plus" size={20} color="#fff" />
        <Text style={commonStyles.primaryButtonText}>{title}を追加</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  sectionBlock: {
    marginTop: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  subTitle: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: 0.2,
  },
  counter: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.mutedText,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  listWrap: {
    marginTop: theme.spacing.xs,
  },
  emptyWrap: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceSoft,
  },
  emptyText: {
    color: theme.colors.mutedText,
    fontSize: 13,
    lineHeight: 20,
  },
  addButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.accent,
  },
})

export default StepSection
