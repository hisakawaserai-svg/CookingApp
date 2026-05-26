import React, { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { LogBox } from 'react-native'

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { initDB } from './src/database/db'
import { HomeScreen } from './src/screens/HomeScreen'
import { DetailScreen } from './src/screens/DetailScreen'
import { CookingScreen } from './src/screens/CookingScreen'
import { SettingsScreen } from './src/screens/SettingsScreen'
import { theme } from './src/styles/theme'
import AddRecipeTopTab from './src/Stack/AddRecipeTopTab'
import { ActivityIndicator, TouchableOpacity, View, StyleSheet } from 'react-native'
import { TagSetting } from './src/screens/settings/TagSetting'

const Stack = createNativeStackNavigator()
LogBox.ignoreAllLogs()

function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  )
}

function AppContent() {
  const [isIconReady, setIsIconReady] = useState(false)

  useEffect(() => {
    initDB()

    const prepareIcons = async () => {
      try {
        await Icon.loadFont()
        await Promise.all([
          Icon.getImageSource('cog-outline', 30, theme.colors.primary),
          Icon.getImageSource('trash-can-outline', 30, 'red'),
          Icon.getImageSource('pencil-plus-outline', 20, '#FFF'),
          Icon.getImageSource('chef-hat', 22, theme.colors.accent),
        ])
      } catch (error) {
        console.error('Icon preload error', error)
      } finally {
        setIsIconReady(true)
      }
    }

    prepareIcons()
  }, [])

  if (!isIconReady) {
    return (
      <View style={styles.bootSplash}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: '800'},
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={({ navigation }) => ({
            title: 'レシピ一覧',
            headerRight: () => (
              <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.navigate('Settings')}>
                <Icon name='cog-outline' size={30} color={theme.colors.primary}></Icon>
              </TouchableOpacity>
            )
          })} 
          />
        <Stack.Screen name="AddRecipe" component={AddRecipeTopTab} options={{ title: 'レシピ追加' }} />
        <Stack.Screen name="Detail" component={DetailScreen as any} options={{ title: '詳細編集' }} />
        <Stack.Screen name="Cooking" component={CookingScreen as any} options={{ title: '調理モード' }} />

        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '設定' }} />
        <Stack.Screen name="TagSetting" component={TagSetting} options={{ title: 'タグ管理'}} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  bootSplash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default App
