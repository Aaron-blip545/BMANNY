import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Dimensions, Modal, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/api';

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

const carouselImages = [
  require('@/assets/images/sliderimage/552894504_122298455816006390_667527036630704169_n.jpg'),
  require('@/assets/images/sliderimage/555506696_122299127048006390_6001147551972761857_n.jpg'),
  require('@/assets/images/sliderimage/571990528_122304646826006390_9009641041524635359_n.jpg'),
  require('@/assets/images/sliderimage/574251976_122305393214006390_7882344860355931536_n.jpg'),
  require('@/assets/images/sliderimage/639048031_862557200117795_6194756105031337468_n.jpg'),
];

const coffeeSupplements = [
  { id: 1, name: 'Premium Coffee Protein', price: '$24.99', image: require('@/assets/images/homepageimage/sup1.jpg') },
  { id: 2, name: 'Organic Coffee Energy', price: '$19.99', image: require('@/assets/images/homepageimage/sup2.jpg') },
  { id: 3, name: 'Coffee Focus Blend', price: '$29.99', image: require('@/assets/images/homepageimage/sup3.jpg') },
  { id: 4, name: 'Espresso Pre-Workout', price: '$34.99', image: require('@/assets/images/homepageimage/sup4.jpg') },
  { id: 5, name: 'Coffee Recovery Mix', price: '$27.99', image: require('@/assets/images/homepageimage/sup5.jpg') },
  { id: 6, name: 'Cold Brew Supplement', price: '$22.99', image: require('@/assets/images/homepageimage/sup6.jpg') },
];

