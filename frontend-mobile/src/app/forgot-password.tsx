import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoginColors } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');

  const handleSendReset = () => {
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerSpacer} />
          <View style={styles.backRow}>
            <Pressable style={styles.backButton} onPress={() => router.push('/')}>
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.brandTitle}>BMANNY PARTNERS INC.</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.cardWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.cardAccent} />
        <ScrollView
          contentContainerStyle={[
            styles.cardScroll,
            { paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.welcomeTitle}>Forgot Password?</Text>
            <Text style={styles.welcomeSubtitle}>Enter your email to reset your password</Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={LoginColors.placeholder}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />

              <Pressable style={styles.sendButton} onPress={handleSendReset}>
                {({ hovered, pressed }) => (
                  <Text style={[styles.sendButtonText, hovered && styles.sendButtonTextHovered, pressed && styles.sendButtonTextPressed]}>Send Reset Link</Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LoginColors.header,
  },
  header: {
    backgroundColor: LoginColors.header,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerSpacer: {
    flex: 1,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: LoginColors.getStartedButton,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    transitionDuration: 200,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  cardWrapper: {
    flex: 1,
    marginTop: -28,
  },
  cardAccent: {
    position: 'absolute',
    top: 8,
    left: 20,
    right: 20,
    height: 40,
    backgroundColor: LoginColors.getStartedButton,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    opacity: 0.35,
  },
  cardScroll: {
    flexGrow: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 40,
    minHeight: '100%',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: LoginColors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: LoginColors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111111',
    backgroundColor: '#FFFFFF',
  },
  sendButton: {
    backgroundColor: LoginColors.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    transitionDuration: 200,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sendButtonTextHovered: {
    color: '#E8E8E8',
  },
  sendButtonTextPressed: {
    color: '#D0D0D0',
  },
});
