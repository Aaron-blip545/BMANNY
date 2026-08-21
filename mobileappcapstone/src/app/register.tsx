import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { register } from '../services/api';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignUp() {
    setError('');
    setLoading(true);

    try {
      await register({
        full_name: fullName,
        email,
        password,
        password_confirmation: confirmPassword,
        business_name: businessName,
        business_type: businessType,
        contact_person: contactPerson,
        business_address: businessAddress,
      });
      router.replace('/home');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Sign up to get started!</Text>

            <View style={styles.inputContainer}>
              <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#999" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
            </View>

            <View style={styles.inputContainer}>
              <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.inputContainer}>
              <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#999" value={password} onChangeText={setPassword} secureTextEntry />
            </View>

            <View style={styles.inputContainer}>
              <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#999" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            </View>

            <Text style={styles.sectionLabel}>Business Information</Text>

            <View style={styles.inputContainer}>
              <TextInput style={styles.input} placeholder="Business Name" placeholderTextColor="#999" value={businessName} onChangeText={setBusinessName} />
            </View>

            <View style={styles.inputContainer}>
              <TextInput style={styles.input} placeholder="Business Type (e.g. Retail, Reseller)" placeholderTextColor="#999" value={businessType} onChangeText={setBusinessType} />
            </View>

            <View style={styles.inputContainer}>
              <TextInput style={styles.input} placeholder="Contact Person" placeholderTextColor="#999" value={contactPerson} onChangeText={setContactPerson} />
            </View>

            <View style={styles.inputContainer}>
              <TextInput style={styles.input} placeholder="Business Address" placeholderTextColor="#999" value={businessAddress} onChangeText={setBusinessAddress} multiline />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={[styles.signInButton, loading && { opacity: 0.6 }]} onPress={handleSignUp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInButtonText}>Sign up</Text>}
            </TouchableOpacity>

            <View style={styles.createAccountContainer}>
              <Text style={styles.createAccountText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.createAccountLink}>Login</Text>
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
  subtitle: { fontSize: 16, color: '#a0a0a0', marginBottom: 30 },
  sectionLabel: { color: '#a0a0a0', fontSize: 13, fontWeight: '600', marginBottom: 12, marginTop: 10, textTransform: 'uppercase' },
  inputContainer: { backgroundColor: '#16213e', borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#2d2d44' },
  input: { padding: 18, fontSize: 16, color: '#fff' },
  errorText: { color: '#ff6b6b', fontSize: 14, marginBottom: 16, textAlign: 'center' },
  signInButton: { backgroundColor: '#ff4500', paddingVertical: 18, borderRadius: 15, alignItems: 'center', marginBottom: 30 },
  signInButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  createAccountContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  createAccountText: { color: '#a0a0a0', fontSize: 14 },
  createAccountLink: { color: '#ff4500', fontSize: 14, fontWeight: 'bold' },
});