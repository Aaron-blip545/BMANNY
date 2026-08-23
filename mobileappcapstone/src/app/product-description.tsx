import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

interface Product {
  id: number;
  name: string;
  price: string;
  image: any;
  description?: string;
  moq?: string;
}

const coffeeSupplements: Product[] = [
  { id: 1, name: 'Premium Coffee Protein', price: '$24.99', image: require('@/assets/images/homepageimage/sup1.jpg'), description: 'High-quality protein powder infused with premium coffee extract for sustained energy and muscle recovery.', moq: '100 units' },
  { id: 2, name: 'Organic Coffee Energy', price: '$19.99', image: require('@/assets/images/homepageimage/sup2.jpg'), description: 'Organic coffee-based energy supplement made from 100% natural ingredients for clean energy boost.', moq: '100 units' },
  { id: 3, name: 'Coffee Focus Blend', price: '$29.99', image: require('@/assets/images/homepageimage/sup3.jpg'), description: 'Specially formulated cognitive enhancer combining coffee with focus-boosting nootropics.', moq: '100 units' },
  { id: 4, name: 'Espresso Pre-Workout', price: '$34.99', image: require('@/assets/images/homepageimage/sup4.jpg'), description: 'Intense pre-workout formula with concentrated espresso for maximum performance and pump.', moq: '100 units' },
  { id: 5, name: 'Coffee Recovery Mix', price: '$27.99', image: require('@/assets/images/homepageimage/sup5.jpg'), description: 'Post-workout recovery blend with coffee antioxidants and essential amino acids.', moq: '100 units' },
  { id: 6, name: 'Cold Brew Supplement', price: '$22.99', image: require('@/assets/images/homepageimage/sup6.jpg'), description: 'Smooth cold brew coffee supplement perfect for daily hydration and moderate caffeine intake.', moq: '100 units' },
];

export default function ProductDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = coffeeSupplements.find(p => p.id === parseInt(id));

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Product not found</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: '#2196F3' }]} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.headerBackButton, { backgroundColor: '#2196F3' }]} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={product.image} style={styles.productImage} />

        <View style={[styles.productInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
          <Text style={[styles.productPrice, { color: '#2196F3' }]}>{product.price}</Text>
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{product.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>MOQ (Minimum Order Quantity)</Text>
            <Text style={[styles.moqText, { color: '#2196F3' }]}>{product.moq}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomButtons, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.border }]} onPress={() => router.push({ pathname: '/chat-detail', params: { name: product.name } })}>
          <Text style={[styles.backButtonText, { color: colors.text }]}>Inquire</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sendInquiryButton, { backgroundColor: '#2196F3' }]} onPress={() => router.push({ pathname: '/product-customization', params: { name: product.name } })}>
          <View style={styles.buttonContent}>
            <Image source={require('@/assets/images/homepageimage/settings.png')} style={styles.iconImage} tintColor={colors.text} />
            <Text style={[styles.sendInquiryText, { color: colors.text }]}>Customize order</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  headerBackButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  productImage: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    resizeMode: 'cover',
    marginBottom: 20,
  },
  productInfo: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  productName: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2196F3',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  moqText: {
    fontSize: 18,
    fontWeight: '700',
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
  },
  backButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  iconImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  sendInquiryButton: {
    flex: 2,
    backgroundColor: '#2196F3',
    borderRadius: 14,
    padding: 16,
  },
  sendInquiryText: {
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
});