function formatRelativeTime(dateString: string) {
  if (!dateString) return 'Just now';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

interface NotificationItem {
  notification_id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { width } = Dimensions.get('window');

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    // Keep the badge and notification list current without requiring a
    // manual pull-to-refresh.
    const poll = setInterval(loadNotifications, 8000);
    return () => clearInterval(poll);
  }, [loadNotifications]);

  const handleNotificationPress = async (item: NotificationItem) => {
    if (!item.is_read) {
      markNotificationRead(item.notification_id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === item.notification_id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setShowNotifications(false);

    if (item.type === 'message') {
      const otherUserId = item.data?.sender_id;
      const otherUserName = item.data?.sender_name || 'Sales Agent';
      const inquiryId = item.data?.inquiry_id;
      if (otherUserId) {
        router.push(
          `/chat-detail?otherUserId=${otherUserId}&otherUserName=${encodeURIComponent(
            otherUserName
          )}${inquiryId ? `&inquiryId=${inquiryId}` : ''}`
        );
      } else {
        router.push('/messages');
      }
    } else if (item.type === 'order') {
      const status = typeof item.data?.status === 'string' ? item.data.status : 'pending';
      router.replace(`/orders?source=notification&tab=${encodeURIComponent(status)}` as any);
    } else if (item.type === 'quotation') {
      router.push('/orders');
    } else if (item.type === 'inquiry') {
      router.push('/orders');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.log('Failed to mark all as read');
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollViewRef.current) {
        const nextIndex = (carouselIndex + 1) % carouselImages.length;
        setCarouselIndex(nextIndex);
        scrollViewRef.current.scrollTo({ x: nextIndex * (width - 40), animated: true });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [carouselIndex, width]);

  const filteredProducts = coffeeSupplements.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Image source={require('@/assets/images/homepageicon/BMANNYLOGO.png')} style={styles.headerLogo} />
            <Text style={styles.headerTitle}>BMANNY Partners Inc.</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationIcon}
            onPress={() => {
              setShowNotifications(true);
              loadNotifications();
            }}
          >
            <Ionicons name="notifications-outline" size={28} color="#2196F3" />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchField}
              placeholder="Search products..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {!searchQuery && (
          <View style={styles.carouselContainer}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / (width - 40));
                setCarouselIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {carouselImages.map((image, index) => (
                <Image key={index} source={image} style={styles.carouselImage} />
              ))}
            </ScrollView>
            <View style={styles.carouselDots}>
              {carouselImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === carouselIndex && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        <Text style={[styles.featuredProductTitle, { color: colors.text }]}>Featured Product</Text>

        <View style={styles.productsGrid}>
          {filteredProducts.map((product) => (
            <TouchableOpacity 
              key={product.id} 
              style={[styles.productCard, { backgroundColor: colors.card }]}
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
                <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
                <Text style={[styles.productPrice, { color: colors.text }]}>{product.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.navigationBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/home')}>
          <HomeIcon colors={colors} isActive={true} />
          <Text style={[styles.navText, { color: '#2196F3' }]}>Home</Text>
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

      <Modal
        visible={showNotifications}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={[styles.fullScreenModal, { backgroundColor: colors.background }]}>
          <View style={[styles.notificationHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowNotifications(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.notificationTitle, { color: colors.text }]}>Notifications</Text>
            {unreadCount > 0 ? (
              <TouchableOpacity onPress={handleMarkAllRead}>
                <Text style={{ color: '#2196F3', fontSize: 13, fontWeight: '700' }}>Mark all read</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 24 }} />
            )}
          </View>
          
          <ScrollView
            style={styles.notificationList}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await loadNotifications();
                  setRefreshing(false);
                }}
                tintColor="#2196F3"
                colors={['#2196F3']}
              />
            }
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyNotifications}>
                <View style={[styles.emptyNotificationIconCircle, { backgroundColor: colors.card }]}>
                  <Ionicons name="notifications-off-outline" size={42} color="#2196F3" />
                </View>
                <Text style={[styles.emptyNotificationTitle, { color: colors.text }]}>No notifications yet</Text>
                <Text style={[styles.emptyNotificationSubtitle, { color: colors.textSecondary }]}>
                  When your inquiries, quotations, orders, or messages update, you'll receive real-time alerts right here.
                </Text>
              </View>
            ) : (
              notifications.map((notification) => {
                const getMeta = (type: string) => {
                  switch (type) {
                    case 'inquiry':
                      return { icon: 'help-circle-outline', color: '#2196F3' };
                    case 'quotation':
                      return { icon: 'document-text-outline', color: '#4CAF50' };
                    case 'order':
                      return { icon: 'cube-outline', color: '#FF9800' };
                    case 'message':
                      return { icon: 'chatbubble-ellipses-outline', color: '#9C27B0' };
                    case 'moderation':
                      return { icon: 'shield-checkmark-outline', color: '#D4A72C' };
                    default:
                      return { icon: 'notifications-outline', color: '#607D8B' };
                  }
                };

                const meta = getMeta(notification.type);

                return (
                  <TouchableOpacity
                    key={notification.notification_id}
                    style={[
                      styles.notificationItem,
                      { borderBottomColor: colors.border },
                      !notification.is_read && { backgroundColor: colors.card },
                    ]}
                    onPress={() => handleNotificationPress(notification)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.notificationAvatarContainer}>
                      <View style={[styles.notificationAvatar, { backgroundColor: meta.color }]}>
                        <Ionicons name={meta.icon as any} size={24} color="#ffffff" />
                      </View>
                    </View>
                    <View style={styles.notificationContent}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.notificationName, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                          {notification.title}
                        </Text>
                        {!notification.is_read && (
                          <View style={styles.unreadDot} />
                        )}
                      </View>
                      <Text style={[styles.notificationDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                        {notification.message}
                      </Text>
                      <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                        {formatRelativeTime(notification.created_at)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerLogo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  notificationIcon: {
    position: 'relative',
    padding: 4,
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#E53935',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchField: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  carouselContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  carouselImage: {
    width: Dimensions.get('window').width - 40,
    height: 180,
    resizeMode: 'cover',
    borderRadius: 16,
  },
  carouselInquireButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  carouselInquireButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  carouselDots: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    flexDirection: 'row',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 6,
  },
  activeDot: {
    backgroundColor: '#2196F3',
    width: 20,
  },
  featuredProductTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  productCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2196F3',
  },
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
  fullScreenModal: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  notificationList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  notificationAvatarContainer: {
    marginRight: 14,
    marginTop: 2,
  },
  notificationAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginLeft: 6,
  },
  notificationDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 90,
    paddingHorizontal: 36,
  },
  emptyNotificationIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyNotificationTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyNotificationSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
