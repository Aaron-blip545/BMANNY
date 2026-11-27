import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { reorderFromOrder } from '../services/api';

interface Order {
  order_id?: number;
  status?: string;
  priority?: string;
  estimated_completion_date?: string | null;
  estimated_delivery_date?: string | null;
  courier_name?: string | null;
  courier_tracking_number?: string | null;
  production_schedule?: {
    batch_code?: string | null;
    production_start_date?: string | null;
    target_end_date?: string | null;
    actual_start_date?: string | null;
    actual_end_date?: string | null;
    planned_quantity?: number;
    production_status?: string;
  } | null;
  delivery_batches?: Array<{
    batch_id: number;
    batch_number: number;
    quantity: number;
    fulfillment_type: string;
    delivery_status: string;
    scheduled_date?: string | null;
    courier_name?: string | null;
    tracking_number?: string | null;
    remarks?: string | null;
  }>;
  customizations?: {
    selected_package?: string | null;
    packaging_type?: string | null;
    packaging_finish?: string | null;
    serving_size?: string | null;
    requested_ingredient_note?: string | null;
    design_file_path?: string | null;
    client_notes?: string | null;
  }[];
  productName?: string;
  productType?: string;
  packageName?: string;
  companyName?: string;
  contactPerson?: string;
  flavor?: string;
  size?: string;
  packaging?: string;
  labelDesign?: string;
  brandName?: string;
  quantity?: string;
  leadTime?: string;
  packageTerms?: string;
  requestedIngredient?: string;
  specialInstructions?: string;
  paymentMethod?: string;
  payment_method?: string | null;
  paymentDate?: string;
  payment_submitted_at?: string | null;
  initial_payment_amount?: number | string | null;
  initial_payment_verified_at?: string | null;
  balance_payment_amount?: number | string | null;
  balance_payment_submitted_at?: string | null;
  balance_payment_verified_at?: string | null;
  imageData?: string;
  proofImage?: string;
  payment_proof_url?: string | null;
  orderDate?: string;
  created_at?: string;
  total_amount?: number | string | null;
  internal_tracking_number?: string | null;
  timeline?: { label: string; at?: string | null }[];
}

