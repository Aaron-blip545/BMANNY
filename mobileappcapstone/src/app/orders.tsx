import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

interface Order {
  productType: string;
  flavor: string;
  size: string;
  packaging: string;
  container: string;
  labelDesign: string;
  brandName: string;
  quantity: string;
  paymentMethod: string;
  imageData: string;
  status: string;
  orderDate: string;
}

export default function OrdersScreen() {
  const { orderData } = useLocalSearchParams<{ orderData: string }>();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (orderData) {
      try {
        const parsedOrder = JSON.parse(orderData);
        setOrders([parsedOrder]);
      } catch (error) {
        console.error('Error parsing order data:', error);
      }
    }
  }, [orderData]);

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const approvedOrders = orders.filter(order => order.status === 'approved');
  const inProductionOrders = orders.filter(order => order.status === 'in_production');
  const forDeliveryOrders = orders.filter(order => order.status === 'for_delivery');
  const deliveredOrders = orders.filter(order => order.status === 'delivered');
  const completedOrders = orders.filter(order => order.status === 'completed');
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending</Text>
            <Text style={styles.sectionCount}>{pendingOrders.length}</Text>
          </View>
          {pendingOrders.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No pending orders</Text>
            </View>
          ) : (
            pendingOrders.map((order, index) => (
              <View key={index} style={styles.orderCard}>
                <Text style={styles.orderProduct}>{order.productType}</Text>
                <Text style={styles.orderDetail}>Flavor: {order.flavor}</Text>
                <Text style={styles.orderDetail}>Size: {order.size}</Text>
                <Text style={styles.orderDetail}>Quantity: {order.quantity}</Text>
                <Text style={styles.orderDetail}>Payment: {order.paymentMethod}</Text>
                <Text style={styles.orderDate}>{new Date(order.orderDate).toLocaleDateString()}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Approved</Text>
            <Text style={styles.sectionCount}>0</Text>
          </View>
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No approved orders</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>In Production</Text>
            <Text style={styles.sectionCount}>0</Text>
          </View>
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No orders in production</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>For Delivery</Text>
            <Text style={styles.sectionCount}>0</Text>
          </View>
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No orders for delivery</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivered</Text>
            <Text style={styles.sectionCount}>0</Text>
          </View>
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No delivered orders</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Completed</Text>
            <Text style={styles.sectionCount}>0</Text>
          </View>
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No completed orders</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ff6b35',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a40',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a40',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionCount: {
    fontSize: 16,
    color: '#ff6b35',
    fontWeight: '700',
  },
  emptySection: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#b8b8c0',
  },
  orderCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a40',
  },
  orderProduct: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  orderDetail: {
    fontSize: 14,
    color: '#b8b8c0',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
});
