import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.trim());
  const isEmailAccepted = email.trim().length > 0 && email.trim().length <= 150 && validateEmail(email);
  const isPasswordAccepted = password.length > 0;

  const handleSignIn = async () => {
    setErrorMessage('');
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!email.trim()) {
      setErrorMessage('Please enter your email.');
      return;
    }
    if (!isEmailAccepted) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!isPasswordAccepted) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/home');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Image
        source={require('@/assets/images/homepageicon/background.png')}
        style={styles.backgroundImage}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Image source={require('@/assets/images/bmanny-logo-hd.png')} style={styles.logo} />
            <Text style={styles.brandName}>BMANNY</Text>
            <Text style={styles.companyName}>PARTNERS INC.</Text>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.continueText}>Sign in to continue to your account</Text>

            {errorMessage ? (
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            ) : null}

            {/* Email Input */}
            <View style={styles.fieldGroup}>
              <View
                style={[
                  styles.inputContainer,
                  email.length > 0 && isEmailAccepted
                    ? styles.inputAccepted
                    : (email.length > 0 || emailTouched) && !isEmailAccepted && !emailFocused
                      ? styles.inputRejected
                      : emailFocused
                        ? styles.inputFocused
                        : null,
                ]}
              >
                <Ionicons name="mail-outline" size={20} color="#2196F3" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  maxLength={150}
                  underlineColorAndroid="transparent"
                  selectionColor="#2196F3"
                  cursorColor="#2196F3"
                  selectionHandleColor="#2196F3"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => {
                    setEmailFocused(false);
                    setEmailTouched(true);
                  }}
                />
                {(email.length > 0 || emailTouched) && (
                  <Ionicons
                    name={isEmailAccepted ? 'checkmark-circle' : 'close-circle'}
                    size={18}
                    color={isEmailAccepted ? '#10b981' : '#ff6b6b'}
                  />
                )}
              </View>
              {(email.length > 0 || emailTouched) && !isEmailAccepted && (
                <Text style={styles.fieldHintError}>Enter a valid email address (e.g. name@company.com).</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.fieldGroup}>
              <View
                style={[
                  styles.inputContainer,
                  password.length > 0
                    ? styles.inputAccepted
                    : passwordTouched && !passwordFocused
                      ? styles.inputRejected
                      : passwordFocused
                        ? styles.inputFocused
                        : null,
                ]}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#2196F3" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  underlineColorAndroid="transparent"
                  selectionColor="#2196F3"
                  cursorColor="#2196F3"
                  selectionHandleColor="#2196F3"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => {
                    setPasswordFocused(false);
                    setPasswordTouched(true);
                  }}
                />
                {(password.length > 0 || passwordTouched) && (
                  <Ionicons
                    name={isPasswordAccepted ? 'checkmark-circle' : 'close-circle'}
                    size={18}
                    color={isPasswordAccepted ? '#10b981' : '#ff6b6b'}
                  />
                )}
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#2196F3" />
                </TouchableOpacity>
              </View>
              {passwordTouched && !isPasswordAccepted && (
                <Text style={styles.fieldHintError}>Password is required to sign in.</Text>
              )}
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.rowContainer}>
              <TouchableOpacity style={styles.checkboxContainer} onPress={() => setRememberMe(!rememberMe)}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                <Text style={styles.forgotPassword}>Forgot your password?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, loading && { opacity: 0.7 }]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#ffffff" />
                : <Text style={styles.signInButtonText}>Sign in</Text>
              }
            </TouchableOpacity>

            {/* Create Account Link */}
            <View style={styles.createAccountContainer}>
              <Text style={styles.createAccountText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.createAccountLink}>Signup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 46, 0.7)',
  },
  backgroundImageStyle: {
    opacity: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 30,
    paddingTop: 40,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
    alignSelf: 'center',
  },
  brandName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
    textAlign: 'center',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 30,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  continueText: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 40,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  inputContainer: {
    backgroundColor: '#1e2a4a',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3d4a6a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputFocused: {
    borderColor: '#2196F3',
  },
  inputAccepted: {
    borderColor: '#10b981',
  },
  inputRejected: {
    borderColor: '#ff6b6b',
  },
  fieldHintError: {
    color: '#ff8585',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#fff',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  eyeIcon: {
    paddingLeft: 12,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#3d4a6a',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxText: {
    color: '#a0a0a0',
    fontSize: 13,
  },
  forgotPassword: {
    color: '#2196F3',
    fontSize: 13,
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createAccountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createAccountText: {
    color: '#a0a0a0',
    fontSize: 14,
  },
  createAccountLink: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
