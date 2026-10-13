import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Dimensions, Modal, RefreshControl, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getProducts,
  getProductCategories,
  getApiBaseUrl,
  getMe,
} from '../services/api';
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

const carouselImages = [
  require('@/assets/images/sliderimage/552894504_122298455816006390_667527036630704169_n.jpg'),
  require('@/assets/images/sliderimage/555506696_122299127048006390_6001147551972761857_n.jpg'),
  require('@/assets/images/sliderimage/571990528_122304646826006390_9009641041524635359_n.jpg'),
  require('@/assets/images/sliderimage/574251976_122305393214006390_7882344860355931536_n.jpg'),
  require('@/assets/images/sliderimage/639048031_862557200117795_6194756105031337468_n.jpg'),
];

const fallbackImages = [
  require('@/assets/images/homepageimage/sup1.jpg'),
  require('@/assets/images/homepageimage/sup2.jpg'),
  require('@/assets/images/homepageimage/sup3.jpg'),
  require('@/assets/images/homepageimage/sup4.jpg'),
  require('@/assets/images/homepageimage/sup5.jpg'),
  require('@/assets/images/homepageimage/sup6.jpg'),
];

export interface CatalogProductItem {
  id: number;
  product_type_id?: number;
  name: string;
  category?: string;
  category_code?: string;
  price: string;
  base_price?: number;
  description?: string;
  shelf_life?: string;
  storage_conditions?: string;
  lead_time_days?: number;
  formulation_notes?: string;
  moq?: string;
  image?: any;
  image_url?: string | null;
  is_active?: boolean;
}



