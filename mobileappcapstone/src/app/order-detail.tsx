import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

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

interface Order {
  productType?: string;
  flavor?: string;
  size?: string;
  packaging?: string;
  container?: string;
  labelDesign?: string;
  brandName?: string;
  quantity?: string;
  paymentMethod?: string;
  imageData?: string;
  status?: string;
  orderDate?: string;
  proofImage?: string;
  paymentDate?: string;
}

export default function OrderDetailScreen() {
  const { colors } = useTheme();
  const { orderData } = useLocalSearchParams<{ orderData: string }>();
  
  let order: Order = {};
  try {
    if (orderData) {
      order = JSON.parse(orderData);
    }
  } catch (error) {
    console.error('Error parsing order data:', error);
  }

  // If order is empty, show error
  if (!order || Object.keys(order).length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Order not found</Text>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: '#2196F3' }]} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#2196F3';
      case 'approved':
        return '#4CAF50';
      case 'in_production':
        return '#2196F3';
      case 'for_delivery':
        return '#9C27B0';
      case 'delivered':
        return '#00BCD4';
      case 'completed':
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  };

  console.log('Order data in order-detail:', order);
  console.log('Payment method:', order.paymentMethod);
  console.log('Proof image:', order.proofImage);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: '#2196F3' }]} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {order.brandName || 'Order Details'}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Product Information</Text>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status</Text>
            <View style={[styles.statusBox, { backgroundColor: getStatusColor(order.status || 'pending') }]}>
              <Text style={styles.statusBoxText}>
                {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'N/A'}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Product Type</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{order.productType || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Brand Name</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{order.brandName || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Flavor</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{order.flavor || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Size</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{order.size || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Quantity</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{order.quantity || 'N/A'}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Packaging Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Packaging</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{order.packaging || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Container</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{order.container || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Label Design</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{order.labelDesign || 'N/A'}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Information</Text>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Payment Method</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {(() => {
                if (order.paymentMethod === 'gcash') return 'GCash';
                if (order.paymentMethod === 'card') return 'Credit/Debit Card';
                if (order.paymentMethod === 'cod') return 'Cash on Delivery';
                return order.paymentMethod || 'N/A';
              })()}
            </Text>
          </View>
          
          {order.paymentDate && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Payment Date</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {new Date(order.paymentDate || '').toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {order.imageData && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Product Image</Text>
            <Image source={{ uri: order.imageData }} style={styles.productImage} resizeMode="cover" />
          </View>
        )}

        {(order.paymentMethod === 'gcash' || order.paymentMethod === 'card') && order.proofImage && order.proofImage !== '' && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Proof of Payment</Text>
            <Image source={{ uri: order.proofImage }} style={styles.proofImage} resizeMode="cover" />
          </View>
        )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBox: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBoxText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  proofImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
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
