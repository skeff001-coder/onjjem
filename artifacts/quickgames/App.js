import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './screens/HomeScreen';
import DesignScreen from './screens/DesignScreen';
import BuildingScreen from './screens/BuildingScreen';
import GameScreen from './screens/GameScreen';
import HallOfFameScreen from './screens/HallOfFameScreen';
import StoreScreen from './screens/StoreScreen';
import ShareScreen from './screens/ShareScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0F1419' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Design" component={DesignScreen} />
        <Stack.Screen name="Building" component={BuildingScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="HallOfFame" component={HallOfFameScreen} />
        <Stack.Screen name="Store" component={StoreScreen} />
        <Stack.Screen name="Share" component={ShareScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