const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
  const lower = category.toLowerCase();
  if (lower === 'all') return 'grid-outline';
  if (lower === 'favorites' || lower.includes('favorite')) return 'heart-outline';
  if (lower.includes('beverage') || lower.includes('drink') || lower.includes('coffee') || lower.includes('water') || lower.includes('shot')) return 'cafe-outline';
  if (lower.includes('supplement') || lower.includes('collagen') || lower.includes('blend') || lower.includes('capsule')) return 'medkit-outline';
  if (lower.includes('cosmetic') || lower.includes('balm') || lower.includes('beauty') || lower.includes('skin') || lower.includes('care') || lower.includes('lip')) return 'sparkles-outline';
  if (lower.includes('health') || lower.includes('wellness')) return 'heart-outline';
  if (lower.includes('detox') || lower.includes('nutrition')) return 'leaf-outline';
  return 'cube-outline';
};

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
  const { colors, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [products, setProducts] = useState<CatalogProductItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [clientId, setClientId] = useState<string | number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { width } = Dimensions.get('window');

  const loadFavorites = useCallback(async () => {
    try {
      let cId = clientId;
      if (!cId) {
        try {
          const user = await getMe();
          cId = user?.id || user?.user_id || user?.business_client?.client_id || user?.business_client?.user_id;
          if (cId) setClientId(cId);
        } catch (e) { }
      }

      const clientKey = cId ? `bmanny_favorites_${cId}` : 'bmanny_favorites';
      const saved = await SecureStore.getItemAsync(clientKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
          return;
        }
      }

      // Check legacy generic key
      const legacySaved = await SecureStore.getItemAsync('bmanny_favorites');
      if (legacySaved) {
        const parsed = JSON.parse(legacySaved);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to load favorites in home:', err);
    }
  }, [clientId]);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const toggleFavorite = useCallback(async (productId: number) => {
    setFavorites((prev) => {
      const updated = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      const json = JSON.stringify(updated);
      if (clientId) {
        SecureStore.setItemAsync(`bmanny_favorites_${clientId}`, json).catch(() => { });
      }
      SecureStore.setItemAsync('bmanny_favorites', json).catch(() => { });
      return updated;
    });
  }, [clientId]);

  const loadCatalog = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getProductCategories(),
      ]);
      if (Array.isArray(productsData)) {
        setProducts(productsData);
      }
      if (Array.isArray(categoriesData) && categoriesData.length > 0) {
        setApiCategories(categoriesData);
      }
    } catch (err) {
      console.warn('Failed to load dynamic product catalog:', err);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

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
    loadCatalog();
    loadNotifications();

    return subscribeToRealtime((event) => {
      if (event.type === 'notification.created') {
        loadNotifications();
      }
    });
  }, [loadCatalog, loadNotifications]);

  const handleNotificationPress = async (item: NotificationItem) => {
    if (!item.is_read) {
      markNotificationRead(item.notification_id).catch(() => { });
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

  const getProductImage = (product: CatalogProductItem, index: number) => {
    if (product.image_url) {
      const uri = product.image_url.startsWith('http')
        ? product.image_url
        : `${getApiBaseUrl().replace('/api', '')}${product.image_url}`;
      return { uri };
    }
    if (typeof product.image === 'string' && product.image.length > 0) {
      const uri = product.image.startsWith('http')
        ? product.image
        : `${getApiBaseUrl().replace('/api', '')}${product.image}`;
      return { uri };
    }
    if (product.image && typeof product.image === 'number') {
      return product.image;
    }
    return fallbackImages[index % fallbackImages.length];
  };

  const categories = useMemo(() => {
    const list: string[] = ['All', 'Favorites'];

    // Categories from Product Controller API
    apiCategories.forEach((cat) => {
      const trimmed = cat?.trim();
      if (trimmed && !list.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
        list.push(trimmed);
      }
    });

    // Categories assigned to catalog products in Product Management
    products.forEach((p) => {
      const cat = (p.category || p.category_code)?.trim();
      if (cat && !list.some((item) => item.toLowerCase() === cat.toLowerCase())) {
        list.push(cat);
      }
    });


    return list;
  }, [products, apiCategories]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.category && product.category.toLowerCase().includes(query));

      let matchesCategory = false;
      if (selectedCategory === 'All') {
        matchesCategory = true;
      } else if (selectedCategory === 'Favorites') {
        const pId = Number(product.id);
        const pTypeId = product.product_type_id ? Number(product.product_type_id) : null;
        matchesCategory = favorites.includes(pId) || (pTypeId !== null && favorites.includes(pTypeId));
      } else {
        matchesCategory = Boolean(
          product.category && product.category.toLowerCase() === selectedCategory.toLowerCase()
        );
      }

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory, favorites]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await Promise.all([loadCatalog(), loadNotifications(), loadFavorites()]);
              setRefreshing(false);
            }}
            tintColor="#2196F3"
            colors={['#2196F3']}
          />
        }
      >
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

        {/* Search Bar Under Header */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInput, { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.40)' : '#f1f5f9', borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={19} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchField, { color: colors.text }]}
              placeholder="Search products, categories..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
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

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesHeader}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Categories</Text>
            <Text style={[styles.categoriesCount, { color: colors.textSecondary }]}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsList}
          >
            {categories.map((category) => {
              const isSelected = selectedCategory === category;
              const isFavCategory = category === 'Favorites';
              const iconName = getCategoryIcon(category);
              const label = isFavCategory ? `Favorites (${favorites.length})` : category;
              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    isSelected
                      ? styles.categoryChipActive
                      : [
                        styles.categoryChipInactive,
                        {
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                          borderColor: colors.border,
                        },
                      ],
                  ]}
                  onPress={() => setSelectedCategory(category)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={iconName}
                    size={15}
                    color={isSelected ? '#ffffff' : colors.textSecondary}
                    style={styles.categoryChipIcon}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected
                        ? styles.categoryChipTextActive
                        : [styles.categoryChipTextInactive, { color: colors.text }],
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Section Heading with Dynamic Title and Filter Reset */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.featuredProductTitle, { color: colors.text }]}>
            {selectedCategory === 'All'
              ? 'Featured Products'
              : selectedCategory === 'Favorites'
                ? 'Your Favorited Products'
                : selectedCategory}
          </Text>
          {selectedCategory !== 'All' && (
            <TouchableOpacity onPress={() => setSelectedCategory('All')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearFilterText}>Show All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Products Grid */}
        <View style={styles.productsGrid}>
          {loadingProducts && products.length === 0 ? (
            <View style={[styles.emptyContainer, { paddingVertical: 48 }]}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary, marginTop: 12 }]}>
                Loading products...
              </Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name={selectedCategory === 'Favorites' ? 'heart-dislike-outline' : 'basket-outline'}
                size={40}
                color={selectedCategory === 'Favorites' ? '#EF4444' : colors.textSecondary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {selectedCategory === 'Favorites' ? 'No Favorites Found' : 'No products found'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchQuery
                  ? `No formulations match "${searchQuery}".`
                  : selectedCategory === 'Favorites'
                    ? "You haven't favorited any products yet. Tap the heart icon on any product to save your favorites here!"
                    : `No formulations available in "${selectedCategory}".`}
              </Text>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
              >
                <Text style={styles.resetBtnText}>View All Products</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredProducts.map((product, idx) => {
              const pId = Number(product.id || product.product_type_id || idx + 1);
              const isFav = favorites.includes(pId);
              return (
                <TouchableOpacity
                  key={product.id || idx}
                  style={[styles.productCard, { backgroundColor: colors.card }]}
                  onPress={() => {
                    console.log('Navigating to product:', product.name);
                    try {
                      router.push({
                        pathname: '/product-description',
                        params: {
                          id: (product.id || product.product_type_id || idx + 1).toString(),
                          name: product.name,
                          price: product.price,
                          description: product.description || '',
                          moq: product.moq || '100 units',
                          image_url: product.image_url || '',
                          category: product.category || '',
                        },
                      } as any);
                    } catch (error) {
                      console.error('Navigation error:', error);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.productImageContainer}>
                    <Image source={getProductImage(product, idx)} style={styles.productImage} />
                    <TouchableOpacity
                      style={[
                        styles.cardFavoriteBtn,
                        { backgroundColor: isDarkMode ? 'rgba(30, 30, 32, 0.88)' : 'rgba(255, 255, 255, 0.92)' },
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleFavorite(pId);
                      }}
                      activeOpacity={0.8}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={isFav ? 'heart' : 'heart-outline'}
                        size={17}
                        color={isFav ? '#EF4444' : (isDarkMode ? '#A1A1AA' : '#6B7280')}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={[styles.productPrice, { color: colors.text }]}>
                      {product.price}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <MobileNavDock activeTab="home" />

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
    </KeyboardAvoidingView>
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
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchField: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    height: '100%',
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
  categoriesSection: {
    marginBottom: 22,
  },
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
  },
  categoriesCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  categoryChipsList: {
    paddingRight: 12,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryChipInactive: {},
  categoryChipIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  categoryChipTextInactive: {},
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  clearFilterText: {
    color: '#2196F3',
    fontSize: 13,
    fontWeight: '600',
  },
  featuredProductTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  resetBtn: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resetBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
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
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
  },
  cardFavoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 2,
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
