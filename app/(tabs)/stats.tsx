import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFlightStore } from '../../src/store/useFlightStore';
import { computeTravelStats, formatMinutes } from '../../src/utils/stats';

export default function StatsScreen() {
  const flights = useFlightStore((s) => s.flights);
  const stats = useMemo(() => computeTravelStats(flights), [flights]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>旅行統計</Text>
      <Text style={styles.subtitle}>登録済みのフライトから自動集計しています</Text>

      <View style={styles.grid}>
        <StatTile label="フライト数" value={`${stats.flightCount}`} unit="回" />
        <StatTile
          label="総飛行距離"
          value={stats.totalDistanceKm.toLocaleString()}
          unit="km"
        />
        <StatTile label="総飛行時間" value={formatMinutes(stats.totalMinutes)} />
        <StatTile label="訪問国数" value={`${stats.countries.length}`} unit="ヶ国" />
        <StatTile label="利用空港数" value={`${stats.airports.length}`} unit="空港" />
      </View>

      {stats.countries.length > 0 && (
        <View style={styles.listCard}>
          <Text style={styles.listTitle}>訪問した国</Text>
          <View style={styles.chipRow}>
            {stats.countries.map((country) => (
              <View key={country} style={styles.chip}>
                <Text style={styles.chipText}>{country}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {stats.airports.length > 0 && (
        <View style={styles.listCard}>
          <Text style={styles.listTitle}>利用した空港</Text>
          <View style={styles.chipRow}>
            {stats.airports.map((iata) => (
              <View key={iata} style={styles.chip}>
                <Text style={styles.chipText}>{iata}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {stats.flightCount === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            フライトを登録すると、飛行距離や訪問国などの統計がここに表示されます。
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function StatTile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <View style={styles.tileValueRow}>
        <Text style={styles.tileValue}>{value}</Text>
        {unit && <Text style={styles.tileUnit}>{unit}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1424',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8A93A6',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    backgroundColor: '#151F32',
    borderRadius: 16,
    padding: 16,
    width: '47%',
  },
  tileLabel: {
    color: '#8A93A6',
    fontSize: 13,
    marginBottom: 8,
  },
  tileValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  tileValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  tileUnit: {
    color: '#8A93A6',
    fontSize: 13,
    marginBottom: 3,
  },
  listCard: {
    backgroundColor: '#151F32',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  listTitle: {
    color: '#EAF0FF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#1B2740',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: '#4C8DFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    marginTop: 32,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    color: '#8A93A6',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
