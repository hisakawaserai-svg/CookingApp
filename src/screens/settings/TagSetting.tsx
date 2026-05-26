import { useState, useEffect } from "react"
import { View, Text, ScrollView, Alert, TouchableOpacity, StyleSheet } from 'react-native'

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { getTags, deleteTag } from "../../database/recipeRepository"
import { Tag } from "../../types/recipe"
import { commonStyles } from "../../styles/common"
import { theme } from "../../styles/theme"
import { TagCreate } from "../../components/Tags/TagCreate"

export const TagSetting = () => {
    const [ allTags, setAllTags] = useState<Tag[]>([])
    const [ open, setOpen] = useState(false)

    const [ mode, setMode] = useState<'create' | 'edit'>('create')
    const [ isEditingTag, setIsEditingTag] = useState<Tag | null>(null)

    const loadTags = async () => {
        try {
            setAllTags(await getTags())
        } catch (error) {
            console.error('タグ取得エラー', error)
            throw error
        }
    }

    useEffect(() => {
        loadTags()
    }, [])

    // タグ削除
    const delTag = async (id: string) => {
        try {
            Alert.alert(
                '削除確認',
                '本当に削除しますか？',
                [
                    {
                        text: 'キャンセル',
                        style: 'cancel',
                    },
                    {
                        text: '削除',
                        style: 'destructive',
                        onPress: async () => {
                            await deleteTag(id)
                            await loadTags()
                        },
                    },
                ]
            )
        } catch (error) {
            console.error('タグ削除絵エラー', error)
            throw error
        }
    }

    return(
        <View style={commonStyles.screen}>
            <View style={commonStyles.decorTop} />
            <View style={commonStyles.decorBottom} />

            <View style={styles.wrapper}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>タグ管理</Text>
                    <TouchableOpacity style={[commonStyles.primaryButton, styles.addButton]} onPress={() => {
                        setMode('create')
                        setOpen(true)
                    }}>
                        <Icon name="tag-plus-outline" size={18} color="#fff" />
                        <Text style={commonStyles.primaryButtonText}>新規タグ</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.listContent}>
                    {allTags.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>タグがまだありません。右上の「新規タグ」から追加してください。</Text>
                        </View>
                    ) : allTags.map(item => (
                        <View key={item.id} style={[commonStyles.card, styles.tagCard]}>
                            <View style={styles.tagLeft}>
                                <View style={[styles.colorDot, { backgroundColor: item.tagColor }]} />
                                <Text style={styles.tagName}>{item.name}</Text>
                            </View>

                            <View style={styles.actions}>
                                <TouchableOpacity style={styles.iconButton} onPress={() => {
                                    setIsEditingTag(item)
                                    setMode('edit')
                                    setOpen(true)
                                }}>
                                    <Icon name="pencil-outline" size={18} color={theme.colors.primary} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.iconButton} onPress={() => delTag(item.id)}>
                                    <Icon name="trash-can-outline" size={18} color={theme.colors.accent}/>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>

            <TagCreate 
                showTagCreator={open} 
                setShowTagCreator={setOpen} 
                reloadTags={loadTags} 
                mode={mode} 
                isEditingTag={isEditingTag}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        padding: theme.spacing.md,
        paddingTop: theme.spacing.lg,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
        gap: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.text,
    },
    addButton: {
        minHeight: 40,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    listContent: {
        gap: theme.spacing.sm,
        paddingBottom: 120,
    },
    emptyCard: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceSoft,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.md,
    },
    emptyText: {
        color: theme.colors.mutedText,
        lineHeight: 20,
    },
    tagCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surface,
    },
    tagLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    tagName: {
        color: theme.colors.text,
        fontWeight: '700',
        fontSize: 15,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceSoft,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
})
