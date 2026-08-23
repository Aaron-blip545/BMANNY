import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { submitQuotationPayment } from '../services/api';

const HomeIcon = ({ colors }: { colors: any }) => (
  <Image source={require('@/assets/images/homepageicon/home.png')} style={styles.navIcon} tintColor={colors.text} />
);

const OrdersIcon = ({ colors }: { colors: any }) => (
  <Image source={require('@/assets/images/homepageicon/booking.png')} style={styles.navIcon} tintColor={colors.text} />
);

const MessagesIcon = ({ colors }: { colors: any }) => (
  <Image source={require('@/assets/images/homepageicon/messages.png')} style={styles.navIcon} tintColor={colors.text} />
);

const ProfileIcon = ({ colors }: { colors: any }) => (
  <Image source={require('@/assets/images/homepageicon/profile.png')} style={styles.navIcon} tintColor={colors.text} />
);

export default function PaymentScreen() {
  const { colors } = useTheme();
  const { quotationId, amount, paymentMethod } = useLocalSearchParams<{
    quotationId: string;
    amount: string;
    paymentMethod: string;
  }>();
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const totalAmount = parseFloat(amount) || 0;
  const method = paymentMethod || 'gcash';

  // Determine QR code based on payment method
  const qrCodeSource = method === 'card'
    ? require('@/assets/images/paymentmethodimage/debit qr.png')
    : require('@/assets/images/paymentmethodimage/gcash qr.png');

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setProofImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (method !== 'cod' && !proofImage) {
      Alert.alert('Error', 'Please upload a proof of payment image');
      return;
    }

    if (!quotationId) {
      Alert.alert('Error', 'Missing quotation reference. Please go back and try again.');
      return;
    }

    setIsUploading(true);
    try {
      await submitQuotationPayment(Number(quotationId), method as 'gcash' | 'card' | 'cod', proofImage);

      Alert.alert(
        'Payment Submitted! 🎉',
        'Your payment has been sent to our sales team for confirmation. Once confirmed, your order will be created.',
        [{ text: 'OK', onPress: () => router.push('/orders') }]
      );
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: '#2196F3' }]} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Payment</Text>
        </View>

        <View style={[styles.totalSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Quotation</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>#{quotationId}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Payment Method</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {method === 'gcash' ? 'GCash' : method === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery'}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: '#2196F3' }]}>₱{totalAmount.toLocaleString()}</Text>
          </View>
        </View>

        {method === 'cod' ? (
          <View style={[styles.codSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Cash on Delivery</Text>
            <Text style={[styles.codInstruction, { color: colors.textSecondary }]}>
              You will pay in cash when your order is delivered. Please have the exact amount ready.
            </Text>
          </View>
        ) : (
          <View style={[styles.qrSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Scan QR Code to Pay</Text>
            <Image
              source={qrCodeSource}
              style={styles.qrCode}
              resizeMode="contain"
            />
            <Text style={[styles.qrInstruction, { color: colors.textSecondary }]}>
              Scan this QR code using your {method === 'card' ? 'banking app' : 'GCash app'} to complete the payment
            </Text>
          </View>
        )}

        {method !== 'cod' && (
          <View style={[styles.uploadSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Upload Proof of Payment</Text>
            <Text style={[styles.uploadInstruction, { color: colors.textSecondary }]}>
              Take a screenshot or photo of your payment transaction
            </Text>

            {proofImage ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: proofImage }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setProofImage(null)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: colors.border }]}
                onPress={handlePickImage}
              >
                <Text style={[styles.uploadButtonText, { color: colors.text }]}>Upload Image</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: '#2196F3' }, isUploading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={isUploading}
        >
          <Text style={styles.submitButtonText}>
            {isUploading ? 'Submitting...' : method === 'cod' ? 'Confirm Cash on Delivery' : 'Submit Payment'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.navigationBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/home')}>
          <HomeIcon colors={colors} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/orders')}>
          <OrdersIcon colors={colors} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/messages')}>
          <MessagesIcon colors={colors} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
          <ProfileIcon colors={colors} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
  },
  totalSection: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  qrSection: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  qrCode: {
    width: 250,
    height: 250,
    marginBottom: 16,
  },
  qrInstruction: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  codSection: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  codInstruction: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  uploadSection: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
  },
  uploadInstruction: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewContainer: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  /* NAVIGATION BAR */
  navigationBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 20,
  },
  navItem: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  navIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
});
