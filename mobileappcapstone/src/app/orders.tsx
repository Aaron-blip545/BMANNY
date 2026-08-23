import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { getMyOrders, getMyInquiries } from '../services/api';

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
  order_id: number;
  status: string;
  total_amount: string;
  internal_tracking_number: string | null;
  created_at: string;
  item_details: string | null;
  inquiry_id: number | null;
  customizations: { packaging_type: string; serving_size: string | null }[];
}

interface Inquiry {
  inquiry_id: number;
  status: string;
  created_at: string;
  has_quotation: boolean;
  quotation_amount: string | null;
  customizations: { packaging_type: string; serving_size: string | null; client_notes: string | null }[];
}

export default function OrdersScreen() {
  const { colors } = useTheme();
  const [view, setView] = useState<'inquiries' | 'orders'>('inquiries');
  const [orders, setOrders] = useState<Order[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('approved');

  const statusTabs = [
    { id: 'approved',      label: 'Approved' },
    { id: 'in_production', label: 'In Production' },
    { id: 'for_delivery',  label: 'For Delivery' },
    { id: 'delivered',     label: 'Delivered' },
    { id: 'completed',     label: 'Completed' },
    { id: 'pending',       label: 'Pending' },
  ];

  const loadAll = useCallback(async () => {
    try {
      const [ordersData, inquiriesData] = await Promise.all([
        getMyOrders(),
        getMyInquiries(),
      ]);
      setOrders(ordersData);
      setInquiries(inquiriesData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);


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

  const inquiryStatusColor = (status: string) => {
    if (status === 'responded') return '#4CAF50';
    if (status === 'reviewed')  return '#2196F3';
    return '#ff6b35'; // pending
  };

  const filteredOrders = orders.filter(order => order.status === activeTab);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#ff6b35" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/home')}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{view === 'inquiries' ? 'My Inquiries' : 'My Orders'}</Text>
      </View>

      {/* VIEW SWITCHER */}
      <View style={[styles.switcherRow, { borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.switcherBtn, view === 'inquiries' && styles.switcherActive]}
          onPress={() => setView('inquiries')}
        >
          <Text style={[styles.switcherText, { color: view === 'inquiries' ? '#ffffff' : colors.textSecondary }]}>
            Inquiries {inquiries.length > 0 ? `(${inquiries.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switcherBtn, view === 'orders' && styles.switcherActive]}
          onPress={() => setView('orders')}
        >
          <Text style={[styles.switcherText, { color: view === 'orders' ? '#ffffff' : colors.textSecondary }]}>
            Orders {orders.length > 0 ? `(${orders.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── INQUIRIES VIEW ── */}
      {view === 'inquiries' && (
        <ScrollView
          style={styles.ordersScroll}
          contentContainerStyle={styles.ordersContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor="#ff6b35" />}
        >
          {inquiries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No Inquiries Yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Submit a rebranding inquiry from the Home screen to get started.
              </Text>
            </View>
          ) : (
            inquiries.map((inq) => (
              <View key={inq.inquiry_id} style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.orderHeader}>
                  <Text style={[styles.orderProduct, { color: colors.text }]}>
                    Inquiry #{inq.inquiry_id}
                    {inq.customizations?.[0]?.packaging_type ? ` — ${inq.customizations[0].packaging_type}` : ''}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: inquiryStatusColor(inq.status) }]}>
                    <Text style={styles.statusText}>{inq.status.charAt(0).toUpperCase() + inq.status.slice(1)}</Text>
                  </View>
                </View>

                <View style={styles.orderDetails}>
                  {inq.customizations?.[0]?.serving_size ? (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Specs:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{inq.customizations[0].serving_size}</Text>
                    </View>
                  ) : null}
                  {inq.customizations?.[0]?.client_notes ? (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Notes:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={2}>{inq.customizations[0].client_notes}</Text>
                    </View>
                  ) : null}
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Quotation:</Text>
                    <Text style={[styles.detailValue, { color: inq.has_quotation ? '#4CAF50' : colors.textSecondary }]}>
                      {inq.has_quotation ? `₱${parseFloat(inq.quotation_amount!).toLocaleString()}` : 'Awaiting quote...'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                  Submitted {new Date(inq.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* ── ORDERS VIEW ── */}
      {view === 'orders' && (
        <>
          <View style={styles.tabsWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
              {statusTabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && styles.activeTab, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText, { color: activeTab === tab.id ? '#ffffff' : colors.textSecondary }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            style={styles.ordersScroll}
            contentContainerStyle={styles.ordersContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor="#ff6b35" />}
          >
            {filteredOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No Orders Yet</Text>
              </View>
            ) : (
              filteredOrders.map((order) => (
                <View key={order.order_id} style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.orderHeader}>
                    <Text style={[styles.orderProduct, { color: colors.text }]}>
                      Order #{order.order_id}
                      {order.customizations?.[0]?.packaging_type ? ` — ${order.customizations[0].packaging_type}` : ''}
                    </Text>
                    <View style={[styles.statusBadge, getStatusStyle(order.status)]}>
                      <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
                    </View>
                  </View>
                  <View style={styles.orderDetails}>
                    {order.customizations?.[0]?.serving_size ? (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Specs:</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{order.customizations[0].serving_size}</Text>
                      </View>
                    ) : null}
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Amount:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>₱{parseFloat(order.total_amount).toLocaleString()}</Text>
                    </View>
                    {order.internal_tracking_number ? (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Tracking:</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{order.internal_tracking_number}</Text>
                      </View>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={[styles.viewButton, { backgroundColor: '#ff6b35' }]}
                    onPress={() => router.push({ pathname: '/order-detail', params: { orderData: JSON.stringify(order) } })}
                  >
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </TouchableOpacity>
                  <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                    {new Date(order.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </>
      )}

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

  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },

  /* INQUIRIES / ORDERS SWITCHER */
  switcherRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },

  switcherBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  switcherActive: {
    backgroundColor: '#ff6b35',
  },

  switcherText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
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