const peso = (val?: number | string | null) => {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  if (Number.isNaN(num)) return null;
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatStatus = (status?: string) => {
  if (!status) return 'Pending';
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const formatPaymentMethod = (method?: string | null) => {
  if (!method) return null;
  const m = method.toLowerCase();
  if (m === 'bank_transfer' || m === 'bank') return 'Bank Transfer';
  if (m === 'gcash') return 'GCash';
  if (m === 'card') return 'Credit / Debit Card';
  if (m === 'cod') return 'Cash on Delivery';
  return method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function OrderDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { orderData } = useLocalSearchParams<{ orderData: string }>();
  const [reordering, setReordering] = useState(false);

  let order: Order = {};
  try {
    if (orderData) {
      order = JSON.parse(orderData);
    }
  } catch (error) {
    console.error('Error parsing order data:', error);
  }

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
      case 'in_production':
        return '#2196F3';
      case 'ready_for_pickup':
        return '#F59E0B';
      case 'approved':
      case 'completed':
        return '#4CAF50';
      case 'for_delivery':
        return '#9C27B0';
      case 'delivered':
        return '#00BCD4';
      default:
        return '#64748B';
    }
  };

  const firstCust = order.customizations?.[0];
  const productDisplay = order.productName || order.productType || 'AshigoPlus Coffee Drink Mix';
  const packageDisplay =
    order.packageName ||
    (firstCust?.selected_package
      ? `${firstCust.selected_package.charAt(0).toUpperCase()}${firstCust.selected_package.slice(1)} Package`
      : null);
  const packagingDisplay = order.packaging || firstCust?.packaging_type || null;
  const labelDisplay = order.labelDesign || firstCust?.packaging_finish || null;
  const artworkUri = order.imageData || firstCust?.design_file_path || null;
  const proofUri = order.proofImage || order.payment_proof_url || null;
  const methodDisplay = formatPaymentMethod(order.paymentMethod || order.payment_method);
  const totalDisplay = peso(order.total_amount);
  const initialDisplay = peso(order.initial_payment_amount);
  const balanceNum = order.balance_payment_amount != null ? Number(order.balance_payment_amount) : null;
  const balanceDisplay = peso(order.balance_payment_amount);
  const orderDateDisplay = formatDate(order.orderDate || order.created_at);
  const initialVerifiedDate = formatDate(order.initial_payment_verified_at || order.paymentDate || order.payment_submitted_at);
  const balanceVerifiedDate = formatDate(order.balance_payment_verified_at);

  const DetailRow = ({ label, value }: { label: string; value?: string | null }) => {
    if (!value) return null;
    return (
      <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: '#2196F3' }]} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {order.brandName || 'Order Details'}
            </Text>
            {order.order_id ? (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Order #{order.order_id}{orderDateDisplay ? ` · ${orderDateDisplay}` : ''}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Product &amp; Package Information</Text>

          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status</Text>
            <View style={[styles.statusBox, { backgroundColor: getStatusColor(order.status || 'pending') }]}>
              <Text style={styles.statusBoxText}>{formatStatus(order.status)}</Text>
            </View>
          </View>

          <DetailRow label="Product" value={productDisplay} />
          <DetailRow label="Package" value={packageDisplay} />
          <DetailRow label="Brand Name" value={order.brandName} />
          <DetailRow label="Company" value={order.companyName} />
          <DetailRow label="Contact Person" value={order.contactPerson} />
          <DetailRow label="Flavor" value={order.flavor} />
          <DetailRow label="Net Weight" value={order.size} />
          <DetailRow label="Order Quantity" value={order.quantity} />
          <DetailRow label="Lead Time" value={order.leadTime} />
          <DetailRow label="Tracking No." value={order.internal_tracking_number} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Packaging &amp; Specifications</Text>

          <DetailRow label="Packaging" value={packagingDisplay || 'Stand-up pouch, 12 × 20 cm'} />
          <DetailRow label="Label Style" value={labelDisplay || 'Standard label'} />
          <DetailRow label="Requested Ingredient" value={order.requestedIngredient || firstCust?.requested_ingredient_note} />
          <DetailRow label="Special Instructions" value={order.specialInstructions} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Information</Text>

          <DetailRow label="Total Amount" value={totalDisplay} />
          <DetailRow
            label="Before Production"
            value={
              initialDisplay
                ? `${initialDisplay}${order.initial_payment_verified_at ? ' · Verified' : ''}`
                : null
            }
          />
          <DetailRow
            label="Before Pickup"
            value={
              balanceDisplay
                ? `${balanceDisplay}${
                    balanceNum !== null && balanceNum <= 0
                      ? ' · Paid upfront'
                      : order.balance_payment_verified_at
                        ? ' · Verified'
                        : order.balance_payment_submitted_at
                          ? ' · Proof submitted'
                          : ' · Due before pickup'
                  }`
                : null
            }
          />
          <DetailRow label="Payment Method" value={methodDisplay || 'Bank Transfer'} />
          <DetailRow label="Initial Payment Date" value={initialVerifiedDate} />
          <DetailRow label="Balance Verified Date" value={balanceVerifiedDate} />
          <DetailRow label="Payment Terms" value={order.packageTerms} />
        </View>

        {(order.production_schedule || order.estimated_completion_date || order.estimated_delivery_date) && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Production Schedule</Text>
            <DetailRow label="Batch Code" value={order.production_schedule?.batch_code} />
            <DetailRow
              label="Scheduled Window"
              value={
                order.production_schedule?.production_start_date
                  ? `${order.production_schedule.production_start_date} → ${order.production_schedule.target_end_date}`
                  : null
              }
            />
            <DetailRow label="Est. Completion" value={order.estimated_completion_date} />
            <DetailRow label="Est. Release / Delivery" value={order.estimated_delivery_date} />
            <DetailRow
              label="Courier & Tracking"
              value={
                order.courier_name
                  ? `${order.courier_name}${order.courier_tracking_number ? ` (${order.courier_tracking_number})` : ''}`
                  : null
              }
            />
          </View>
        )}

        {order.delivery_batches && order.delivery_batches.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery &amp; Pickup Batches</Text>
            {order.delivery_batches.map((b) => (
              <View key={b.batch_id} style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  Batch #{b.batch_number} · {b.quantity} units ({b.fulfillment_type}) — {b.delivery_status.replace(/_/g, ' ')}
                </Text>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  {b.scheduled_date ? `Date: ${b.scheduled_date}` : 'Date TBD'}
                  {b.courier_name ? ` · ${b.courier_name}` : ''}
                  {b.tracking_number ? ` (${b.tracking_number})` : ''}
                </Text>
                {b.remarks ? <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{b.remarks}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {order.timeline && order.timeline.length > 0 ? (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Timeline</Text>
            {order.timeline.map((event, idx) => (
              <View key={`${event.label}-${idx}`} style={styles.timelineRow}>
                <Text style={[styles.timelineDot, { color: idx === order.timeline!.length - 1 ? '#4CAF50' : '#2196F3' }]}>
                  {idx === order.timeline!.length - 1 ? '●' : '○'}
                </Text>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineLabel, { color: colors.text }]}>{event.label}</Text>
                  {event.at ? (
                    <Text style={[styles.timelineDate, { color: colors.textSecondary }]}>
                      {formatDate(event.at)}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {artworkUri ? (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Brand Artwork</Text>
            <Image source={{ uri: artworkUri }} style={styles.productImage} resizeMode="contain" />
          </View>
        ) : null}

        {proofUri ? (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Proof of Payment</Text>
            <Image source={{ uri: proofUri }} style={styles.proofImage} resizeMode="cover" />
          </View>
        ) : null}

        {/* Reorder Same — only for completed/delivered orders */}
        {(order.status === 'completed' || order.status === 'delivered') && order.order_id ? (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: '#4CAF50' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Reorder</Text>
            <Text style={[styles.reorderDesc, { color: colors.textSecondary }]}>
              Want the same product again? Submit a new inquiry with identical specs — our sales team will send you a fresh quotation.
            </Text>
            <TouchableOpacity
              style={[styles.reorderBtn, reordering && styles.reorderBtnDisabled]}
              disabled={reordering}
              onPress={() => {
                const specs: string[] = [];
                if (packageDisplay) specs.push(`Package: ${packageDisplay}`);
                if (packagingDisplay) specs.push(`Packaging: ${packagingDisplay}`);
                if (order.size) specs.push(`Net Weight: ${order.size}`);
                if (order.quantity) specs.push(`Quantity: ${order.quantity}`);
                if (order.brandName) specs.push(`Brand: ${order.brandName}`);
                const specsText = specs.length > 0 ? `\n\n${specs.join('\n')}` : '';

                Alert.alert(
                  'Reorder Same?',
                  `Submit a new inquiry with the same specs as "${order.brandName || 'this order'}"?${specsText}\n\nOur sales team will review and send you a fresh quotation.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Confirm Reorder',
                      onPress: async () => {
                        setReordering(true);
                        try {
                          await reorderFromOrder(order.order_id!);
                          Alert.alert(
                            'Reorder Submitted!',
                            "A new inquiry has been created. We'll send you a quotation soon.",
                            [{ text: 'View Inquiries', onPress: () => router.push('/orders') }]
                          );
                        } catch (err: any) {
                          Alert.alert('Reorder Failed', err.message || 'Something went wrong. Please try again.');
                        } finally {
                          setReordering(false);
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.reorderBtnText}>
                {reordering ? 'Submitting…' : 'Reorder Same'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleWrap: {
    flex: 1,
  },
  backButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 14,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
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
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 13.5,
    fontWeight: '500',
    minWidth: 110,
  },
  detailValue: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    textAlign: 'right',
    lineHeight: 19,
  },
  statusBox: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBoxText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
  },
  timelineDot: {
    fontSize: 13,
    marginTop: 1,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  timelineDate: {
    fontSize: 11.5,
    marginTop: 2,
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  proofImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  reorderDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  reorderBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  reorderBtnDisabled: {
    opacity: 0.5,
  },
  reorderBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
