import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { requestPasswordReset } from '../services/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isEmailAccepted =
    email.trim().length > 0 &&
    email.trim().length <= 150 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  const handleSendResetLink = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setEmailTouched(true);

    if (!isEmailAccepted) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(email.trim());
      setSuccessMessage(res?.message || 'If that email exists in our system, password reset instructions have been sent.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to send reset request. Please try again.');
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
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>Enter your email to reset your password</Text>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            {successMessage ? (
              <Text style={styles.successText}>{successMessage}</Text>
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
                <Text style={styles.fieldHintError}>Enter a valid email format (e.g. name@company.com).</Text>
              )}
            </View>

            {/* Send Reset Link Button */}
            <TouchableOpacity
              style={[styles.signInButton, loading && { opacity: 0.7 }]}
              onPress={handleSendResetLink}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signInButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login Link */}
            <View style={styles.createAccountContainer}>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.createAccountLink}>Back to Login</Text>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 30,
    paddingTop: 60,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    marginBottom: 40,
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  errorText: {
    color: '#ff8585',
    fontSize: 13,
    marginBottom: 14,
  },
  successText: {
    color: '#34d399',
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  inputIcon: {
    marginRight: 12,
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
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#fff',
    backgroundColor: 'transparent',
    borderWidth: 0,
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
  createAccountLink: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
