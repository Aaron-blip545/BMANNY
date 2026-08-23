import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: any;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'gcash',
    name: 'GCash',
    description: 'Pay using your GCash wallet',
    icon: require('@/assets/images/paymentmethodimage/gcash.png'),
  },
  {
    id: 'card',
    name: 'Credit / Debit Card',
    description: 'Support Visa, Mastercard, and other cards',
    icon: require('@/assets/images/paymentmethodimage/mastercard.png'),
  },
  {
    id: 'cod',
    name: 'Cash on Delivery (COD)',
    description: 'Pay in cash when the order is received',
    icon: require('@/assets/images/paymentmethodimage/cod.png'),
  },
];

export default function PaymentMethodScreen() {
  const { colors } = useTheme();
  const { formData, imageData } = useLocalSearchParams<{ formData: string; imageData: string }>();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedMethod(id);
  };

  const handleContinue = () => {
    if (!selectedMethod) return;
    
    // Parse the form data
    const parsedFormData = formData ? JSON.parse(formData) : {};
    
    // Navigate to payment with all the data
    router.push({
      pathname: '/payment',
      params: {
        orderData: JSON.stringify({
          ...parsedFormData,
          paymentMethod: selectedMethod,
          imageData: imageData || '',
          status: 'pending',
          orderDate: new Date().toISOString()
        })
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: '#2196F3' }]} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Payment Method</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Choose how you want to pay</Text>
          </View>
        </View>

        <View style={styles.paymentOptions}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentCard,
                selectedMethod === method.id && styles.selectedCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                selectedMethod === method.id && { borderColor: '#2196F3' },
              ]}
              onPress={() => handleSelect(method.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Image source={method.icon} style={styles.paymentIcon} />
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentName, { color: colors.text }]}>{method.name}</Text>
                  <Text style={[styles.paymentDescription, { color: colors.textSecondary }]}>{method.description}</Text>
                </View>
                <View style={[styles.radioButton, { borderColor: colors.border }, selectedMethod === method.id && { borderColor: '#2196F3' }]}>
                  {selectedMethod === method.id && <View style={[styles.radioInner, { backgroundColor: '#2196F3' }]} />}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {selectedMethod && (
          <TouchableOpacity style={[styles.continueButton, { backgroundColor: '#2196F3' }]} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 16,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  paymentOptions: {
    marginBottom: 24,
  },
  paymentCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
  },
  selectedCard: {
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 16,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadio: {
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  continueButton: {
    backgroundColor: '#2196F3',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
