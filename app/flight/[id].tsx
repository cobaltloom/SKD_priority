import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AviationStackError, fetchFlightStatus } from '../../src/api/aviationstack';
import { findAirport } from '../../src/data/airports';
import { useFlightStore } from '../../src/store/useFlightStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { estimateFlightMinutes, haversineDistanceKm } from '../../src/utils/geo';
import { formatDateJa, formatDateTime, statusColor, statusLabel } from '../../src/utils/format';
import { formatMinutes } from '../../src/utils/stats';

export default function FlightDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const flight = useFlightStore((s) => s.flights.find((f) => f.id === id));
  const status = useFlightStore((s) => (id ? s.statusByFlightId[id] : undefined));
  const setStatus = useFlightStore((s) => s.setStatus);
  const removeFlight = useFlightStore((s) => s.removeFlight);
  const apiKey = useSettingsStore((s) => s.apiKey);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dep = flight ? findAirport(flight.depIata) : undefined;
  const arr = flight ? findAirport(flight.arrIata) : undefined;

  const distanceInfo = useMemo(() => {
    if (!dep || !arr) return null;
    const km = haversineDistanceKm(dep.lat, dep.lon, arr.lat, arr.lon);
    return { km: Math.round(km), minutes: estimateFlightMinutes(km) };
  }, [dep, arr]);

  if (!flight) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>フライトが見つかりませんでした。</Text>
      </View>
    );
  }

  const currentFlight = flight;

  async function handleRefreshStatus() {
    if (!apiKey) {
      Alert.alert(
        'APIキー未設定',
        'リアルタイムのフライト状況を取得するには、設定画面でAviationStackのAPIキーを登録してください。'
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFlightStatus(apiKey, currentFlight.flightNumber, currentFlight.date);
      if (!result) {
        setError('この便の情報が見つかりませんでした。便名・日付をご確認ください。');
      } else {
        setStatus(currentFlight.id, result);
      }
    } catch (e) {
      setError(e instanceof AviationStackError ? e.message : '通信エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  }

  function handleDelete() {
    Alert.alert('フライトを削除', 'この操作は取り消せません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await removeFlight(currentFlight.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerCard}>
        <Text style={styles.flightNumber}>{flight.flightNumber}</Text>
        <Text style={styles.date}>{formatDateJa(flight.date)}</Text>

        <View style={styles.routeRow}>
          <View style={styles.airportBlock}>
            <Text style={styles.iata}>{flight.depIata}</Text>
            <Text style={styles.city}>{dep?.name ?? '未登録の空港'}</Text>
          </View>
          <Text style={styles.arrow}>✈</Text>
          <View style={styles.airportBlock}>
            <Text style={styles.iata}>{flight.arrIata}</Text>
            <Text style={styles.city}>{arr?.name ?? '未登録の空港'}</Text>
          </View>
        </View>

        {distanceInfo && (
          <Text style={styles.distance}>
            約 {distanceInfo.km.toLocaleString()} km ・ 推定 {formatMinutes(distanceInfo.minutes)}
          </Text>
        )}
        {flight.note ? <Text style={styles.note}>メモ: {flight.note}</Text> : null}
      </View>

      <Pressable style={styles.refreshButton} onPress={handleRefreshStatus} disabled={loading}>
        <Text style={styles.refreshButtonText}>
          {loading ? '取得中...' : '🔄 リアルタイム状況を取得'}
        </Text>
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {status && (
        <View style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <Text style={styles.statusHeader}>フライト状況</Text>
            <View style={[styles.badge, { backgroundColor: statusColor(status.status) }]}>
              <Text style={styles.badgeText}>{statusLabel(status.status)}</Text>
            </View>
          </View>
          {status.airlineName && <Text style={styles.airline}>{status.airlineName}</Text>}

          <View style={styles.statusSection}>
            <Text style={styles.statusLabel}>出発 {status.departure.iata ?? flight.depIata}</Text>
            <StatusLine label="定刻" value={formatDateTime(status.departure.scheduledTime)} />
            <StatusLine label="予測" value={formatDateTime(status.departure.estimatedTime)} />
            <StatusLine label="実績" value={formatDateTime(status.departure.actualTime)} />
            {status.departure.terminal && (
              <StatusLine label="ターミナル" value={status.departure.terminal} />
            )}
            {status.departure.gate && <StatusLine label="ゲート" value={status.departure.gate} />}
          </View>

          <View style={styles.statusSection}>
            <Text style={styles.statusLabel}>到着 {status.arrival.iata ?? flight.arrIata}</Text>
            <StatusLine label="定刻" value={formatDateTime(status.arrival.scheduledTime)} />
            <StatusLine label="予測" value={formatDateTime(status.arrival.estimatedTime)} />
            <StatusLine label="実績" value={formatDateTime(status.arrival.actualTime)} />
            {status.arrival.terminal && (
              <StatusLine label="ターミナル" value={status.arrival.terminal} />
            )}
            {status.arrival.gate && <StatusLine label="ゲート" value={status.arrival.gate} />}
            {status.arrival.baggage && (
              <StatusLine label="バゲージ" value={status.arrival.baggage} />
            )}
          </View>
        </View>
      )}

      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>このフライトを削除</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statusLine}>
      <Text style={styles.statusLineLabel}>{label}</Text>
      <Text style={styles.statusLineValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1424',
  },
  headerCard: {
    backgroundColor: '#151F32',
    borderRadius: 16,
    padding: 20,
  },
  flightNumber: {
    color: '#EAF0FF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  date: {
    color: '#8A93A6',
    fontSize: 13,
    marginTop: 4,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  airportBlock: { flex: 1 },
  iata: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  city: {
    color: '#8A93A6',
    fontSize: 13,
    marginTop: 2,
  },
  arrow: {
    color: '#4C8DFF',
    fontSize: 22,
    marginHorizontal: 12,
  },
  distance: {
    color: '#8A93A6',
    fontSize: 13,
    marginTop: 16,
  },
  note: {
    color: '#8A93A6',
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
  refreshButton: {
    backgroundColor: '#1B2740',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2A3752',
  },
  refreshButtonText: {
    color: '#4C8DFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#151F32',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusHeader: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: '#0B1424',
    fontSize: 12,
    fontWeight: '700',
  },
  airline: {
    color: '#8A93A6',
    fontSize: 13,
    marginTop: 4,
  },
  statusSection: {
    marginTop: 16,
  },
  statusLabel: {
    color: '#8A93A6',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statusLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statusLineLabel: {
    color: '#556077',
    fontSize: 13,
  },
  statusLineValue: {
    color: '#EAF0FF',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: 24,
    marginBottom: 40,
    alignItems: 'center',
    paddingVertical: 12,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
