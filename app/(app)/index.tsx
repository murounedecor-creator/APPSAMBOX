import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRole } from '@/lib/RoleContext';
import { RoleSelector } from '@/components/RoleSelector';
import { type Role } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardScreen } from '@/screens/Dashboard';
import { CustomersScreen } from '@/screens/Customers';
import { TicketsScreen } from '@/screens/Tickets';
import { SalesScreen } from '@/screens/Sales';
import { MetricsScreen } from '@/screens/Metrics';
import { TechniciansScreen } from '@/screens/Technicians';
import { PlansScreen } from '@/screens/Plans';

type Page = 'dashboard' | 'customers' | 'tickets' | 'sales' | 'metrics' | 'technicians' | 'plans';

interface NavItem {
  id: Page;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Painel', icon: 'grid', roles: ['owner', 'manager', 'technician'] },
  { id: 'customers', label: 'Clientes', icon: 'people', roles: ['owner', 'manager'] },
  { id: 'tickets', label: 'Atendimentos', icon: 'ticket', roles: ['owner', 'manager', 'technician'] },
  { id: 'sales', label: 'Vendas', icon: 'cash', roles: ['owner', 'manager'] },
  { id: 'metrics', label: 'Métricas', icon: 'bar-chart', roles: ['owner'] },
  { id: 'technicians', label: 'Técnicos', icon: 'build', roles: ['owner', 'manager'] },
  { id: 'plans', label: 'Planos', icon: 'pricetag', roles: ['owner', 'manager'] },
];

export default function AppLayout() {
  const { role } = useRole();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ page?: string }>();
  const currentPage = (params.page as Page) || 'dashboard';

  const visibleNav = NAV_ITEMS.filter(n => n.roles.includes(role));

  function navigate(p: Page) {
    router.setParams({ page: p });
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>G</Text>
          </View>
          <Text style={styles.headerTitle}>Gestão Operacional</Text>
        </View>
        <RoleSelector />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navBar} contentContainerStyle={styles.navContent}>
        {visibleNav.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => navigate(item.id)}
              style={({ pressed }) => [
                styles.navItem,
                isActive && styles.navItemActive,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name={item.icon} size={18} color={isActive ? '#00d2ff' : '#64748b'} />
              <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.content}>
        {currentPage === 'dashboard' && <DashboardScreen />}
        {currentPage === 'customers' && <CustomersScreen />}
        {currentPage === 'tickets' && <TicketsScreen />}
        {currentPage === 'sales' && <SalesScreen />}
        {currentPage === 'metrics' && <MetricsScreen />}
        {currentPage === 'technicians' && <TechniciansScreen />}
        {currentPage === 'plans' && <PlansScreen />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e17' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#0b0c10', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#00d2ff', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#0a0e17', fontWeight: '700', fontSize: 14 },
  headerTitle: { fontWeight: '600', color: '#f1f5f9', fontSize: 16 },
  navBar: { maxHeight: 52, backgroundColor: '#0b0c10', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  navContent: { paddingHorizontal: 12, alignItems: 'center', gap: 4, paddingVertical: 8 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  navItemActive: { backgroundColor: 'rgba(0,210,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,210,255,0.2)' },
  navItemText: { fontSize: 13, fontWeight: '500', color: '#64748b' },
  navItemTextActive: { color: '#00d2ff' },
  content: { flex: 1 },
});
