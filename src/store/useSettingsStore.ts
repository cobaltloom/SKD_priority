import { create } from 'zustand';
import { deleteSecureItem, getSecureItem, setSecureItem } from '../utils/secureStorage';

const API_KEY_STORAGE_KEY = 'aviationstack_api_key';

interface SettingsState {
  apiKey: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  clearApiKey: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  apiKey: null,
  hydrated: false,
  hydrate: async () => {
    const key = await getSecureItem(API_KEY_STORAGE_KEY);
    set({ apiKey: key, hydrated: true });
  },
  setApiKey: async (key: string) => {
    await setSecureItem(API_KEY_STORAGE_KEY, key);
    set({ apiKey: key });
  },
  clearApiKey: async () => {
    await deleteSecureItem(API_KEY_STORAGE_KEY);
    set({ apiKey: null });
  },
}));
