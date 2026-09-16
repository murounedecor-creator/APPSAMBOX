import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Modal as RNModal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#0a0e17',
  card: '#121826',
  border: '#1e293b',
  primary: '#00d2ff',
  text: '#f1f5f9',
  textMuted: '#64748b',
  textDim: '#94a3b8',
};

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function parseDateValue(value: string): Date {
  if (value) {
    const [y, m, d] = value.split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
  }
  return new Date();
}

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}

export function DateField({ label, value, onChange, required = false }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const initial = parseDateValue(value);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  function openPicker() {
    const base = parseDateValue(value);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setOpen(true);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  function selectDay(day: number) {
    const formatted = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    onChange(formatted);
    setOpen(false);
  }

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selected = parseDateValue(value);
  const isSelectedMonth = Boolean(value) && selected.getFullYear() === viewYear && selected.getMonth() === viewMonth;

  const displayValue = value
    ? `${pad(selected.getDate())}/${pad(selected.getMonth() + 1)}/${selected.getFullYear()}`
    : '';

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label}{required && <Text style={{ color: '#ef4444' }}> *</Text>}
      </Text>
      <Pressable onPress={openPicker} style={styles.fieldBtn}>
        <Text style={displayValue ? styles.fieldValue : styles.fieldPlaceholder}>
          {displayValue || 'Selecionar data'}
        </Text>
        <Ionicons name="calendar" size={18} color={COLORS.primary} />
      </Pressable>

      <RNModal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.calendarCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.calendarHeader}>
              <Pressable onPress={prevMonth} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
              </Pressable>
              <Text style={styles.calendarTitle}>{MONTHS[viewMonth]} {viewYear}</Text>
              <Pressable onPress={nextMonth} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
              </Pressable>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((w, i) => (
                <Text key={`${w}-${i}`} style={styles.weekdayText}>{w}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {cells.map((day, idx) => {
                const isSelected = isSelectedMonth && day === selected.getDate();
                return (
                  <View key={idx} style={styles.dayCell}>
                    {day !== null ? (
                      <Pressable
                        onPress={() => selectDay(day)}
                        style={[styles.dayBtn, isSelected && styles.dayBtnSelected]}
                      >
                        <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>

            <Pressable onPress={() => setOpen(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Fechar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </RNModal>
    </View>
  );
}

interface TimeFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = Array.from({ length: 60 }, (_, i) => pad(i));

export function TimeField({ label, value, onChange, required = false }: TimeFieldProps) {
  const [open, setOpen] = useState(false);
  const [hh, mm] = value ? value.split(':') : ['', ''];
  const [tempHour, setTempHour] = useState(hh || '08');
  const [tempMinute, setTempMinute] = useState(mm || '00');

  function openPicker() {
    setTempHour(hh || '08');
    setTempMinute(mm || '00');
    setOpen(true);
  }

  function confirm() {
    onChange(`${tempHour}:${tempMinute}`);
    setOpen(false);
  }

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label}{required && <Text style={{ color: '#ef4444' }}> *</Text>}
      </Text>
      <Pressable onPress={openPicker} style={styles.fieldBtn}>
        <Text style={value ? styles.fieldValue : styles.fieldPlaceholder}>
          {value || 'Selecionar hora'}
        </Text>
        <Ionicons name="time" size={18} color={COLORS.primary} />
      </Pressable>

      <RNModal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.clockCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.clockDisplay}>{tempHour}:{tempMinute}</Text>
            <View style={styles.clockColumns}>
              <View style={styles.clockColumn}>
                <Text style={styles.clockColumnLabel}>Hora</Text>
                <ScrollView style={styles.clockScroll} showsVerticalScrollIndicator={false}>
                  {HOURS.map(h => (
                    <Pressable key={h} onPress={() => setTempHour(h)} style={[styles.clockItem, tempHour === h && styles.clockItemSelected]}>
                      <Text style={[styles.clockItemText, tempHour === h && styles.clockItemTextSelected]}>{h}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.clockColumn}>
                <Text style={styles.clockColumnLabel}>Minuto</Text>
                <ScrollView style={styles.clockScroll} showsVerticalScrollIndicator={false}>
                  {MINUTES.map(m => (
                    <Pressable key={m} onPress={() => setTempMinute(m)} style={[styles.clockItem, tempMinute === m && styles.clockItemSelected]}>
                      <Text style={[styles.clockItemText, tempMinute === m && styles.clockItemTextSelected]}>{m}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
            <Pressable onPress={confirm} style={styles.confirmBtn}>
              <Text style={styles.confirmBtnText}>Confirmar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </RNModal>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: COLORS.textDim, marginBottom: 6 },
  fieldBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
  },
  fieldValue: { color: COLORS.text, fontSize: 14 },
  fieldPlaceholder: { color: COLORS.textMuted, fontSize: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  calendarCard: {
    width: '100%', maxWidth: 340, backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, padding: 16,
  },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(0,210,255,0.08)' },
  calendarTitle: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekdayText: { flex: 1, textAlign: 'center', color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  dayBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayBtnSelected: { backgroundColor: COLORS.primary },
  dayText: { color: COLORS.textDim, fontSize: 14 },
  dayTextSelected: { color: COLORS.bg, fontWeight: '700' },
  closeBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  closeBtnText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '500' },
  clockCard: {
    width: '100%', maxWidth: 320, backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, padding: 20, alignItems: 'center',
  },
  clockDisplay: { color: COLORS.primary, fontSize: 32, fontWeight: '700', marginBottom: 16, letterSpacing: 2 },
  clockColumns: { flexDirection: 'row', gap: 16, width: '100%' },
  clockColumn: { flex: 1, alignItems: 'center' },
  clockColumnLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  clockScroll: { height: 160, width: '100%' },
  clockItem: { paddingVertical: 8, alignItems: 'center', borderRadius: 8, marginVertical: 1 },
  clockItemSelected: { backgroundColor: 'rgba(0,210,255,0.15)' },
  clockItemText: { color: COLORS.textDim, fontSize: 16 },
  clockItemTextSelected: { color: COLORS.primary, fontWeight: '700' },
  confirmBtn: { marginTop: 16, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 32 },
  confirmBtnText: { color: COLORS.bg, fontWeight: '700', fontSize: 14 },
});
