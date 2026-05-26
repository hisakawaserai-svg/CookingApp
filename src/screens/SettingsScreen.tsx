import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { commonStyles } from "../styles/common"
import { theme } from "../styles/theme"

type Props = {
    navigation: NativeStackNavigationProp<any>
}

export const SettingsScreen = ({ navigation }: Props) => {

    return(
        <View style={commonStyles.screen}>
            <View style={commonStyles.decorTop} />
            <View style={commonStyles.decorBottom} />

            <View style={styles.wrapper}>
                <Text style={styles.title}>設定</Text>

                <TouchableOpacity style={[commonStyles.card, styles.menuRow]} onPress={() => navigation.navigate('TagSetting')}>
                    <View style={styles.menuLeft}>
                        <View style={styles.iconWrap}>
                            <Icon name="tag-multiple-outline" size={20} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.menuLabel}>タグ管理</Text>
                    </View>
                    <Icon name="chevron-right" size={24} color={theme.colors.mutedText} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        padding: theme.spacing.md,
        paddingTop: theme.spacing.lg,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primarySoft,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    menuLabel: {
        color: theme.colors.text,
        fontWeight: '700',
        fontSize: 16,
    },
})

export default SettingsScreen
