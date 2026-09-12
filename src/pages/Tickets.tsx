import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Ticket as TicketIcon, Clock, CheckCircle2, XCircle,
  Edit2, FileText, User, Calendar, Filter
} from 'lucide-react';
import {
  supabase, type Ticket, type Customer, type Technician,
  type TicketStatus, type TicketType, type TicketPriority,
  TICKET_STATUS_LABELS, TICKET_TYPE_LABELS, TICKET_PRIORITY_LABELS,
} from '@/lib/supabase';
import { useRole } from '@/lib/RoleContext';
import { Modal, Button, Input, Select, Textarea, Badge, EmptyState, LoadingSpinner } from '@/components/ui';
import { generateTicketPDF, openPDF } from '@/lib/pdf';

export function Tickets() {
  const { role, technicianId, setTechnicianId } = useRole();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);

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
    setForm({
      customer_id: '', technician_id: '', ticket_type: 'maintenance',
      status: 'pending', priority: 'normal', description: '',
      scheduled_date: '', scheduled_time: '', notes: '',
    });
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
      customer_id: form.customer_id,
      technician_id: form.technician_id || null,
      ticket_type: form.ticket_type,
      status: form.status,
      priority: form.priority,
      description: form.description || null,
      scheduled_date: form.scheduled_date || null,
      scheduled_time: form.scheduled_time || null,
      notes: form.notes || null,
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

  function handlePDF(t: Ticket) {
    const html = generateTicketPDF(t, t.customer);
    openPDF(html);
  }

  const statusColors: Record<string, string> = {
    pending: 'orange', assigned: 'blue', in_progress: 'blue',
    completed: 'green', cancelled: 'red',
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isTechnician ? 'Meus Atendimentos' : 'Atendimentos'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{tickets.length} registros</p>
        </div>
        {canManage && (
          <Button onClick={openNew}>
            <Plus size={18} className="inline mr-1" /> Novo Atendimento
          </Button>
        )}
      </div>

      {isTechnician && technicians.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-3">
          <User size={18} className="text-blue-600" />
          <span className="text-sm text-blue-800">Logado como técnico:</span>
          <select
            value={technicianId || ''}
            onChange={(e) => setTechnicianId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-blue-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente ou protocolo..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="assigned">Atribuído</option>
            <option value="in_progress">Em Andamento</option>
            <option value="completed">Concluído</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={TicketIcon} title="Nenhum atendimento encontrado" subtitle="Abra um novo atendimento para começar." />
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-gray-400">#{String(t.ticket_number).padStart(5, '0')}</span>
                    <Badge color={statusColors[t.status]}>{TICKET_STATUS_LABELS[t.status as TicketStatus]}</Badge>
                    <Badge color="gray">{TICKET_TYPE_LABELS[t.ticket_type as TicketType]}</Badge>
                  </div>
                  <h3 className="font-semibold text-gray-800">{t.customer?.name || 'Cliente removido'}</h3>
                  <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                    {t.technician && <p className="flex items-center gap-1"><User size={12} /> {t.technician.name}</p>}
                    {t.scheduled_date && <p className="flex items-center gap-1"><Calendar size={12} /> {new Date(t.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR')} {t.scheduled_time}</p>}
                    {t.description && <p className="text-gray-400 text-xs mt-1">{t.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {isTechnician && t.status !== 'completed' && t.status !== 'cancelled' && (
                    <>
                      {t.status === 'pending' && (
                        <Button size="sm" variant="secondary" onClick={() => updateStatus(t, 'in_progress')}>Iniciar</Button>
                      )}
                      {t.status === 'in_progress' && (
                        <Button size="sm" variant="success" onClick={() => updateStatus(t, 'completed')}>
                          <CheckCircle2 size={14} className="inline mr-1" /> Concluir
                        </Button>
                      )}
                    </>
                  )}
                  {canManage && (
                    <>
                      {t.status !== 'completed' && t.status !== 'cancelled' && (
                        <Button size="sm" variant="danger" onClick={() => updateStatus(t, 'cancelled')}>
                          <XCircle size={14} className="inline mr-1" /> Cancelar
                        </Button>
                      )}
                      <button onClick={() => openEdit(t)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600" title="Editar">
                        <Edit2 size={16} />
                      </button>
                    </>
                  )}
                  <button onClick={() => handlePDF(t)} className="p-2 rounded-lg hover:bg-amber-50 text-amber-600" title="Gerar PDF">
                    <FileText size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Atendimento' : 'Novo Atendimento'}>
        <div className="space-y-4">
          <Select
            label="Cliente"
            value={form.customer_id}
            onChange={(v) => setForm({ ...form, customer_id: v })}
            required
            options={customers.map(c => ({ value: c.id, label: c.name }))}
          />
          {canManage && (
            <Select
              label="Técnico Responsável"
              value={form.technician_id}
              onChange={(v) => setForm({ ...form, technician_id: v })}
              options={technicians.map(t => ({ value: t.id, label: t.name }))}
            />
          )}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tipo"
              value={form.ticket_type}
              onChange={(v) => setForm({ ...form, ticket_type: v as TicketType })}
              options={Object.entries(TICKET_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            />
            <Select
              label="Prioridade"
              value={form.priority}
              onChange={(v) => setForm({ ...form, priority: v as TicketPriority })}
              options={Object.entries(TICKET_PRIORITY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            />
          </div>
          {canManage && (
            <Select
              label="Status"
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v as TicketStatus })}
              options={Object.entries(TICKET_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            />
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Data Agendada" value={form.scheduled_date} onChange={(v) => setForm({ ...form, scheduled_date: v })} type="date" />
            <Input label="Hora" value={form.scheduled_time} onChange={(v) => setForm({ ...form, scheduled_time: v })} type="time" />
          </div>
          <Textarea label="Descrição" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Descreva o atendimento..." />
          <Textarea label="Observações Técnicas" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} rows={2} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editId ? 'Salvar' : 'Abrir Atendimento'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
