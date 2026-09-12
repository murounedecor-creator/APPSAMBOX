import { useState } from 'react';
import {
  LayoutDashboard, Users, Ticket as TicketIcon, DollarSign,
  BarChart3, Wrench, Tag, Menu, X
} from 'lucide-react';
import { RoleProvider, useRole } from '@/lib/RoleContext';
import { RoleSelector } from '@/components/RoleSelector';
import { Dashboard } from '@/pages/Dashboard';
import { Customers } from '@/pages/Customers';
import { Tickets } from '@/pages/Tickets';
import { Sales } from '@/pages/Sales';
import { Metrics } from '@/pages/Metrics';
import { Technicians } from '@/pages/Technicians';
import { Plans } from '@/pages/Plans';
import type { Role } from '@/lib/supabase';

type Page = 'dashboard' | 'customers' | 'tickets' | 'sales' | 'metrics' | 'technicians' | 'plans';

interface NavItem {
  id: Page;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Painel', icon: LayoutDashboard, roles: ['owner', 'manager', 'technician'] },
  { id: 'customers', label: 'Clientes', icon: Users, roles: ['owner', 'manager'] },
  { id: 'tickets', label: 'Atendimentos', icon: TicketIcon, roles: ['owner', 'manager', 'technician'] },
  { id: 'sales', label: 'Vendas', icon: DollarSign, roles: ['owner', 'manager'] },
  { id: 'metrics', label: 'Métricas', icon: BarChart3, roles: ['owner'] },
  { id: 'technicians', label: 'Técnicos', icon: Wrench, roles: ['owner', 'manager'] },
  { id: 'plans', label: 'Planos', icon: Tag, roles: ['owner', 'manager'] },
];

function AppContent() {
  const { role } = useRole();
  const [page, setPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleNav = NAV_ITEMS.filter(n => n.roles.includes(role));

  const currentNav = visibleNav.find(n => n.id === page) || visibleNav[0];
  const activePage = currentNav?.id || 'dashboard';

  function navigate(p: string) {
    setPage(p as Page);
    setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#05070d] border-r border-[#172033] fixed inset-y-0 left-0 z-30">
        <SidebarContent activePage={activePage} onNavigate={navigate} navItems={visibleNav} />
      </aside>

      {/* Sidebar — mobile drawer */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-[#05070d] z-50 md:hidden flex flex-col">
            <SidebarContent
              activePage={activePage}
              onNavigate={navigate}
              navItems={visibleNav}
              onClose={() => setSidebarOpen(false)}
            />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-[#05070d] border-b border-[#172033] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg hover:bg-[#101a2d]"
            >
              <Menu size={22} className="text-white" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d9ff] to-[#2563eb] flex items-center justify-center shadow-[0_0_18px_rgba(0,217,255,0.35)]">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="font-semibold text-white hidden sm:block tracking-tight">Gestão Operacional</span>
            </div>
          </div>
          <RoleSelector />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
          {activePage === 'dashboard' && <Dashboard onNavigate={navigate} />}
          {activePage === 'customers' && <Customers />}
          {activePage === 'tickets' && <Tickets />}
          {activePage === 'sales' && <Sales />}
          {activePage === 'metrics' && <Metrics />}
          {activePage === 'technicians' && <Technicians />}
          {activePage === 'plans' && <Plans />}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  activePage, onNavigate, navItems, onClose,
}: {
  activePage: string;
  onNavigate: (p: string) => void;
  navItems: NavItem[];
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#172033]">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00d9ff] to-[#2563eb] flex items-center justify-center shadow-[0_0_22px_rgba(0,217,255,0.3)]">
            <span className="text-white font-bold">G</span>
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Gestão</p>
            <p className="text-xs text-[#7d8ba5]">Operacional</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 rounded-lg hover:bg-[#101a2d]">
            <X size={20} className="text-[#9ba9c4]" />
          </button>
        )}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#0b2b55] text-[#6ee7ff] border border-[#0e7490] shadow-[inset_3px_0_0_#00d9ff]'
                  : 'text-[#9ba9c4] hover:bg-[#101a2d] hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-[#00d9ff]' : 'text-[#62718c]'} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-[#172033]">
        <p className="text-xs text-[#62718c]">Sistema de Gestão Operacional v1.0</p>
      </div>
    </>
  );
}

export default function App() {
  return (
    <RoleProvider>
      <AppContent />
    </RoleProvider>
  );
}
