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
import { MobileNavDock } from '../components/mobile-nav-dock';

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
  balance_payment_amount?: string | null;
  balance_payment_submitted_at?: string | null;
  balance_payment_verified_at?: string | null;
  timeline?: { label: string; at: string }[];
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
  quotation_payment_due_amount?: string | number | null;
  quotation_status: string | null;
  quotation_item_details?: string | null;
  quotation_valid_until?: string | null;
  quotation_payment_method?: string | null;
  quotation_created_at?: string | null;
  product_specification?: {
    product_name?: string | null;
    variant_name?: string | null;
    net_weight?: string | null;
    packaging_details?: string | null;
    selected_packaging?: string | null;
    label_details?: string | null;
    ingredients?: string | null;
    minimum_order_quantity?: number | null;
    lead_time_days?: number | null;
    presentation_image?: string | null;
  } | null;
  payment_submitted_at: string | null;
  cancelled_at: string | null;
  manufacturing_review?: {
    status: 'pending' | 'available' | 'alternative' | 'unavailable';
    response_notes: string | null;
    reviewed_at: string | null;
    suggested_variant: { name: string | null; product_name: string | null } | null;
    suggested_packaging: { name: string | null } | null;
  } | null;
  customizations: { packaging_type: string; serving_size: string | null; client_notes: string | null; selected_package?: string | null; requested_ingredient_note?: string | null; design_file_path?: string | null }[];
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

