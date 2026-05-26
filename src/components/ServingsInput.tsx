import { useState } from 'react'
import { View, Text, TextInput, StyleSheet } from 'react-native'

import { Picker } from '@react-native-picker/picker'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { commonStyles } from '../styles/common'
import { theme } from '../styles/theme'
import { ServingsUnit } from '../types/recipe'

type Props = {
    servings: number
    setServings: React.Dispatch<React.SetStateAction<number>>
    servingsUnit: ServingsUnit
    setServingsUnit: React.Dispatch<React.SetStateAction<ServingsUnit>>
    customServingsUnit: string
    setCustomServingsUnit: React.Dispatch<React.SetStateAction<string>>
}

export const ServingsInput = ({
    servings, 
    setServings, 
    servingsUnit, 
    setServingsUnit, 
    customServingsUnit, 
    setCustomServingsUnit 
}: Props) => {
    const [servingsInput, setServingsInput] = useState(String(servings))

    return(
        <View style={styles.wrapper}>
            <View style={[{alignItems: 'center'}, commonStyles.bottomBorder]}>
                <Text style={styles.indexText}>基準</Text>
            </View>
            
            {/* 数量入力 */}
            <View style={styles.metaRow}>
                <TextInput
                    style={[commonStyles.input, styles.amountInput]}
                    value={String(servings)}
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="decimal-pad"
                    onChangeText={text => {
                        const formatted = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
                        setServingsInput(formatted)
                    }}
                    onBlur={() => {
                        const n = Number(servingsInput)
                        setServings(Number.isFinite(n) && n > 0 ? n : 2)
                    }}
                />

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto'}}>
                    <View style={styles.unitBox}>
                        {servingsUnit === 'その他' ? (
                        <TextInput
                            style={[commonStyles.input, styles.amountInput]}
                            value={customServingsUnit ?? ''}
                            placeholder='単位'
                            onChangeText={setCustomServingsUnit}
                            />
                        ) : (
                            <Text style={styles.unitText}>{servingsUnit}</Text>
                        )}
                    </View>

                    <View style={styles.iconPickerWrap}>
                        <Picker
                        selectedValue={servingsUnit}
                        onValueChange={value => setServingsUnit(value)}
                        style={styles.hiddenPicker}
                        >
                            <Picker.Item label="人前" value="人前" />
                            <Picker.Item label="個分" value="個分" />
                            <Picker.Item label="台分" value="台分" />
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
    )
}

const styles = StyleSheet.create({
    amountInput: {
        width: 90,
        height: 48,
        textAlign: 'center',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
        gap: 8,
    },
    unitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
    },
    wrapper: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    hiddenPicker: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0,
    },
    iconPickerWrap: {
        width: 40,
        height: 40,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    indexText: {
        color: theme.colors.primary,
        fontWeight: '800',
        fontSize: 13,
    },
})

export default ServingsInput