export interface Flight {
  id: string;
  flightNumber: string; // e.g. "NH006"
  depIata: string; // departure airport IATA code, e.g. "HND"
  arrIata: string; // arrival airport IATA code, e.g. "JFK"
  date: string; // scheduled departure date, "YYYY-MM-DD"
  note?: string;
  createdAt: number;
}

export type FlightStatusCode =
  | 'scheduled'
  | 'active'
  | 'landed'
  | 'cancelled'
  | 'incident'
  | 'diverted'
  | 'unknown';

export interface FlightStatus {
  status: FlightStatusCode;
  airlineName?: string;
  departure: {
    airportName?: string;
    iata?: string;
    terminal?: string;
    gate?: string;
    scheduledTime?: string;
    estimatedTime?: string;
    actualTime?: string;
    delayMinutes?: number;
  };
  arrival: {
    airportName?: string;
    iata?: string;
    terminal?: string;
    gate?: string;
    baggage?: string;
    scheduledTime?: string;
    estimatedTime?: string;
    actualTime?: string;
    delayMinutes?: number;
  };
  fetchedAt: number;
}
