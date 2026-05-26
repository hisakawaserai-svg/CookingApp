import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Vibration, Alert, StyleSheet } from 'react-native'

import { Picker } from '@react-native-picker/picker'
import DraggableFlatList, { ScaleDecorator} from 'react-native-draggable-flatlist'
import 'react-native-get-random-values'
import { v4 as uuidv4 } from 'uuid'

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { Ingredient } from '../../types/recipe'
import { commonStyles } from '../../styles/common'
import { theme } from '../../styles/theme'
import { formatNumber } from '../../utils/format'

type Props = {
    ingredients: Ingredient[]
    setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>
}

export const IngredientsForm = ({ingredients, setIngredients}: Props) => {
    // 入力中のテキストをMapで管理（ingredientのidをキーに）
    const [numInputs, setNumInputs] = useState<Record<string, string>>({})

    // indexを更新
    const updateIngredient = (id: string, patch: Partial<Ingredient>) => {
        setIngredients(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)))
      }

    const parseAmount = (value: string) => {
        if (value.trim() === '') return null
        const normalized = formatNumber(value)
        if (!normalized) return null
        const n = Number(normalized)
        if (!Number.isFinite(n) || n < 0) return null
        return n
    }

    // ing材料追加
    const addIngredient = () => {
        setIngredients(prev => [
          ...prev,
          {
            id: uuidv4(),
            name: '',
            num: 0,
            unit: 'g',
            customUnit: '',
          }
        ])
      }
      
    // ing削除
    const removeIngredient = (id: string) => {
      setIngredients(prev =>
        prev.filter(item => item.id !== id)
      )
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
              onPress: () => removeIngredient(id),
            },
          ]
        )
      }

    return(
        <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
                <Text style={styles.subTitle}>材料</Text>
                <Text style={styles.counter}>{ingredients.length}件</Text>
            </View>

            {ingredients.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>まだ材料がありません。下のボタンから追加してください。</Text>
                </View>
            ) : (
                <View style={styles.listWrap}>
                    <DraggableFlatList
                    data={ingredients}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    renderItem={({ item, drag, getIndex }) => {
                        const index = getIndex() ?? 0
                        return(
                            <ScaleDecorator>
                                <View style={styles.wrapper}>
                                    {/* 上段 */}
                                    <View style={[{justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row'}, commonStyles.bottomBorder]}>
                                        <TouchableOpacity onLongPress={() => {
                                            Vibration.vibrate()
                                            drag()
                                        }}>
                                            <Icon name="menu" size={20} />
                                        </TouchableOpacity>
                                        
                                        <View>
                                            <Text style={styles.indexText}>材料：{index + 1}</Text>
                                        </View>

                                        <TouchableOpacity
                                            style={[ingredients.length < 2 && styles.disabledButton]}
                                            onPress={() => confirmDelete(item.id)}
                                            disabled={ingredients.length < 2}
                                            activeOpacity={0.8}
                                        >
                                            <Icon name='minus-circle' size={20} color="red" />
                                        </TouchableOpacity>
                                    </View>
                                    {/* 中段 */}
                                <TextInput
                                    style={[commonStyles.input, commonStyles.stepLikeInput, styles.ingredientNameInput]}
                                    placeholder="材料名"
                                    placeholderTextColor={theme.colors.mutedText}
                                    value={item.name}
                                    onChangeText={text => updateIngredient(item.id, { name: text })}
                                    multiline={true}
                                />
                                {/* 下段 */}
                                <View style={styles.metaRow}>
                                    <TextInput
                                        style={[commonStyles.input, styles.amountInput]}
                                        placeholder="量"
                                        placeholderTextColor={theme.colors.mutedText}
                                        keyboardType="decimal-pad"
                                        value={numInputs[item.id] ?? (item.num === null ? '' : String(item.num))}
                                        onChangeText={text => {
                                            setNumInputs(prev => ({ ...prev, [item.id]: formatNumber(text) }))
                                        }}
                                        onBlur={() => {
                                        updateIngredient(item.id, { num: parseAmount(numInputs[item.id] ?? '') })
                                        }}
                                    />
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto'}}>
                                        <View style={styles.unitBox}>
                                            {item.unit === 'その他' ? (
                                                <TextInput
                                                key={`input-${item.id}`}
                                                style={[commonStyles.input, styles.amountInput]}
                                                value={item.customUnit ?? ''}
                                                placeholder='単位'
                                                onChangeText={(text) =>
                                                    updateIngredient(item.id, { customUnit: text })
                                                }
                                                />
                                            ) : (
                                                <Text style={styles.unitText}>{item.unit}</Text>
                                            )}
                                        </View>

                                        <View style={styles.iconPickerWrap}>
                                        <Picker
                                            selectedValue={item.unit}
                                            onValueChange={value =>
                                            updateIngredient(item.id, { unit: value })
                                            }
                                            style={styles.hiddenPicker}
                                            >
                                            
                                            <Picker.Item label="g" value="g" />
                                            <Picker.Item label="ml" value="ml" />
                                            <Picker.Item label="個" value="個" />
                                            <Picker.Item label="小さじ" value="小さじ" />
                                            <Picker.Item label="中さじ" value="中さじ" />
                                            <Picker.Item label="大さじ" value="大さじ" />
                                            <Picker.Item label="少々" value="少々" />
                                            <Picker.Item label="適量" value="適量" />
                                            <Picker.Item label="その他" value="その他" />
                                        </Picker>

                                        <Icon
                                            name="chevron-down"
                                            size={20}
                                            color={theme.colors.text}
                                        />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </ScaleDecorator>
                    )}}
                    onDragEnd={({ data }) => {
                        setIngredients([...data])
                    }}
                    />
                </View>
            )}

            <TouchableOpacity style={[commonStyles.primaryButton, styles.addButton]} onPress={addIngredient} activeOpacity={0.85}>
                <Icon name="tray-plus" size={20} color="#fff" />
                <Text style={commonStyles.primaryButtonText}>材料を追加</Text>
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
    wrapper: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    indexBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primarySoft,
        marginTop: 8,
    },
    indexText: {
        color: theme.colors.primary,
        fontWeight: '800',
        fontSize: 13,
    },
    ingredientNameInput: {
        flex: 1,
    },
    removeButton: {
        backgroundColor: theme.colors.accent,
        borderRadius: theme.radius.pill,
        width: 42,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    disabledButton: {
        opacity: 0.4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
        gap: 8,
    },
    metaLabel: {
        color: theme.colors.mutedText,
        fontSize: 12,
        fontWeight: '700',
    },
    amountInput: {
        width: 90,
        height: 48,
        textAlign: 'center',
    },
    pickerWrap: {
        flex: 1,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.surfaceSoft,
        overflow: 'hidden',
    },
    picker: {
        color: theme.colors.text,
        minHeight: 48,
    },
    customUnitInput: {
        marginTop: theme.spacing.sm,
    },
    addButton: {
        alignSelf: 'flex-start',
        marginTop: theme.spacing.xs,
        backgroundColor: theme.colors.accent,
    },
    sectionHint: {
        color: theme.colors.mutedText,
        marginTop: theme.spacing.xs,
    },
    unitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      },
      
    iconPickerWrap: {
        width: 40,
        height: 48,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    
    hiddenPicker: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0,
    },
      
    unitText: {
        minWidth: 40,
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
      unitBox: {
        minWidth: 60,
        height: 48,
        justifyContent: 'center',
    }
})

export default IngredientsForm
