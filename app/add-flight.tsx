import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { findAirport } from '../src/data/airports';
import { useFlightStore } from '../src/store/useFlightStore';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function AddFlightScreen() {
  const router = useRouter();
  const addFlight = useFlightStore((s) => s.addFlight);

  const [flightNumber, setFlightNumber] = useState('');
  const [depIata, setDepIata] = useState('');
  const [arrIata, setArrIata] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const depAirport = findAirport(depIata);
  const arrAirport = findAirport(arrIata);

  async function handleSave() {
    if (!flightNumber.trim()) {
      Alert.alert('入力エラー', '便名を入力してください (例: NH006)');
      return;
    }
    if (depIata.trim().length !== 3 || arrIata.trim().length !== 3) {
      Alert.alert('入力エラー', '出発・到着空港は3文字のIATAコードで入力してください (例: HND)');
      return;
    }
    if (!DATE_RE.test(date)) {
      Alert.alert('入力エラー', '日付は YYYY-MM-DD 形式で入力してください');
      return;
    }

    setSaving(true);
    try {
      await addFlight({
        flightNumber: flightNumber.trim().toUpperCase(),
        depIata: depIata.trim().toUpperCase(),
        arrIata: arrIata.trim().toUpperCase(),
        date,
        note: note.trim() || undefined,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
        <Field label="便名">
          <TextInput
            style={styles.input}
            placeholder="例: NH006"
            placeholderTextColor="#556077"
            autoCapitalize="characters"
            value={flightNumber}
            onChangeText={setFlightNumber}
          />
        </Field>

        <View style={styles.row}>
          <Field label="出発空港 (IATA)" style={styles.flex1}>
            <TextInput
              style={styles.input}
              placeholder="HND"
              placeholderTextColor="#556077"
              autoCapitalize="characters"
              maxLength={3}
              value={depIata}
              onChangeText={setDepIata}
            />
            {depIata.length === 3 && (
              <Text style={styles.hint}>
                {depAirport ? `${depAirport.city}, ${depAirport.country}` : '未登録の空港コード'}
              </Text>
            )}
          </Field>
          <Field label="到着空港 (IATA)" style={styles.flex1}>
            <TextInput
              style={styles.input}
              placeholder="JFK"
              placeholderTextColor="#556077"
              autoCapitalize="characters"
              maxLength={3}
              value={arrIata}
              onChangeText={setArrIata}
            />
            {arrIata.length === 3 && (
              <Text style={styles.hint}>
                {arrAirport ? `${arrAirport.city}, ${arrAirport.country}` : '未登録の空港コード'}
              </Text>
            )}
          </Field>
        </View>

        <Field label="搭乗日 (YYYY-MM-DD)">
          <TextInput
            style={styles.input}
            placeholder="2026-09-21"
            placeholderTextColor="#556077"
            value={date}
            onChangeText={setDate}
          />
        </Field>

        <Field label="メモ (任意)">
          <TextInput
            style={styles.input}
            placeholder="例: 家族旅行"
            placeholderTextColor="#556077"
            value={note}
            onChangeText={setNote}
          />
        </Field>

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? '保存中...' : 'フライトを保存'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flex1: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#0B1424',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: '#8A93A6',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#151F32',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  hint: {
    color: '#556077',
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#4C8DFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#0B1424',
    fontSize: 16,
    fontWeight: '700',
  },
});
