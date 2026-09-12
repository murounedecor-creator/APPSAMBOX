import { useState, useEffect, useCallback } from 'react';
import { Plus, Tag, Edit2, Trash2, DollarSign } from 'lucide-react';
import { supabase, type Plan } from '@/lib/supabase';
import { useRole } from '@/lib/RoleContext';
import { Modal, Button, Input, Textarea, Badge, EmptyState, LoadingSpinner } from '@/components/ui';

export function Plans() {
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

  function openNew() {
    setEditId(null);
    setForm({ name: '', description: '', price: '0', variation: '' });
    setModalOpen(true);
  }

  function openEdit(p: Plan) {
    setEditId(p.id);
    setForm({ name: p.name, description: p.description || '', price: String(p.price), variation: p.variation || '' });
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      description: form.description || null,
      price: parseFloat(form.price) || 0,
      variation: form.variation || null,
    };
    if (editId) {
      await supabase.from('plans').update(payload).eq('id', editId);
    } else {
      await supabase.from('plans').insert(payload);
    }
    setModalOpen(false);
    load();
  }

  async function deletePlan() {
    if (!deleteConfirm) return;
    const { error } = await supabase.from('plans').delete().eq('id', deleteConfirm.id);
    if (error) {
      alert('Não foi possível excluir — verifique se há clientes ou vendas vinculados a este plano.');
      return;
    }
    setDeleteConfirm(null);
    load();
  }

  function formatBRL(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Planos e Produtos</h1>
          <p className="text-gray-500 text-sm mt-1">{plans.length} cadastrados</p>
        </div>
        {canEdit && (
          <Button onClick={openNew}>
            <Plus size={18} className="inline mr-1" /> Novo Plano
          </Button>
        )}
      </div>

      {plans.length === 0 ? (
        <EmptyState icon={Tag} title="Nenhum plano cadastrado" subtitle="Cadastre planos para vincular aos clientes." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Tag size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{p.name}</h3>
                    {p.variation && <Badge color="purple">{p.variation}</Badge>}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setDeleteConfirm(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-emerald-600 flex items-center gap-1">
                <DollarSign size={18} />
                {formatBRL(p.price)}
              </p>
              {p.description && <p className="mt-2 text-sm text-gray-500">{p.description}</p>}
              <div className="mt-2">
                <Badge color={p.active ? 'green' : 'gray'}>{p.active ? 'Ativo' : 'Inativo'}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Plano' : 'Novo Plano'}>
        <div className="space-y-4">
          <Input label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required placeholder="Ultimate, Mensal, etc." />
          <Input label="Variação" value={form.variation} onChange={(v) => setForm({ ...form, variation: v })} placeholder="Ex: de Muvo, normal, etc." />
          <Input label="Preço (R$)" value={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" required />
          <Textarea label="Descrição" value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={2} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editId ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Excluir Plano" maxWidth="max-w-md">
        <p className="text-gray-600">
          Excluir o plano <strong>{deleteConfirm?.name}</strong>? Esta ação pode falhar se houver clientes ou vendas vinculados.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onClick={deletePlan}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}
