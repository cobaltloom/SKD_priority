import axios from 'axios';
import type { FlightStatus, FlightStatusCode } from '../types/flight';

const BASE_URL = 'https://api.aviationstack.com/v1/flights';

interface AviationStackEndpoint {
  airport?: string;
  iata?: string;
  terminal?: string;
  gate?: string;
  baggage?: string;
  delay?: number;
  scheduled?: string;
  estimated?: string;
  actual?: string;
}

interface AviationStackFlightRecord {
  flight_date: string;
  flight_status: string;
  departure: AviationStackEndpoint;
  arrival: AviationStackEndpoint;
  airline?: { name?: string };
}

const KNOWN_STATUSES: FlightStatusCode[] = [
  'scheduled',
  'active',
  'landed',
  'cancelled',
  'incident',
  'diverted',
];

function mapStatus(status: string): FlightStatusCode {
  return (KNOWN_STATUSES as string[]).includes(status)
    ? (status as FlightStatusCode)
    : 'unknown';
}

export class AviationStackError extends Error {}

/**
 * Fetches live/scheduled status for a flight number from the AviationStack API.
 * flightDate (YYYY-MM-DD) narrows results when the API returns multiple records.
 */
export async function fetchFlightStatus(
  apiKey: string,
  flightIata: string,
  flightDate?: string
): Promise<FlightStatus | null> {
  const params: Record<string, string> = {
    access_key: apiKey,
    flight_iata: flightIata.trim().toUpperCase(),
  };
  if (flightDate) {
    params.flight_date = flightDate;
  }

  const response = await axios.get(BASE_URL, { params });

  if (response.data?.error) {
    const message =
      response.data.error.message ?? response.data.error.info ?? 'AviationStack APIエラー';
    throw new AviationStackError(message);
  }

  const records: AviationStackFlightRecord[] = response.data?.data ?? [];
  if (records.length === 0) return null;

  const matchByDate = flightDate
    ? records.find((r) => r.flight_date === flightDate)
    : undefined;
  const record = matchByDate ?? records[0];

  return {
    status: mapStatus(record.flight_status),
    airlineName: record.airline?.name,
    departure: {
      airportName: record.departure?.airport,
      iata: record.departure?.iata,
      terminal: record.departure?.terminal,
      gate: record.departure?.gate,
      scheduledTime: record.departure?.scheduled,
      estimatedTime: record.departure?.estimated,
      actualTime: record.departure?.actual,
      delayMinutes: record.departure?.delay,
    },
    arrival: {
      airportName: record.arrival?.airport,
      iata: record.arrival?.iata,
      terminal: record.arrival?.terminal,
      gate: record.arrival?.gate,
      baggage: record.arrival?.baggage,
      scheduledTime: record.arrival?.scheduled,
      estimatedTime: record.arrival?.estimated,
      actualTime: record.arrival?.actual,
      delayMinutes: record.arrival?.delay,
    },
    fetchedAt: Date.now(),
  };
}
