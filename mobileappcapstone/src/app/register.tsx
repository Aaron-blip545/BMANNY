import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { register } from '../services/api';

export default function RegisterScreen() {
  const [fullName, setFullName]               = useState('');
  const [email, setEmail]                     = useState('');
  const [phoneNumber, setPhoneNumber]         = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage]       = useState('');
  const [loading, setLoading]                 = useState(false);
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [showSuccess, setShowSuccess]         = useState(false);

  // Focus & touched states for live acceptability indicators
  const [nameFocused, setNameFocused]         = useState(false);
  const [emailFocused, setEmailFocused]       = useState(false);
  const [phoneFocused, setPhoneFocused]       = useState(false);
  const [passFocused, setPassFocused]         = useState(false);
  const [confFocused, setConfFocused]         = useState(false);
  const [touched, setTouched]                 = useState<Record<string, boolean>>({});

  const markTouched = (field: string) =>
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));

  // Field validation rules
  const trimmedName = fullName.trim();
  const isNameAccepted =
    trimmedName.length >= 2 &&
    trimmedName.length <= 100 &&
    /^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/.test(trimmedName);

  const trimmedEmail = email.trim();
  const isEmailAccepted =
    trimmedEmail.length > 0 &&
    trimmedEmail.length <= 150 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail);

  const trimmedPhone = phoneNumber.trim();
  const phoneDigits = trimmedPhone.replace(/\D/g, '');
  const isPhoneAccepted =
    /^(\+?\d[\d\s-]{8,18}\d)$/.test(trimmedPhone) &&
    phoneDigits.length >= 10 &&
    phoneDigits.length <= 15;

  // Password live criteria
  const passwordRules = [
    { key: 'length', label: 'At least 8 characters', met: password.length >= 8 },
    { key: 'upper', label: 'At least 1 uppercase letter (A–Z)', met: /[A-Z]/.test(password) },
    { key: 'lower', label: 'At least 1 lowercase letter (a–z)', met: /[a-z]/.test(password) },
    { key: 'numSym', label: 'At least 1 number or symbol (0–9, !@#)', met: /[\d\W_]/.test(password) },
  ];
  const metPasswordCount = passwordRules.filter((r) => r.met).length;
  const isPasswordAccepted = passwordRules.every((r) => r.met);
  const isConfirmAccepted = confirmPassword.length > 0 && password === confirmPassword;

  const isFormAccepted =
    isNameAccepted &&
    isEmailAccepted &&
    isPhoneAccepted &&
    isPasswordAccepted &&
    isConfirmAccepted;

  const getBorderStyle = (hasValue: boolean, isAccepted: boolean, isFocused: boolean, isTouched?: boolean) => {
    if (hasValue && isAccepted) return styles.inputAccepted;
    if ((hasValue || isTouched) && !isAccepted && !isFocused) return styles.inputRejected;
    if (isFocused) return styles.inputFocused;
    return null;
  };

  const renderStatusBadge = (hasValue: boolean, isAccepted: boolean, isTouched?: boolean) => {
    if (!hasValue && !isTouched) return null;
    return (
      <View style={[styles.statusPill, isAccepted ? styles.statusPillAccepted : styles.statusPillRejected]}>
        <Ionicons
          name={isAccepted ? 'checkmark-circle' : 'close-circle'}
          size={15}
          color={isAccepted ? '#10b981' : '#ff6b6b'}
        />
        <Text style={[styles.statusPillText, isAccepted ? styles.statusTextAccepted : styles.statusTextRejected]}>
          {isAccepted ? 'Accepted' : 'Invalid'}
        </Text>
      </View>
    );
  };

  const handleSignUp = async () => {
    setErrorMessage('');
    setTouched({ name: true, email: true, phone: true, password: true, confirm: true });

    if (!isNameAccepted) {
      setErrorMessage('Please enter a valid full name (2–100 letters).');
      return;
    }
    if (!isEmailAccepted) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!isPhoneAccepted) {
      setErrorMessage('Please enter a valid 10–15 digit phone number (e.g. 09171234567).');
      return;
    }
    if (!isPasswordAccepted) {
      setErrorMessage('Password must meet all security requirements below.');
      return;
    }
    if (!isConfirmAccepted) {
      setErrorMessage('Confirmation password does not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name:             trimmedName,
        email:                 trimmedEmail.toLowerCase(),
        phone_number:          trimmedPhone,
        password,
        password_confirmation: confirmPassword,
        business_name:         trimmedName,   // customer can update this later in profile
        business_type:         'private_label',
        contact_person:        trimmedName,
        business_address:      'TBD',
      });
      setShowSuccess(true);
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
            <Image source={require('@/assets/images/bmanny-logo-hd.png')} style={styles.logo} />
            <Text style={styles.brandName}>BMANNY</Text>
            <Text style={styles.companyName}>PARTNERS INC.</Text>
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.continueText}>Sign up to get started with BMANNY</Text>

            {/* Error */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#ff6b6b" />
                <Text style={styles.errorMessage}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* 1. Full Name */}
            <View style={styles.fieldGroup}>
              <View
                style={[
                  styles.inputContainer,
                  getBorderStyle(fullName.length > 0, isNameAccepted, nameFocused, touched.name),
                ]}
              >
                <Ionicons name="person-outline" size={20} color="#2196F3" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#888"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  maxLength={100}
                  underlineColorAndroid="transparent"
                  selectionColor="#2196F3"
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => {
                    setNameFocused(false);
                    markTouched('name');
                  }}
                />
                {renderStatusBadge(fullName.length > 0, isNameAccepted, touched.name)}
              </View>
              {(fullName.length > 0 || touched.name) && !isNameAccepted ? (
                <Text style={styles.helperRejected}>
                  Enter 2–100 letters (spaces, periods, hyphens, and apostrophes allowed).
                </Text>
              ) : null}
            </View>

            {/* 2. Email */}
            <View style={styles.fieldGroup}>
              <View
                style={[
                  styles.inputContainer,
                  getBorderStyle(email.length > 0, isEmailAccepted, emailFocused, touched.email),
                ]}
              >
                <Ionicons name="mail-outline" size={20} color="#2196F3" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  maxLength={150}
                  underlineColorAndroid="transparent"
                  selectionColor="#2196F3"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => {
                    setEmailFocused(false);
                    markTouched('email');
                  }}
                />
                {renderStatusBadge(email.length > 0, isEmailAccepted, touched.email)}
              </View>
              {(email.length > 0 || touched.email) && !isEmailAccepted ? (
                <Text style={styles.helperRejected}>
                  Enter a valid email format (e.g. name@company.com).
                </Text>
              ) : null}
            </View>

            {/* 3. Phone Number (Top column before Password & Confirm Password) */}
            <View style={styles.fieldGroup}>
              <View
                style={[
                  styles.inputContainer,
                  getBorderStyle(phoneNumber.length > 0, isPhoneAccepted, phoneFocused, touched.phone),
                ]}
              >
                <Ionicons name="call-outline" size={20} color="#2196F3" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number (e.g. 09171234567)"
                  placeholderTextColor="#888"
                  value={phoneNumber}
                  onChangeText={(val) => setPhoneNumber(val.replace(/[^\d+\s-]/g, ''))}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  maxLength={20}
                  underlineColorAndroid="transparent"
                  selectionColor="#2196F3"
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => {
                    setPhoneFocused(false);
                    markTouched('phone');
                  }}
                />
                {renderStatusBadge(phoneNumber.length > 0, isPhoneAccepted, touched.phone)}
              </View>
              {(phoneNumber.length > 0 || touched.phone) && !isPhoneAccepted ? (
                <Text style={styles.helperRejected}>
                  Enter 10–15 digits (e.g. 09171234567 or +639171234567).
                </Text>
              ) : null}
            </View>

            {/* 4. Password */}
            <View style={styles.fieldGroup}>
              <View
                style={[
                  styles.inputContainer,
                  getBorderStyle(password.length > 0, isPasswordAccepted, passFocused, touched.password),
                ]}
              >
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
                  onBlur={() => {
                    setPassFocused(false);
                    markTouched('password');
                  }}
                />
                {renderStatusBadge(password.length > 0, isPasswordAccepted, touched.password)}
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#2196F3" />
                </TouchableOpacity>
              </View>

              {/* Live Password Acceptability Indicator & Checklist */}
              <View style={styles.passwordCard}>
                <View style={styles.passwordCardHeader}>
                  <Text style={styles.passwordCardTitle}>Password Requirements</Text>
                  <Text
                    style={[
                      styles.passwordStrengthLabel,
                      password.length === 0
                        ? { color: '#94a3b8' }
                        : isPasswordAccepted
                          ? { color: '#10b981' }
                          : metPasswordCount >= 2
                            ? { color: '#f59e0b' }
                            : { color: '#ff6b6b' },
                    ]}
                  >
                    {password.length === 0
                      ? 'Enter password'
                      : isPasswordAccepted
                        ? 'Accepted'
                        : 'Not yet accepted'}
                  </Text>
                </View>

                <View style={styles.strengthMeterRow}>
                  {[1, 2, 3, 4].map((bar) => (
                    <View
                      key={bar}
                      style={[
                        styles.strengthSegment,
                        metPasswordCount >= bar &&
                          (isPasswordAccepted
                            ? styles.segmentAccepted
                            : metPasswordCount >= 2
                              ? styles.segmentMedium
                              : styles.segmentWeak),
                      ]}
                    />
                  ))}
                </View>

                {passwordRules.map((rule) => (
                  <View key={rule.key} style={styles.ruleRow}>
                    <Ionicons
                      name={rule.met ? 'checkmark-circle' : password.length > 0 ? 'close-circle' : 'ellipse-outline'}
                      size={15}
                      color={rule.met ? '#10b981' : password.length > 0 ? '#ff6b6b' : '#64748b'}
                    />
                    <Text
                      style={[
                        styles.ruleText,
                        rule.met ? styles.ruleTextMet : password.length > 0 ? styles.ruleTextUnmet : null,
                      ]}
                    >
                      {rule.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 5. Confirm Password */}
            <View style={styles.fieldGroup}>
              <View
                style={[
                  styles.inputContainer,
                  getBorderStyle(confirmPassword.length > 0, isConfirmAccepted, confFocused, touched.confirm),
                ]}
              >
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
                  onBlur={() => {
                    setConfFocused(false);
                    markTouched('confirm');
                  }}
                />
                {renderStatusBadge(confirmPassword.length > 0, isConfirmAccepted, touched.confirm)}
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#2196F3" />
                </TouchableOpacity>
              </View>
              {(confirmPassword.length > 0 || touched.confirm) ? (
                <Text style={isConfirmAccepted ? styles.helperAccepted : styles.helperRejected}>
                  {isConfirmAccepted ? '✓ Passwords match and are accepted.' : '✕ Passwords must match exactly.'}
                </Text>
              ) : null}
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[
                styles.signUpButton,
                (!isFormAccepted || loading) && styles.signUpButtonMuted,
              ]}
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

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={52} color="#10b981" />
            </View>
            <Text style={styles.successTitle}>Account Created!</Text>
            <Text style={styles.successSubtitle}>Welcome to BMANNY Partners.</Text>
            <Text style={styles.successNote2}>
              Your account has been created successfully. You can now browse products and submit inquiries.
            </Text>
            <TouchableOpacity style={styles.continueBtn} onPress={() => router.replace('/home')}>
              <Text style={styles.continueBtnText}>Continue to App</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.45)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorMessage: {
    color: '#ff8585',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  fieldGroup: {
    marginBottom: 14,
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginLeft: 6,
  },
  statusPillAccepted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusPillRejected: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextAccepted: {
    color: '#10b981',
  },
  statusTextRejected: {
    color: '#ff6b6b',
  },
  helperRejected: {
    color: '#ff8585',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 4,
  },
  helperAccepted: {
    color: '#34d399',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 4,
    fontWeight: '600',
  },
  passwordCard: {
    marginTop: 8,
    backgroundColor: 'rgba(20, 30, 56, 0.92)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2f3d5e',
    padding: 12,
    gap: 6,
  },
  passwordCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passwordCardTitle: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  passwordStrengthLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  strengthMeterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#334155',
  },
  segmentAccepted: {
    backgroundColor: '#10b981',
  },
  segmentMedium: {
    backgroundColor: '#f59e0b',
  },
  segmentWeak: {
    backgroundColor: '#ff6b6b',
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  ruleText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  ruleTextMet: {
    color: '#d1fae5',
    fontWeight: '600',
  },
  ruleTextUnmet: {
    color: '#fca5a5',
  },
  eyeIcon: {
    paddingLeft: 10,
  },
  signUpButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  signUpButtonMuted: {
    opacity: 0.85,
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

  /* Registration success modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  successIconWrap: { marginBottom: 12 },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    color: '#a0a0a0',
    marginBottom: 10,
  },
  successNote2: {
    fontSize: 12,
    color: '#a0a0a0',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 20,
  },
  continueBtn: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
