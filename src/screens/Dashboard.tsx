import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, type Ticket, type Sale, type AdMetric, TICKET_STATUS_LABELS } from '@/lib/supabase';
import { useRole } from '@/lib/RoleContext';
import { LoadingSpinner, Badge } from '@/components/ui';

type IconName = keyof typeof Ionicons.glyphMap;

export function DashboardScreen() {
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    customersTotal: 0,
    customersNewMonth: 0,
    activeTickets: 0,
    pendingTickets: 0,
    completedToday: 0,
    salesTodayCount: 0,
    salesTodayRevenue: 0,
    salesMonthRevenue: 0,
    salesMonthCount: 0,
    ticketsByStatus: {} as Record<string, number>,
    recentTickets: [] as Ticket[],
    recentSales: [] as Sale[],
    adImpressions: 0,
    adClicks: 0,
    adConversions: 0,
    adSpend: 0,
    adRevenue: 0,
  });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [customers, tickets, sales, adMetrics] = await Promise.all([
      supabase.from('customers').select('id, created_at'),
      supabase.from('tickets').select('*, customer:customers(name), technician:technicians(name)'),
      supabase.from('sales').select('*, customer:customers(name), plan:plans(name)'),
      supabase.from('ad_metrics').select('*'),
    ]);

    const ticketsData = (tickets.data || []) as unknown as Ticket[];
    const salesData = (sales.data || []) as unknown as Sale[];
    const customersData = (customers.data || []) as { id: string; created_at: string }[];
    const adData = (adMetrics.data || []) as AdMetric[];

    const todayCompleted = ticketsData.filter(t => t.completed_at && t.completed_at.startsWith(today));
    const todaySales = salesData.filter(s => s.sale_date === today);
    const monthSales = salesData.filter(s => s.sale_date >= monthStart);
    const monthCustomers = customersData.filter(c => c.created_at.startsWith(monthStart));
    const monthAd = adData.filter(a => a.metric_date >= monthStart);

    const byStatus = ticketsData.reduce((acc: Record<string, number>, t: Ticket) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    setStats({
      customersTotal: customersData.length,
      customersNewMonth: monthCustomers.length,
      activeTickets: ticketsData.filter(t => !['completed', 'cancelled'].includes(t.status)).length,
      pendingTickets: ticketsData.filter(t => t.status === 'pending').length,
      completedToday: todayCompleted.length,
      salesTodayCount: todaySales.length,
      salesTodayRevenue: todaySales.reduce((sum, s) => sum + s.final_amount, 0),
      salesMonthRevenue: monthSales.reduce((sum, s) => sum + s.final_amount, 0),
      salesMonthCount: monthSales.length,
      ticketsByStatus: byStatus,
      recentTickets: ticketsData.slice(0, 5),
      recentSales: salesData.slice(0, 5),
      adImpressions: monthAd.reduce((sum, a) => sum + a.impressions, 0),
      adClicks: monthAd.reduce((sum, a) => sum + a.clicks, 0),
      adConversions: monthAd.reduce((sum, a) => sum + a.conversions, 0),
      adSpend: monthAd.reduce((sum, a) => sum + a.cost, 0),
      adRevenue: monthAd.reduce((sum, a) => sum + a.revenue, 0),
    });
    setLoading(false);
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (loading) return <LoadingSpinner />;

  const isOwner = role === 'owner';
  const isManager = role === 'manager' || role === 'owner';
  const isTechnician = role === 'technician';

  const statusColors: Record<string, string> = {
    pending: 'orange', assigned: 'blue', in_progress: 'blue',
    completed: 'green', cancelled: 'red',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Painel do Dia</Text>
        <Text style={styles.subtitle}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </View>

      <View style={styles.cardGrid}>
        <StatCard icon="people" label="Clientes" value={stats.customersTotal} subtext={`${stats.customersNewMonth} novos este mês`} />
        <StatCard icon="ticket" label="Atendimentos Ativos" value={stats.activeTickets} subtext={`${stats.pendingTickets} pendentes`} />
        {isManager && <StatCard icon="cash" label="Vendas Hoje" value={stats.salesTodayCount} subtext={formatBRL(stats.salesTodayRevenue)} />}
        {isManager && <StatCard icon="trending-up" label="Receita do Mês" value={formatBRL(stats.salesMonthRevenue)} subtext={`${stats.salesMonthCount} vendas`} />}
        {isTechnician && <StatCard icon="time" label="Meus Atendimentos" value={stats.activeTickets} subtext="Em andamento" />}
        {isTechnician && <StatCard icon="checkmark-circle" label="Concluídos Hoje" value={stats.completedToday} subtext="Finalizados" />}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status dos Atendimentos</Text>
        <View style={styles.statusGrid}>
          {Object.entries(TICKET_STATUS_LABELS).map(([key, label]) => (
            <View key={key} style={styles.statusCard}>
              <Text style={styles.statusValue}>{stats.ticketsByStatus[key] || 0}</Text>
              <Badge color={statusColors[key]}>{label}</Badge>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionGrid}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atendimentos Recentes</Text>
          {stats.recentTickets.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum atendimento registrado.</Text>
          ) : (
            stats.recentTickets.map(t => (
              <View key={t.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemTitle}>#{String(t.ticket_number).padStart(5, '0')} — {t.customer?.name || '-'}</Text>
                  <Text style={styles.listItemSub}>{TICKET_STATUS_LABELS[t.status as keyof typeof TICKET_STATUS_LABELS]}</Text>
                </View>
                <Badge color={statusColors[t.status]}>{TICKET_STATUS_LABELS[t.status as keyof typeof TICKET_STATUS_LABELS]}</Badge>
              </View>
            ))
          )}
        </View>

        {isManager && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vendas Recentes</Text>
            {stats.recentSales.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma venda registrada.</Text>
            ) : (
              stats.recentSales.map(s => (
                <View key={s.id} style={styles.listItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listItemTitle}>#{String(s.sale_number).padStart(5, '0')} — {s.customer?.name || '-'}</Text>
                    <Text style={styles.listItemSub}>{s.plan?.name || '-'} {s.variation ? `(${s.variation})` : ''}</Text>
                  </View>
                  <Text style={styles.saleAmount}>{formatBRL(s.final_amount)}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </View>

      {isOwner && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Desempenho de Anúncios (Mês)</Text>
          </View>
          <View style={styles.miniGrid}>
            <MiniStat label="Impressões" value={stats.adImpressions.toLocaleString('pt-BR')} />
            <MiniStat label="Cliques" value={stats.adClicks.toLocaleString('pt-BR')} />
            <MiniStat label="Conversões" value={String(stats.adConversions)} />
            <MiniStat label="Investimento" value={formatBRL(stats.adSpend)} />
          </View>
          {stats.adSpend > 0 && (
            <View style={styles.roasBox}>
              <Text style={styles.roasText}>
                ROAS: {(stats.adRevenue / stats.adSpend).toFixed(2)}x — Receita: {formatBRL(stats.adRevenue)}
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function StatCard({ icon, label, value, subtext }: { icon: IconName; label: string; value: string | number; subtext?: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={20} color="#00d2ff" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subtext && <Text style={styles.statSubtext}>{subtext}</Text>}
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e17' },
  content: { padding: 16, gap: 24 },
  header: { gap: 4 },
  title: { fontSize: 24, fontWeight: '700', color: '#f1f5f9' },
  subtitle: { fontSize: 14, color: '#64748b' },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { backgroundColor: '#121826', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 20, width: '48%' },
  statIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,210,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#f1f5f9' },
  statLabel: { fontSize: 14, fontWeight: '500', color: '#94a3b8' },
  statSubtext: { fontSize: 12, color: '#475569', marginTop: 4 },
  section: { backgroundColor: '#121826', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#f1f5f9', marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statusCard: { alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: '#0a0e17', borderWidth: 1, borderColor: '#1e293b', width: '31%' },
  statusValue: { fontSize: 24, fontWeight: '700', color: '#f1f5f9', marginBottom: 8 },
  sectionGrid: { gap: 16 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  listItemTitle: { fontSize: 14, fontWeight: '500', color: '#e2e8f0' },
  listItemSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  saleAmount: { fontSize: 14, fontWeight: '600', color: '#00d2ff' },
  emptyText: { color: '#64748b', fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  miniStat: { padding: 12, borderRadius: 10, backgroundColor: '#0a0e17', borderWidth: 1, borderColor: '#1e293b', width: '48%' },
  miniStatValue: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  miniStatLabel: { fontSize: 12, color: '#64748b' },
  roasBox: { marginTop: 16, padding: 12, borderRadius: 10, backgroundColor: 'rgba(0,210,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,210,255,0.2)' },
  roasText: { fontSize: 14, color: '#00d2ff' },
});
