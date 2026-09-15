import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, type Customer, type Plan, type CustomerPlan } from '@/lib/supabase';
import { useRole } from '@/lib/RoleContext';
import { Modal, Button, Input, Textarea, Badge, EmptyState, LoadingSpinner } from '@/components/ui';

let citiesCache: { name: string; uf: string }[] | null = null;

async function getCitiesList(): Promise<{ name: string; uf: string }[]> {
  if (citiesCache) return citiesCache;
  try {
    const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
    const data = await res.json();
    citiesCache = data.map((m: any) => ({
      name: m.nome as string,
      uf: m?.microrregiao?.mesorregiao?.UF?.sigla || '',
    }));
    return citiesCache!;
  } catch {
    return [];
  }
}

export function CustomersScreen() {
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerPlans, setCustomerPlans] = useState<CustomerPlan[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);
  const [citySuggestions, setCitySuggestions] = useState<{ name: string; uf: string }[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', cpf_cnpj: '', address: '', city: '', state: '', zipcode: '', notes: '',
    has_discount: false, discount_value: '0',
  });

  const canEdit = role === 'owner' || role === 'manager';

  async function handleCityChange(v: string) {
    setForm(f => ({ ...f, city: v }));
    if (v.trim().length < 2) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }
    const list = await getCitiesList();
    const q = v.trim().toLowerCase();
    const matches = list.filter(c => c.name.toLowerCase().startsWith(q)).slice(0, 8);
    setCitySuggestions(matches);
    setShowCitySuggestions(matches.length > 0);
  }

  function selectCity(c: { name: string; uf: string }) {
    setForm(f => ({ ...f, city: c.name, state: c.uf }));
    setShowCitySuggestions(false);
  }

  async function handleCepChange(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 8);
    setForm(f => ({ ...f, zipcode: digits }));
    if (digits.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setForm(f => ({
            ...f,
            address: data.logradouro || f.address,
            city: data.localidade || f.city,
            state: data.uf || f.state,
          }));
        }
      } catch {
        // sem conexão: mantém o que foi digitado manualmente
      }
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    const [custRes, planRes] = await Promise.all([
      supabase.from('customers').select('*').order('name'),
      supabase.from('plans').select('*').eq('active', true).order('name'),
    ]);
    setCustomers(custRes.data || []);
    setPlans(planRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  function openNew() {
    setEditId(null);
    setForm({ name: '', phone: '', email: '', cpf_cnpj: '', address: '', city: '', state: '', zipcode: '', notes: '', has_discount: false, discount_value: '0' });
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setEditId(c.id);
    setForm({
      name: c.name, phone: c.phone || '', email: c.email || '', cpf_cnpj: c.cpf_cnpj || '',
      address: c.address || '', city: c.city || '', state: c.state || '', zipcode: c.zipcode || '',
      notes: c.notes || '', has_discount: c.has_discount, discount_value: String(c.discount_value),
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(), phone: form.phone || null, email: form.email || null,
      cpf_cnpj: form.cpf_cnpj || null, address: form.address || null, city: form.city || null,
      state: form.state || null, zipcode: form.zipcode || null, notes: form.notes || null,
      has_discount: form.has_discount, discount_value: parseFloat(form.discount_value) || 0,
    };
    if (editId) {
      const { error } = await supabase.from('customers').update(payload).eq('id', editId);
      if (error) { alert('Erro ao atualizar: ' + error.message); return; }
    } else {
      const { error } = await supabase.from('customers').insert(payload);
      if (error) { alert('Erro ao cadastrar: ' + error.message); return; }
    }
    setModalOpen(false);
    load();
  }

  async function deleteCustomer(c: Customer) {
    const { error } = await supabase.from('customers').delete().eq('id', c.id);
    if (error) { alert('Não foi possível excluir — verifique se há atendimentos ou vendas vinculados.'); return; }
    setDeleteConfirm(null);
    load();
  }

  async function openPlans(c: Customer) {
    setSelectedCustomer(c);
    const { data } = await supabase.from('customer_plans').select('*, plan:plans(*)').eq('customer_id', c.id);
    setCustomerPlans(data || []);
    setPlansModalOpen(true);
  }

  async function addPlan(planId: string, variation: string) {
    if (!selectedCustomer) return;
    const { error } = await supabase.from('customer_plans').insert({
      customer_id: selectedCustomer.id, plan_id: planId, variation: variation || null,
    });
    if (error) { alert('Erro: ' + error.message); return; }
    const { data } = await supabase.from('customer_plans').select('*, plan:plans(*)').eq('customer_id', selectedCustomer.id);
    setCustomerPlans(data || []);
  }

  async function removePlan(cpId: string) {
    await supabase.from('customer_plans').delete().eq('id', cpId);
    if (selectedCustomer) {
      const { data } = await supabase.from('customer_plans').select('*, plan:plans(*)').eq('customer_id', selectedCustomer.id);
      setCustomerPlans(data || []);
    }
  }

  if (loading) return <LoadingSpinner />;

  const renderItem = ({ item: c }: { item: Customer }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{c.name}</Text>
          {c.has_discount && <Badge color="green">Desconto ativo</Badge>}
        </View>
        {canEdit && (
          <View style={styles.cardActions}>
            <Pressable onPress={() => openPlans(c)} style={styles.iconBtn}>
              <Ionicons name="pricetag" size={16} color="#00d2ff" />
            </Pressable>
            <Pressable onPress={() => openEdit(c)} style={styles.iconBtn}>
              <Ionicons name="create" size={16} color="#94a3b8" />
            </Pressable>
            <Pressable onPress={() => setDeleteConfirm(c)} style={styles.iconBtn}>
              <Ionicons name="trash" size={16} color="#ef4444" />
            </Pressable>
          </View>
        )}
      </View>
      <View style={{ gap: 4 }}>
        {c.phone && <Text style={styles.cardInfo}>  {c.phone}</Text>}
        {c.email && <Text style={styles.cardInfo}>  {c.email}</Text>}
        {c.address && <Text style={styles.cardInfo}>  {[c.address, c.city, c.state].filter(Boolean).join(', ')}</Text>}
      </View>
      {c.notes && <Text style={styles.cardNotes}>{c.notes}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Clientes</Text>
          <Text style={styles.subtitle}>{customers.length} cadastrados</Text>
        </View>
        {canEdit && (
          <Button onPress={openNew}>
            <Text>+ Novo Cliente</Text>
          </Button>
        )}
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#64748b" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nome, telefone ou e-mail..."
          placeholderTextColor="#475569"
          style={styles.searchInput}
        />
      </View>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum cliente encontrado" subtitle="Cadastre seu primeiro cliente para começar." />
      ) : (
        <FlatList data={filtered} renderItem={renderItem} keyExtractor={item => item.id} contentContainerStyle={{ gap: 12, paddingBottom: 20 }} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Cliente' : 'Novo Cliente'}>
        <View style={{ gap: 16 }}>
          <Input label="Nome" value={form.name} onChange={v => setForm({ ...form, name: v })} required placeholder="Nome completo" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Telefone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="E-mail" value={form.email} onChange={v => setForm({ ...form, email: v })} keyboardType="email-address" />
            </View>
          </View>
          <Input label="CPF/CNPJ" value={form.cpf_cnpj} onChange={v => setForm({ ...form, cpf_cnpj: v })} />
          <Input label="Endereço" value={form.address} onChange={v => setForm({ ...form, address: v })} />
          <View style={styles.row}>
            <View style={{ flex: 2 }}>
              <Input label="Cidade" value={form.city} onChange={handleCityChange} />
              {showCitySuggestions && (
                <View style={styles.suggestionBox}>
                  {citySuggestions.map((c, idx) => (
                    <Pressable key={`${c.name}-${c.uf}-${idx}`} onPress={() => selectCity(c)} style={styles.suggestionItem}>
                      <Text style={styles.suggestionText}>{c.name} — {c.uf}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Input label="UF" value={form.state} onChange={v => setForm({ ...form, state: v })} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="CEP" value={form.zipcode} onChange={handleCepChange} keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.row}>
            <Pressable onPress={() => setForm({ ...form, has_discount: !form.has_discount })} style={styles.checkboxRow}>
              <Ionicons name={form.has_discount ? 'checkbox' : 'square-outline'} size={20} color={form.has_discount ? '#00d2ff' : '#64748b'} />
              <Text style={styles.checkboxLabel}>Possui desconto</Text>
            </Pressable>
            {form.has_discount && (
              <View style={{ flex: 1 }}>
                <Input label="Desconto (R$)" value={form.discount_value} onChange={v => setForm({ ...form, discount_value: v })} keyboardType="numeric" />
              </View>
            )}
          </View>
          <Textarea label="Observações" value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
          <View style={styles.modalActions}>
            <Button variant="secondary" onPress={() => setModalOpen(false)}>Cancelar</Button>
            <Button onPress={save}>{editId ? 'Salvar' : 'Cadastrar'}</Button>
          </View>
        </View>
      </Modal>

      <Modal open={plansModalOpen} onClose={() => setPlansModalOpen(false)} title={`Planos — ${selectedCustomer?.name || ''}`}>
        <View style={{ gap: 16 }}>
          <View>
            <Text style={styles.sectionLabel}>Planos Vinculados</Text>
            {customerPlans.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum plano vinculado.</Text>
            ) : (
              customerPlans.map(cp => (
                <View key={cp.id} style={styles.planItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{cp.plan?.name || 'Plano removido'}</Text>
                    {cp.variation && <Text style={styles.planVar}>Variação: {cp.variation}</Text>}
                  </View>
                  {canEdit && (
                    <Pressable onPress={() => removePlan(cp.id)} style={styles.iconBtn}>
                      <Ionicons name="close" size={16} color="#ef4444" />
                    </Pressable>
                  )}
                </View>
              ))
            )}
          </View>
          {canEdit && plans.length > 0 && (
            <AddPlanForm plans={plans} onAdd={addPlan} />
          )}
        </View>
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Excluir Cliente">
        <Text style={styles.deleteText}>
          Tem certeza que deseja excluir {deleteConfirm?.name}? Esta ação não pode ser desfeita.
        </Text>
        <View style={styles.modalActions}>
          <Button variant="secondary" onPress={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onPress={() => deleteConfirm && deleteCustomer(deleteConfirm)}>Excluir</Button>
        </View>
      </Modal>
    </View>
  );
}

function AddPlanForm({ plans, onAdd }: { plans: Plan[]; onAdd: (planId: string, variation: string) => void }) {
  const [planId, setPlanId] = useState('');
  const [variation, setVariation] = useState('');
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 16, gap: 12 }}>
      <Text style={styles.sectionLabel}>Adicionar Plano</Text>
      <View style={{ gap: 8 }}>
        {plans.map(p => (
          <Pressable
            key={p.id}
            onPress={() => setPlanId(p.id)}
            style={[styles.planOption, planId === p.id && styles.planOptionActive]}
          >
            <Text style={[styles.planOptionText, planId === p.id && styles.planOptionTextActive]}>
              {p.name} {p.variation ? `(${p.variation})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
      <Input label="Variação (opcional)" value={variation} onChange={setVariation} placeholder="Variação específica" />
      <Button size="sm" onPress={() => { if (planId) { onAdd(planId, variation); setPlanId(''); setVariation(''); } }}>
        <Text>+ Adicionar</Text>
      </Button>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#f1f5f9', marginBottom: 4 },
  cardActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6, borderRadius: 8 },
  cardInfo: { fontSize: 14, color: '#94a3b8' },
  cardNotes: { fontSize: 12, color: '#475569', fontStyle: 'italic', marginTop: 8 },
  row: { flexDirection: 'row', gap: 12 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  checkboxLabel: { fontSize: 14, fontWeight: '500', color: '#94a3b8' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '500', color: '#94a3b8', marginBottom: 8 },
  emptyText: { color: '#64748b', fontSize: 14, textAlign: 'center', paddingVertical: 16, backgroundColor: '#0a0e17', borderRadius: 10, borderWidth: 1, borderColor: '#1e293b' },
  planItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, backgroundColor: 'rgba(0,210,255,0.05)', borderWidth: 1, borderColor: 'rgba(0,210,255,0.15)', marginBottom: 8 },
  planName: { fontSize: 14, fontWeight: '500', color: '#e2e8f0' },
  planVar: { fontSize: 12, color: '#64748b', marginTop: 2 },
  planOption: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#0a0e17' },
  planOptionActive: { backgroundColor: 'rgba(0,210,255,0.1)', borderColor: 'rgba(0,210,255,0.3)' },
  planOptionText: { fontSize: 14, color: '#94a3b8' },
  planOptionTextActive: { color: '#00d2ff', fontWeight: '600' },
  deleteText: { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
  suggestionBox: { backgroundColor: '#0a0e17', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, marginTop: -8, marginBottom: 8, overflow: 'hidden' },
  suggestionItem: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  suggestionText: { color: '#94a3b8', fontSize: 13 },
});
