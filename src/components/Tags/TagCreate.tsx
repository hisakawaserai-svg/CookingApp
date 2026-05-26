import { useState, useEffect, useCallback } from "react"
import { View, Text, TouchableOpacity, TextInput, Alert, Modal, StyleSheet } from "react-native"

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { Tag } from "../../types/recipe"
import { createTag, updateTag } from "../../database/recipeRepository"
import { TagColorPicker } from "./TagColorPicker"
import { commonStyles } from "../../styles/common"
import { theme } from "../../styles/theme"

type Props = {
    showTagCreator: boolean
    setShowTagCreator: React.Dispatch<React.SetStateAction<boolean>>
    reloadTags: () => Promise<any>
    mode: 'create' | 'edit'
    isEditingTag: Tag | null
}

const MAX_TAG_NAME_LENGTH = 20

export const TagCreate = ({showTagCreator, setShowTagCreator, reloadTags, mode, isEditingTag}: Props) => {
    const [newTagName, setNewTagName] = useState('')
    const [newTagColor, setNewTagColor] = useState('#ffffff')

    // 初期値を代入
    useEffect(() => {
        if (!showTagCreator) return

        if (mode === 'edit' && isEditingTag) {
            setNewTagName(isEditingTag.name)
            setNewTagColor(isEditingTag.tagColor)
        }
    
        if (mode === 'create') {
            setNewTagName('')
            setNewTagColor('#ffffff')
        }
    }, [mode, isEditingTag, showTagCreator])

    const handleSelectColor = useCallback((nextColor: string) => {
        if (!nextColor) return
        setNewTagColor(prev => (prev.toLowerCase() === nextColor.toLowerCase() ? prev : nextColor))
    }, [])

    const handleChangeTagName = (value: string) => {
        if (value.length > MAX_TAG_NAME_LENGTH) {
            Alert.alert('入力エラー', `タグ名は${MAX_TAG_NAME_LENGTH}文字以内で入力してください。`)
            return
        }
        setNewTagName(value)
    }

    // タグ作成 | 追加
    const handleCreateTag = async () => {
        const normalizedName = newTagName.trim()

        if (!normalizedName) {
            Alert.alert('タグ名を入力してください')
            return
        }
        if (normalizedName.length > MAX_TAG_NAME_LENGTH) {
            Alert.alert('入力エラー', `タグ名は${MAX_TAG_NAME_LENGTH}文字以内で入力してください。`)
            return
        }

        try {
            if (mode === 'create') {
                await createTag(normalizedName, newTagColor)
            } else {
                if (!isEditingTag) return
            
                await updateTag({
                    ...isEditingTag,
                    name: normalizedName,
                    tagColor: newTagColor,
                })
            }
            await reloadTags()

            setNewTagName('')
            setNewTagColor('#ffffff')
            setShowTagCreator(false)
        } catch (error) {
            if (mode === 'create') {
                console.error('タグ作成エラー：', error)
            } else {
                console.error('タグ更新エラー：', error)
            }
            throw error
        }
    }

    return(
        <Modal
            visible={showTagCreator}
            transparent
            animationType="slide"
            onRequestClose={() => setShowTagCreator(false)}
        >
            <View style={styles.backdrop}>
                <View style={[commonStyles.card, styles.modalCard]}>
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>{mode === 'create' ? "タグ追加" : "タグ編集"}</Text>
                        <TouchableOpacity style={styles.closeIcon} onPress={() => setShowTagCreator(false)}>
                            <Icon name="close" size={20} color={theme.colors.mutedText} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>タグ名</Text>
                    <TextInput 
                        style={[commonStyles.input, styles.nameInput]}
                        placeholder="タグ名を入力"
                        placeholderTextColor={theme.colors.mutedText}
                        value={newTagName}
                        onChangeText={handleChangeTagName}
                    />
                    <Text style={styles.countText}>{newTagName.length}/{MAX_TAG_NAME_LENGTH}</Text>

                    <Text style={styles.label}>タグカラー</Text>
                    <View style={styles.colorPreviewRow}>
                        <View style={[styles.colorPreview, { backgroundColor: newTagColor }]} />
                        <Text style={styles.hexText}>{newTagColor.toUpperCase()}</Text>
                    </View>

                    <View style={styles.pickerWrap}>
                        <TagColorPicker
                            color={newTagColor}
                            onSelect={handleSelectColor}
                        />
                    </View>

                    <View style={styles.footerRow}>
                        <TouchableOpacity style={[commonStyles.secondaryButton, styles.footerButton]} onPress={() => setShowTagCreator(false)}>
                            <Text style={commonStyles.secondaryButtonText}>閉じる</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[commonStyles.primaryButton, styles.footerButton]} onPress={handleCreateTag}>
                            <Icon name={mode === 'create' ? 'tag-plus-outline' : 'content-save-outline'} size={18} color="#fff" />
                            <Text style={commonStyles.primaryButtonText}>{mode === 'create' ? '作成' : '保存'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(37, 24, 15, 0.38)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    modalCard: {
        width: '100%',
        maxWidth: 520,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.text,
    },
    closeIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceSoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        color: theme.colors.primary,
        fontWeight: '700',
        marginBottom: 6,
        marginTop: 4,
    },
    nameInput: {
        marginBottom: theme.spacing.xs,
    },
    countText: {
        color: theme.colors.mutedText,
        fontSize: 12,
        textAlign: 'right',
        marginBottom: theme.spacing.sm,
    },
    colorPreviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: theme.spacing.sm,
    },
    colorPreview: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: theme.colors.border,
    },
    hexText: {
        color: theme.colors.mutedText,
        fontWeight: '700',
    },
    pickerWrap: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceSoft,
        padding: theme.spacing.sm,
    },
    footerRow: {
        marginTop: theme.spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    footerButton: {
        flex: 1,
    },
})
