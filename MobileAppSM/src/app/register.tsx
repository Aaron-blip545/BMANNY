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

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasUpperCase && hasNumber;
  };

  const isFormValid = () => {
    return name.trim() !== '' && 
           email.trim() !== '' && 
           password.trim() !== '' && 
           confirmPassword.trim() !== '' &&
           isValidEmail(email) &&
           isValidPassword(password) &&
           password === confirmPassword;
  };

  const handleSignUp = () => {
    setAttemptedSubmit(true);
    
    if (name.trim() === '') {
      setNameError('Name is required');
    } else {
      setNameError('');
    }
    
    if (email.trim() === '') {
      setEmailError('Email is required');
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email');
    } else {
      setEmailError('');
    }
    
    if (password.trim() === '') {
      setPasswordError('Password is required');
    } else if (!isValidPassword(password)) {
      setPasswordError('Password must contain at least 1 uppercase letter and 1 number');
    } else {
      setPasswordError('');
    }
    
    if (confirmPassword.trim() === '') {
      setConfirmPasswordError('Please confirm your password');
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
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
          <View style={styles.signInRow}>
            <Text style={styles.signInLabel}>Already Have an Account?</Text>
            <Pressable style={styles.headerSignInButton} onPress={() => router.push('/')}>
              {({ hovered, pressed }) => (
                <Text style={[styles.headerSignInButtonText, hovered && styles.headerSignInButtonTextHovered, pressed && styles.headerSignInButtonTextPressed]}>Sign In</Text>
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
            <Text style={styles.welcomeTitle}>Get Started with Us</Text>
            <Text style={styles.welcomeSubtitle}>Free Sign up withoutout any payment</Text>

            <View style={styles.form}>
              <View>
                <TextInput
                  style={[styles.input, nameError && styles.inputError]}
                  placeholder="Name"
                  placeholderTextColor={LoginColors.placeholder}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (attemptedSubmit && text.trim() === '') {
                      setNameError('Name is required');
                    } else {
                      setNameError('');
                    }
                  }}
                  autoCapitalize="words"
                />
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
              </View>

              <View>
                <TextInput
                  style={[styles.input, emailError && styles.inputError]}
                  placeholder="Email"
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
                      if (attemptedSubmit) {
                        if (text.trim() === '') {
                          setPasswordError('Password is required');
                        } else if (!isValidPassword(text)) {
                          setPasswordError('Password must contain at least 1 uppercase letter and 1 number');
                        } else {
                          setPasswordError('');
                        }
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

              <View>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, confirmPasswordError && styles.inputError]}
                    placeholder="Confirm Password"
                    placeholderTextColor={LoginColors.placeholder}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (attemptedSubmit) {
                        if (text.trim() === '') {
                          setConfirmPasswordError('Please confirm your password');
                        } else if (password !== text) {
                          setConfirmPasswordError('Passwords do not match');
                        } else {
                          setConfirmPasswordError('');
                        }
                      }
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="password"
                  />
                  <Pressable
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword((current) => !current)}
                    hitSlop={8}>
                    <SymbolView
                      name={{
                        ios: showConfirmPassword ? 'eye.slash' : 'eye',
                        android: showConfirmPassword ? 'visibility_off' : 'visibility',
                        web: showConfirmPassword ? 'visibility_off' : 'visibility',
                      }}
                      size={20}
                      tintColor={LoginColors.placeholder}
                    />
                  </Pressable>
                </View>
                {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
              </View>

              <Pressable 
                style={[styles.signInButton, !isFormValid() && styles.signInButtonDisabled]} 
                onPress={handleSignUp}
                disabled={!isFormValid()}>
                {({ hovered, pressed }) => (
                  <Text style={[styles.signInButtonText, hovered && styles.signInButtonTextHovered, pressed && styles.signInButtonTextPressed, !isFormValid() && styles.signInButtonTextDisabled]}>Sign up</Text>
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
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signInLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  headerSignInButton: {
    backgroundColor: LoginColors.getStartedButton,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 8,
    borderRadius: 20,
    transitionDuration: 200,
  },
  headerSignInButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  headerSignInButtonTextHovered: {
    color: '#E0E0E0',
  },
  headerSignInButtonTextPressed: {
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
});
