import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';

export default function OrdersScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending</Text>
            <Text style={styles.sectionCount}>0</Text>
          </View>
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No pending orders</Text>
          </View>
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
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff4500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionCount: {
    fontSize: 16,
    color: '#ff4500',
    fontWeight: '600',
  },
  emptySection: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#a0a0a0',
  },
});
