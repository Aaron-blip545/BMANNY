import { SymbolView } from 'expo-symbols';
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

function GoogleIcon() {
  return (
    <View style={styles.googleIcon}>
      <Text style={[styles.googleLetter, { color: '#4285F4' }]}>G</Text>
    </View>
  );
}

function DottedDivider({ label }: { label: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = () => {
    router.replace('/home');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerSpacer} />
          <View style={styles.getStartedRow}>
            <Text style={styles.getStartedLabel}>Dont Have an Account?</Text>
            <Pressable style={styles.getStartedButton}>
              <Text style={styles.getStartedButtonText}>Get Started</Text>
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
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>Please Input your Log in Credentials</Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email or Username"
                placeholderTextColor={LoginColors.placeholder}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor={LoginColors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((current) => !current)}
                  hitSlop={8}>
                  <SymbolView
                    name={{
                      ios: showPassword ? 'eye.slash' : 'eye',
                      android: showPassword ? 'visibility_off' : 'visibility',
                      web: showPassword ? 'visibility_off' : 'visibility',
                    }}
                    size={20}
                    tintColor={LoginColors.placeholder}
                  />
                </Pressable>
              </View>

              <Pressable style={styles.signInButton} onPress={handleSignIn}>
                <Text style={styles.signInButtonText}>Sign in</Text>
              </Pressable>

              <Pressable>
                <Text style={styles.forgotPassword}>Forgot your Password?</Text>
              </Pressable>

              <DottedDivider label="or sign in with" />

              <Pressable style={styles.googleButton}>
                <GoogleIcon />
                <Text style={styles.googleButtonText}>Google</Text>
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
  getStartedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  getStartedLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  getStartedButton: {
    backgroundColor: LoginColors.getStartedButton,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  getStartedButtonText: {
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
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    height: 52,
    justifyContent: 'center',
  },
  signInButton: {
    backgroundColor: LoginColors.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotPassword: {
    color: LoginColors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: LoginColors.border,
  },
  dividerText: {
    color: LoginColors.textMuted,
    fontSize: 13,
  },
  googleButton: {
    height: 52,
    borderWidth: 1,
    borderColor: LoginColors.border,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  googleIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLetter: {
    fontSize: 18,
    fontWeight: '700',
  },
  googleButtonText: {
    color: '#333333',
    fontSize: 15,
    fontWeight: '600',
  },
});
