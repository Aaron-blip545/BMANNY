import React, { useState, useCallback, useEffect } from 'react';
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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { getMyOrders, getMyInquiries, cancelInquiry } from '../services/api';
import { subscribeToRealtime } from '../services/realtime';

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
  brand_name?: string | null;
  status: string;
  total_amount: string;
  internal_tracking_number: string | null;
  created_at: string;
  item_details: string | null;
  inquiry_id: number | null;
  customizations: { packaging_type: string; serving_size: string | null; client_notes?: string | null }[];
}

interface Inquiry {
  inquiry_id: number;
  client_inquiry_number: number;  // per-customer sequential number (1, 2, 3…)
  brand_name?: string | null;
  status: string;
  created_at: string;
  has_quotation: boolean;
  has_order: boolean;
  quotation_id: number | null;
  quotation_amount: string | null;
  quotation_status: string | null;
  payment_submitted_at: string | null;
  cancelled_at: string | null;
  customizations: { packaging_type: string; serving_size: string | null; client_notes: string | null }[];
}

function getBrandTitle(
  item: {
    brand_name?: string | null;
    customizations?: { client_notes?: string | null; packaging_type?: string | null }[];
    client_inquiry_number?: number;
    inquiry_id?: number | null;
    order_id?: number;
  },
  fallback: string
): string {
  if (item.brand_name && item.brand_name.trim()) {
    return item.brand_name.trim();
  }
  if (item.customizations?.[0]?.client_notes) {
    const match = item.customizations[0].client_notes.match(/Brand:\s*([^|]+)/i);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }
  }
  if ('client_inquiry_number' in item && item.client_inquiry_number) {
    return `Inquiry #${item.client_inquiry_number}`;
  }
  if ('inquiry_id' in item && item.inquiry_id) {
    return `Inquiry #${item.inquiry_id}`;
  }
  if ('order_id' in item && item.order_id) {
    return `Order #${item.order_id}`;
  }
  return fallback;
}

