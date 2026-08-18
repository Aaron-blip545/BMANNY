import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

interface Product {
  id: number;
  name: string;
  price: string;
  image: any;
  description?: string;
  moq?: string;
}

const coffeeSupplements: Product[] = [
  { id: 1, name: 'Premium Coffee Protein', price: '$24.99', image: require('@/assets/images/homepageimage/sup1.jpg'), description: 'High-quality protein powder infused with premium coffee extract for sustained energy and muscle recovery.', moq: '50 units' },
  { id: 2, name: 'Organic Coffee Energy', price: '$19.99', image: require('@/assets/images/homepageimage/sup2.jpg'), description: 'Organic coffee-based energy supplement made from 100% natural ingredients for clean energy boost.', moq: '100 units' },
  { id: 3, name: 'Coffee Focus Blend', price: '$29.99', image: require('@/assets/images/homepageimage/sup3.jpg'), description: 'Specially formulated cognitive enhancer combining coffee with focus-boosting nootropics.', moq: '25 units' },
  { id: 4, name: 'Espresso Pre-Workout', price: '$34.99', image: require('@/assets/images/homepageimage/sup4.jpg'), description: 'Intense pre-workout formula with concentrated espresso for maximum performance and pump.', moq: '30 units' },
  { id: 5, name: 'Coffee Recovery Mix', price: '$27.99', image: require('@/assets/images/homepageimage/sup5.jpg'), description: 'Post-workout recovery blend with coffee antioxidants and essential amino acids.', moq: '40 units' },
  { id: 6, name: 'Cold Brew Supplement', price: '$22.99', image: require('@/assets/images/homepageimage/sup6.jpg'), description: 'Smooth cold brew coffee supplement perfect for daily hydration and moderate caffeine intake.', moq: '75 units' },
];

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = coffeeSupplements.find(p => p.id === parseInt(id));

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={product.image} style={styles.productImage} />

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>{product.price}</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MOQ (Minimum Order Quantity)</Text>
            <Text style={styles.moqText}>{product.moq}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push({ pathname: '/chat-detail', params: { name: product.name } })}>
          <View style={styles.buttonContent}>
            <Text style={styles.icon}>💬</Text>
            <Text style={styles.backButtonText}>Inquire</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendInquiryButton} onPress={() => router.push({ pathname: '/product-customization', params: { name: product.name } })}>
          <View style={styles.buttonContent}>
            <Text style={styles.icon}>⚙️</Text>
            <Text style={styles.sendInquiryText}>Customize order</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
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
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2a2a40',
  },
  productName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ff6b35',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    color: '#b8b8c0',
    lineHeight: 22,
  },
  moqText: {
    fontSize: 18,
    color: '#ff6b35',
    fontWeight: '700',
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#2a2a40',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#2a2a40',
    borderRadius: 14,
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
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  sendInquiryButton: {
    flex: 2,
    backgroundColor: '#ff6b35',
    borderRadius: 14,
    padding: 16,
  },
  sendInquiryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
});
