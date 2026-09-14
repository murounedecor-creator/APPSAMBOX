import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, type AdMetric, type Sale } from '@/lib/supabase';
import { useRole } from '@/lib/RoleContext';
import { Modal, Button, Input, Textarea, EmptyState, LoadingSpinner } from '@/components/ui';

export function MetricsScreen() {
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

  const filteredMetrics = periodFilter === 'month' ? metrics.filter(m => m.metric_date >= monthStart)
    : periodFilter === 'week' ? metrics.filter(m => m.metric_date >= weekStart) : metrics;
  const filteredSales = periodFilter === 'month' ? sales.filter(s => s.sale_date >= monthStart)
    : periodFilter === 'week' ? sales.filter(s => s.sale_date >= weekStart) : sales;

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
      metric_date: form.metric_date, platform: form.platform || 'N/A', ad_name: form.ad_name || null,
      impressions: parseInt(form.impressions) || 0, clicks: parseInt(form.clicks) || 0,
      cost: parseFloat(form.cost) || 0, conversions: parseInt(form.conversions) || 0,
      revenue: parseFloat(form.revenue) || 0, notes: form.notes || null,
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

  const renderMetric = ({ item: m }: { item: AdMetric }) => (
    <View style={styles.metricRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.metricDate}>{new Date(m.metric_date + 'T00:00:00').toLocaleDateString('pt-BR')}</Text>
        <Text style={styles.metricPlatform}>{m.platform}</Text>
        <Text style={styles.metricAd}>{m.ad_name || '-'}</Text>
      </View>
      <View style={styles.metricStats}>
        <Text style={styles.metricStat}>Impr: {m.impressions.toLocaleString('pt-BR')}</Text>
        <Text style={styles.metricStat}>Clicks: {m.clicks.toLocaleString('pt-BR')}</Text>
        <Text style={styles.metricStat}>Custo: {formatBRL(m.cost)}</Text>
        <Text style={styles.metricStat}>Conv: {m.conversions}</Text>
        <Text style={styles.metricStat}>Rec: {formatBRL(m.revenue)}</Text>
      </View>
      {canEdit && (
        <Pressable onPress={() => deleteMetric(m.id)} style={styles.iconBtn}>
          <Ionicons name="trash" size={14} color="#ef4444" />
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Métricas e Anúncios</Text>
          <Text style={styles.subtitle}>Desempenho de vendas e publicidade</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.filterRow}>
            {['week', 'month', 'all'].map(f => (
              <Pressable key={f} onPress={() => setPeriodFilter(f)} style={[styles.filterBtn, periodFilter === f && styles.filterBtnActive]}>
                <Text style={[styles.filterText, periodFilter === f && styles.filterTextActive]}>
                  {f === 'week' ? 'Semana' : f === 'month' ? 'Mês' : 'Tudo'}
                </Text>
              </Pressable>
            ))}
          </View>
          {canEdit && <Button onPress={() => setModalOpen(true)}><Text>+ Registrar</Text></Button>}
        </View>
      </View>

      <View style={styles.salesSummary}>
        <Text style={styles.sectionTitle}>Resumo de Vendas</Text>
        <View style={styles.summaryGrid}>
          <View>
            <Text style={styles.summaryValue}>{filteredSales.length}</Text>
            <Text style={styles.summaryLabel}>Vendas no período</Text>
          </View>
          <View>
            <Text style={styles.summaryValue}>{formatBRL(totalSalesRevenue)}</Text>
            <Text style={styles.summaryLabel}>Receita total</Text>
          </View>
          <View>
            <Text style={styles.summaryValue}>{filteredSales.length > 0 ? formatBRL(totalSalesRevenue / filteredSales.length) : formatBRL(0)}</Text>
            <Text style={styles.summaryLabel}>Ticket médio</Text>
          </View>
        </View>
      </View>

      <View style={styles.adSection}>
        <Text style={styles.sectionTitle}>Desempenho de Anúncios</Text>
        <View style={styles.kpiGrid}>
          <MetricCard icon="eye" label="Impressões" value={totalImpressions.toLocaleString('pt-BR')} />
          <MetricCard icon="hand-left" label="Cliques" value={totalClicks.toLocaleString('pt-BR')} />
          <MetricCard icon="ribbon" label="Conversões" value={String(totalConversions)} />
          <MetricCard icon="trending-down" label="Investimento" value={formatBRL(totalCost)} />
        </View>
        <View style={styles.kpiGrid}>
          <KPI label="CTR" value={`${ctr}%`} />
          <KPI label="CPC" value={formatBRL(parseFloat(cpc))} />
          <KPI label="CPA" value={formatBRL(parseFloat(cpa))} />
          <KPI label="ROAS" value={`${roas}x`} highlight={parseFloat(roas) >= 1} />
        </View>

        {filteredMetrics.length === 0 ? (
          <EmptyState title="Nenhuma métrica registrada" subtitle="Registre métricas de anúncios para acompanhar." />
        ) : (
          <FlatList data={filteredMetrics} renderItem={renderMetric} keyExtractor={item => item.id} scrollEnabled={false} contentContainerStyle={{ gap: 8 }} />
        )}
      </View>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Métrica de Anúncio">
        <View style={{ gap: 16 }}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Data" value={form.metric_date} onChange={v => setForm({ ...form, metric_date: v })} placeholder="AAAA-MM-DD" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Plataforma" value={form.platform} onChange={v => setForm({ ...form, platform: v })} placeholder="Facebook, Google..." />
            </View>
          </View>
          <Input label="Nome do Anúncio" value={form.ad_name} onChange={v => setForm({ ...form, ad_name: v })} placeholder="Identificação do anúncio" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Impressões" value={form.impressions} onChange={v => setForm({ ...form, impressions: v })} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Cliques" value={form.clicks} onChange={v => setForm({ ...form, clicks: v })} keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Custo (R$)" value={form.cost} onChange={v => setForm({ ...form, cost: v })} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Conversões" value={form.conversions} onChange={v => setForm({ ...form, conversions: v })} keyboardType="numeric" />
            </View>
          </View>
          <Input label="Receita Gerada (R$)" value={form.revenue} onChange={v => setForm({ ...form, revenue: v })} keyboardType="numeric" />
          <Textarea label="Observações" value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
          <View style={styles.modalActions}>
            <Button variant="secondary" onPress={() => setModalOpen(false)}>Cancelar</Button>
            <Button onPress={save}>Registrar</Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MetricCard({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Ionicons name={icon} size={18} color="#64748b" />
      <Text style={styles.metricCardValue}>{value}</Text>
      <Text style={styles.metricCardLabel}>{label}</Text>
    </View>
  );
}

function KPI({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={[styles.kpiCard, highlight && styles.kpiCardHighlight]}>
      <Text style={[styles.kpiValue, highlight && styles.kpiValueHighlight]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e17', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#f1f5f9' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterRow: { flexDirection: 'row', gap: 6 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#0a0e17' },
  filterBtnActive: { backgroundColor: 'rgba(0,210,255,0.1)', borderColor: 'rgba(0,210,255,0.3)' },
  filterText: { fontSize: 13, color: '#94a3b8' },
  filterTextActive: { color: '#00d2ff', fontWeight: '600' },
  salesSummary: { backgroundColor: '#0b0c10', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#f1f5f9', marginBottom: 16 },
  summaryGrid: { flexDirection: 'row', gap: 16 },
  summaryValue: { fontSize: 28, fontWeight: '700', color: '#00d2ff' },
  summaryLabel: { fontSize: 14, color: '#64748b', marginTop: 4 },
  adSection: { backgroundColor: '#121826', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 20 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  metricCard: { padding: 16, borderRadius: 12, backgroundColor: '#0a0e17', borderWidth: 1, borderColor: '#1e293b', width: '48%' },
  metricCardValue: { fontSize: 20, fontWeight: '700', color: '#f1f5f9', marginTop: 8 },
  metricCardLabel: { fontSize: 12, color: '#64748b' },
  kpiCard: { padding: 12, borderRadius: 10, borderWidth: 1, backgroundColor: '#1e293b', borderColor: '#334155', width: '48%' },
  kpiCardHighlight: { backgroundColor: 'rgba(0,210,255,0.1)', borderColor: 'rgba(0,210,255,0.2)' },
  kpiValue: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  kpiValueHighlight: { color: '#00d2ff' },
  kpiLabel: { fontSize: 12, color: '#64748b' },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#0a0e17' },
  metricDate: { fontSize: 13, color: '#94a3b8' },
  metricPlatform: { fontSize: 14, fontWeight: '500', color: '#e2e8f0' },
  metricAd: { fontSize: 12, color: '#64748b' },
  metricStats: { gap: 2 },
  metricStat: { fontSize: 12, color: '#94a3b8' },
  iconBtn: { padding: 8, borderRadius: 8 },
  row: { flexDirection: 'row', gap: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
});