function DetailRow({ label, value, colors }: { label: string; value?: string | null; colors: any }) {
  if (!value) return null;

  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.detailRowLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailRowValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
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
  const [activeTab, setActiveTab] = useState('all');
  const [quotationDetails, setQuotationDetails] = useState<Inquiry | null>(null);
  const [manufacturingReviewDetails, setManufacturingReviewDetails] = useState<Inquiry | null>(null);

  // Cancel-with-reason modal state
  const [cancelModal, setCancelModal] = useState<{
    visible: boolean;
    inquiryId: number | null;
    title: string;
    reason: string;
    submitting: boolean;
  }>({ visible: false, inquiryId: null, title: '', reason: '', submitting: false });

  const statusTabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'approved', label: 'Approved' },
    { id: 'in_production', label: 'In Production' },
    { id: 'ready_for_pickup', label: 'Ready for Pickup' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  useEffect(() => {
    if (source === 'notification') {
      setView('orders');
    }

    if (tab && ['all', 'approved', 'in_production', 'ready_for_pickup', 'completed', 'cancelled'].includes(tab)) {
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
      if (event.type === 'notification.created' && ['order', 'quotation', 'inquiry', 'product_request'].includes(event.payload.type)) {
        loadAll();
      }
    });
  }, [loadAll]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return styles.pending;
      case 'approved': return styles.approved;
      case 'in_production': return styles.in_production;
      case 'ready_for_pickup': return styles.ready_for_pickup;
      case 'completed': return styles.completed;
      case 'cancelled': return styles.cancelled;
      default: return styles.pending;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_production': return 'In Production';
      case 'ready_for_pickup': return 'Ready for Pickup';
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

  const manufacturingReviewMeta = (inq: Inquiry) => {
    switch (inq.manufacturing_review?.status) {
      case 'available': return { title: 'Can be manufactured', color: '#4CAF50' };
      case 'alternative': return { title: 'Alternative suggested', color: '#F59E0B' };
      case 'unavailable': return { title: 'Cannot be manufactured', color: '#E53935' };
      default: return null;
    }
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

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab);
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
              const reviewMeta = manufacturingReviewMeta(inq);
              return (
                <View key={inq.inquiry_id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
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
                        <Text style={[styles.rowValue, { color: colors.text }]} numberOfLines={2}>{inq.customizations[0].serving_size}</Text>
                      </View>
                    ) : null}
                    {inq.customizations?.[0]?.client_notes ? (
                      <View style={styles.notesBlock}>
                        <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>Your request</Text>
                        <Text style={[styles.notesValue, { color: colors.text }]} numberOfLines={2}>
                          {inq.customizations[0].client_notes}
                        </Text>
                      </View>
                    ) : null}
                    {reviewMeta && (
                      <View style={[styles.manufacturingReview, { borderColor: reviewMeta.color }]}>
                        <View style={styles.manufacturingReviewHeader}>
                          <Text style={[styles.manufacturingReviewLabel, { color: reviewMeta.color }]}>MANUFACTURING REVIEW</Text>
                          <View style={[styles.reviewPill, { backgroundColor: reviewMeta.color }]}>
                            <Text style={styles.reviewPillText}>{reviewMeta.title}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={[styles.reviewDetailsBtn, { borderColor: reviewMeta.color }]}
                          onPress={() => setManufacturingReviewDetails(inq)}
                        >
                          <Text style={[styles.reviewDetailsBtnText, { color: reviewMeta.color }]}>View Inquiry Details</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <View style={styles.row}>
                      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Quotation:</Text>
                      <Text style={[styles.rowValue, { color: inq.has_quotation ? '#4CAF50' : colors.textSecondary }]}>
                        {inq.has_quotation ? `₱${parseFloat(inq.quotation_amount!).toLocaleString()}` : 'Awaiting quote...'}
                      </Text>
                    </View>
                    {inq.product_specification && (
                      <View style={styles.row}>
                        <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Approved:</Text>
                        <Text style={[styles.rowValue, styles.approvedProductValue, { color: colors.text }]} numberOfLines={1}>
                          {inq.product_specification.product_name ?? 'Approved product'}
                          {inq.product_specification.variant_name ? ` — ${inq.product_specification.variant_name}` : ''}
                        </Text>
                      </View>
                    )}
                  </View>

                  {inq.product_specification && !reviewMeta && (
                    <TouchableOpacity
                      style={[styles.detailsBtn, { borderColor: '#2196F3' }]}
                      onPress={() => setQuotationDetails(inq)}
                    >
                      <Text style={styles.detailsBtnText}>View Full Details</Text>
                    </TouchableOpacity>
                  )}

                  {inq.has_quotation && inq.quotation_status === 'sent' && !inq.payment_submitted_at && inq.manufacturing_review?.status !== 'unavailable' ? (
                    <TouchableOpacity
                      style={styles.viewBtn}
                      onPress={() => router.push({
                        pathname: '/payment-method',
                        params: {
                          quotationId: String(inq.quotation_id),
                          amount: String(inq.quotation_payment_due_amount ?? inq.quotation_amount),
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
                    : activeTab === 'all'
                      ? 'Your orders will appear here once a quotation is accepted.'
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
                      {order.timeline?.length ? <View style={[styles.timeline, { borderTopColor: colors.border }]}><Text style={[styles.timelineTitle, { color: colors.textSecondary }]}>ORDER TIMELINE</Text>{order.timeline.map((event, index) => <Text key={`${event.label}-${index}`} style={[styles.timelineItem, { color: colors.text }]}>{index === order.timeline!.length - 1 ? '●' : '○'} {event.label}</Text>)}</View> : null}
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

                    {order.status === 'ready_for_pickup' && !order.balance_payment_submitted_at && !order.balance_payment_verified_at && order.balance_payment_amount ? (
                      <TouchableOpacity
                        style={styles.balanceBtn}
                        onPress={() => router.push({ pathname: '/payment', params: { orderId: String(order.order_id), amount: String(order.balance_payment_amount), paymentMethod: 'bank_transfer' } })}
                      >
                        <Text style={styles.balanceBtnText}>Pay Balance ₱{Number(order.balance_payment_amount).toLocaleString('en-PH')}</Text>
                      </TouchableOpacity>
                    ) : order.status === 'ready_for_pickup' && order.balance_payment_submitted_at && !order.balance_payment_verified_at ? (
                      <Text style={[styles.balanceNotice, { color: colors.textSecondary }]}>Balance proof submitted â€” awaiting Sales verification.</Text>
                    ) : null}

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
      <MobileNavDock activeTab="orders" />

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

      {/* CUSTOMER QUOTATION DETAILS */}
      <Modal
        visible={quotationDetails !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setQuotationDetails(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.detailsSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailsScroll}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Quotation Details</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Review the approved product specification before payment.</Text>

              <View style={[styles.detailsTotal, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>Quotation total</Text>
                <Text style={styles.detailsAmount}>₱{quotationDetails?.quotation_amount ? parseFloat(quotationDetails.quotation_amount).toLocaleString() : '0.00'}</Text>
              </View>

              {quotationDetails?.product_specification && (
                <View style={styles.detailsSection}>
                  <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>Approved Product</Text>
                  <DetailRow label="Product" value={quotationDetails.product_specification.product_name} colors={colors} />
                  <DetailRow label="Variant" value={quotationDetails.product_specification.variant_name} colors={colors} />
                  <DetailRow label="Net content" value={quotationDetails.product_specification.net_weight} colors={colors} />
                  <DetailRow label="Packaging" value={quotationDetails.product_specification.selected_packaging ?? quotationDetails.product_specification.packaging_details} colors={colors} />
                  <DetailRow label="Packaging details" value={quotationDetails.product_specification.packaging_details} colors={colors} />
                  <DetailRow label="Label / printing" value={quotationDetails.product_specification.label_details} colors={colors} />
                  <DetailRow label="Ingredients" value={quotationDetails.product_specification.ingredients} colors={colors} />
                  <DetailRow label="Minimum order" value={quotationDetails.product_specification.minimum_order_quantity ? String(quotationDetails.product_specification.minimum_order_quantity) : null} colors={colors} />
                  <DetailRow label="Lead time" value={quotationDetails.product_specification.lead_time_days ? `${quotationDetails.product_specification.lead_time_days} days` : null} colors={colors} />
                </View>
              )}

              <TouchableOpacity style={styles.closeDetailsBtn} onPress={() => setQuotationDetails(null)}>
                <Text style={styles.viewBtnText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PRODUCT CONTROLLER MANUFACTURING REVIEW */}
      <Modal
        visible={manufacturingReviewDetails !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setManufacturingReviewDetails(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.detailsSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailsScroll}>
              {(() => {
                const review = manufacturingReviewDetails?.manufacturing_review;
                const meta = manufacturingReviewDetails ? manufacturingReviewMeta(manufacturingReviewDetails) : null;
                const suggestedOption = [
                  review?.suggested_variant?.product_name,
                  review?.suggested_variant?.name,
                  review?.suggested_packaging?.name,
                ].filter(Boolean).join(' — ');

                return (
                  <>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Inquiry Details</Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Product Controller response and quotation</Text>

                    {manufacturingReviewDetails?.customizations?.[0]?.selected_package && (
                      <View style={[styles.reviewSuggestionBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>SELECTED PACKAGE</Text>
                        <Text style={[styles.reviewSuggestionText, { color: colors.text }]}>{manufacturingReviewDetails.customizations[0].selected_package}</Text>
                        {manufacturingReviewDetails.customizations[0].requested_ingredient_note && <Text style={[styles.reviewResponseText, { color: colors.textSecondary }]}>{manufacturingReviewDetails.customizations[0].requested_ingredient_note}</Text>}
                      </View>
                    )}

                    {meta && (
                      <View style={[styles.reviewStatusBanner, { borderColor: meta.color }]}>
                        <Text style={[styles.reviewStatusTitle, { color: meta.color }]}>{meta.title}</Text>
                        <Text style={[styles.reviewStatusSubtitle, { color: colors.textSecondary }]}>BMANNY product review</Text>
                      </View>
                    )}

                    <View style={styles.detailsSection}>
                      <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>Response</Text>
                      <Text style={[styles.reviewResponseText, { color: colors.text }]}>
                        {review?.response_notes || 'No additional notes were provided.'}
                      </Text>
                    </View>

                    {review?.status === 'alternative' && (
                      <View style={[styles.reviewSuggestionBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>SUGGESTED ALTERNATIVE</Text>
                        <Text style={[styles.reviewSuggestionText, { color: colors.text }]}>
                          {suggestedOption || 'Please contact Sales for the suggested option.'}
                        </Text>
                      </View>
                    )}

                    {review?.reviewed_at && (
                      <Text style={[styles.reviewedDate, { color: colors.textSecondary }]}>
                        Reviewed {new Date(review.reviewed_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </Text>
                    )}

                    {manufacturingReviewDetails?.has_quotation && (
                      <View style={styles.quotationDetailsSection}>
                        <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>Quotation</Text>
                        <View style={[styles.detailsTotal, { backgroundColor: colors.background, borderColor: colors.border }]}>
                          <Text style={[styles.detailsLabel, { color: colors.textSecondary }]}>Quotation total</Text>
                          <Text style={styles.detailsAmount}>
                            ₱{manufacturingReviewDetails.quotation_amount ? parseFloat(manufacturingReviewDetails.quotation_amount).toLocaleString() : '0.00'}
                          </Text>
                        </View>

                        <View style={styles.detailsSection}>
                          <DetailRow label="Quotation status" value={manufacturingReviewDetails.quotation_status ? manufacturingReviewDetails.quotation_status.charAt(0).toUpperCase() + manufacturingReviewDetails.quotation_status.slice(1) : null} colors={colors} />
                          <DetailRow label="Valid until" value={manufacturingReviewDetails.quotation_valid_until ? new Date(manufacturingReviewDetails.quotation_valid_until).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : null} colors={colors} />
                          <DetailRow label="Payment method" value={manufacturingReviewDetails.quotation_payment_method ? manufacturingReviewDetails.quotation_payment_method.replace(/_/g, ' ') : null} colors={colors} />
                          <DetailRow label="Quotation notes" value={manufacturingReviewDetails.quotation_item_details} colors={colors} />
                        </View>

                        {manufacturingReviewDetails.product_specification && (
                          <View style={styles.detailsSection}>
                            <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>Approved Product</Text>
                            <DetailRow label="Product" value={manufacturingReviewDetails.product_specification.product_name} colors={colors} />
                            <DetailRow label="Variant" value={manufacturingReviewDetails.product_specification.variant_name} colors={colors} />
                            <DetailRow label="Net content" value={manufacturingReviewDetails.product_specification.net_weight} colors={colors} />
                            <DetailRow label="Packaging" value={manufacturingReviewDetails.product_specification.selected_packaging ?? manufacturingReviewDetails.product_specification.packaging_details} colors={colors} />
                            <DetailRow label="Packaging details" value={manufacturingReviewDetails.product_specification.packaging_details} colors={colors} />
                            <DetailRow label="Label / printing" value={manufacturingReviewDetails.product_specification.label_details} colors={colors} />
                            <DetailRow label="Ingredients" value={manufacturingReviewDetails.product_specification.ingredients} colors={colors} />
                            <DetailRow label="Minimum order" value={manufacturingReviewDetails.product_specification.minimum_order_quantity ? String(manufacturingReviewDetails.product_specification.minimum_order_quantity) : null} colors={colors} />
                            <DetailRow label="Lead time" value={manufacturingReviewDetails.product_specification.lead_time_days ? `${manufacturingReviewDetails.product_specification.lead_time_days} days` : null} colors={colors} />
                          </View>
                        )}
                      </View>
                    )}
                  </>
                );
              })()}

              <TouchableOpacity style={styles.closeDetailsBtn} onPress={() => setManufacturingReviewDetails(null)}>
                <Text style={styles.viewBtnText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
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
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', flex: 1, flexShrink: 1, lineHeight: 21 },
  cardBody: { marginBottom: 10 },
  cardDate: { fontSize: 11, marginTop: 6 },

  /* STATUS BADGES */
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#ffffff', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  pending: { backgroundColor: '#78909C' },
  approved: { backgroundColor: '#4CAF50' },
  in_production: { backgroundColor: '#FF9800' },
  ready_for_pickup: { backgroundColor: '#2196F3' },
  completed: { backgroundColor: '#4CAF50' },
  cancelled: { backgroundColor: '#E53935' },

  /* ROWS */
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 12 },
  rowLabel: { fontSize: 13, fontWeight: '500', flexShrink: 0 },
  rowValue: { fontSize: 13, fontWeight: '700', flex: 1, flexShrink: 1, textAlign: 'right', lineHeight: 19 },
  approvedProductValue: { flex: 1, marginLeft: 12, textAlign: 'right' },
  notesBlock: { marginBottom: 12 },
  notesLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  notesValue: { fontSize: 13, fontWeight: '600', lineHeight: 19 },
  manufacturingReview: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  manufacturingReviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  manufacturingReviewLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, flex: 1 },
  reviewPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 1 },
  reviewPillText: { color: '#ffffff', fontSize: 10, fontWeight: '800', textAlign: 'center' },
  manufacturingReviewText: { fontSize: 13, fontWeight: '600', lineHeight: 19 },
  suggestionText: { fontSize: 12, fontWeight: '600', lineHeight: 18, marginTop: 8 },
  reviewDetailsBtn: { borderWidth: 1, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  reviewDetailsBtnText: { fontSize: 13, fontWeight: '800' },
  reviewStatusBanner: { borderWidth: 1, borderRadius: 12, padding: 14, marginVertical: 14 },
  reviewStatusTitle: { fontSize: 18, fontWeight: '800' },
  reviewStatusSubtitle: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  reviewResponseText: { fontSize: 14, fontWeight: '500', lineHeight: 21 },
  reviewSuggestionBox: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 18 },
  reviewSuggestionText: { fontSize: 15, fontWeight: '700', lineHeight: 21, marginTop: 5 },
  reviewedDate: { fontSize: 12, marginTop: 16 },
  quotationDetailsSection: { marginTop: 22, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#2A3854' },
  detailsBtn: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginBottom: 8 },
  detailsBtnText: { color: '#2196F3', fontSize: 14, fontWeight: '700' },

  /* CUSTOMER QUOTATION DETAILS */
  detailsSheet: { maxHeight: '88%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 28 },
  detailsScroll: { paddingBottom: 4 },
  detailsTotal: { borderWidth: 1, borderRadius: 12, padding: 14, marginVertical: 14 },
  detailsLabel: { fontSize: 12, fontWeight: '600' },
  detailsAmount: { color: '#2196F3', fontSize: 26, fontWeight: '800', marginTop: 3 },
  detailsSection: { gap: 10 },
  detailsSectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  detailRow: { borderBottomWidth: 1, paddingBottom: 9 },
  detailRowLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  detailRowValue: { fontSize: 14, lineHeight: 20 },
  closeDetailsBtn: { backgroundColor: '#2196F3', borderRadius: 10, alignItems: 'center', paddingVertical: 12, marginTop: 20 },

  /* VIEW BUTTON */
  viewBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  viewBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  balanceBtn: { backgroundColor: '#2196F3', borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginTop: 9 },
  balanceBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  balanceNotice: { fontSize: 12.5, fontWeight: '600', textAlign: 'center', marginTop: 11 },
  timeline: { borderTopWidth: 1, marginTop: 12, paddingTop: 10, gap: 4 },
  timelineTitle: { fontSize: 10.5, fontWeight: '800', letterSpacing: .7, marginBottom: 2 },
  timelineItem: { fontSize: 12.5, lineHeight: 18 },

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
