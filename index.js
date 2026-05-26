/**
 * @format
 */

import 'react-native-reanimated'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values'

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

const RootComponent = () => {
    return(
        <GestureHandlerRootView style={{ flex: 1 }}>
            <App />
        </GestureHandlerRootView>
    )
}

AppRegistry.registerComponent(appName, () => RootComponent);