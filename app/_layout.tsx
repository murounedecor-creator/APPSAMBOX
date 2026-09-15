import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RoleProvider } from '@/lib/RoleContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RoleProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </RoleProvider>
    </SafeAreaProvider>
  );
}
