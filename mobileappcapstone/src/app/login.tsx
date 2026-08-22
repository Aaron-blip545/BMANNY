import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { login } from '../services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.replace('/home');
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>BMANNY Partners Inc.</Text>
            <Text style={styles.subtitle}>Welcome back you've been missed!</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity onPress={() => router.push('/forgot-password')}>
              <Text style={styles.forgotPassword}>Forgot your password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signInButton, loading && { opacity: 0.6 }]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signInButtonText}>Sign in</Text>
              )}
            </TouchableOpacity>

            <View style={styles.createAccountContainer}>
              <Text style={styles.createAccountText}>Create new account </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.createAccountLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scrollContent: { flexGrow: 1 },
  content: { padding: 30, paddingTop: 80 },
  title: { fontSize: 30, fontWeight: 'bold', color: '#ff4500', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#a0a0a0', marginBottom: 40 },
  inputContainer: { backgroundColor: '#16213e', borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#2d2d44' },
  input: { padding: 18, fontSize: 16, color: '#fff' },
  errorText: { color: '#ff6b6b', fontSize: 14, marginBottom: 16, textAlign: 'center' },
  forgotPassword: { color: '#ff4500', fontSize: 14, textAlign: 'right', marginBottom: 30, fontWeight: '500' },
  signInButton: { backgroundColor: '#ff4500', paddingVertical: 18, borderRadius: 15, alignItems: 'center', marginBottom: 30 },
  signInButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  createAccountContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  createAccountText: { color: '#a0a0a0', fontSize: 14 },
  createAccountLink: { color: '#ff4500', fontSize: 14, fontWeight: 'bold' },
});