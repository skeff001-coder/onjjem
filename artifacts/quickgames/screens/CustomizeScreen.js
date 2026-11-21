// This screen has been replaced by DesignScreen.js
// Keeping file for backward compatibility — redirects to Design
import React, { useEffect } from 'react';
import { View } from 'react-native';

export default function CustomizeScreen({ navigation }) {
  useEffect(() => {
    navigation.replace('Design');
  }, []);
  return <View style={{ flex: 1, backgroundColor: '#0F1419' }} />;
}
