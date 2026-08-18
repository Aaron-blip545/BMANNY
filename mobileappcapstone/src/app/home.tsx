import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';

const HomeIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 24, color }}>⌂</Text>
);

const OrdersIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 24, color }}>☰</Text>
);

const MessagesIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 24, color }}>◎</Text>
);

const ProfileIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 24, color }}>⌘</Text>
);

const coffeeSupplements = [
  { id: 1, name: 'Premium Coffee Protein', price: '$24.99', image: require('@/assets/images/homepageimage/sup1.jpg') },
  { id: 2, name: 'Organic Coffee Energy', price: '$19.99', image: require('@/assets/images/homepageimage/sup2.jpg') },
  { id: 3, name: 'Coffee Focus Blend', price: '$29.99', image: require('@/assets/images/homepageimage/sup3.jpg') },
  { id: 4, name: 'Espresso Pre-Workout', price: '$34.99', image: require('@/assets/images/homepageimage/sup4.jpg') },
  { id: 5, name: 'Coffee Recovery Mix', price: '$27.99', image: require('@/assets/images/homepageimage/sup5.jpg') },
  { id: 6, name: 'Cold Brew Supplement', price: '$22.99', image: require('@/assets/images/homepageimage/sup6.jpg') },
];

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = coffeeSupplements.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>BMANNY Partners Inc.</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.productsGrid}>
          {filteredProducts.map((product) => (
            <TouchableOpacity 
              key={product.id} 
              style={styles.productCard}
              onPress={() => {
                console.log('Navigating to product:', product.id);
                try {
                  // @ts-ignore
                  router.push(`/product-description?id=${product.id}`);
                } catch (error) {
                  console.error('Navigation error:', error);
                }
              }}
              activeOpacity={0.7}
            >
              <Image source={product.image} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>{product.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.navigationBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/home')}>
          <HomeIcon color="#a0a0a0" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/orders')}>
          <OrdersIcon color="#a0a0a0" />
          <Text style={styles.navText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/messages')}>
          <MessagesIcon color="#a0a0a0" />
          <Text style={styles.navText}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
          <ProfileIcon color="#a0a0a0" />
          <Text style={styles.navText}>Profile</Text>
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
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ff6b35',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2a40',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a40',
  },
  productImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 14,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ff6b35',
  },
  navigationBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#2a2a40',
    paddingBottom: 20,
  },
  navItem: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  navText: {
    color: '#b8b8c0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
