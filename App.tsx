import React, { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { initDB } from './src/database/db'
import { HomeScreen } from './src/screens/HomeScreen'
import { AddRecipeScreen } from './src/screens/AddRecipeScreen'
import { DetailScreen } from './src/screens/DetailScreen'
import { CookingScreen } from './src/screens/CookingScreen'
import { theme } from './src/styles/theme'

const Stack = createNativeStackNavigator()

function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  )
}

function AppContent() {
  useEffect(() => {
    initDB()
  }, [])

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'レシピ一覧' }} />
        <Stack.Screen name="AddRecipe" component={AddRecipeScreen} options={{ title: 'レシピ追加' }} />
        <Stack.Screen name="Detail" component={DetailScreen as any} options={{ title: '詳細編集' }} />
        <Stack.Screen name="Cooking" component={CookingScreen as any} options={{ title: '調理モード' }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App
