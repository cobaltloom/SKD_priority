import type { Flight } from '../types/flight';
import { findAirport } from '../data/airports';
import { estimateFlightMinutes, haversineDistanceKm } from './geo';

export interface TravelStats {
  flightCount: number;
  totalDistanceKm: number;
  totalMinutes: number;
  countries: string[];
  airports: string[];
}

export function computeTravelStats(flights: Flight[]): TravelStats {
  let totalDistanceKm = 0;
  let totalMinutes = 0;
  const countries = new Set<string>();
  const airports = new Set<string>();

  for (const flight of flights) {
    const dep = findAirport(flight.depIata);
    const arr = findAirport(flight.arrIata);

    if (dep) {
      countries.add(dep.country);
      airports.add(dep.iata);
    }
    if (arr) {
      countries.add(arr.country);
      airports.add(arr.iata);
    }

    if (dep && arr) {
      const distance = haversineDistanceKm(dep.lat, dep.lon, arr.lat, arr.lon);
      totalDistanceKm += distance;
      totalMinutes += estimateFlightMinutes(distance);
    }
  }

  return {
    flightCount: flights.length,
    totalDistanceKm: Math.round(totalDistanceKm),
    totalMinutes: Math.round(totalMinutes),
    countries: Array.from(countries).sort(),
    airports: Array.from(airports).sort(),
  };
}

export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}時間${minutes}分`;
}
