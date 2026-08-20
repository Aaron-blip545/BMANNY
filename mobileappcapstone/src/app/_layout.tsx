import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemeProvider as CustomThemeProvider } from '../contexts/ThemeContext';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <CustomThemeProvider>
        <AnimatedSplashOverlay />
        <Stack 
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 300,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="home" />
          <Stack.Screen name="product-description" />
          <Stack.Screen name="product-customization" />
          <Stack.Screen name="payment-method" />
          <Stack.Screen name="payment" />
          <Stack.Screen name="order-detail" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="chat-detail" />
          <Stack.Screen name="orders" />
          <Stack.Screen name="messages" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="explore" />
        </Stack>
      </CustomThemeProvider>
    </ThemeProvider>
  );
}
