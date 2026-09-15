import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRole } from '@/lib/RoleContext';
import { ROLE_LABELS, type Role } from '@/lib/supabase';

const ROLE_ICONS: Record<Role, keyof typeof Ionicons.glyphMap> = {
  owner: 'key',
  manager: 'clipboard',
  technician: 'build',
};

const ROLE_COLORS: Record<Role, { text: string; bg: string; border: string }> = {
  owner: { text: '#00d2ff', bg: 'rgba(0,210,255,0.1)', border: 'rgba(0,210,255,0.2)' },
  manager: { text: '#94a3b8', bg: '#1e293b', border: '#334155' },
  technician: { text: '#94a3b8', bg: '#1e293b', border: '#334155' },
};

export function RoleSelector() {
  const { role, setRole } = useRole();
  const [open, setOpen] = useState(false);
  const c = ROLE_COLORS[role];

  return (
    <View>
      <Pressable
        onPress={() => setOpen(!open)}
        style={({ pressed }) => [
          styles.selector,
          { backgroundColor: c.bg, borderColor: c.border },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Ionicons name={ROLE_ICONS[role]} size={18} color={c.text} />
        <Text style={[styles.selectorText, { color: c.text }]}>{ROLE_LABELS[role]}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={c.text} />
      </Pressable>

      {open && (
        <View style={styles.dropdown}>
          <Pressable style={styles.dropdownBackdrop} onPress={() => setOpen(false)} />
          <View style={styles.dropdownMenu}>
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <Pressable
                key={r}
                onPress={() => { setRole(r); setOpen(false); }}
                style={({ pressed }) => [
                  styles.dropdownItem,
                  role === r && styles.dropdownItemActive,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons
                  name={ROLE_ICONS[r]}
                  size={18}
                  color={role === r ? '#00d2ff' : '#64748b'}
                />
                <Text style={[styles.dropdownItemText, role === r && styles.dropdownItemTextActive]}>
                  {ROLE_LABELS[r]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  selector: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  selectorText: { fontSize: 14, fontWeight: '500' },
  dropdown: { position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 999, elevation: 20 },
  dropdownBackdrop: { position: 'absolute', top: -1000, left: -1000, right: -1000, bottom: -1000 },
  dropdownMenu: { width: 220, backgroundColor: '#121826', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  dropdownItemActive: { backgroundColor: 'rgba(0,210,255,0.1)' },
  dropdownItemText: { fontSize: 14, color: '#94a3b8' },
  dropdownItemTextActive: { color: '#00d2ff', fontWeight: '600' },
});
