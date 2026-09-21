import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Flight, FlightStatus } from '../types/flight';

const STORAGE_KEY = 'skd_priority_flights_v1';

interface FlightState {
  flights: Flight[];
  statusByFlightId: Record<string, FlightStatus>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addFlight: (flight: Omit<Flight, 'id' | 'createdAt'>) => Promise<Flight>;
  removeFlight: (id: string) => Promise<void>;
  setStatus: (flightId: string, status: FlightStatus) => void;
}

async function persist(flights: Flight[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(flights));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useFlightStore = create<FlightState>((set, get) => ({
  flights: [],
  statusByFlightId: {},
  hydrated: false,

  hydrate: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const flights: Flight[] = raw ? JSON.parse(raw) : [];
    set({ flights, hydrated: true });
  },

  addFlight: async (input) => {
    const flight: Flight = {
      ...input,
      id: generateId(),
      createdAt: Date.now(),
    };
    const flights = [flight, ...get().flights].sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0
    );
    set({ flights });
    await persist(flights);
    return flight;
  },

  removeFlight: async (id) => {
    const flights = get().flights.filter((f) => f.id !== id);
    const statusByFlightId = { ...get().statusByFlightId };
    delete statusByFlightId[id];
    set({ flights, statusByFlightId });
    await persist(flights);
  },

  setStatus: (flightId, status) => {
    set((state) => ({
      statusByFlightId: { ...state.statusByFlightId, [flightId]: status },
    }));
  },
}));
