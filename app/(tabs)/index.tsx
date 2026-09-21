import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlightCard } from '../../src/components/FlightCard';
import { useFlightStore } from '../../src/store/useFlightStore';

export default function FlightListScreen() {
  const router = useRouter();
  const flights = useFlightStore((s) => s.flights);
  const statusByFlightId = useFlightStore((s) => s.statusByFlightId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>マイフライト</Text>
        <Pressable style={styles.addButton} onPress={() => router.push('/add-flight')}>
          <Text style={styles.addButtonText}>＋ 追加</Text>
        </Pressable>
      </View>

      {flights.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🧳</Text>
          <Text style={styles.emptyTitle}>まだフライトがありません</Text>
          <Text style={styles.emptyBody}>
            右上の「＋ 追加」から便名と空港・日付を登録すると、ここに旅程として表示されます。
          </Text>
        </View>
      ) : (
        <FlatList
          data={flights}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <FlightCard
              flight={item}
              status={statusByFlightId[item.id]}
              onPress={() => router.push(`/flight/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1424',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: '#4C8DFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addButtonText: {
    color: '#0B1424',
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#EAF0FF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyBody: {
    color: '#8A93A6',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
