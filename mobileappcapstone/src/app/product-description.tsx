import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { getProducts, getApiBaseUrl } from '../services/api';

interface Product {
  id: number;
  name: string;
  price: string;
  image?: any;
  image_url?: string | null;
  description?: string;
  moq?: string;
  shelf_life?: string;
  storage_conditions?: string;
}

const fallbackImages = [
  require('@/assets/images/homepageimage/sup1.jpg'),
  require('@/assets/images/homepageimage/sup2.jpg'),
  require('@/assets/images/homepageimage/sup3.jpg'),
  require('@/assets/images/homepageimage/sup4.jpg'),
  require('@/assets/images/homepageimage/sup5.jpg'),
  require('@/assets/images/homepageimage/sup6.jpg'),
];

export default function ProductDetailScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    price?: string;
    description?: string;
    moq?: string;
    image_url?: string;
    category?: string;
  }>();

  const [product, setProduct] = useState<Product | null>(() => {
    if (params.name) {
      return {
        id: parseInt(params.id || '1') || 1,
        name: params.name,
        price: params.price || '₱0.00',
        description: params.description || 'Premium custom formulation base.',
        moq: params.moq || '100 units',
        image_url: params.image_url || null,
      };
    }
    return null;
  });
  const [loading, setLoading] = useState(!params.name);

  useEffect(() => {
    async function fetchProduct() {
      if (!params.id && !params.name) return;
      try {
        const catalog = await getProducts();
        if (Array.isArray(catalog)) {
          const found = catalog.find(
            (p: any) =>
              (params.id && p.id?.toString() === params.id.toString()) ||
              (params.name && p.name.toLowerCase() === params.name.toLowerCase())
          );
          if (found) {
            setProduct({
              id: found.id || 1,
              name: found.name,
              price: found.price || '₱0.00',
              description: found.description || 'Premium custom formulation base.',
              moq: found.moq || '100 units',
              image_url: found.image_url || null,
              shelf_life: found.shelf_life,
              storage_conditions: found.storage_conditions,
            });
          }
        }
      } catch (err) {
        console.warn('Failed to load product details from server:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!product || !product.name) {
      fetchProduct();
    }
  }, [params.id, params.name]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2196F3" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={[styles.errorText, { color: colors.text, marginBottom: 16 }]}>Product not found</Text>
        <TouchableOpacity style={[styles.errorButton, { backgroundColor: '#2196F3' }]} onPress={() => router.back()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const getImageSource = () => {
    if (product.image_url) {
      const uri = product.image_url.startsWith('http')
        ? product.image_url
        : `${getApiBaseUrl().replace('/api', '')}${product.image_url}`;
      return { uri };
    }
    const idx = (product.id || 1) % fallbackImages.length;
    return fallbackImages[idx];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={getImageSource()} style={styles.productImage} />

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
        <TouchableOpacity
          style={[styles.customizeButton, { backgroundColor: '#2196F3' }]}
          onPress={() => router.push({ pathname: '/product-customization', params: { name: product.name } } as any)}
        >
          <View style={styles.buttonContent}>
            <Image source={require('@/assets/images/homepageimage/settings.png')} style={styles.iconImage} tintColor="#ffffff" />
            <Text style={styles.sendInquiryText}>Customize order</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorButtonText: {
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
  customizeButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 14,
    padding: 16,
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
