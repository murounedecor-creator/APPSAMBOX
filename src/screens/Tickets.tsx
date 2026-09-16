import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  supabase, type Ticket, type Customer, type Technician,
  type TicketStatus, type TicketType, type TicketPriority,
  TICKET_STATUS_LABELS, TICKET_TYPE_LABELS, TICKET_PRIORITY_LABELS,
} from '@/lib/supabase';
import { useRole } from '@/lib/RoleContext';
import { Modal, Button, Input, Select, Textarea, Badge, EmptyState, LoadingSpinner } from '@/components/ui';
import { DateField, TimeField } from '@/components/DateTimePicker';

export function TicketsScreen() {
  const { role, technicianId, setTechnicianId } = useRole();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState({
    customer_id: '', technician_id: '', ticket_type: 'maintenance' as TicketType,
    status: 'pending' as TicketStatus, priority: 'normal' as TicketPriority,
    description: '', scheduled_date: '', scheduled_time: '', notes: '',
  });

  const canManage = role === 'owner' || role === 'manager';
  const isTechnician = role === 'technician';

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('tickets').select('*, customer:customers(*), technician:technicians(*)').order('created_at', { ascending: false });
    if (isTechnician && technicianId) {
      query = query.eq('technician_id', technicianId);
    }
    const [tktRes, custRes, techRes] = await Promise.all([
      query,
      supabase.from('customers').select('id, name').order('name'),
      supabase.from('technicians').select('*').eq('active', true).order('name'),
    ]);
    setTickets(tktRes.data || []);
    setCustomers((custRes.data || []) as unknown as Customer[]);
    setTechnicians(techRes.data || []);
    if (isTechnician && !technicianId && techRes.data && techRes.data.length > 0) {
      setTechnicianId(techRes.data[0].id);
    }
    setLoading(false);
  }, [isTechnician, technicianId, setTechnicianId]);

  useEffect(() => { load(); }, [load]);

  const filtered = tickets.filter(t => {
    const matchSearch = !search ||
      t.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      String(t.ticket_number).includes(search);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function openNew() {
    setEditId(null);
    setForm({ customer_id: '', technician_id: '', ticket_type: 'maintenance', status: 'pending', priority: 'normal', description: '', scheduled_date: '', scheduled_time: '', notes: '' });
    setModalOpen(true);
  }

  function openEdit(t: Ticket) {
    setEditId(t.id);
    setForm({
      customer_id: t.customer_id, technician_id: t.technician_id || '',
      ticket_type: t.ticket_type, status: t.status, priority: t.priority,
      description: t.description || '', scheduled_date: t.scheduled_date || '',
      scheduled_time: t.scheduled_time || '', notes: t.notes || '',
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.customer_id) { alert('Selecione um cliente.'); return; }
    const payload = {
      customer_id: form.customer_id, technician_id: form.technician_id || null,
      ticket_type: form.ticket_type, status: form.status, priority: form.priority,
      description: form.description || null, scheduled_date: form.scheduled_date || null,
      scheduled_time: form.scheduled_time || null, notes: form.notes || null,
      completed_at: form.status === 'completed' ? new Date().toISOString() : null,
    };
    if (editId) {
      const { error } = await supabase.from('tickets').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editId);
      if (error) { alert('Erro: ' + error.message); return; }
    } else {
      const { error } = await supabase.from('tickets').insert(payload);
      if (error) { alert('Erro: ' + error.message); return; }
    }
    setModalOpen(false);
    load();
  }

  async function updateStatus(t: Ticket, status: TicketStatus) {
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    if (status !== 'completed') updates.completed_at = null;
    const { error } = await supabase.from('tickets').update(updates).eq('id', t.id);
    if (error) { alert('Erro: ' + error.message); return; }
    load();
  }

  const statusColors: Record<string, string> = {
    pending: 'orange', assigned: 'blue', in_progress: 'blue',
    completed: 'green', cancelled: 'red',
  };

  if (loading) return <LoadingSpinner />;

  const renderItem = ({ item: t }: { item: Ticket }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <View style={styles.cardBadges}>
            <Text style={styles.ticketNumber}>#{String(t.ticket_number).padStart(5, '0')}</Text>
            <Badge color={statusColors[t.status]}>{TICKET_STATUS_LABELS[t.status as TicketStatus]}</Badge>
            <Badge color="gray">{TICKET_TYPE_LABELS[t.ticket_type as TicketType]}</Badge>
          </View>
          <Text style={styles.cardTitle}>{t.customer?.name || 'Cliente removido'}</Text>
          <View style={{ gap: 2, marginTop: 4 }}>
            {t.technician && <Text style={styles.cardInfo}>  {t.technician.name}</Text>}
            {t.scheduled_date && <Text style={styles.cardInfo}>  {new Date(t.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR')} {t.scheduled_time}</Text>}
            {t.description && <Text style={styles.cardDesc}>{t.description}</Text>}
          </View>
        </View>
        <View style={styles.cardActions}>
          {isTechnician && t.status !== 'completed' && t.status !== 'cancelled' && (
            <>
              {t.status === 'pending' && (
                <Button size="sm" variant="secondary" onPress={() => updateStatus(t, 'in_progress')}>Iniciar</Button>
              )}
              {t.status === 'in_progress' && (
                <Button size="sm" variant="success" onPress={() => updateStatus(t, 'completed')}>Concluir</Button>
              )}
            </>
          )}
          {canManage && t.status !== 'completed' && t.status !== 'cancelled' && (
            <Button size="sm" variant="danger" onPress={() => updateStatus(t, 'cancelled')}>Cancelar</Button>
          )}
          {canManage && (
            <Pressable onPress={() => openEdit(t)} style={styles.iconBtn}>
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
          <Text style={styles.title}>{isTechnician ? 'Meus Atendimentos' : 'Atendimentos'}</Text>
          <Text style={styles.subtitle}>{tickets.length} registros</Text>
        </View>
        {canManage && <Button onPress={openNew}><Text>+ Novo Atendimento</Text></Button>}
      </View>

      {isTechnician && technicians.length > 0 && (
        <View style={styles.techSelector}>
          <Ionicons name="person" size={18} color="#00d2ff" />
          <Text style={styles.techLabel}>Logado como técnico:</Text>
          <View style={styles.techOptions}>
            {technicians.map(t => (
              <Pressable key={t.id} onPress={() => setTechnicianId(t.id)} style={[styles.techOption, technicianId === t.id && styles.techOptionActive]}>
                <Text style={[styles.techOptionText, technicianId === t.id && styles.techOptionTextActive]}>{t.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Buscar por cliente ou protocolo..." placeholderTextColor="#475569" style={styles.searchInput} />
        </View>
      </View>

      <View style={styles.filterRow}>
        <Pressable onPress={() => setStatusFilter('all')} style={[styles.filterBtn, statusFilter === 'all' && styles.filterBtnActive]}>
          <Text style={[styles.filterText, statusFilter === 'all' && styles.filterTextActive]}>Todos</Text>
        </Pressable>
        {Object.entries(TICKET_STATUS_LABELS).map(([v, l]) => (
          <Pressable key={v} onPress={() => setStatusFilter(v)} style={[styles.filterBtn, statusFilter === v && styles.filterBtnActive]}>
            <Text style={[styles.filterText, statusFilter === v && styles.filterTextActive]}>{l}</Text>
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum atendimento encontrado" subtitle="Abra um novo atendimento para começar." />
      ) : (
        <FlatList data={filtered} renderItem={renderItem} keyExtractor={item => item.id} contentContainerStyle={{ gap: 12, paddingBottom: 20 }} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Atendimento' : 'Novo Atendimento'}>
        <View style={{ gap: 16 }}>
          <Select label="Cliente" value={form.customer_id} onChange={v => setForm({ ...form, customer_id: v })} required options={customers.map(c => ({ value: c.id, label: c.name }))} />
          {canManage && (
            <Select label="Técnico Responsável" value={form.technician_id} onChange={v => setForm({ ...form, technician_id: v })} options={technicians.map(t => ({ value: t.id, label: t.name }))} />
          )}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Select label="Tipo" value={form.ticket_type} onChange={v => setForm({ ...form, ticket_type: v as TicketType })} options={Object.entries(TICKET_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            </View>
            <View style={{ flex: 1 }}>
              <Select label="Prioridade" value={form.priority} onChange={v => setForm({ ...form, priority: v as TicketPriority })} options={Object.entries(TICKET_PRIORITY_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            </View>
          </View>
          {canManage && (
            <Select label="Status" value={form.status} onChange={v => setForm({ ...form, status: v as TicketStatus })} options={Object.entries(TICKET_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          )}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <DateField label="Data Agendada" value={form.scheduled_date} onChange={v => setForm({ ...form, scheduled_date: v })} />
            </View>
            <View style={{ flex: 1 }}>
              <TimeField label="Hora" value={form.scheduled_time} onChange={v => setForm({ ...form, scheduled_time: v })} />
            </View>
          </View>
          <Textarea label="Descrição" value={form.description} onChange={v => setForm({ ...form, description: v })} placeholder="Descreva o atendimento..." />
          <Textarea label="Observações Técnicas" value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
          <View style={styles.modalActions}>
            <Button variant="secondary" onPress={() => setModalOpen(false)}>Cancelar</Button>
            <Button onPress={save}>{editId ? 'Salvar' : 'Abrir Atendimento'}</Button>
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
  techSelector: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,210,255,0.05)', borderWidth: 1, borderColor: 'rgba(0,210,255,0.15)', borderRadius: 10, padding: 12, marginBottom: 12, flexWrap: 'wrap' },
  techLabel: { fontSize: 14, color: '#94a3b8' },
  techOptions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  techOption: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#0a0e17' },
  techOptionActive: { backgroundColor: 'rgba(0,210,255,0.1)', borderColor: 'rgba(0,210,255,0.3)' },
  techOptionText: { fontSize: 13, color: '#94a3b8' },
  techOptionTextActive: { color: '#00d2ff', fontWeight: '600' },
  searchRow: { marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#0a0e17', borderRadius: 10, paddingHorizontal: 12 },
  searchInput: { flex: 1, color: '#f1f5f9', fontSize: 14, paddingVertical: 10 },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#0a0e17' },
  filterBtnActive: { backgroundColor: 'rgba(0,210,255,0.1)', borderColor: 'rgba(0,210,255,0.3)' },
  filterText: { fontSize: 13, color: '#94a3b8' },
  filterTextActive: { color: '#00d2ff', fontWeight: '600' },
  card: { backgroundColor: '#121826', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 20 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' },
  cardBadges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  ticketNumber: { fontSize: 13, color: '#64748b', fontFamily: 'monospace' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#f1f5f9' },
  cardInfo: { fontSize: 14, color: '#94a3b8' },
  cardDesc: { fontSize: 12, color: '#475569', marginTop: 4 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  iconBtn: { padding: 8, borderRadius: 8 },
  row: { flexDirection: 'row', gap: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
});
