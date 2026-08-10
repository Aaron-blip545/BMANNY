import { useEffect } from 'react';
import { router } from 'expo-router';

export default function HomeScreen() {
  useEffect(() => {
    // Redirect to login screen on app start
    router.replace('/login');
  }, []);

  return null;
}
