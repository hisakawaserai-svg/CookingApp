import React, { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { Tag } from "../../types/recipe"
import { getTags } from "../../database/recipeRepository"
import { TagCreate } from "./TagCreate"
import { theme } from "../../styles/theme"
import { commonStyles } from "../../styles/common"

type Props = {
    selectedTags: Tag[]
    setSelectedTags: React.Dispatch<React.SetStateAction<Tag[]>>
}
  
export const TagSelector = ({ selectedTags, setSelectedTags }: Props) => {
    const [allTags, setAllTags] = useState<Tag[]>([])
    const [showTagCreator, setShowTagCreator] = useState(false)
    
    // 【ここを追加】「もっと見る」の開閉状態（初期値は閉じている状態）
    const [isExpanded, setIsExpanded] = useState(false)
    
    // 最初に見せるタグの個数（例：8個。2行分くらいに収まる数）
    const INITIAL_DISPLAY_COUNT = 8

    const loadTags = async () => {
        try {
            const tags = await getTags()
            setAllTags(Array.isArray(tags) ? tags : [])
        } catch (error) {
            console.error('タグ取得エラー', error)
            setAllTags([])
        }
    }

    useEffect(() => {
        loadTags()
    }, [])
  
    const toggleTag = (tag: Tag) => {
        const isSelected = selectedTags.some(t => t.id === tag.id)
        if (isSelected) {
          setSelectedTags(prev => prev.filter(t => t.id !== tag.id))
        } else {
          setSelectedTags(prev => [...prev, tag])
        }
    }

    // 【ここを追加】今表示すべきタグの配列を決定する
    // 開いている時はすべて(allTags)、閉じている時は最初の数個だけ切り出す(slice)
    const displayedTags = isExpanded ? allTags : allTags.slice(0, INITIAL_DISPLAY_COUNT)

    return(
      <View style={styles.sectionBlock}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>タグ</Text>
          <TouchableOpacity style={[commonStyles.primaryButton, styles.tagAddButton]} onPress={() => setShowTagCreator(true)}>
              <Icon name="tag-plus-outline" size={18} color="#fff" />
              <Text style={commonStyles.primaryButtonText}>新規タグ</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.wrapper}>
          {allTags.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>タグがありません。「新規タグ」から作成できます。</Text>
            </View>
          ) : (
            <View style={styles.containerWithFooter}>
              {/* 表示件数を絞ったタグのリスト */}
              <View style={styles.tagListContent}>
                {displayedTags.map(tag => {
                  const isSelected = selectedTags.some(t => t.id === tag.id)
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[styles.tagChip, isSelected && styles.selectedTagChip]}
                      onPress={() => toggleTag(tag)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.colorDot, { backgroundColor: tag.tagColor }]} />
                      <Text style={[styles.tagText, isSelected && styles.selectedTagText]}>{tag.name}</Text>
                      <Icon
                        name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                        size={16}
                        color={isSelected ? theme.colors.primary : theme.colors.mutedText}
                      />
                    </TouchableOpacity>
                  )
                })}
              </View>

              {/* 【ここを追加】タグの総数が制限数より多いときだけ「もっと見る」ボタンを出す */}
              {allTags.length > INITIAL_DISPLAY_COUNT && (
                <TouchableOpacity 
                  style={styles.expandButton} 
                  onPress={() => setIsExpanded(!isExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.expandButtonText}>
                    {isExpanded ? '閉じる' : `もっと見る (${allTags.length - INITIAL_DISPLAY_COUNT}個のタグ)`}
                  </Text>
                  <Icon 
                    name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                    size={16} 
                    color={theme.colors.primary} 
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <TagCreate
          showTagCreator={showTagCreator}
          setShowTagCreator={setShowTagCreator}
          reloadTags={loadTags}
          mode={'create'}
          isEditingTag={null}
        />
      </View>
    )
}

const styles = StyleSheet.create({
    sectionBlock: {
        marginBottom: theme.spacing.sm,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xs,
    },
    title: {
        color: theme.colors.primary,
        fontWeight: '800',
        fontSize: 16,
    },
    wrapper: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceSoft,
        padding: theme.spacing.sm,

        width: '100%',
        alignSelf: 'stretch',
    },
    tagListContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    emptyWrap: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
        borderRadius: theme.radius.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        width: '100%',
        justifyContent: 'center',
        minHeight: 72,
    },
    emptyText: {
        color: theme.colors.mutedText,
        lineHeight: 20,
    },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    selectedTagChip: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primarySoft,
    },
    colorDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    tagText: {
        color: theme.colors.text,
        fontWeight: '700',
        fontSize: 13,
    },
    selectedTagText: {
        color: theme.colors.primary,
    },
    tagAddButton: {
        minHeight: 36,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    containerWithFooter: {
        width: '100%',
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: theme.spacing.sm,
        paddingTop: theme.spacing.xs,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border, // 区切り線を入れてスッキリ見せる
        width: '100%',
    },
    expandButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.primary,
    }
})
