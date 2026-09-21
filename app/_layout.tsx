import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFlightStore } from '../src/store/useFlightStore';
import { useSettingsStore } from '../src/store/useSettingsStore';

export default function RootLayout() {
  const hydrateFlights = useFlightStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([hydrateFlights(), hydrateSettings()]).finally(() => setReady(true));
  }, [hydrateFlights, hydrateSettings]);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1424' }}>
          <ActivityIndicator size="large" color="#4C8DFF" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerTitleAlign: 'center' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-flight"
          options={{ presentation: 'modal', title: 'フライトを追加' }}
        />
        <Stack.Screen name="flight/[id]" options={{ title: 'フライト詳細' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
