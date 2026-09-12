import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, DollarSign, FileText, Edit2, Tag, TrendingUp } from 'lucide-react';
import { supabase, type Sale, type Customer, type Plan } from '@/lib/supabase';
import { useRole } from '@/lib/RoleContext';
import { Modal, Button, Input, Select, Textarea, Badge, EmptyState, LoadingSpinner } from '@/components/ui';
import { generateSalePDF, openPDF } from '@/lib/pdf';

export function Sales() {
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
    !search ||
    s.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    String(s.sale_number).includes(search)
  );

  function openNew() {
    setEditId(null);
    setForm({
      customer_id: '', plan_id: '', variation: '',
      amount: '0', has_discount: false, discount_value: '0',
      payment_method: '', payment_condition: '', sale_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
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
      customer_id: form.customer_id,
      plan_id: form.plan_id || null,
      variation: form.variation || null,
      amount,
      has_discount: form.has_discount,
      discount_value: discount,
      final_amount: final,
      payment_method: form.payment_method || null,
      payment_condition: form.payment_condition || null,
      sale_date: form.sale_date,
      notes: form.notes || null,
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

  function handlePDF(s: Sale) {
    const html = generateSalePDF(s, s.customer as Customer | undefined);
    openPDF(html);
  }

  function formatBRL(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vendas</h1>
          <p className="text-gray-500 text-sm mt-1">{sales.length} registros</p>
        </div>
        {canManage && (
          <Button onClick={openNew}>
            <Plus size={18} className="inline mr-1" /> Nova Venda
          </Button>
        )}
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente ou número..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={DollarSign} title="Nenhuma venda encontrada" subtitle="Registre a primeira venda para começar." />
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-gray-400">#{String(s.sale_number).padStart(5, '0')}</span>
                    {s.has_discount && <Badge color="green">Desconto</Badge>}
                  </div>
                  <h3 className="font-semibold text-gray-800">{s.customer?.name || 'Cliente removido'}</h3>
                  <div className="text-sm text-gray-500 mt-1">
                    <p className="flex items-center gap-1"><Tag size={12} /> {s.plan?.name || '-'} {s.variation ? `(${s.variation})` : ''}</p>
                    <p className="flex items-center gap-1"><TrendingUp size={12} /> {new Date(s.sale_date + 'T00:00:00').toLocaleDateString('pt-BR')} — {s.payment_method || 'Pagamento não informado'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">{formatBRL(s.final_amount)}</p>
                  {s.has_discount && s.discount_value > 0 && (
                    <p className="text-xs text-gray-400 line-through">{formatBRL(s.amount)}</p>
                  )}
                  <div className="flex items-center gap-1 mt-2 justify-end">
                    {canManage && (
                      <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600" title="Editar">
                        <Edit2 size={16} />
                      </button>
                    )}
                    <button onClick={() => handlePDF(s)} className="p-2 rounded-lg hover:bg-amber-50 text-amber-600" title="Gerar PDF">
                      <FileText size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Venda' : 'Nova Venda'}>
        <div className="space-y-4">
          <Select
            label="Cliente"
            value={form.customer_id}
            onChange={(v) => setForm({ ...form, customer_id: v })}
            required
            options={customers.map(c => ({ value: c.id, label: c.name }))}
          />
          <Select
            label="Plano/Produto"
            value={form.plan_id}
            onChange={(v) => {
              const plan = plans.find(p => p.id === v);
              setForm({ ...form, plan_id: v, amount: plan ? String(plan.price) : form.amount });
            }}
            options={plans.map(p => ({ value: p.id, label: `${p.name} ${p.variation ? `(${p.variation})` : ''} — ${formatBRL(p.price)}` }))}
          />
          <Input label="Variação (ex: de Muvo)" value={form.variation} onChange={(v) => setForm({ ...form, variation: v })} placeholder="Variação específica do produto" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Valor (R$)" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} type="number" required />
            <Input label="Data da Venda" value={form.sale_date} onChange={(v) => setForm({ ...form, sale_date: v })} type="date" />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.has_discount}
                onChange={(e) => setForm({ ...form, has_discount: e.target.checked })}
                className="w-4 h-4 rounded accent-amber-600"
              />
              <span className="text-sm font-medium text-gray-700">Aplicar desconto</span>
            </label>
            {form.has_discount && (
              <Input label="Desconto (R$)" value={form.discount_value} onChange={(v) => setForm({ ...form, discount_value: v })} type="number" />
            )}
          </div>
          {form.has_discount && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <p className="text-sm text-emerald-800">
                Total final: <span className="font-bold">{formatBRL((parseFloat(form.amount) || 0) - (parseFloat(form.discount_value) || 0))}</span>
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Forma de Pagamento" value={form.payment_method} onChange={(v) => setForm({ ...form, payment_method: v })} placeholder="Pix, Cartão, Boleto..." />
            <Input label="Condição" value={form.payment_condition} onChange={(v) => setForm({ ...form, payment_condition: v })} placeholder="À vista, 3x, ..." />
          </div>
          <Textarea label="Observações" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editId ? 'Salvar' : 'Registrar Venda'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
