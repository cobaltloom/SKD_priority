import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { FlightStatusCode } from '../types/flight';

export function formatDateJa(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'yyyy年M月d日(E)', { locale: ja });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateTimeStr?: string): string {
  if (!dateTimeStr) return '--:--';
  try {
    return format(parseISO(dateTimeStr), 'M/d HH:mm');
  } catch {
    return dateTimeStr;
  }
}

const STATUS_LABELS: Record<FlightStatusCode, string> = {
  scheduled: '予定',
  active: '飛行中',
  landed: '到着済み',
  cancelled: '欠航',
  incident: '事故',
  diverted: '目的地変更',
  unknown: '不明',
};

const STATUS_COLORS: Record<FlightStatusCode, string> = {
  scheduled: '#4C8DFF',
  active: '#22C55E',
  landed: '#8A93A6',
  cancelled: '#EF4444',
  incident: '#EF4444',
  diverted: '#F59E0B',
  unknown: '#8A93A6',
};

export function statusLabel(status: FlightStatusCode): string {
  return STATUS_LABELS[status];
}

export function statusColor(status: FlightStatusCode): string {
  return STATUS_COLORS[status];
}
