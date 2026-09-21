import { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSettingsStore } from '../../src/store/useSettingsStore';

export default function SettingsScreen() {
  const apiKey = useSettingsStore((s) => s.apiKey);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const clearApiKey = useSettingsStore((s) => s.clearApiKey);

  const [draft, setDraft] = useState(apiKey ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!draft.trim()) {
      Alert.alert('入力エラー', 'APIキーを入力してください');
      return;
    }
    setSaving(true);
    try {
      await setApiKey(draft.trim());
      Alert.alert('保存しました', 'APIキーを保存しました');
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    Alert.alert('APIキーを削除', '保存済みのAPIキーを削除しますか?', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await clearApiKey();
          setDraft('');
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>設定</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>AviationStack APIキー</Text>
        <Text style={styles.cardBody}>
          リアルタイムのフライト状況を取得するには、AviationStackのAPIキーが必要です。
          無料プランでも登録できます。
        </Text>

        <TextInput
          style={styles.input}
          placeholder="APIキーを入力"
          placeholderTextColor="#556077"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          value={draft}
          onChangeText={setDraft}
        />

        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: apiKey ? '#22C55E' : '#556077' }]} />
          <Text style={styles.statusText}>
            {apiKey ? 'APIキーが設定されています' : 'APIキーが未設定です'}
          </Text>
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? '保存中...' : '保存'}</Text>
        </Pressable>

        {apiKey && (
          <Pressable style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>APIキーを削除</Text>
          </Pressable>
        )}

        <Pressable onPress={() => Linking.openURL('https://aviationstack.com/signup/free')}>
          <Text style={styles.link}>無料APIキーを取得する ↗</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>このアプリについて</Text>
        <Text style={styles.cardBody}>
          フライトを登録して旅程を管理し、飛行距離・時間・訪問国などの統計を確認できます。
          フライトデータはお使いの端末内にのみ保存されます。
        </Text>
      </View>
    </ScrollView>
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
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#151F32',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#EAF0FF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardBody: {
    color: '#8A93A6',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#0B1424',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#8A93A6',
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: '#4C8DFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#0B1424',
    fontSize: 15,
    fontWeight: '700',
  },
  clearButton: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  clearButtonText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  link: {
    color: '#4C8DFF',
    fontSize: 13,
    marginTop: 14,
    textAlign: 'center',
  },
});
