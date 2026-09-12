import { useState, useEffect, useCallback } from 'react';
import { Plus, Wrench, Phone, Mail, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase, type Technician } from '@/lib/supabase';
import { useRole } from '@/lib/RoleContext';
import { Modal, Button, Input, Badge, EmptyState, LoadingSpinner } from '@/components/ui';

export function Technicians() {
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

  function openNew() {
    setEditId(null);
    setForm({ name: '', phone: '', email: '' });
    setModalOpen(true);
  }

  function openEdit(t: Technician) {
    setEditId(t.id);
    setForm({ name: t.name, phone: t.phone || '', email: t.email || '' });
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), phone: form.phone || null, email: form.email || null };
    if (editId) {
      await supabase.from('technicians').update(payload).eq('id', editId);
    } else {
      await supabase.from('technicians').insert(payload);
    }
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Técnicos</h1>
          <p className="text-gray-500 text-sm mt-1">{technicians.length} cadastrados</p>
        </div>
        {canEdit && (
          <Button onClick={openNew}>
            <Plus size={18} className="inline mr-1" /> Novo Técnico
          </Button>
        )}
      </div>

      {technicians.length === 0 ? (
        <EmptyState icon={Wrench} title="Nenhum técnico cadastrado" subtitle="Cadastre técnicos para atribuir atendimentos." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicians.map((t) => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Wrench size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{t.name}</h3>
                    <Badge color={t.active ? 'green' : 'gray'}>{t.active ? 'Ativo' : 'Inativo'}</Badge>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setDeleteConfirm(t)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-1 text-sm text-gray-500">
                {t.phone && <p className="flex items-center gap-2"><Phone size={14} /> {t.phone}</p>}
                {t.email && <p className="flex items-center gap-2"><Mail size={14} /> {t.email}</p>}
              </div>
              {canEdit && (
                <button
                  onClick={() => toggleActive(t)}
                  className="mt-3 text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                >
                  <CheckCircle2 size={14} />
                  {t.active ? 'Marcar como inativo' : 'Reativar'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Técnico' : 'Novo Técnico'}>
        <div className="space-y-4">
          <Input label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required placeholder="Nome do técnico" />
          <Input label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="(00) 00000-0000" />
          <Input label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editId ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Excluir Técnico" maxWidth="max-w-md">
        <p className="text-gray-600">
          Excluir <strong>{deleteConfirm?.name}</strong>? Atendimentos vinculados ficarão sem técnico atribuído.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onClick={deleteTech}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}
