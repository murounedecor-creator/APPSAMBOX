import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, type Technician } from '@/lib/supabase';
import { useRole } from '@/lib/RoleContext';
import { Modal, Button, Input, Badge, EmptyState, LoadingSpinner } from '@/components/ui';

export function TechniciansScreen() {
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Technician | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  const canEdit = role === 'owner' || role === 'manager';

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('technicians').select('*').order('name');
    setTechnicians(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() { setEditId(null); setForm({ name: '', phone: '', email: '' }); setModalOpen(true); }
  function openEdit(t: Technician) { setEditId(t.id); setForm({ name: t.name, phone: t.phone || '', email: t.email || '' }); setModalOpen(true); }

  async function save() {
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), phone: form.phone || null, email: form.email || null };
    if (editId) { await supabase.from('technicians').update(payload).eq('id', editId); }
    else { await supabase.from('technicians').insert(payload); }
    setModalOpen(false);
    load();
  }

  async function toggleActive(t: Technician) {
    await supabase.from('technicians').update({ active: !t.active }).eq('id', t.id);
    load();
  }

  async function deleteTech() {
    if (!deleteConfirm) return;
    await supabase.from('technicians').delete().eq('id', deleteConfirm.id);
    setDeleteConfirm(null);
    load();
  }

  if (loading) return <LoadingSpinner />;

  const renderItem = ({ item: t }: { item: Technician }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={[styles.techIcon, t.active ? styles.techIconActive : styles.techIconInactive]}>
            <Ionicons name="build" size={18} color={t.active ? '#10b981' : '#475569'} />
          </View>
          <View>
            <Text style={styles.cardTitle}>{t.name}</Text>
            <Badge color={t.active ? 'green' : 'gray'}>{t.active ? 'Ativo' : 'Inativo'}</Badge>
          </View>
        </View>
        {canEdit && (
          <View style={styles.cardActions}>
            <Pressable onPress={() => openEdit(t)} style={styles.iconBtn}>
              <Ionicons name="create" size={16} color="#94a3b8" />
            </Pressable>
            <Pressable onPress={() => setDeleteConfirm(t)} style={styles.iconBtn}>
              <Ionicons name="trash" size={16} color="#ef4444" />
            </Pressable>
          </View>
        )}
      </View>
      <View style={{ gap: 4 }}>
        {t.phone && <Text style={styles.cardInfo}>  {t.phone}</Text>}
        {t.email && <Text style={styles.cardInfo}>  {t.email}</Text>}
      </View>
      {canEdit && (
        <Pressable onPress={() => toggleActive(t)} style={styles.toggleBtn}>
          <Ionicons name="checkmark-circle" size={14} color="#00d2ff" />
          <Text style={styles.toggleText}>{t.active ? 'Marcar como inativo' : 'Reativar'}</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Técnicos</Text>
          <Text style={styles.subtitle}>{technicians.length} cadastrados</Text>
        </View>
        {canEdit && <Button onPress={openNew}><Text>+ Novo Técnico</Text></Button>}
      </View>

      {technicians.length === 0 ? (
        <EmptyState title="Nenhum técnico cadastrado" subtitle="Cadastre técnicos para atribuir atendimentos." />
      ) : (
        <FlatList data={technicians} renderItem={renderItem} keyExtractor={item => item.id} contentContainerStyle={{ gap: 12, paddingBottom: 20 }} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Técnico' : 'Novo Técnico'}>
        <View style={{ gap: 16 }}>
          <Input label="Nome" value={form.name} onChange={v => setForm({ ...form, name: v })} required placeholder="Nome do técnico" />
          <Input label="Telefone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
          <Input label="E-mail" value={form.email} onChange={v => setForm({ ...form, email: v })} keyboardType="email-address" />
          <View style={styles.modalActions}>
            <Button variant="secondary" onPress={() => setModalOpen(false)}>Cancelar</Button>
            <Button onPress={save}>{editId ? 'Salvar' : 'Cadastrar'}</Button>
          </View>
        </View>
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Excluir Técnico">
        <Text style={styles.deleteText}>Excluir {deleteConfirm?.name}? Atendimentos vinculados ficarão sem técnico atribuído.</Text>
        <View style={styles.modalActions}>
          <Button variant="secondary" onPress={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onPress={deleteTech}>Excluir</Button>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e17', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#f1f5f9' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  card: { backgroundColor: '#121826', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  techIcon: { width: 40, height: 40, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  techIconActive: { backgroundColor: 'rgba(16,185,129,0.1)' },
  techIconInactive: { backgroundColor: '#1e293b' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#f1f5f9', marginBottom: 4 },
  cardActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6, borderRadius: 8 },
  cardInfo: { fontSize: 14, color: '#94a3b8' },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  toggleText: { fontSize: 13, color: '#00d2ff', fontWeight: '500' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  deleteText: { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
});
