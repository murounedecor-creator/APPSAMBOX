import { useState, useEffect, useCallback } from 'react';
import { Plus, BarChart3, TrendingUp, TrendingDown, Target, Eye, MousePointerClick, Trash2 } from 'lucide-react';
import { supabase, type AdMetric, type Sale } from '@/lib/supabase';
import { useRole } from '@/lib/RoleContext';
import { Modal, Button, Input, Textarea, EmptyState, LoadingSpinner } from '@/components/ui';

export function Metrics() {
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdMetric[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState('month');

  const [form, setForm] = useState({
    metric_date: new Date().toISOString().split('T')[0],
    platform: '', ad_name: '',
    impressions: '0', clicks: '0', cost: '0',
    conversions: '0', revenue: '0', notes: '',
  });

  const canEdit = role === 'owner';

  const load = useCallback(async () => {
    setLoading(true);
    const [mRes, sRes] = await Promise.all([
      supabase.from('ad_metrics').select('*').order('metric_date', { ascending: false }),
      supabase.from('sales').select('sale_date, final_amount').order('sale_date', { ascending: false }),
    ]);
    setMetrics(mRes.data || []);
    setSales((sRes.data || []) as unknown as Sale[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const filteredMetrics = periodFilter === 'month'
    ? metrics.filter(m => m.metric_date >= monthStart)
    : periodFilter === 'week'
    ? metrics.filter(m => m.metric_date >= weekStart)
    : metrics;

  const filteredSales = periodFilter === 'month'
    ? sales.filter(s => s.sale_date >= monthStart)
    : periodFilter === 'week'
    ? sales.filter(s => s.sale_date >= weekStart)
    : sales;

  const totalImpressions = filteredMetrics.reduce((s, m) => s + m.impressions, 0);
  const totalClicks = filteredMetrics.reduce((s, m) => s + m.clicks, 0);
  const totalCost = filteredMetrics.reduce((s, m) => s + m.cost, 0);
  const totalConversions = filteredMetrics.reduce((s, m) => s + m.conversions, 0);
  const totalAdRevenue = filteredMetrics.reduce((s, m) => s + m.revenue, 0);
  const totalSalesRevenue = filteredSales.reduce((s, m) => s + m.final_amount, 0);
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0';
  const cpc = totalClicks > 0 ? (totalCost / totalClicks).toFixed(2) : '0';
  const cpa = totalConversions > 0 ? (totalCost / totalConversions).toFixed(2) : '0';
  const roas = totalCost > 0 ? (totalAdRevenue / totalCost).toFixed(2) : '0';

  async function save() {
    const payload = {
      metric_date: form.metric_date,
      platform: form.platform || 'N/A',
      ad_name: form.ad_name || null,
      impressions: parseInt(form.impressions) || 0,
      clicks: parseInt(form.clicks) || 0,
      cost: parseFloat(form.cost) || 0,
      conversions: parseInt(form.conversions) || 0,
      revenue: parseFloat(form.revenue) || 0,
      notes: form.notes || null,
    };
    const { error } = await supabase.from('ad_metrics').insert(payload);
    if (error) { alert('Erro: ' + error.message); return; }
    setModalOpen(false);
    setForm({ metric_date: new Date().toISOString().split('T')[0], platform: '', ad_name: '', impressions: '0', clicks: '0', cost: '0', conversions: '0', revenue: '0', notes: '' });
    load();
  }

  async function deleteMetric(id: string) {
    await supabase.from('ad_metrics').delete().eq('id', id);
    load();
  }

  function formatBRL(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Métricas e Anúncios</h1>
          <p className="text-gray-500 text-sm mt-1">Desempenho de vendas e publicidade</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#cbd5e1] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00d9ff]/40 focus:border-[#00d9ff]"
          >
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
            <option value="all">Tudo</option>
          </select>
          {canEdit && (
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={18} className="inline mr-1" /> Registrar Métrica
            </Button>
          )}
        </div>
      </div>

      {/* Sales summary */}
      <div className="bg-gradient-to-br from-[#05070d] to-[#0b2b55] rounded-2xl border border-[#172033] p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={20} /> Resumo de Vendas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-3xl font-bold text-[#00d9ff]">{filteredSales.length}</p>
            <p className="text-sm text-[#94a3b8]">Vendas no período</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#00d9ff]">{formatBRL(totalSalesRevenue)}</p>
            <p className="text-sm text-[#94a3b8]">Receita total</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#00d9ff]">
              {filteredSales.length > 0 ? formatBRL(totalSalesRevenue / filteredSales.length) : formatBRL(0)}
            </p>
            <p className="text-sm text-[#94a3b8]">Ticket médio</p>
          </div>
        </div>
      </div>

      {/* Ad metrics */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-[#2563eb]" /> Desempenho de Anúncios
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <MetricCard icon={Eye} label="Impressões" value={totalImpressions.toLocaleString('pt-BR')} />
          <MetricCard icon={MousePointerClick} label="Cliques" value={totalClicks.toLocaleString('pt-BR')} />
          <MetricCard icon={Target} label="Conversões" value={String(totalConversions)} />
          <MetricCard icon={TrendingDown} label="Investimento" value={formatBRL(totalCost)} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <KPI label="CTR" value={`${ctr}%`} />
          <KPI label="CPC" value={formatBRL(parseFloat(cpc))} />
          <KPI label="CPA" value={formatBRL(parseFloat(cpa))} />
          <KPI label="ROAS" value={`${roas}x`} highlight={parseFloat(roas) >= 1} />
        </div>

        {filteredMetrics.length === 0 ? (
          <EmptyState icon={BarChart3} title="Nenhuma métrica registrada" subtitle="Registre métricas de anúncios para acompanhar o desempenho." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="py-2 px-3 font-medium text-gray-500">Data</th>
                  <th className="py-2 px-3 font-medium text-gray-500">Plataforma</th>
                  <th className="py-2 px-3 font-medium text-gray-500">Anúncio</th>
                  <th className="py-2 px-3 font-medium text-gray-500 text-right">Impr.</th>
                  <th className="py-2 px-3 font-medium text-gray-500 text-right">Cliques</th>
                  <th className="py-2 px-3 font-medium text-gray-500 text-right">Custo</th>
                  <th className="py-2 px-3 font-medium text-gray-500 text-right">Conv.</th>
                  <th className="py-2 px-3 font-medium text-gray-500 text-right">Receita</th>
                  {canEdit && <th></th>}
                </tr>
              </thead>
              <tbody>
                {filteredMetrics.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3">{new Date(m.metric_date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="py-2 px-3 font-medium">{m.platform}</td>
                    <td className="py-2 px-3 text-gray-500">{m.ad_name || '-'}</td>
                    <td className="py-2 px-3 text-right">{m.impressions.toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-3 text-right">{m.clicks.toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-3 text-right">{formatBRL(m.cost)}</td>
                    <td className="py-2 px-3 text-right">{m.conversions}</td>
                    <td className="py-2 px-3 text-right font-medium text-[#0284c7]">{formatBRL(m.revenue)}</td>
                    {canEdit && (
                      <td className="py-2 px-3">
                        <button onClick={() => deleteMetric(m.id)} className="p-1 rounded hover:bg-red-50 text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Métrica de Anúncio">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Data" value={form.metric_date} onChange={(v) => setForm({ ...form, metric_date: v })} type="date" />
            <Input label="Plataforma" value={form.platform} onChange={(v) => setForm({ ...form, platform: v })} placeholder="Facebook, Google, Instagram..." />
          </div>
          <Input label="Nome do Anúncio" value={form.ad_name} onChange={(v) => setForm({ ...form, ad_name: v })} placeholder="Identificação do anúncio" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Impressões" value={form.impressions} onChange={(v) => setForm({ ...form, impressions: v })} type="number" />
            <Input label="Cliques" value={form.clicks} onChange={(v) => setForm({ ...form, clicks: v })} type="number" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Custo (R$)" value={form.cost} onChange={(v) => setForm({ ...form, cost: v })} type="number" />
            <Input label="Conversões" value={form.conversions} onChange={(v) => setForm({ ...form, conversions: v })} type="number" />
          </div>
          <Input label="Receita Gerada (R$)" value={form.revenue} onChange={(v) => setForm({ ...form, revenue: v })} type="number" />
          <Textarea label="Observações" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} rows={2} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Registrar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
      <Icon size={18} className="text-gray-400 mb-2" />
      <p className="text-xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function KPI({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-lg border ${highlight ? 'bg-[#e0f2fe] border-[#bae6fd]' : 'bg-[#eef2f9] border-[#e2e8f0]'}`}>
      <p className={`text-lg font-bold ${highlight ? 'text-[#0284c7]' : 'text-[#0f172a]'}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
