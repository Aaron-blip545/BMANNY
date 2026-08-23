import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { register } from '../services/api';

export default function RegisterScreen() {
  const [fullName, setFullName]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage]       = useState('');
  const [loading, setLoading]                 = useState(false);
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);

  // Focus states for input highlighting
  const [nameFocused, setNameFocused]         = useState(false);
  const [emailFocused, setEmailFocused]       = useState(false);
  const [passFocused, setPassFocused]         = useState(false);
  const [confFocused, setConfFocused]         = useState(false);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSignUp = async () => {
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name:             fullName.trim(),
        email:                 email.trim(),
        password,
        password_confirmation: confirmPassword,
        business_name:         fullName.trim(),   // customer can update this later in profile
        business_type:         'private_label',
        contact_person:        fullName.trim(),
        business_address:      'TBD',
      });
      // register() already saves the token so we go straight home
      router.replace('/home');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background image */}
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

            {/* Logo */}
            <Image source={require('@/assets/images/homepageicon/BMANNYLOGO.png')} style={styles.logo} />
            <Text style={styles.brandName}>BMANNY</Text>
            <Text style={styles.companyName}>PARTNERS INC.</Text>
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.continueText}>Sign up to get started with BMANNY</Text>

            {/* Error */}
            {errorMessage ? (
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            ) : null}

            {/* Full Name */}
            <View style={[styles.inputContainer, nameFocused && styles.inputFocused]}>
              <Ionicons name="person-outline" size={20} color="#2196F3" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#888"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                underlineColorAndroid="transparent"
                selectionColor="#2196F3"
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
              />
            </View>

            {/* Email */}
            <View style={[styles.inputContainer, emailFocused && styles.inputFocused]}>
              <Ionicons name="mail-outline" size={20} color="#2196F3" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                underlineColorAndroid="transparent"
                selectionColor="#2196F3"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            {/* Password */}
            <View style={[styles.inputContainer, passFocused && styles.inputFocused]}>
              <Ionicons name="lock-closed-outline" size={20} color="#2196F3" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                underlineColorAndroid="transparent"
                selectionColor="#2196F3"
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#2196F3" />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={[styles.inputContainer, confFocused && styles.inputFocused]}>
              <Ionicons name="lock-closed-outline" size={20} color="#2196F3" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                underlineColorAndroid="transparent"
                selectionColor="#2196F3"
                onFocus={() => setConfFocused(true)}
                onBlur={() => setConfFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#2196F3" />
              </TouchableOpacity>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signUpButton, loading && { opacity: 0.7 }]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#ffffff" />
                : <Text style={styles.signUpButtonText}>Create Account</Text>
              }
            </TouchableOpacity>

            {/* Already have account */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Sign in</Text>
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
    paddingTop: 40,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 16,
    alignSelf: 'center',
  },
  brandName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
    textAlign: 'center',
  },
  companyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
  },
  continueText: {
    fontSize: 13,
    color: '#a0a0a0',
    marginBottom: 30,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#ff4444',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'left',
  },
  inputContainer: {
    backgroundColor: '#1e2a4a',
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#3d4a6a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputFocused: {
    borderColor: '#2196F3',
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
  signUpButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#a0a0a0',
    fontSize: 14,
  },
  loginLink: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
  },
});