import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignIn = () => {
    console.log('handleSignIn called', { email, password });
    setErrorMessage('');
    
    if (!email) {
      console.log('Email is empty');
      setErrorMessage('Please enter your email');
      return;
    }
    
    console.log('Email entered:', email);
    console.log('Email validation result:', validateEmail(email));
    
    if (!validateEmail(email)) {
      console.log('Email validation failed');
      setErrorMessage('Input must be a valid email address');
      return;
    }
    
    if (!password) {
      console.log('Password is empty');
      setErrorMessage('Please enter your password');
      return;
    }
    
    console.log('Validation passed, navigating to home');
    router.push('/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Image source={require('@/assets/images/homepageicon/BMANNYLOGO.png')} style={styles.logo} />
            <Text style={styles.brandName}>BMANNY</Text>
            <Text style={styles.companyName}>PARTNERS INC.</Text>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.continueText}>Sign in to continue to your account</Text>

            {errorMessage ? (
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            ) : null}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                underlineColorAndroid="transparent"
                selectionColor="#2196F3"
                cursorColor="#2196F3"
                selectionHandleColor="#2196F3"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
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
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#2196F3" />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
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
    backgroundColor: '#1a1a2e',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 30,
    paddingTop: 80,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ff4500',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    marginBottom: 40,
  },
  errorMessage: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  input: {
    padding: 18,
    fontSize: 16,
    color: '#fff',
  },
  forgotPassword: {
    color: '#ff4500',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 30,
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: '#ff4500',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    color: '#ff4500',
    fontSize: 14,
    fontWeight: 'bold',
  },
});