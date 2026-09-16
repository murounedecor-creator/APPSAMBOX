import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { RoleProvider } from '@/lib/RoleContext';
import AnimatedSplash from '@/components/AnimatedSplash';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <AnimatedSplash>
      <SafeAreaProvider>
        <RoleProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </RoleProvider>
      </SafeAreaProvider>
    </AnimatedSplash>
  );
}
