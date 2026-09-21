import { Pressable, StyleSheet, Text, View } from 'react-native';
import { findAirport } from '../data/airports';
import type { Flight, FlightStatus } from '../types/flight';
import { formatDateJa, statusColor, statusLabel } from '../utils/format';

interface Props {
  flight: Flight;
  status?: FlightStatus;
  onPress: () => void;
}

export function FlightCard({ flight, status, onPress }: Props) {
  const dep = findAirport(flight.depIata);
  const arr = findAirport(flight.arrIata);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <Text style={styles.flightNumber}>{flight.flightNumber}</Text>
        {status ? (
          <View style={[styles.badge, { backgroundColor: statusColor(status.status) }]}>
            <Text style={styles.badgeText}>{statusLabel(status.status)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.routeRow}>
        <View style={styles.airportBlock}>
          <Text style={styles.iata}>{flight.depIata}</Text>
          <Text style={styles.city} numberOfLines={1}>
            {dep?.city ?? '不明な空港'}
          </Text>
        </View>
        <Text style={styles.arrow}>→</Text>
        <View style={styles.airportBlock}>
          <Text style={styles.iata}>{flight.arrIata}</Text>
          <Text style={styles.city} numberOfLines={1}>
            {arr?.city ?? '不明な空港'}
          </Text>
        </View>
      </View>

      <Text style={styles.date}>{formatDateJa(flight.date)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#151F32',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  flightNumber: {
    color: '#EAF0FF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
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
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  airportBlock: {
    flex: 1,
  },
  iata: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  city: {
    color: '#8A93A6',
    fontSize: 13,
    marginTop: 2,
  },
  arrow: {
    color: '#4C8DFF',
    fontSize: 18,
    marginHorizontal: 12,
  },
  date: {
    color: '#8A93A6',
    fontSize: 13,
    marginTop: 12,
  },
});
