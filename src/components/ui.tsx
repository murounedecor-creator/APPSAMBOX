import { type ReactNode } from 'react';
import {
  View, Text, Pressable, TextInput, Modal as RNModal,
  ScrollView, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';

const COLORS = {
  bg: '#0a0e17',
  card: '#121826',
  border: '#1e293b',
  borderHover: '#334155',
  primary: '#00d2ff',
  primaryDark: '#0077b6',
  text: '#f1f5f9',
  textMuted: '#64748b',
  textDim: '#94a3b8',
  red: '#ef4444',
  green: '#10b981',
  amber: '#f59e0b',
  purple: '#a78bfa',
};

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <RNModal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>X</Text>
            </Pressable>
          </View>
          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
}: {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}) {
  const variantStyles = {
    primary: { backgroundColor: COLORS.primary },
    secondary: { backgroundColor: COLORS.border, borderWidth: 1, borderColor: COLORS.borderHover },
    danger: { backgroundColor: '#450a0a', borderWidth: 1, borderColor: '#7f1d1d' },
    ghost: { backgroundColor: 'transparent' },
    success: { backgroundColor: 'rgba(0,210,255,0.15)', borderWidth: 1, borderColor: 'rgba(0,210,255,0.3)' },
  };
  const variantText = {
    primary: { color: COLORS.bg, fontWeight: '600' as const },
    secondary: { color: COLORS.textDim },
    danger: { color: COLORS.red },
    ghost: { color: COLORS.textMuted },
    success: { color: COLORS.primary },
  };
  const sizeStyles = {
    sm: { paddingHorizontal: 12, paddingVertical: 6 },
    md: { paddingHorizontal: 16, paddingVertical: 8 },
    lg: { paddingHorizontal: 24, paddingVertical: 12 },
  };
  const sizeText = { sm: 12, md: 14, lg: 16 };
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btnBase,
        variantStyles[variant],
        sizeStyles[size],
        pressed && { opacity: 0.8 },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text style={[{ fontSize: sizeText[size] }, variantText[variant]]}>{children}</Text>
    </Pressable>
  );
}

export function Input({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label}{required && <Text style={{ color: COLORS.red }}> *</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor={COLORS.textMuted}
        style={styles.input}
      />
    </View>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  required = false,
  placeholder = 'Selecione...',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label}{required && <Text style={{ color: COLORS.red }}> *</Text>}
      </Text>
      <View style={styles.selectContainer}>
        {placeholder && (
          <Pressable
            onPress={() => onChange('')}
            style={[styles.selectOption, value === '' && styles.selectOptionActive]}
          >
            <Text style={[styles.selectOptionText, value === '' && styles.selectOptionTextActive]}>
              {placeholder}
            </Text>
          </Pressable>
        )}
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.selectOption, value === opt.value && styles.selectOptionActive]}
          >
            <Text style={[styles.selectOptionText, value === opt.value && styles.selectOptionTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function Textarea({
  label,
  value,
  onChange,
  placeholder = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        style={[styles.input, { minHeight: 72 }]}
      />
    </View>
  );
}

export function Badge({ children, color = 'gray' }: { children: ReactNode; color?: string }) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    gray: { bg: '#1e293b', text: COLORS.textMuted, border: 'transparent' },
    amber: { bg: 'rgba(245,158,11,0.15)', text: COLORS.amber, border: 'rgba(245,158,11,0.2)' },
    blue: { bg: 'rgba(0,210,255,0.15)', text: COLORS.primary, border: 'rgba(0,210,255,0.2)' },
    green: { bg: 'rgba(16,185,129,0.15)', text: COLORS.green, border: 'rgba(16,185,129,0.2)' },
    red: { bg: 'rgba(239,68,68,0.15)', text: COLORS.red, border: 'rgba(239,68,68,0.2)' },
    orange: { bg: 'rgba(249,115,22,0.15)', text: '#f97316', border: 'rgba(249,115,22,0.2)' },
    purple: { bg: 'rgba(167,139,250,0.15)', text: COLORS.purple, border: 'rgba(167,139,250,0.2)' },
  };
  const c = colorMap[color] || colorMap.gray;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{children}</Text>
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

export function LoadingSpinner() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', borderColor: COLORS.border, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  modalCloseBtn: { padding: 8 },
  modalCloseText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },
  modalBody: { paddingHorizontal: 20, paddingVertical: 20 },
  btnBase: { borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: COLORS.textDim, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg, color: COLORS.text, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  selectContainer: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg, borderRadius: 10, overflow: 'hidden' },
  selectOption: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  selectOptionActive: { backgroundColor: 'rgba(0,210,255,0.1)' },
  selectOptionText: { fontSize: 14, color: COLORS.textDim },
  selectOptionTextActive: { color: COLORS.primary, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 9999, borderWidth: 1, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '500' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyIcon: { width: 64, height: 64, borderRadius: 9999, backgroundColor: COLORS.border, borderWidth: 1, borderColor: COLORS.borderHover, marginBottom: 16 },
  emptyTitle: { color: COLORS.textDim, fontWeight: '500', fontSize: 16 },
  emptySubtitle: { color: COLORS.textMuted, fontSize: 14, marginTop: 4 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
});
