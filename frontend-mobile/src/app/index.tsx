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


export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isFormValid = () => {
    return email.trim() !== '' && 
           password.trim() !== '' && 
           isValidEmail(email);
  };

  const handleSignIn = () => {
    setAttemptedSubmit(true);
    
    if (email.trim() === '') {
      setEmailError('Email is required');
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email');
    } else {
      setEmailError('');
    }
    
    if (password.trim() === '') {
      setPasswordError('Password is required');
    } else {
      setPasswordError('');
    }
    
    if (isFormValid()) {
      router.replace('/home');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerSpacer} />
          <View style={styles.getStartedRow}>
            <Text style={styles.getStartedLabel}>Dont Have an Account?</Text>
            <Pressable style={styles.getStartedButton} onPress={() => router.push('/register')}>
              {({ hovered, pressed }) => (
                <Text style={[styles.getStartedButtonText, hovered && styles.getStartedButtonTextHovered, pressed && styles.getStartedButtonTextPressed]}>Get Started</Text>
              )}
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
              <View>
                <TextInput
                  style={[styles.input, emailError && styles.inputError]}
                  placeholder="Email or Username"
                  placeholderTextColor={LoginColors.placeholder}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (attemptedSubmit) {
                      if (text.trim() === '') {
                        setEmailError('Email is required');
                      } else if (!isValidEmail(text)) {
                        setEmailError('Please enter a valid email');
                      } else {
                        setEmailError('');
                      }
                    }
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </View>

              <View>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, passwordError && styles.inputError]}
                    placeholder="Password"
                    placeholderTextColor={LoginColors.placeholder}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (attemptedSubmit && text.trim() === '') {
                        setPasswordError('Password is required');
                      } else {
                        setPasswordError('');
                      }
                    }}
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
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              </View>

              <Pressable 
                style={[styles.signInButton, !isFormValid() && styles.signInButtonDisabled]} 
                onPress={handleSignIn}
                disabled={!isFormValid()}>
                {({ hovered, pressed }) => (
                  <Text style={[styles.signInButtonText, hovered && styles.signInButtonTextHovered, pressed && styles.signInButtonTextPressed, !isFormValid() && styles.signInButtonTextDisabled]}>Sign in</Text>
                )}
              </Pressable>

              <Pressable onPress={() => router.push('/forgot-password')}>
                {({ hovered }) => (
                  <Text style={[styles.forgotPassword, hovered && styles.forgotPasswordHovered]}>Forgot your Password?</Text>
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
    transitionDuration: 200,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  getStartedButtonTextHovered: {
    color: '#E0E0E0',
  },
  getStartedButtonTextPressed: {
    color: '#C0C0C0',
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
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
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
    transitionDuration: 200,
  },
  signInButtonDisabled: {
    backgroundColor: LoginColors.border,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  signInButtonTextDisabled: {
    color: LoginColors.textMuted,
  },
  signInButtonTextHovered: {
    color: '#E8E8E8',
  },
  signInButtonTextPressed: {
    color: '#D0D0D0',
  },
  forgotPassword: {
    color: LoginColors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  forgotPasswordHovered: {
    color: LoginColors.primary,
    textDecorationLine: 'underline',
  },
});
