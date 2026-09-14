import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, type Plan } from '@/lib/supabase';
import { useRole } from '@/lib/RoleContext';
import { Modal, Button, Input, Textarea, Badge, EmptyState, LoadingSpinner } from '@/components/ui';

export function PlansScreen() {
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Plan | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '0', variation: '' });

  const canEdit = role === 'owner' || role === 'manager';

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('plans').select('*').order('name');
    setPlans(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() { setEditId(null); setForm({ name: '', description: '', price: '0', variation: '' }); setModalOpen(true); }
  function openEdit(p: Plan) { setEditId(p.id); setForm({ name: p.name, description: p.description || '', price: String(p.price), variation: p.variation || '' }); setModalOpen(true); }

  async function save() {
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), description: form.description || null, price: parseFloat(form.price) || 0, variation: form.variation || null };
    if (editId) { await supabase.from('plans').update(payload).eq('id', editId); }
    else { await supabase.from('plans').insert(payload); }
    setModalOpen(false);
    load();
  }

  async function deletePlan() {
    if (!deleteConfirm) return;
    const { error } = await supabase.from('plans').delete().eq('id', deleteConfirm.id);
    if (error) { alert('Não foi possível excluir — verifique se há clientes ou vendas vinculados.'); return; }
    setDeleteConfirm(null);
    load();
  }

  function formatBRL(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  if (loading) return <LoadingSpinner />;

  const renderItem = ({ item: p }: { item: Plan }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={styles.planIcon}>
            <Ionicons name="pricetag" size={18} color="#00d2ff" />
          </View>
          <View>
            <Text style={styles.cardTitle}>{p.name}</Text>
            {p.variation && <Badge color="purple">{p.variation}</Badge>}
          </View>
        </View>
        {canEdit && (
          <View style={styles.cardActions}>
            <Pressable onPress={() => openEdit(p)} style={styles.iconBtn}>
              <Ionicons name="create" size={16} color="#94a3b8" />
            </Pressable>
            <Pressable onPress={() => setDeleteConfirm(p)} style={styles.iconBtn}>
              <Ionicons name="trash" size={16} color="#ef4444" />
            </Pressable>
          </View>
        )}
      </View>
      <Text style={styles.planPrice}>{formatBRL(p.price)}</Text>
      {p.description && <Text style={styles.planDesc}>{p.description}</Text>}
      <Badge color={p.active ? 'green' : 'gray'}>{p.active ? 'Ativo' : 'Inativo'}</Badge>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Planos e Produtos</Text>
          <Text style={styles.subtitle}>{plans.length} cadastrados</Text>
        </View>
        {canEdit && <Button onPress={openNew}><Text>+ Novo Plano</Text></Button>}
      </View>

      {plans.length === 0 ? (
        <EmptyState title="Nenhum plano cadastrado" subtitle="Cadastre planos para vincular aos clientes." />
      ) : (
        <FlatList data={plans} renderItem={renderItem} keyExtractor={item => item.id} contentContainerStyle={{ gap: 12, paddingBottom: 20 }} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Plano' : 'Novo Plano'}>
        <View style={{ gap: 16 }}>
          <Input label="Nome" value={form.name} onChange={v => setForm({ ...form, name: v })} required placeholder="Ultimate, Mensal, etc." />
          <Input label="Variação" value={form.variation} onChange={v => setForm({ ...form, variation: v })} placeholder="Ex: de Muvo, normal, etc." />
          <Input label="Preço (R$)" value={form.price} onChange={v => setForm({ ...form, price: v })} required keyboardType="numeric" />
          <Textarea label="Descrição" value={form.description} onChange={v => setForm({ ...form, description: v })} />
          <View style={styles.modalActions}>
            <Button variant="secondary" onPress={() => setModalOpen(false)}>Cancelar</Button>
            <Button onPress={save}>{editId ? 'Salvar' : 'Cadastrar'}</Button>
          </View>
        </View>
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Excluir Plano">
        <Text style={styles.deleteText}>Excluir o plano {deleteConfirm?.name}? Esta ação pode falhar se houver clientes ou vendas vinculados.</Text>
        <View style={styles.modalActions}>
          <Button variant="secondary" onPress={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onPress={deletePlan}>Excluir</Button>
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
  planIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,210,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#f1f5f9', marginBottom: 4 },
  cardActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6, borderRadius: 8 },
  planPrice: { fontSize: 24, fontWeight: '700', color: '#00d2ff', marginBottom: 8 },
  planDesc: { fontSize: 14, color: '#94a3b8', marginBottom: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  deleteText: { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
});
