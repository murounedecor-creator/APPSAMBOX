import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Users, Phone, Mail, MapPin, Edit2, Trash2, Tag, X } from 'lucide-react';
import { supabase, type Customer, type Plan, type CustomerPlan } from '@/lib/supabase';
import { useRole } from '@/lib/RoleContext';
import { Modal, Button, Input, Textarea, Badge, EmptyState, LoadingSpinner } from '@/components/ui';

export function Customers() {
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

  const [form, setForm] = useState({
    name: '', phone: '', email: '', cpf_cnpj: '', address: '', city: '', state: '', zipcode: '', notes: '',
    has_discount: false, discount_value: '0',
  });

  const canEdit = role === 'owner' || role === 'manager';

  const load = useCallback(async () => {
    setLoading(true);
    const [custRes, planRes] = await Promise.all([
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
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
      name: form.name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      cpf_cnpj: form.cpf_cnpj || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      zipcode: form.zipcode || null,
      notes: form.notes || null,
      has_discount: form.has_discount,
      discount_value: parseFloat(form.discount_value) || 0,
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
    if (error) {
      alert('Não foi possível excluir — verifique se há atendimentos ou vendas vinculados a este cliente.');
      return;
    }
    setDeleteConfirm(null);
    load();
  }

  async function openPlans(c: Customer) {
    setSelectedCustomer(c);
    const { data } = await supabase
      .from('customer_plans')
      .select('*, plan:plans(*)')
      .eq('customer_id', c.id);
    setCustomerPlans(data || []);
    setPlansModalOpen(true);
  }

  async function addPlan(planId: string, variation: string) {
    if (!selectedCustomer) return;
    const { error } = await supabase.from('customer_plans').insert({
      customer_id: selectedCustomer.id,
      plan_id: planId,
      variation: variation || null,
    });
    if (error) { alert('Erro: ' + error.message); return; }
    const { data } = await supabase
      .from('customer_plans')
      .select('*, plan:plans(*)')
      .eq('customer_id', selectedCustomer.id);
    setCustomerPlans(data || []);
  }

  async function removePlan(cpId: string) {
    await supabase.from('customer_plans').delete().eq('id', cpId);
    if (selectedCustomer) {
      const { data } = await supabase
        .from('customer_plans')
        .select('*, plan:plans(*)')
        .eq('customer_id', selectedCustomer.id);
      setCustomerPlans(data || []);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">{customers.length} cadastrados</p>
        </div>
        {canEdit && (
          <Button onClick={openNew}>
            <Plus size={18} className="inline mr-1" /> Novo Cliente
          </Button>
        )}
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, telefone ou e-mail..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#cbd5e1] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00d9ff]/40 focus:border-[#00d9ff]"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum cliente encontrado" subtitle="Cadastre seu primeiro cliente para começar." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{c.name}</h3>
                  {c.has_discount && (
                    <Badge color="green">Desconto ativo</Badge>
                  )}
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <button onClick={() => openPlans(c)} className="p-1.5 rounded-lg hover:bg-[#e0f2fe] text-[#0284c7]" title="Planos">
                      <Tag size={16} />
                    </button>
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setDeleteConfirm(c)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-1 text-sm text-gray-500">
                {c.phone && <p className="flex items-center gap-2"><Phone size={14} /> {c.phone}</p>}
                {c.email && <p className="flex items-center gap-2"><Mail size={14} /> {c.email}</p>}
                {c.address && <p className="flex items-center gap-2"><MapPin size={14} /> {[c.address, c.city, c.state].filter(Boolean).join(', ')}</p>}
              </div>
              {c.notes && <p className="mt-2 text-xs text-gray-400 italic">{c.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Customer form modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Cliente' : 'Novo Cliente'}>
        <div className="space-y-4">
          <Input label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required placeholder="Nome completo" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="(00) 00000-0000" />
            <Input label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
          </div>
          <Input label="CPF/CNPJ" value={form.cpf_cnpj} onChange={(v) => setForm({ ...form, cpf_cnpj: v })} />
          <Input label="Endereço" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Cidade" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            <Input label="UF" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
            <Input label="CEP" value={form.zipcode} onChange={(v) => setForm({ ...form, zipcode: v })} />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.has_discount}
                onChange={(e) => setForm({ ...form, has_discount: e.target.checked })}
                className="w-4 h-4 rounded accent-[#2563eb]"
              />
              <span className="text-sm font-medium text-gray-700">Possui desconto</span>
            </label>
            {form.has_discount && (
              <Input label="Valor do Desconto (R$)" value={form.discount_value} onChange={(v) => setForm({ ...form, discount_value: v })} type="number" />
            )}
          </div>
          <Textarea label="Observações" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editId ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </div>
      </Modal>

      {/* Plans modal */}
      <Modal open={plansModalOpen} onClose={() => setPlansModalOpen(false)} title={`Planos — ${selectedCustomer?.name || ''}`}>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Planos Vinculados</h3>
            {customerPlans.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center bg-gray-50 rounded-lg">Nenhum plano vinculado.</p>
            ) : (
              <div className="space-y-2">
                {customerPlans.map((cp) => (
                  <div key={cp.id} className="flex items-center justify-between p-3 rounded-lg bg-[#e0f2fe] border border-[#bae6fd]">
                    <div>
                      <p className="font-medium text-gray-800">{cp.plan?.name || 'Plano removido'}</p>
                      {cp.variation && <p className="text-xs text-gray-500">Variação: {cp.variation}</p>}
                    </div>
                    {canEdit && (
                      <button onClick={() => removePlan(cp.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-600">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {canEdit && plans.length > 0 && (
            <AddPlanForm plans={plans} onAdd={addPlan} />
          )}
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Excluir Cliente" maxWidth="max-w-md">
        <p className="text-gray-600">
          Tem certeza que deseja excluir <strong>{deleteConfirm?.name}</strong>?
          Esta ação não pode ser desfeita. Se houver atendimentos ou vendas vinculados, a exclusão será bloqueada.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => deleteConfirm && deleteCustomer(deleteConfirm)}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}

function AddPlanForm({ plans, onAdd }: { plans: Plan[]; onAdd: (planId: string, variation: string) => void }) {
  const [planId, setPlanId] = useState('');
  const [variation, setVariation] = useState('');
  return (
    <div className="border-t border-gray-100 pt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Adicionar Plano</h3>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00d9ff]/40 focus:border-[#00d9ff]"
          >
            <option value="">Selecione um plano...</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name} {p.variation ? `(${p.variation})` : ''}</option>
            ))}
          </select>
        </div>
        <input
          value={variation}
          onChange={(e) => setVariation(e.target.value)}
          placeholder="Variação (opcional)"
          className="flex-1 px-3 py-2 rounded-lg border border-[#cbd5e1] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00d9ff]/40 focus:border-[#00d9ff]"
        />
        <Button size="sm" onClick={() => { if (planId) { onAdd(planId, variation); setPlanId(''); setVariation(''); } }}>
          <Plus size={16} />
        </Button>
      </div>
    </div>
  );
}