export default function OrdersScreen() {
  const { colors } = useTheme();
  const { source, tab } = useLocalSearchParams<{
    source?: string;
    tab?: string;
  }>();
  const [view, setView] = useState<'inquiries' | 'history' | 'orders'>('inquiries');
  const [orders, setOrders] = useState<Order[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('approved');

  // Cancel-with-reason modal state
  const [cancelModal, setCancelModal] = useState<{
    visible: boolean;
    inquiryId: number | null;
    title: string;
    reason: string;
    submitting: boolean;
  }>({ visible: false, inquiryId: null, title: '', reason: '', submitting: false });

  const statusTabs = [
    { id: 'approved', label: 'Approved' },
    { id: 'in_production', label: 'In Production' },
    { id: 'for_delivery', label: 'For Delivery' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'pending', label: 'Pending' },
  ];

  useEffect(() => {
    if (source === 'notification') {
      setView('orders');
    }

    if (tab && ['approved', 'in_production', 'for_delivery', 'delivered', 'completed', 'cancelled', 'pending'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [source, tab]);

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

  useEffect(() => {
    // Order, quotation, and inquiry notifications mean the server has
    // changed data that this screen presents, so refresh it immediately.
    return subscribeToRealtime((event) => {
      if (event.type === 'notification.created' && ['order', 'quotation', 'inquiry'].includes(event.payload.type)) {
        loadAll();
      }
    });
  }, [loadAll]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return styles.pending;
      case 'approved': return styles.approved;
      case 'in_production': return styles.in_production;
      case 'for_delivery': return styles.for_delivery;
      case 'delivered': return styles.delivered;
      case 'completed': return styles.completed;
      case 'cancelled': return styles.cancelled;
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

  /** Whether an inquiry is currently eligible for cancellation */
  const canCancelInquiry = (inq: Inquiry): boolean => {
    if (inq.cancelled_at) return false;         // already cancelled
    if (inq.has_order) return false;            // order exists
    if (inq.payment_submitted_at) return false; // payment submitted
    // Allow: no quotation yet OR quotation sent but unpaid
    return true;
  };

  const openCancelModal = (inq: Inquiry, title: string) => {
    setCancelModal({ visible: true, inquiryId: inq.inquiry_id, title, reason: '', submitting: false });
  };

  const closeCancelModal = () => {
    if (cancelModal.submitting) return;
    setCancelModal(prev => ({ ...prev, visible: false, reason: '' }));
  };

  const submitCancel = async () => {
    const { inquiryId, reason } = cancelModal;
    if (!inquiryId || reason.trim().length < 5) return;
    setCancelModal(prev => ({ ...prev, submitting: true }));
    try {
      await cancelInquiry(inquiryId, reason.trim());
      await loadAll();
      setCancelModal({ visible: false, inquiryId: null, title: '', reason: '', submitting: false });
    } catch (err: any) {
      setCancelModal(prev => ({ ...prev, submitting: false }));
      Alert.alert('Unable to Cancel', err.message || 'Something went wrong. Please try again.');
    }
  };

  const filteredOrders = orders.filter(o => o.status === activeTab);
  // Active inquiries: not yet converted to an order, not cancelled
  const activeInquiries = inquiries.filter(inq => !inq.has_order && !inq.cancelled_at);
  // All inquiries for history tab (already sorted newest-first by backend)
  const allInquiries = inquiries;

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
        <Text style={styles.title}>
          {view === 'inquiries' ? 'My Inquiries' : view === 'history' ? 'Inquiry History' : 'My Orders'}
        </Text>
      </View>

      {/* SWITCHER: Inquiries | History | Orders */}
      <View style={[styles.switcherRow, { borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.switcherBtn, view === 'inquiries' && styles.switcherActive]}
          onPress={() => setView('inquiries')}
        >
          <Text style={[styles.switcherText, { color: view === 'inquiries' ? '#ffffff' : colors.textSecondary }]}>
            Inquiries{activeInquiries.length > 0 ? ` (${activeInquiries.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switcherBtn, view === 'history' && styles.switcherActive]}
          onPress={() => setView('history')}
        >
          <Text style={[styles.switcherText, { color: view === 'history' ? '#ffffff' : colors.textSecondary }]}>
            History
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

      {/* ── ACTIVE INQUIRIES VIEW ── */}
      {view === 'inquiries' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor="#2196F3" />}
        >
          {activeInquiries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No Active Inquiries</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Submit a rebranding inquiry from the Home screen to get started.
              </Text>
            </View>
          ) : (
            activeInquiries.map((inq) => {
              const inqTitle = getBrandTitle(inq, `Inquiry #${inq.client_inquiry_number ?? inq.inquiry_id}`);
              return (
                <View key={inq.inquiry_id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {inqTitle}
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

                  {canCancelInquiry(inq) && (
                    <TouchableOpacity
                      style={[styles.cancelInquiryBtn, { borderColor: '#E53935' }]}
                      onPress={() => openCancelModal(inq, inqTitle)}
                    >
                      <Text style={styles.cancelInquiryBtnText}>Cancel Inquiry</Text>
                    </TouchableOpacity>
                  )}

                  <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
                    Submitted {new Date(inq.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── HISTORY VIEW (all inquiries including converted ones = receipts) ── */}
      {view === 'history' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor="#2196F3" />}
        >
          {allInquiries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🗂️</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No History Yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                All your past inquiries and receipts will appear here.
              </Text>
            </View>
          ) : (
            allInquiries.map((inq) => {
              const inqTitle = getBrandTitle(inq, `Inquiry #${inq.client_inquiry_number ?? inq.inquiry_id}`);
              const isCancelled = !!inq.cancelled_at;
              const convertedToOrder = inq.has_order;
              return (
                <View
                  key={inq.inquiry_id}
                  style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isCancelled && styles.cardCancelled,
                  ]}
                >
                  <View style={styles.receiptHeader}>
                    <View style={styles.receiptHeaderLeft}>
                      <Text style={[styles.cardTitle, { color: isCancelled ? colors.textSecondary : colors.text }]}>
                        {inqTitle}
                      </Text>
                      {inq.customizations?.[0]?.packaging_type ? (
                        <Text style={[styles.receiptSubtitle, { color: colors.textSecondary }]}>
                          {inq.customizations[0].packaging_type}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <View style={[styles.badge, { backgroundColor: inquiryStatusColor(inq) }]}>
                        <Text style={styles.badgeText}>{inquiryStatusLabel(inq)}</Text>
                      </View>
                      {convertedToOrder && (
                        <View style={[styles.badge, { backgroundColor: '#4CAF50' }]}>
                          <Text style={styles.badgeText}>✓ Order Created</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={[styles.receiptDivider, { borderColor: colors.border }]} />

                  <View style={styles.cardBody}>
                    <View style={styles.row}>
                      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Inquiry #</Text>
                      <Text style={[styles.rowValue, { color: colors.text }]}>
                        {inq.client_inquiry_number ?? inq.inquiry_id}
                      </Text>
                    </View>
                    {inq.has_quotation && inq.quotation_amount ? (
                      <View style={styles.row}>
                        <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Quoted Amount:</Text>
                        <Text style={[styles.rowValue, { color: '#4CAF50', fontWeight: '800' }]}>
                          ₱{parseFloat(inq.quotation_amount).toLocaleString()}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.row}>
                        <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Quotation:</Text>
                        <Text style={[styles.rowValue, { color: colors.textSecondary }]}>No quote received</Text>
                      </View>
                    )}
                    {inq.customizations?.[0]?.serving_size ? (
                      <View style={styles.row}>
                        <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Specs:</Text>
                        <Text style={[styles.rowValue, { color: colors.text }]}>{inq.customizations[0].serving_size}</Text>
                      </View>
                    ) : null}
                    <View style={styles.row}>
                      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Submitted:</Text>
                      <Text style={[styles.rowValue, { color: colors.text }]}>
                        {new Date(inq.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    {isCancelled && inq.cancelled_at ? (
                      <View style={styles.row}>
                        <Text style={[styles.rowLabel, { color: '#E53935' }]}>Cancelled:</Text>
                        <Text style={[styles.rowValue, { color: '#E53935' }]}>
                          {new Date(inq.cancelled_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
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
              filteredOrders.map((order) => {
                const orderTitle = getBrandTitle(order, `Order #${order.order_id}`);
                return (
                  <View key={order.order_id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>
                        {orderTitle}
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
                      onPress={() => {
                        const notes = order.customizations?.[0]?.client_notes || '';
                        const flavorMatch = notes.match(/Flavor:\s*([^|]+)/i);
                        const labelMatch = notes.match(/Label:\s*([^|]+)/i);
                        const serving = order.customizations?.[0]?.serving_size || '';
                        const sizeMatch = serving.match(/^([^\s×x]+)/);
                        const qtyMatch = serving.match(/[×x]\s*([^\s]+(?:\s+units)?)/i);

                        const detailPayload = {
                          ...order,
                          brandName: orderTitle,
                          productType: order.customizations?.[0]?.packaging_type || 'Custom Order',
                          packaging: order.customizations?.[0]?.packaging_type || 'N/A',
                          flavor: flavorMatch ? flavorMatch[1].trim() : undefined,
                          size: sizeMatch ? sizeMatch[1].trim() : undefined,
                          quantity: qtyMatch ? qtyMatch[1].trim() : undefined,
                          labelDesign: labelMatch ? labelMatch[1].trim() : undefined,
                          container: order.customizations?.[0]?.packaging_type || undefined,
                          orderDate: order.created_at,
                        };

                        router.push({
                          pathname: '/order-detail',
                          params: { orderData: JSON.stringify(detailPayload) },
                        });
                      }}
                    >
                      <Text style={styles.viewBtnText}>View Details</Text>
                    </TouchableOpacity>

                    {/* Reorder button is inside the order detail screen */}

                    <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
                      {new Date(order.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                );
              })
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

      {/* ── CANCEL INQUIRY MODAL (with reason) ── */}
      <Modal
        visible={cancelModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeCancelModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

            <Text style={[styles.modalTitle, { color: colors.text }]}>Cancel Inquiry</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              "{cancelModal.title}"
            </Text>

            <Text style={[styles.modalLabel, { color: colors.text }]}>
              Reason for cancellation <Text style={{ color: '#E53935' }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  borderColor:
                    cancelModal.reason.trim().length > 0 && cancelModal.reason.trim().length < 5
                      ? '#E53935'
                      : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. Changed my mind, found another supplier…"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={cancelModal.reason}
              onChangeText={(text) => setCancelModal(prev => ({ ...prev, reason: text }))}
              editable={!cancelModal.submitting}
              maxLength={1000}
            />
            {cancelModal.reason.trim().length > 0 && cancelModal.reason.trim().length < 5 && (
              <Text style={styles.modalInputHint}>Please provide at least 5 characters.</Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnOutline, { borderColor: colors.border }]}
                onPress={closeCancelModal}
                disabled={cancelModal.submitting}
              >
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Keep Inquiry</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.modalBtnDanger,
                  (cancelModal.reason.trim().length < 5 || cancelModal.submitting) && styles.modalBtnDisabled,
                ]}
                onPress={submitCancel}
                disabled={cancelModal.reason.trim().length < 5 || cancelModal.submitting}
              >
                <Text style={styles.modalBtnDangerText}>
                  {cancelModal.submitting ? 'Cancelling…' : 'Confirm Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  cardCancelled: {
    opacity: 0.7,
  },

  /* RECEIPT STYLE (history tab) */
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  receiptHeaderLeft: { flex: 1 },
  receiptSubtitle: { fontSize: 12, marginTop: 2 },
  receiptDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 10,
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
  cancelled: { backgroundColor: '#E53935' },

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

  /* CANCEL MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    lineHeight: 20,
  },
  modalInputHint: {
    color: '#E53935',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalBtnOutline: {
    borderWidth: 1.5,
  },
  modalBtnDanger: {
    backgroundColor: '#E53935',
  },
  modalBtnDisabled: {
    opacity: 0.4,
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalBtnDangerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
