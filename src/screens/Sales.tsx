import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, type Sale, type Customer, type Plan } from '@/lib/supabase';
import { useRole } from '@/lib/RoleContext';
import { Modal, Button, Input, Select, Textarea, Badge, EmptyState, LoadingSpinner } from '@/components/ui';

export function SalesScreen() {
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState({
    customer_id: '', plan_id: '', variation: '',
    amount: '0', has_discount: false, discount_value: '0',
    payment_method: '', payment_condition: '', sale_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const canManage = role === 'owner' || role === 'manager';

  const load = useCallback(async () => {
    setLoading(true);
    const [sRes, cRes, pRes] = await Promise.all([
      supabase.from('sales').select('*, customer:customers(name, phone, email), plan:plans(name)').order('sale_date', { ascending: false }),
      supabase.from('customers').select('id, name').order('name'),
      supabase.from('plans').select('*').eq('active', true).order('name'),
    ]);
    setSales(sRes.data || []);
    setCustomers((cRes.data || []) as unknown as Customer[]);
    setPlans(pRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = sales.filter(s =>
    !search || s.customer?.name?.toLowerCase().includes(search.toLowerCase()) || String(s.sale_number).includes(search)
  );

  function openNew() {
    setEditId(null);
    setForm({ customer_id: '', plan_id: '', variation: '', amount: '0', has_discount: false, discount_value: '0', payment_method: '', payment_condition: '', sale_date: new Date().toISOString().split('T')[0], notes: '' });
    setModalOpen(true);
  }

  function openEdit(s: Sale) {
    setEditId(s.id);
    setForm({
      customer_id: s.customer_id, plan_id: s.plan_id || '', variation: s.variation || '',
      amount: String(s.amount), has_discount: s.has_discount, discount_value: String(s.discount_value),
      payment_method: s.payment_method || '', payment_condition: s.payment_condition || '',
      sale_date: s.sale_date, notes: s.notes || '',
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.customer_id) { alert('Selecione um cliente.'); return; }
    const amount = parseFloat(form.amount) || 0;
    const discount = form.has_discount ? (parseFloat(form.discount_value) || 0) : 0;
    const final = amount - discount;
    const payload = {
      customer_id: form.customer_id, plan_id: form.plan_id || null, variation: form.variation || null,
      amount, has_discount: form.has_discount, discount_value: discount, final_amount: final,
      payment_method: form.payment_method || null, payment_condition: form.payment_condition || null,
      sale_date: form.sale_date, notes: form.notes || null,
    };
    if (editId) {
      const { error } = await supabase.from('sales').update(payload).eq('id', editId);
      if (error) { alert('Erro: ' + error.message); return; }
    } else {
      const { error } = await supabase.from('sales').insert(payload);
      if (error) { alert('Erro: ' + error.message); return; }
    }
    setModalOpen(false);
    load();
  }

  function formatBRL(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  if (loading) return <LoadingSpinner />;

  const renderItem = ({ item: s }: { item: Sale }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <View style={styles.cardBadges}>
            <Text style={styles.saleNumber}>#{String(s.sale_number).padStart(5, '0')}</Text>
            {s.has_discount && <Badge color="green">Desconto</Badge>}
          </View>
          <Text style={styles.cardTitle}>{s.customer?.name || 'Cliente removido'}</Text>
          <Text style={styles.cardInfo}>{s.plan?.name || '-'} {s.variation ? `(${s.variation})` : ''}</Text>
          <Text style={styles.cardInfo}>{new Date(s.sale_date + 'T00:00:00').toLocaleDateString('pt-BR')} — {s.payment_method || 'Pagamento não informado'}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.saleAmount}>{formatBRL(s.final_amount)}</Text>
          {s.has_discount && s.discount_value > 0 && (
            <Text style={styles.saleOriginal}>{formatBRL(s.amount)}</Text>
          )}
          {canManage && (
            <Pressable onPress={() => openEdit(s)} style={styles.iconBtn}>
              <Ionicons name="create" size={16} color="#94a3b8" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Vendas</Text>
          <Text style={styles.subtitle}>{sales.length} registros</Text>
        </View>
        {canManage && <Button onPress={openNew}><Text>+ Nova Venda</Text></Button>}
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#64748b" />
        <TextInput value={search} onChangeText={setSearch} placeholder="Buscar por cliente ou número..." placeholderTextColor="#475569" style={styles.searchInput} />
      </View>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhuma venda encontrada" subtitle="Registre a primeira venda para começar." />
      ) : (
        <FlatList data={filtered} renderItem={renderItem} keyExtractor={item => item.id} contentContainerStyle={{ gap: 12, paddingBottom: 20 }} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Venda' : 'Nova Venda'}>
        <View style={{ gap: 16 }}>
          <Select label="Cliente" value={form.customer_id} onChange={v => setForm({ ...form, customer_id: v })} required options={customers.map(c => ({ value: c.id, label: c.name }))} />
          <Select label="Plano/Produto" value={form.plan_id} onChange={v => { const plan = plans.find(p => p.id === v); setForm({ ...form, plan_id: v, amount: plan ? String(plan.price) : form.amount }); }} options={plans.map(p => ({ value: p.id, label: `${p.name} ${p.variation ? `(${p.variation})` : ''} — ${formatBRL(p.price)}` }))} />
          <Input label="Variação (ex: de Muvo)" value={form.variation} onChange={v => setForm({ ...form, variation: v })} placeholder="Variação específica do produto" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Valor (R$)" value={form.amount} onChange={v => setForm({ ...form, amount: v })} required keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Data da Venda" value={form.sale_date} onChange={v => setForm({ ...form, sale_date: v })} placeholder="AAAA-MM-DD" />
            </View>
          </View>
          <Pressable onPress={() => setForm({ ...form, has_discount: !form.has_discount })} style={styles.checkboxRow}>
            <Ionicons name={form.has_discount ? 'checkbox' : 'square-outline'} size={20} color={form.has_discount ? '#00d2ff' : '#64748b'} />
            <Text style={styles.checkboxLabel}>Aplicar desconto</Text>
          </Pressable>
          {form.has_discount && (
            <>
              <Input label="Desconto (R$)" value={form.discount_value} onChange={v => setForm({ ...form, discount_value: v })} keyboardType="numeric" />
              <View style={styles.totalBox}>
                <Text style={styles.totalText}>Total final: {formatBRL((parseFloat(form.amount) || 0) - (parseFloat(form.discount_value) || 0))}</Text>
              </View>
            </>
          )}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Forma de Pagamento" value={form.payment_method} onChange={v => setForm({ ...form, payment_method: v })} placeholder="Pix, Cartão..." />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Condição" value={form.payment_condition} onChange={v => setForm({ ...form, payment_condition: v })} placeholder="À vista, 3x..." />
            </View>
          </View>
          <Textarea label="Observações" value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
          <View style={styles.modalActions}>
            <Button variant="secondary" onPress={() => setModalOpen(false)}>Cancelar</Button>
            <Button onPress={save}>{editId ? 'Salvar' : 'Registrar Venda'}</Button>
          </View>
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
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#0a0e17', borderRadius: 10, paddingHorizontal: 12, marginBottom: 16 },
  searchInput: { flex: 1, color: '#f1f5f9', fontSize: 14, paddingVertical: 10 },
  card: { backgroundColor: '#121826', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 20 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' },
  cardBadges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  saleNumber: { fontSize: 13, color: '#64748b', fontFamily: 'monospace' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#f1f5f9' },
  cardInfo: { fontSize: 14, color: '#94a3b8', marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  saleAmount: { fontSize: 18, fontWeight: '700', color: '#00d2ff' },
  saleOriginal: { fontSize: 12, color: '#475569', textDecorationLine: 'line-through' },
  iconBtn: { padding: 8, borderRadius: 8 },
  row: { flexDirection: 'row', gap: 12 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  checkboxLabel: { fontSize: 14, fontWeight: '500', color: '#94a3b8' },
  totalBox: { padding: 12, borderRadius: 10, backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  totalText: { fontSize: 14, color: '#10b981' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
});
