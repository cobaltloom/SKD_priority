import { Tabs } from 'expo-router';
import { ColorValue, Text } from 'react-native';

function TabIcon({ emoji, color }: { emoji: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4C8DFF',
        tabBarInactiveTintColor: '#8A93A6',
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'フライト',
          tabBarIcon: ({ color }) => <TabIcon emoji="✈️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '旅行統計',
          tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} />,
        }}
      />
    </Tabs>
  );
}
