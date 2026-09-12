import { useState, useEffect, useCallback } from 'react';
import {
  Users, Ticket as TicketIcon, DollarSign, TrendingUp,
  Clock, CheckCircle2, AlertCircle, Activity, BarChart3
} from 'lucide-react';
import { supabase, type Ticket, type Sale, type Customer, type AdMetric, TICKET_STATUS_LABELS } from '@/lib/supabase';
import { useRole } from '@/lib/RoleContext';
import { LoadingSpinner, Badge } from '@/components/ui';

export function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeTickets: 0,
    pendingTickets: 0,
    completedToday: 0,
    salesToday: 0,
    salesRevenueToday: 0,
    totalSales: 0,
    totalRevenue: 0,
  inProgressTickets: 0,
  assignedTickets: 0,
  cancelledTickets: 0,
  totalTickets: 0,
  salesThisMonth: 0,
    revenueThisMonth: 0,
  newCustomersThisMonth: 0,
  adSpendThisMonth: 0,
    adRevenueThisMonth: 0,
  conversionsThisMonth: 0,
  impressionsThisMonth: 0,
    clicksThisMonth: 0,
  activeTechnicians: 0,
  activePlans: 0,
  totalTicketsAll: 0,
    completedTicketsAll: 0,
    cancelledTicketsAll: 0,
  pendingTicketsAll: 0,
    inProgressTicketsAll: 0,
    assignedTicketsAll: 0,
  salesTodayCount: 0,
    salesTodayRevenue: 0,
  salesWeekRevenue: 0,
    salesMonthRevenue: 0,
  ticketsTodayCount: 0,
    ticketsCompletedTodayCount: 0,
    ticketsPendingTodayCount: 0,
  ticketsInProgressTodayCount: 0,
  customersTotalCount: 0,
    customersNewThisMonthCount: 0,
    plansActiveCount: 0,
    adMetricsThisMonthCount: 0,
    adMetricsTotalSpend: 0,
    adMetricsTotalRevenue: 0,
    adMetricsTotalConversions: 0,
    adMetricsTotalImpressions: 0,
    adMetricsTotalClicks: 0,
    techniciansActiveCount: 0,
  ticketsAllByStatus: {} as Record<string, number>,
    salesAllByDay: [] as { date: string; count: number; revenue: number }[],
    recentTickets: [] as Ticket[],
    recentSales: [] as Sale[],
  });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [customers, tickets, sales, adMetrics, technicians, plans] = await Promise.all([
      supabase.from('customers').select('id, created_at'),
      supabase.from('tickets').select('*, customer:customers(name), technician:technicians(name)'),
      supabase.from('sales').select('*, customer:customers(name), plan:plans(name)'),
      supabase.from('ad_metrics').select('*'),
      supabase.from('technicians').select('id, active'),
      supabase.from('plans').select('id, active'),
    ]);

    const ticketsData = (tickets.data || []) as unknown as Ticket[];
    const salesData = (sales.data || []) as unknown as Sale[];
    const customersData = (customers.data || []) as { id: string; created_at: string }[];
    const adData = (adMetrics.data || []) as AdMetric[];
    const techData = (technicians.data || []) as { id: string; active: boolean }[];
    const plansData = (plans.data || []) as { id: string; active: boolean }[];



    const todayTickets = ticketsData.filter((t: Ticket) => t.created_at.startsWith(today));
    const todayCompleted = ticketsData.filter((t: Ticket) =>
      t.completed_at && t.completed_at.startsWith(today)
    );
    const todaySales = salesData.filter((s: Sale) => s.sale_date === today);
    const monthSales = salesData.filter((s: Sale) => s.sale_date >= monthStart);
    const weekSales = salesData.filter((s: Sale) => s.sale_date >= weekStart);
    const monthCustomers = customersData.filter((c) => c.created_at.startsWith(monthStart));
    const monthAd = adData.filter((a) => a.metric_date >= monthStart);

    const byStatus = ticketsData.reduce((acc: Record<string, number>, t: Ticket) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    const salesByDay = salesData.reduce((acc: Map<string, { count: number; revenue: number }>, s: Sale) => {
      const key = s.sale_date;
      const existing = acc.get(key) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += s.final_amount;
      acc.set(key, existing);
      return acc;
    }, new Map());
    const salesByDayArr = Array.from(salesByDay.entries())
      .map(([date, v]: [string, { count: number; revenue: number }]) => ({ date, ...v }))
      .sort((a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date))
      .slice(0, 7)
      .reverse();

    setStats({
      totalCustomers: customersData.length,
      activeTickets: ticketsData.filter((t: Ticket) => !['completed', 'cancelled'].includes(t.status)).length,
      pendingTickets: ticketsData.filter((t: Ticket) => t.status === 'pending').length,
      completedToday: todayCompleted.length,
      salesToday: todaySales.length,
      salesRevenueToday: todaySales.reduce((sum: number, s: Sale) => sum + s.final_amount, 0),
      totalSales: salesData.length,
      totalRevenue: salesData.reduce((sum: number, s: Sale) => sum + s.final_amount, 0),
      inProgressTickets: ticketsData.filter((t: Ticket) => t.status === 'in_progress').length,
      assignedTickets: ticketsData.filter((t: Ticket) => t.status === 'assigned').length,
      cancelledTickets: ticketsData.filter((t: Ticket) => t.status === 'cancelled').length,
      totalTickets: ticketsData.length,
      salesThisMonth: monthSales.length,
      revenueThisMonth: monthSales.reduce((sum: number, s: Sale) => sum + s.final_amount, 0),
      newCustomersThisMonth: monthCustomers.length,
      adSpendThisMonth: monthAd.reduce((sum: number, a) => sum + a.cost, 0),
      adRevenueThisMonth: monthAd.reduce((sum: number, a) => sum + a.revenue, 0),
      conversionsThisMonth: monthAd.reduce((sum: number, a) => sum + a.conversions, 0),
      impressionsThisMonth: monthAd.reduce((sum: number, a) => sum + a.impressions, 0),
      clicksThisMonth: monthAd.reduce((sum: number, a) => sum + a.clicks, 0),
      activeTechnicians: techData.filter((t) => t.active).length,
      activePlans: plansData.filter((p) => p.active).length,
      totalTicketsAll: ticketsData.length,
      completedTicketsAll: ticketsData.filter((t: Ticket) => t.status === 'completed').length,
      cancelledTicketsAll: ticketsData.filter((t: Ticket) => t.status === 'cancelled').length,
      pendingTicketsAll: ticketsData.filter((t: Ticket) => t.status === 'pending').length,
      inProgressTicketsAll: ticketsData.filter((t: Ticket) => t.status === 'in_progress').length,
      assignedTicketsAll: ticketsData.filter((t: Ticket) => t.status === 'assigned').length,
      salesTodayCount: todaySales.length,
      salesTodayRevenue: todaySales.reduce((sum: number, s: Sale) => sum + s.final_amount, 0),
      salesWeekRevenue: weekSales.reduce((sum: number, s: Sale) => sum + s.final_amount, 0),
      salesMonthRevenue: monthSales.reduce((sum: number, s: Sale) => sum + s.final_amount, 0),
      ticketsTodayCount: todayTickets.length,
      ticketsCompletedTodayCount: todayCompleted.length,
      ticketsPendingTodayCount: todayTickets.filter((t: Ticket) => t.status === 'pending').length,
      ticketsInProgressTodayCount: todayTickets.filter((t: Ticket) => t.status === 'in_progress').length,
      customersTotalCount: customersData.length,
      customersNewThisMonthCount: monthCustomers.length,
      plansActiveCount: plansData.filter((p) => p.active).length,
      adMetricsThisMonthCount: monthAd.length,
      adMetricsTotalSpend: monthAd.reduce((sum: number, a) => sum + a.cost, 0),
      adMetricsTotalRevenue: monthAd.reduce((sum: number, a) => sum + a.revenue, 0),
      adMetricsTotalConversions: monthAd.reduce((sum: number, a) => sum + a.conversions, 0),
      adMetricsTotalImpressions: monthAd.reduce((sum: number, a) => sum + a.impressions, 0),
      adMetricsTotalClicks: monthAd.reduce((sum: number, a) => sum + a.clicks, 0),
      techniciansActiveCount: techData.filter((t) => t.active).length,
      ticketsAllByStatus: byStatus,
      salesAllByDay: salesByDayArr,
      recentTickets: ticketsData.slice(0, 5),
      recentSales: salesData.slice(0, 5),
    });
    setLoading(false);
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (loading) return <LoadingSpinner />;

  const isOwner = role === 'owner';
  const isManager = role === 'manager' || role === 'owner';
  const isTechnician = role === 'technician';

  const statusColors: Record<string, string> = {
    pending: 'orange',
    assigned: 'blue',
    in_progress: 'blue',
    completed: 'green',
    cancelled: 'red',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Painel do Dia</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Clientes"
          value={stats.customersTotalCount}
          subtext={`${stats.customersNewThisMonthCount} novos este mês`}
          color="amber"
          onClick={() => onNavigate('customers')}
        />
        <StatCard
          icon={TicketIcon}
          label="Atendimentos Ativos"
          value={stats.activeTickets}
          subtext={`${stats.pendingTicketsAll} pendentes`}
          color="blue"
          onClick={() => onNavigate('tickets')}
        />
        {isManager && (
          <StatCard
            icon={DollarSign}
            label="Vendas Hoje"
            value={stats.salesTodayCount}
            subtext={formatBRL(stats.salesTodayRevenue)}
            color="green"
            onClick={() => onNavigate('sales')}
          />
        )}
        {isManager && (
          <StatCard
            icon={TrendingUp}
            label="Receita do Mês"
            value={formatBRL(stats.salesMonthRevenue)}
            subtext={`${stats.salesThisMonth} vendas`}
            color="purple"
            onClick={() => onNavigate('metrics')}
          />
        )}
        {isTechnician && (
          <StatCard
            icon={Clock}
            label="Meus Atendimentos"
            value={stats.activeTickets}
            subtext="Em andamento"
            color="green"
            onClick={() => onNavigate('tickets')}
          />
        )}
        {isTechnician && (
          <StatCard
            icon={CheckCircle2}
            label="Concluídos Hoje"
            value={stats.completedToday}
            subtext="Atendimentos finalizados"
            color="purple"
          />
        )}
      </div>

      {/* Ticket status breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Status dos Atendimentos</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(TICKET_STATUS_LABELS).map(([key, label]) => (
            <div key={key} className="text-center p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-2xl font-bold text-gray-800">{stats.ticketsAllByStatus[key] || 0}</p>
              <Badge color={statusColors[key]}>{label}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Atendimentos Recentes</h2>
            <button onClick={() => onNavigate('tickets')} className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              Ver todos
            </button>
          </div>
          {stats.recentTickets.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">Nenhum atendimento registrado.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentTickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">#{String(t.ticket_number).padStart(5, '0')} — {t.customer?.name || '-'}</p>
                    <p className="text-xs text-gray-400">{TICKET_STATUS_LABELS[t.status as keyof typeof TICKET_STATUS_LABELS]}</p>
                  </div>
                  <Badge color={statusColors[t.status]}>{TICKET_STATUS_LABELS[t.status as keyof typeof TICKET_STATUS_LABELS]}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {isManager && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Vendas Recentes</h2>
              <button onClick={() => onNavigate('sales')} className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                Ver todas
              </button>
            </div>
            {stats.recentSales.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">Nenhuma venda registrada.</p>
            ) : (
              <div className="space-y-2">
                {stats.recentSales.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-700">#{String(s.sale_number).padStart(5, '0')} — {s.customer?.name || '-'}</p>
                      <p className="text-xs text-gray-400">{s.plan?.name || '-'} {s.variation ? `(${s.variation})` : ''}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">{formatBRL(s.final_amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Owner-only: Ad metrics summary */}
      {isOwner && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 size={20} className="text-amber-600" />
              Desempenho de Anúncios (Mês)
            </h2>
            <button onClick={() => onNavigate('metrics')} className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              Detalhar
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniStat label="Impressões" value={stats.impressionsThisMonth.toLocaleString('pt-BR')} />
            <MiniStat label="Cliques" value={stats.clicksThisMonth.toLocaleString('pt-BR')} />
            <MiniStat label="Conversões" value={stats.conversionsThisMonth.toString()} />
            <MiniStat label="Investimento" value={formatBRL(stats.adSpendThisMonth)} />
          </div>
          {stats.adSpendThisMonth > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-600" />
                <p className="text-sm text-amber-800">
                  ROAS: <span className="font-bold">{(stats.adRevenueThisMonth / stats.adSpendThisMonth).toFixed(2)}x</span>
                  {' '}— Receita: {formatBRL(stats.adRevenueThisMonth)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function StatCard({ icon: Icon, label, value, subtext, color, onClick }: {
  icon: typeof Users; label: string; value: string | number; subtext?: string; color: string; onClick?: () => void;
}) {
  const colors: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
      <p className="text-lg font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
