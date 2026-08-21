import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
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
  const { colors } = useTheme();
  const { orderData } = useLocalSearchParams<{ orderData: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('pending');

  const statusTabs = [
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'in_production', label: 'In Production' },
    { id: 'for_delivery', label: 'For Delivery' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'completed', label: 'Completed' },
  ];

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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return styles.pending;
      case 'approved':
        return styles.approved;
      case 'in_production':
        return styles.in_production;
      case 'for_delivery':
        return styles.for_delivery;
      case 'delivered':
        return styles.delivered;
      case 'completed':
        return styles.completed;
      default:
        return styles.pending;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_production':
        return 'In Production';
      case 'for_delivery':
        return 'For Delivery';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const filteredOrders = orders.filter(
    order => order.status === activeTab
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/home')}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>My Purchases</Text>
      </View>

      {/* STATUS TABS */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {statusTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText,
                  { color: activeTab === tab.id ? '#ffffff' : colors.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ORDERS ONLY SCROLL */}
      <ScrollView
        style={styles.ordersScroll}
        contentContainerStyle={styles.ordersContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No Orders Yet</Text>
          </View>
        ) : (
          filteredOrders.map((order, index) => (
            <View key={index} style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>

              {/* CARD HEADER */}
              <View style={styles.orderHeader}>
                <Text style={[styles.orderProduct, { color: colors.text }]}>
                  {order.productType}
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    getStatusStyle(order.status),
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusLabel(order.status)}
                  </Text>
                </View>
              </View>

              {/* ORDER DETAILS */}
              <View style={styles.orderDetails}>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Flavor:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {order.flavor}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Size:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {order.size}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Quantity:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {order.quantity}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Payment:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {order.paymentMethod}
                  </Text>
                </View>

              </View>

              <TouchableOpacity 
                style={[styles.viewButton, { backgroundColor: colors.accent }]}
                onPress={() => {
                  router.push({
                    pathname: '/order-detail',
                    params: { orderData: JSON.stringify(order) }
                  });
                }}
              >
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>

              <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                {new Date(order.orderDate).toLocaleDateString()}
              </Text>

            </View>
          ))
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

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },

  backButton: {
    backgroundColor: '#ff6b35',
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
    color: '#ff6b35',
    flex: 1,
    textAlign: 'center',
    marginRight: 60,
  },

  /* TABS */
  tabsWrapper: {
    height: 48,
  },

  tabsContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingVertical: 8,
  },

  tab: {
    width: 80,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  activeTab: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',

    shadowColor: '#ff6b35',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  tabText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  activeTabText: {
    color: '#ffffff',
  },

  /* ORDERS SCROLL */
  ordersScroll: {
    flex: 1,
  },

  ordersContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },

  /* EMPTY STATE */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* ORDER CARD */
  orderCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  orderProduct: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    letterSpacing: 0.5,
  },

  /* STATUS BADGE */
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  pending: {
    backgroundColor: '#ff6b35',
  },

  approved: {
    backgroundColor: '#4CAF50',
  },

  in_production: {
    backgroundColor: '#2196F3',
  },

  for_delivery: {
    backgroundColor: '#9C27B0',
  },

  delivered: {
    backgroundColor: '#00BCD4',
  },

  completed: {
    backgroundColor: '#4CAF50',
  },

  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* DETAILS */
  orderDetails: {
    marginBottom: 12,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
  },

  detailValue: {
    fontSize: 13,
    fontWeight: '700',
  },

  orderDate: {
    fontSize: 11,
    marginTop: 12,
  },

  viewButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },

  viewButtonText: {
    color: '#ffffff',
    fontSize: 14,
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