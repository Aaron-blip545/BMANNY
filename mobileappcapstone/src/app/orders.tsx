import React, { useState, useCallback } from 'react';
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
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { getMyOrders, getMyInquiries, cancelInquiry } from '../services/api';

const HomeIcon = ({ colors, isActive }: { colors: any; isActive?: boolean }) => (
  <Image source={require('@/assets/images/homepageicon/home.png')} style={styles.navIcon} tintColor={isActive ? '#2196F3' : colors.text} />
);
const OrdersIcon = ({ colors, isActive }: { colors: any; isActive?: boolean }) => (
  <Image source={require('@/assets/images/homepageicon/booking.png')} style={styles.navIcon} tintColor={isActive ? '#2196F3' : colors.text} />
);
const MessagesIcon = ({ colors, isActive }: { colors: any; isActive?: boolean }) => (
  <Image source={require('@/assets/images/homepageicon/messages.png')} style={styles.navIcon} tintColor={isActive ? '#2196F3' : colors.text} />
);
const ProfileIcon = ({ colors, isActive }: { colors: any; isActive?: boolean }) => (
  <Image source={require('@/assets/images/homepageicon/profile.png')} style={styles.navIcon} tintColor={isActive ? '#2196F3' : colors.text} />
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
  client_inquiry_number: number;  // per-customer sequential number (1, 2, 3…)
  status: string;
  created_at: string;
  has_quotation: boolean;
  quotation_id: number | null;
  quotation_amount: string | null;
  quotation_status: string | null;
  payment_submitted_at: string | null;
  cancelled_at: string | null;
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
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const statusTabs = [
    { id: 'approved', label: 'Approved' },
    { id: 'in_production', label: 'In Production' },
    { id: 'for_delivery', label: 'For Delivery' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'completed', label: 'Completed' },
    { id: 'pending', label: 'Pending' },
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

  // Refetch every time this screen gains focus - not just on first mount.
  // Without this, coming back to the Orders tab after paying a quotation
  // (or after the sales agent accepts it elsewhere) kept showing whatever
  // was fetched the first time the screen mounted, since expo-router
  // doesn't remount already-visited screens by default.
  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return styles.pending;
      case 'approved': return styles.approved;
      case 'in_production': return styles.in_production;
      case 'for_delivery': return styles.for_delivery;
      case 'delivered': return styles.delivered;
      case 'completed': return styles.completed;
      default: return styles.pending;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_production': return 'In Production';
      case 'for_delivery': return 'For Delivery';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const inquiryStatusColor = (inq: Inquiry) => {
    if (inq.cancelled_at) return '#E53935';
    if (inq.status === 'responded') return '#4CAF50';
    if (inq.status === 'reviewed') return '#2196F3';
    return '#78909C'; // pending → gray
  };

  const inquiryStatusLabel = (inq: Inquiry) => {
    if (inq.cancelled_at) return 'Cancelled';
    return inq.status.charAt(0).toUpperCase() + inq.status.slice(1);
  };

  const handleCancelInquiry = (inquiryId: number, inquiryNum: number) => {
    Alert.alert(
      'Cancel Inquiry?',
      `Are you sure you want to cancel Inquiry #${inquiryNum}? This cannot be undone.`,
      [
        { text: 'Keep Inquiry', style: 'cancel' },
        {
          text: 'Cancel Inquiry',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(inquiryId);
            try {
              await cancelInquiry(inquiryId);
              await loadAll();
            } catch (err: any) {
              Alert.alert('Unable to Cancel', err.message || 'Something went wrong. Please try again.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ],
    );
  };

  const filteredOrders = orders.filter(o => o.status === activeTab);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#2196F3" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>{view === 'inquiries' ? 'My Inquiries' : 'My Orders'}</Text>
      </View>

      {/* INQUIRIES / ORDERS SWITCHER */}
      <View style={[styles.switcherRow, { borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.switcherBtn, view === 'inquiries' && styles.switcherActive]}
          onPress={() => setView('inquiries')}
        >
          <Text style={[styles.switcherText, { color: view === 'inquiries' ? '#ffffffff' : colors.textSecondary }]}>
            Inquiries{inquiries.length > 0 ? ` (${inquiries.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switcherBtn, view === 'orders' && styles.switcherActive]}
          onPress={() => setView('orders')}
        >
          <Text style={[styles.switcherText, { color: view === 'orders' ? '#ffffff' : colors.textSecondary }]}>
            Orders{orders.length > 0 ? ` (${orders.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── INQUIRIES VIEW ── */}
      {view === 'inquiries' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor="#2196F3" />}
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
              <View key={inq.inquiry_id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    Inquiry #{inq.client_inquiry_number ?? inq.inquiry_id}
                    {inq.customizations?.[0]?.packaging_type ? ` — ${inq.customizations[0].packaging_type}` : ''}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: inquiryStatusColor(inq) }]}>
                    <Text style={styles.badgeText}>{inquiryStatusLabel(inq)}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  {inq.customizations?.[0]?.serving_size ? (
                    <View style={styles.row}>
                      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Specs:</Text>
                      <Text style={[styles.rowValue, { color: colors.text }]}>{inq.customizations[0].serving_size}</Text>
                    </View>
                  ) : null}
                  {inq.customizations?.[0]?.client_notes ? (
                    <View style={styles.row}>
                      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Notes:</Text>
                      <Text style={[styles.rowValue, { color: colors.text }]} numberOfLines={2}>{inq.customizations[0].client_notes}</Text>
                    </View>
                  ) : null}
                  <View style={styles.row}>
                    <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Quotation:</Text>
                    <Text style={[styles.rowValue, { color: inq.has_quotation ? '#4CAF50' : colors.textSecondary }]}>
                      {inq.has_quotation ? `₱${parseFloat(inq.quotation_amount!).toLocaleString()}` : 'Awaiting quote...'}
                    </Text>
                  </View>
                </View>

                {inq.has_quotation && inq.quotation_status === 'sent' && !inq.payment_submitted_at ? (
                  <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => router.push({
                      pathname: '/payment-method',
                      params: {
                        quotationId: String(inq.quotation_id),
                        amount: String(inq.quotation_amount),
                      },
                    })}
                  >
                    <Text style={styles.viewBtnText}>Pay Now</Text>
                  </TouchableOpacity>
                ) : inq.has_quotation && inq.quotation_status === 'sent' && inq.payment_submitted_at ? (
                  <View style={[styles.badge, { backgroundColor: '#2196F3', alignSelf: 'flex-start', marginTop: 8 }]}>
                    <Text style={styles.badgeText}>Payment Submitted — Awaiting Confirmation</Text>
                  </View>
                ) : inq.has_quotation && inq.quotation_status === 'accepted' ? (
                  <View style={[styles.badge, { backgroundColor: '#4CAF50', alignSelf: 'flex-start', marginTop: 8 }]}>
                    <Text style={styles.badgeText}>Order Created — see Orders tab</Text>
                  </View>
                ) : null}

                {!inq.has_quotation && !inq.cancelled_at && (inq.status === 'pending' || inq.status === 'reviewed') && (
                  <TouchableOpacity
                    style={[styles.cancelInquiryBtn, { borderColor: '#E53935' }]}
                    disabled={cancellingId === inq.inquiry_id}
                    onPress={() => handleCancelInquiry(inq.inquiry_id, inq.client_inquiry_number ?? inq.inquiry_id)}
                  >
                    <Text style={styles.cancelInquiryBtnText}>
                      {cancellingId === inq.inquiry_id ? 'Cancelling…' : 'Cancel Inquiry'}
                    </Text>
                  </TouchableOpacity>
                )}

                <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
            style={styles.tabsWrapper}
          >
            {statusTabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.activeTab, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.tabText, { color: activeTab === tab.id ? '#5377ebff' : colors.textSecondary }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor="#2196F3" />}
          >
            {filteredOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No Orders Yet</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  {orders.length === 0
                    ? 'Orders appear here after your inquiry is processed.'
                    : `No "${statusTabs.find(t => t.id === activeTab)?.label}" orders.`}
                </Text>
              </View>
            ) : (
              filteredOrders.map((order) => (
                <View key={order.order_id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      Order #{order.order_id}
                      {order.customizations?.[0]?.packaging_type ? ` — ${order.customizations[0].packaging_type}` : ''}
                    </Text>
                    <View style={[styles.badge, getStatusStyle(order.status)]}>
                      <Text style={styles.badgeText}>{getStatusLabel(order.status)}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    {order.customizations?.[0]?.serving_size ? (
                      <View style={styles.row}>
                        <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Specs:</Text>
                        <Text style={[styles.rowValue, { color: colors.text }]}>{order.customizations[0].serving_size}</Text>
                      </View>
                    ) : null}
                    <View style={styles.row}>
                      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Amount:</Text>
                      <Text style={[styles.rowValue, { color: colors.text }]}>₱{parseFloat(order.total_amount).toLocaleString()}</Text>
                    </View>
                    {order.internal_tracking_number ? (
                      <View style={styles.row}>
                        <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Tracking:</Text>
                        <Text style={[styles.rowValue, { color: colors.text }]}>{order.internal_tracking_number}</Text>
                      </View>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => router.push({ pathname: '/order-detail', params: { orderData: JSON.stringify(order) } })}
                  >
                    <Text style={styles.viewBtnText}>View Details</Text>
                  </TouchableOpacity>

                  <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
                    {new Date(order.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </>
      )}

      {/* BOTTOM NAV */}
      <View style={[styles.navBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/home')}>
          <HomeIcon colors={colors} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/orders')}>
          <OrdersIcon colors={colors} isActive />
          <Text style={[styles.navText, { color: '#2196F3' }]}>Orders</Text>
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
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 16,
  },
  backButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2196F3',
    flex: 1,
    textAlign: 'center',
    marginRight: 60,
  },

  /* SWITCHER */
  switcherRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  switcherBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  switcherActive: { backgroundColor: '#2196F3' },
  switcherText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },

  /* STATUS TABS */
  tabsWrapper: { maxHeight: 48 },
  tabsContainer: { paddingHorizontal: 20, alignItems: 'center', paddingVertical: 8 },
  tab: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },

  /* SCROLL */
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },

  /* EMPTY */
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  emptySubtext: { fontSize: 13, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 },

  /* CARD */
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  cardBody: { marginBottom: 10 },
  cardDate: { fontSize: 11, marginTop: 6 },

  /* STATUS BADGES */
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#ffffff', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  pending: { backgroundColor: '#78909C' },
  approved: { backgroundColor: '#4CAF50' },
  in_production: { backgroundColor: '#FF9800' },
  for_delivery: { backgroundColor: '#9C27B0' },
  delivered: { backgroundColor: '#00BCD4' },
  completed: { backgroundColor: '#4CAF50' },

  /* ROWS */
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowLabel: { fontSize: 13, fontWeight: '500' },
  rowValue: { fontSize: 13, fontWeight: '700' },

  /* VIEW BUTTON */
  viewBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  viewBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

  /* CANCEL INQUIRY BUTTON */
  cancelInquiryBtn: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 6,
  },
  cancelInquiryBtnText: { color: '#E53935', fontSize: 14, fontWeight: '700' },

  /* NAV */
  navBar: { flexDirection: 'row', borderTopWidth: 1, paddingBottom: 20 },
  navItem: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  navText: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  navIcon: { width: 24, height: 24, resizeMode: 'contain' },
});