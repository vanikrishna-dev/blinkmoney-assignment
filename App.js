import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LienVisionScreen from './src/screens/LienVisionScreen';
import VaultDuelScreen from './src/screens/VaultDuelScreen';
import CostOfWaitingScreen from './src/screens/CostOfWaitingScreen';
import TabBar from './src/nav/TabBar';
import { colors } from './src/theme/tokens';

export default function App() {
  const [tab, setTab] = useState('vault');

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.screenWrap}>
          {tab === 'vault' && <LienVisionScreen />}
          {tab === 'duel' && <VaultDuelScreen />}
          {tab === 'waiting' && <CostOfWaitingScreen />}
        </View>
        <TabBar current={tab} onChange={setTab} />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  screenWrap: { flex: 1 },
});
