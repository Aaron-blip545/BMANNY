import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Platform,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../contexts/ThemeContext';
import { getProducts, getApiBaseUrl, getMe, resolveImageUrl } from '../services/api';

const { width } = Dimensions.get('window');

interface ProductVariantItem {
  variant_id: number;
  name: string;
  size_value?: number;
  size_unit?: string;
  is_available?: boolean;
}

interface Product {
  id: number;
  product_type_id?: number;
  name: string;
  price: string;
  base_price?: number;
  image?: any;
  image_url?: string | null;
  description?: string;
  moq?: string;
  category?: string;
  category_code?: string;
  shelf_life?: string;
  storage_conditions?: string;
  lead_time_days?: number;
  formulation_notes?: string;
  variants?: ProductVariantItem[];
}

interface ProductReview {
  id: string;
  userId?: number | string;
  isOwnReview?: boolean;
  author: string;
  avatar: string;
  avatar_url?: string | null;
  rating: number;
  timeAgo: string;
  comment: string;
  photos?: (string | any)[];
}

const fallbackImages = [
  require('@/assets/images/homepageimage/sup1.jpg'),
  require('@/assets/images/homepageimage/sup2.jpg'),
  require('@/assets/images/homepageimage/sup3.jpg'),
  require('@/assets/images/homepageimage/sup4.jpg'),
  require('@/assets/images/homepageimage/sup5.jpg'),
  require('@/assets/images/homepageimage/sup6.jpg'),
];

const getDefaultReviews = (_productName?: string): ProductReview[] => [];

export default function ProductDetailScreen() {
  const { colors, isDarkMode } = useTheme();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    price?: string;
    description?: string;
    moq?: string;
    image_url?: string;
    category?: string;
  }>();

  const [product, setProduct] = useState<Product | null>(() => {
    if (params.name) {
      return {
        id: parseInt(params.id || '1') || 1,
        name: params.name,
        price: params.price || '₱150.00',
        description:
          params.description ||
          'High-standard contract manufacturing formulation engineered for consistency, shelf stability, and regulatory compliance.',
        moq: params.moq || '100 units',
        image_url: params.image_url || null,
        category: params.category || 'Custom Formulation',
        shelf_life: '12 Months',
        storage_conditions: 'Cool, dry place',
        lead_time_days: 14,
      };
    }
    return null;
  });

  const [loading, setLoading] = useState(!params.name);
  const [favorites, setFavorites] = useState<number[]>([]);

  // Reviews state
  const [reviews, setReviews] = useState<ProductReview[]>(() =>
    getDefaultReviews(params.name || 'product')
  );
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id?: number;
    name?: string;
    avatarUrl?: string | null;
  } | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [newRating, setNewRating] = useState(5);
  const [newAuthor, setNewAuthor] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [showPhotoPickerModal, setShowPhotoPickerModal] = useState(false);
  const [reviewAlertModal, setReviewAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'delete' | 'warning' | 'confirm_delete';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });
  const [previewPhoto, setPreviewPhoto] = useState<any>(null);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | 'all'>('all');
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const buttonOpacity = useRef(new Animated.Value(1)).current;
  const buttonTranslateY = useRef(new Animated.Value(0)).current;
  const [inquireVisible, setInquireVisible] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;

    if (currentY <= 25) {
      // Near top of screen -> always visible
      setInquireVisible(true);
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(buttonTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (diff > 8 && currentY > 50) {
      // Scrolling down -> fade out and slide down
      setInquireVisible(false);
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(buttonTranslateY, {
          toValue: 50,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (diff < -8) {
      // Scrolling up -> fade in and slide up
      setInquireVisible(true);
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(buttonTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    lastScrollY.current = currentY;
  };

  const productId = product?.id || parseInt(params.id || '1') || 1;
  const isFavorited = favorites.includes(productId);

  // Load user profile and picture for review reflection & prefill
  useEffect(() => {
    getMe()
      .then((u) => {
        if (!u) return;
        const businessClient = u?.business_client ?? u?.businessClient;
        const name = u.full_name || u.name || 'Verified Client';
        const rawPic =
          businessClient?.profile_pic_url ??
          businessClient?.profile_pic ??
          u.profile_pic_url ??
          u.profile_pic;
        const avatarUrl = resolveImageUrl(rawPic);
        setCurrentUser({
          id: u.id || u.user_id,
          name,
          avatarUrl,
        });
        setNewAuthor(name);
      })
      .catch(() => {});
  }, []);

  // Load reviews from SecureStore (excluding placeholders)
  useEffect(() => {
    if (!productId) return;
    const storageKey = `bmanny_reviews_${productId}`;
    SecureStore.getItemAsync(storageKey)
      .then((val) => {
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              // Only leave actual client reviews; filter out any old placeholders
              const clientOnly = parsed.filter(
                (r: any) => r.id !== '1' && r.id !== '2' && r.id !== '3'
              );
              setReviews(clientOnly);
            }
          } catch (e) {}
        }
      })
      .catch(() => {});
  }, [productId]);

  // Load favorites from SecureStore
  useEffect(() => {
    const clientKey = currentUser?.id ? `bmanny_favorites_${currentUser.id}` : 'bmanny_favorites';
    SecureStore.getItemAsync(clientKey)
      .then((val) => {
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              setFavorites(parsed);
              return;
            }
          } catch (e) {}
        }
        // Fallback to generic key
        SecureStore.getItemAsync('bmanny_favorites')
          .then((fallbackVal) => {
            if (fallbackVal) {
              try {
                const parsed = JSON.parse(fallbackVal);
                if (Array.isArray(parsed)) setFavorites(parsed);
              } catch (e) {}
            }
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, [currentUser?.id]);

  const toggleFavorite = () => {
    setFavorites((prev) => {
      const updated = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      const json = JSON.stringify(updated);
      if (currentUser?.id) {
        SecureStore.setItemAsync(`bmanny_favorites_${currentUser.id}`, json).catch(() => {});
      }
      SecureStore.setItemAsync('bmanny_favorites', json).catch(() => {});
      return updated;
    });
  };

  useEffect(() => {
    async function fetchProduct() {
      if (!params.id && !params.name) return;
      try {
        const catalog = await getProducts();
        if (Array.isArray(catalog)) {
          const found = catalog.find(
            (p: any) =>
              (params.id && p.id?.toString() === params.id.toString()) ||
              (params.name && p.name.toLowerCase() === params.name.toLowerCase())
          );
          if (found) {
            setProduct({
              id: found.id || 1,
              product_type_id: found.product_type_id,
              name: found.name,
              price: found.price || '₱150.00',
              base_price: found.base_price,
              description:
                found.description ||
                'High-standard contract manufacturing formulation engineered for consistency, shelf stability, and regulatory compliance.',
              moq: found.moq || '100 units',
              image_url: found.image_url || null,
              category: found.category || found.category_code || params.category || 'Custom Formulation',
              shelf_life: found.shelf_life || '12 Months',
              storage_conditions: found.storage_conditions || 'Cool, dry place',
              lead_time_days: found.lead_time_days || 14,
              formulation_notes: found.formulation_notes,
              variants: found.variants,
            });
          }
        }
      } catch (err) {
        console.warn('Failed to load product details from server:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!product || !product.name) {
      fetchProduct();
    }
  }, [params.id, params.name]);

  // Load randomized recommended products ("Other products you might like")
  useEffect(() => {
    async function loadRecommended() {
      try {
        const response = await getProducts();
        const list = Array.isArray(response) ? response : response?.data || [];
        if (list && list.length > 0) {
          const currentId = product?.id || parseInt(params.id || '1') || 1;
          const others = list
            .filter((p: any) => p.id !== currentId && p.name !== product?.name)
            .map((p: any, idx: number) => ({
              id: p.id || idx + 2,
              name: p.name,
              price: p.price
                ? (String(p.price).startsWith('₱') ? p.price : `₱${Number(p.price).toFixed(2)}`)
                : '₱150.00',
              image_url: p.image_url || null,
              category: p.category || p.category_code || 'Supplements',
              moq: p.moq || '100 units',
              description: p.description || '',
            }));
          // Randomize / shuffle products
          const shuffled = [...others].sort(() => 0.5 - Math.random());
          setRecommendedProducts(shuffled.slice(0, 8));
        }
      } catch (e) {
        console.warn('Failed to load recommended products:', e);
      }
    }
    loadRecommended();
  }, [product?.id, params.id]);

  // Derived rating metrics
  const totalReviews = reviews.length;
  const avgRating = useMemo(() => {
    if (totalReviews === 0) return '0.0';
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / totalReviews).toFixed(1);
  }, [reviews, totalReviews]);

  const ratingCounts = useMemo(() => {
    return {
      excellent: reviews.filter((r) => r.rating >= 4.5).length,
      good: reviews.filter((r) => r.rating >= 3.5 && r.rating < 4.5).length,
      average: reviews.filter((r) => r.rating >= 2.5 && r.rating < 3.5).length,
      belowAverage: reviews.filter((r) => r.rating >= 1.5 && r.rating < 2.5).length,
      poor: reviews.filter((r) => r.rating < 1.5).length,
    };
  }, [reviews]);

  const starCounts = useMemo(() => {
    return {
      5: reviews.filter((r) => Math.round(r.rating) === 5).length,
      4: reviews.filter((r) => Math.round(r.rating) === 4).length,
      3: reviews.filter((r) => Math.round(r.rating) === 3).length,
      2: reviews.filter((r) => Math.round(r.rating) === 2).length,
      1: reviews.filter((r) => Math.round(r.rating) === 1).length,
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (selectedStarFilter === 'all') return reviews;
    return reviews.filter((r) => Math.round(r.rating) === selectedStarFilter);
  }, [reviews, selectedStarFilter]);

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color="#2196F3" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          },
        ]}
      >
        <Text style={[styles.errorText, { color: colors.text, marginBottom: 16 }]}>Product not found</Text>
        <TouchableOpacity
          style={[styles.errorButton, { backgroundColor: '#18181B' }]}
          onPress={() => router.back()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const getImageSource = () => {
    if (product.image_url) {
      const uri = product.image_url.startsWith('http')
        ? product.image_url
        : `${getApiBaseUrl().replace('/api', '')}${product.image_url}`;
      return { uri };
    }
    if (product.image) {
      if (typeof product.image === 'string') {
        const uri = product.image.startsWith('http')
          ? product.image
          : `${getApiBaseUrl().replace('/api', '')}${product.image}`;
        return { uri };
      }
      return product.image;
    }
    const idx = Math.max(0, ((product.id || 1) - 1) % fallbackImages.length);
    return fallbackImages[idx];
  };

  const formatPrice = (priceStr?: string) => {
    if (!priceStr) return '₱150.00';
    if (priceStr.startsWith('₱')) return priceStr;
    const num = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return '₱150.00';
    return `₱${num.toFixed(2)}`;
  };

  const handleInquire = () => {
    router.push({
      pathname: '/product-customization',
      params: {
        id: String(product.id || params.id || ''),
        name: product.name,
        product_code: (product as any).product_code || '',
        category: product.category || '',
        price: product.price || '',
        moq: product.moq || '100 units',
        description: product.description || '',
        image: typeof product.image === 'string' ? product.image : ((product as any).image_url || ''),
      },
    } as any);
  };

  const handlePickFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to attach product photos.'
        );
        return;
      }

      const remaining = Math.max(1, 4 - newPhotos.length);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map((a) => a.uri).filter(Boolean);
        setNewPhotos((prev) => [...prev, ...uris].slice(0, 4));
      }
    } catch (err) {
      console.warn('Failed to pick photo from library:', err);
      Alert.alert('Error', 'Unable to pick photo. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow camera access to capture a product photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setNewPhotos((prev) => [...prev, result.assets[0].uri].slice(0, 4));
      }
    } catch (err) {
      console.warn('Failed to take photo with camera:', err);
      Alert.alert('Error', 'Unable to take photo. Please try again.');
    }
  };

  const handleAddPhotoPrompt = () => {
    if (newPhotos.length >= 4) {
      Alert.alert('Limit Reached', 'You can attach up to 4 photos per review.');
      return;
    }
    setShowPhotoPickerModal(true);
  };

  const handleRemovePhoto = (index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenNewReview = () => {
    setEditingReviewId(null);
    setNewRating(5);
    setNewAuthor(currentUser?.name || '');
    setNewComment('');
    setNewPhotos([]);
    setShowReviewModal(true);
  };

  const handleEditReview = (rev: ProductReview) => {
    setEditingReviewId(rev.id);
    setNewRating(rev.rating);
    setNewAuthor(rev.author);
    setNewComment(rev.comment);
    setNewPhotos(
      rev.photos
        ? rev.photos.map((p) => (typeof p === 'string' ? p : p))
        : []
    );
    setShowReviewModal(true);
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviewAlertModal({
      visible: true,
      title: 'Delete Review',
      message: 'Are you sure you want to delete your review for this product?',
      type: 'confirm_delete',
      onConfirm: async () => {
        const updated = reviews.filter((r) => r.id !== reviewId);
        setReviews(updated);
        try {
          const storageKey = `bmanny_reviews_${productId}`;
          await SecureStore.setItemAsync(storageKey, JSON.stringify(updated));
        } catch (e) {}
        setReviewAlertModal({
          visible: true,
          title: 'Review Deleted',
          message: 'Your review has been successfully removed.',
          type: 'delete',
        });
      },
    });
  };

  const handleSubmitReview = async () => {
    const authorName = newAuthor.trim() || currentUser?.name || 'Verified Client';
    const commentText = newComment.trim();
    if (!commentText) {
      setReviewAlertModal({
        visible: true,
        title: 'Review Required',
        message: 'Please enter your review feedback.',
        type: 'warning',
      });
      return;
    }

    const initials =
      authorName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'VC';

    if (editingReviewId) {
      // Editing existing review
      const updated = reviews.map((r) => {
        if (r.id === editingReviewId) {
          return {
            ...r,
            author: authorName,
            avatar: initials,
            rating: newRating,
            timeAgo: 'Edited just now',
            comment: commentText,
            photos: newPhotos.length > 0 ? [...newPhotos] : undefined,
            avatar_url: currentUser?.avatarUrl ?? r.avatar_url ?? null,
          };
        }
        return r;
      });

      setReviews(updated);
      setNewComment('');
      setNewPhotos([]);
      setEditingReviewId(null);
      setShowReviewModal(false);

      try {
        const storageKey = `bmanny_reviews_${productId}`;
        await SecureStore.setItemAsync(storageKey, JSON.stringify(updated));
      } catch (e) {}

      setReviewAlertModal({
        visible: true,
        title: 'Review Updated',
        message: 'Your review has been updated successfully!',
        type: 'success',
      });
    } else {
      // Adding new review
      const newRev: ProductReview = {
        id: Date.now().toString(),
        userId: currentUser?.id,
        isOwnReview: true,
        author: authorName,
        avatar: initials,
        avatar_url: currentUser?.avatarUrl || null,
        rating: newRating,
        timeAgo: 'Just now',
        comment: commentText,
        photos: newPhotos.length > 0 ? [...newPhotos] : undefined,
      };

      const updated = [newRev, ...reviews];
      setReviews(updated);
      setNewComment('');
      setNewPhotos([]);
      setShowReviewModal(false);

      try {
        const storageKey = `bmanny_reviews_${productId}`;
        await SecureStore.setItemAsync(storageKey, JSON.stringify(updated));
      } catch (e) {}

      setReviewAlertModal({
        visible: true,
        title: 'Review Submitted',
        message: 'Thank you for your valuable feedback and photos!',
        type: 'success',
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Hero Area with Green Diagonal Background Photo */}
        <View style={styles.heroWrapper}>
          <Image
            source={require('@/assets/images/homepageimage/green_diagonal_bg.png')}
            style={styles.heroBackgroundImage}
            resizeMode="cover"
          />

          {/* Top Navigation Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={[
                styles.circularIconBtn,
                { backgroundColor: isDarkMode ? '#27272A' : '#FFFFFF' },
              ]}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={isDarkMode ? '#FFFFFF' : '#18181B'}
              />
            </TouchableOpacity>
          </View>

          {/* Centered Tilted Product Image */}
          <View style={styles.heroImageContainer}>
            <Image source={getImageSource()} style={styles.heroProductImage} />
          </View>

          {/* Floating Favorite Action Button */}
          <TouchableOpacity
            style={[
              styles.floatingFavoriteButton,
              { backgroundColor: isDarkMode ? '#27272A' : '#18181B' },
            ]}
            onPress={toggleFavorite}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorited ? '#EF4444' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Product Details Section */}
        <View style={styles.detailsContainer}>
          {/* Title & Price Row */}
          <View style={styles.titlePriceRow}>
            <Text
              style={[
                styles.productName,
                { color: isDarkMode ? '#FFFFFF' : '#18181B' },
              ]}
              numberOfLines={2}
            >
              {product.name}
            </Text>
            <Text
              style={[
                styles.productPrice,
                { color: isDarkMode ? '#FFFFFF' : '#18181B' },
              ]}
            >
              {formatPrice(product.price)}
            </Text>
          </View>

          {/* Subtitle & Ratings Row */}
          <View style={styles.subInfoRow}>
            <Text style={[styles.categoryText, { color: isDarkMode ? '#9CA3AF' : '#8E8E93' }]}>
              {product.category || 'Custom Formulation'}
            </Text>

            <View style={styles.ratingsContainer}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= Math.round(parseFloat(avgRating)) ? 'star' : 'star-outline'}
                    size={13}
                    color="#F59E0B"
                    style={{ marginRight: 2 }}
                  />
                ))}
              </View>
              <Text style={[styles.reviewCountText, { color: isDarkMode ? '#9CA3AF' : '#8E8E93' }]}>
                {avgRating} ( {totalReviews} reviews )
              </Text>
            </View>
          </View>

          {/* Product Description Header */}
          <Text
            style={[
              styles.productDescriptionHeading,
              { color: isDarkMode ? '#FFFFFF' : '#18181B' },
            ]}
          >
            Product Description
          </Text>

          {/* Description Paragraph */}
          <Text
            style={[
              styles.descriptionText,
              { color: isDarkMode ? '#A1A1AA' : '#6B7280' },
            ]}
          >
            {product.description ||
              'High-grade contract manufacturing formulation designed for superior shelf stability, formulation consistency, and commercial scale production.'}
          </Text>

          {/* System Specifications Badges (MOQ, Shelf Life, Lead Time) */}
          <View style={styles.specsRow}>
            <View style={[styles.specBadge, { backgroundColor: isDarkMode ? '#27272A' : '#F3F4F6' }]}>
              <Ionicons name="cube-outline" size={12} color="#2196F3" style={{ marginRight: 4 }} />
              <Text style={[styles.specLabel, { color: isDarkMode ? '#E4E4E7' : '#374151' }]}>
                MOQ: <Text style={styles.specVal}>{product.moq || '100 units'}</Text>
              </Text>
            </View>

            <View style={[styles.specBadge, { backgroundColor: isDarkMode ? '#27272A' : '#F3F4F6' }]}>
              <Ionicons name="time-outline" size={12} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={[styles.specLabel, { color: isDarkMode ? '#E4E4E7' : '#374151' }]}>
                Shelf Life: <Text style={styles.specVal}>{product.shelf_life || '12 Months'}</Text>
              </Text>
            </View>

            {product.lead_time_days ? (
              <View style={[styles.specBadge, { backgroundColor: isDarkMode ? '#27272A' : '#F3F4F6' }]}>
                <Ionicons name="calendar-outline" size={12} color="#F59E0B" style={{ marginRight: 4 }} />
                <Text style={[styles.specLabel, { color: isDarkMode ? '#E4E4E7' : '#374151' }]}>
                  Lead Time: <Text style={styles.specVal}>{product.lead_time_days}d</Text>
                </Text>
              </View>
            ) : null}
          </View>

          {/* Reviews UI Section (Reference Image 2) */}
          <View style={[styles.reviewsSection, { borderTopColor: isDarkMode ? '#27272A' : '#F3F4F6' }]}>
            <View style={styles.reviewsHeaderRow}>
              <Text style={[styles.reviewsSectionTitle, { color: isDarkMode ? '#FFFFFF' : '#18181B' }]}>
                Reviews
              </Text>
              <TouchableOpacity
                onPress={() => setShowReviewModal(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="help-circle-outline" size={20} color={isDarkMode ? '#A1A1AA' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            {/* Big Rating & Star Summary */}
            <View style={styles.ratingSummaryContainer}>
              <Text style={[styles.bigRatingText, { color: isDarkMode ? '#FFFFFF' : '#18181B' }]}>
                {avgRating}
              </Text>
              <View style={styles.bigStarsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.round(parseFloat(avgRating)) ? 'star' : 'star-outline'}
                    size={20}
                    color="#F59E0B"
                    style={{ marginHorizontal: 2 }}
                  />
                ))}
              </View>
              <Text style={[styles.basedOnText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                based on {totalReviews} reviews
              </Text>
            </View>

            {/* Rating Breakdown Bar Chart */}
            <View style={styles.breakdownContainer}>
              {[
                { star: 5, label: 'Excellent', count: ratingCounts.excellent, color: '#10B981' },
                { star: 4, label: 'Good', count: ratingCounts.good, color: '#84CC16' },
                { star: 3, label: 'Average', count: ratingCounts.average, color: '#FBBF24' },
                { star: 2, label: 'Below Average', count: ratingCounts.belowAverage, color: '#F97316' },
                { star: 1, label: 'Poor', count: ratingCounts.poor, color: '#EF4444' },
              ].map((tier) => {
                const pct = totalReviews > 0 ? (tier.count / totalReviews) * 100 : 0;
                const isSelected = selectedStarFilter === tier.star;
                return (
                  <TouchableOpacity
                    key={tier.label}
                    style={[
                      styles.breakdownRow,
                      isSelected && {
                        backgroundColor: isDarkMode ? '#27272A' : '#F4F4F5',
                        borderRadius: 6,
                        paddingHorizontal: 4,
                      },
                    ]}
                    onPress={() => setSelectedStarFilter(isSelected ? 'all' : tier.star)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.breakdownLabel,
                        {
                          color: isSelected
                            ? (isDarkMode ? '#FFFFFF' : '#18181B')
                            : (isDarkMode ? '#A1A1AA' : '#4B5563'),
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {tier.label}
                    </Text>
                    <View style={[styles.breakdownTrack, { backgroundColor: isDarkMode ? '#27272A' : '#E5E7EB' }]}>
                      <View
                        style={[
                          styles.breakdownFill,
                          {
                            width: `${Math.max(pct, tier.count > 0 ? 5 : 0)}%`,
                            backgroundColor: tier.color,
                          },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Review Star Category Tabs (All, 5 Star to 1 Star) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.starCategoriesScroll}
              contentContainerStyle={styles.starCategoriesContainer}
            >
              {[
                { key: 'all' as const, label: 'All', count: totalReviews },
                { key: 5, label: '5 Star', count: starCounts[5] },
                { key: 4, label: '4 Star', count: starCounts[4] },
                { key: 3, label: '3 Star', count: starCounts[3] },
                { key: 2, label: '2 Star', count: starCounts[2] },
                { key: 1, label: '1 Star', count: starCounts[1] },
              ].map((cat) => {
                const isActive = selectedStarFilter === cat.key;
                return (
                  <TouchableOpacity
                    key={String(cat.key)}
                    style={[
                      styles.starCategoryChip,
                      isActive
                        ? [
                            styles.starCategoryChipActive,
                            { backgroundColor: '#2196F3', borderColor: '#2196F3' },
                          ]
                        : [
                            styles.starCategoryChipInactive,
                            {
                              backgroundColor: isDarkMode ? '#27272A' : '#F4F4F5',
                              borderColor: isDarkMode ? '#3F3F46' : '#E4E4E7',
                            },
                          ],
                    ]}
                    onPress={() => setSelectedStarFilter(cat.key)}
                    activeOpacity={0.75}
                  >
                    {cat.key !== 'all' && (
                      <Ionicons
                        name="star"
                        size={12}
                        color={isActive ? '#FFFFFF' : '#F59E0B'}
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text
                      style={[
                        styles.starCategoryChipText,
                        {
                          color: isActive
                            ? '#FFFFFF'
                            : (isDarkMode ? '#D4D4D8' : '#3F3F46'),
                          fontWeight: isActive ? '700' : '500',
                        },
                      ]}
                    >
                      {cat.label} ({cat.count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Reviews List */}
            <View style={styles.reviewsListContainer}>
              {filteredReviews.length === 0 ? (
                <View style={styles.emptyCategoryView}>
                  <Ionicons
                    name="chatbox-ellipses-outline"
                    size={36}
                    color={isDarkMode ? '#52525B' : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.emptyCategoryText,
                      { color: isDarkMode ? '#A1A1AA' : '#6B7280' },
                    ]}
                  >
                    {totalReviews === 0
                      ? 'No reviews yet. Be the first to share your experience with this product!'
                      : `No ${selectedStarFilter} star reviews yet`}
                  </Text>
                  {totalReviews > 0 && selectedStarFilter !== 'all' && (
                    <TouchableOpacity
                      style={[
                        styles.clearFilterBtn,
                        { borderColor: isDarkMode ? '#3F3F46' : '#D1D5DB' },
                      ]}
                      onPress={() => setSelectedStarFilter('all')}
                    >
                      <Text
                        style={[
                          styles.clearFilterBtnText,
                          { color: isDarkMode ? '#FFFFFF' : '#18181B' },
                        ]}
                      >
                        Show All Reviews
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                filteredReviews.map((rev) => {
                const isOwner =
                  rev.isOwnReview ||
                  (!!currentUser?.id && String(rev.userId) === String(currentUser.id)) ||
                  (!!currentUser?.name && rev.author === currentUser.name);

                // Reflect updated client profile picture dynamically
                const effectiveAvatarUrl =
                  isOwner && currentUser?.avatarUrl
                    ? currentUser.avatarUrl
                    : rev.avatar_url;

                return (
                  <View
                    key={rev.id}
                    style={[
                      styles.reviewCard,
                      { borderBottomColor: isDarkMode ? '#27272A' : '#F3F4F6' },
                    ]}
                  >
                    <View style={styles.reviewHeaderRow}>
                      {effectiveAvatarUrl ? (
                        <Image
                          source={{ uri: effectiveAvatarUrl }}
                          style={styles.reviewAvatarImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.reviewAvatarCircle,
                            { backgroundColor: isDarkMode ? '#3F3F46' : '#EEF2FF' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.reviewAvatarText,
                              { color: isDarkMode ? '#FFFFFF' : '#4F46E5' },
                            ]}
                          >
                            {rev.avatar}
                          </Text>
                        </View>
                      )}
                      <View style={styles.reviewAuthorCol}>
                        <View style={styles.authorNameBadgeRow}>
                          <Text
                            style={[
                              styles.reviewAuthorName,
                              { color: isDarkMode ? '#FFFFFF' : '#18181B' },
                            ]}
                          >
                            {rev.author}
                          </Text>
                          {isOwner && (
                            <View style={styles.youBadge}>
                              <Text style={styles.youBadgeText}>You</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.reviewStarRatingRow}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Ionicons
                              key={s}
                              name={s <= rev.rating ? 'star' : 'star-outline'}
                              size={12}
                              color="#F59E0B"
                              style={{ marginRight: 2 }}
                            />
                          ))}
                          <Text
                            style={[
                              styles.reviewRatingNum,
                              { color: isDarkMode ? '#A1A1AA' : '#6B7280' },
                            ]}
                          >
                            {rev.rating.toFixed(1)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.reviewMetaCol}>
                        <Text
                          style={[
                            styles.reviewTimeAgo,
                            { color: isDarkMode ? '#71717A' : '#9CA3AF' },
                          ]}
                        >
                          {rev.timeAgo}
                        </Text>
                        {isOwner && (
                          <View style={styles.ownerActionsRow}>
                            <TouchableOpacity
                              onPress={() => handleEditReview(rev)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={styles.ownerActionBtn}
                            >
                              <Ionicons name="pencil-sharp" size={13} color="#0284C7" />
                              <Text style={styles.ownerActionBtnText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteReview(rev.id)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={[styles.ownerActionBtn, { marginLeft: 8 }]}
                            >
                              <Ionicons name="trash-outline" size={13} color="#EF4444" />
                              <Text style={[styles.ownerActionBtnText, { color: '#EF4444' }]}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.reviewCommentBody,
                        { color: isDarkMode ? '#D4D4D8' : '#4B5563' },
                      ]}
                    >
                      {rev.comment}
                    </Text>

                    {/* Review Photos Thumbnail Row */}
                    {rev.photos && rev.photos.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.reviewPhotosRow}
                        contentContainerStyle={styles.reviewPhotosContent}
                      >
                        {rev.photos.map((photo, pIdx) => {
                          const src = typeof photo === 'string' ? { uri: photo } : photo;
                          return (
                            <TouchableOpacity
                              key={pIdx}
                              activeOpacity={0.88}
                              onPress={() => setPreviewPhoto(src)}
                              style={styles.reviewPhotoThumbWrapper}
                            >
                              <Image source={src} style={styles.reviewPhotoThumb} resizeMode="cover" />
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}
                  </View>
                );
              }))}
            </View>

            {/* Write a Review Button */}
            <TouchableOpacity
              style={[
                styles.writeReviewButton,
                {
                  borderColor: isDarkMode ? '#3F3F46' : '#E5E7EB',
                  backgroundColor: isDarkMode ? '#1E1E20' : '#FFFFFF',
                },
              ]}
              onPress={handleOpenNewReview}
              activeOpacity={0.7}
            >
              <Text style={styles.writeReviewButtonText}>Write a Review</Text>
            </TouchableOpacity>
          </View>

          {/* Other products you might like (Horizontal Scrollable) */}
          {recommendedProducts.length > 0 && (
            <View style={[styles.recommendedSection, { borderTopColor: isDarkMode ? '#27272A' : '#F3F4F6' }]}>
              <View style={styles.recommendedHeaderRow}>
                <Text style={[styles.recommendedSectionTitle, { color: isDarkMode ? '#FFFFFF' : '#18181B' }]}>
                  Other products you might like
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendedScrollContent}
              >
                {recommendedProducts.map((item, idx) => {
                  const fallback = fallbackImages[idx % fallbackImages.length];
                  const imgSrc = item.image_url
                    ? (item.image_url.startsWith('http')
                        ? { uri: item.image_url }
                        : { uri: `${getApiBaseUrl().replace('/api', '')}${item.image_url}` })
                    : fallback;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.recommendedCard,
                        {
                          backgroundColor: isDarkMode ? '#1E1E20' : '#FFFFFF',
                          borderColor: isDarkMode ? '#27272A' : '#E5E7EB',
                        },
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: '/product-description',
                          params: {
                            id: item.id.toString(),
                            name: item.name,
                            price: item.price,
                            description: item.description || '',
                            image_url: item.image_url || '',
                            category: item.category || '',
                            moq: item.moq || '',
                          },
                        })
                      }
                      activeOpacity={0.88}
                    >
                      <View
                        style={[
                          styles.recommendedImageWrapper,
                          { backgroundColor: isDarkMode ? '#27272A' : '#F9FAFB' },
                        ]}
                      >
                        <Image source={imgSrc} style={styles.recommendedImage} resizeMode="contain" />
                      </View>
                      <View style={styles.recommendedInfo}>
                        <Text
                          style={[styles.recommendedCategory, { color: isDarkMode ? '#A1A1AA' : '#6B7280' }]}
                          numberOfLines={1}
                        >
                          {item.category || 'Supplements'}
                        </Text>
                        <Text
                          style={[styles.recommendedName, { color: isDarkMode ? '#FFFFFF' : '#18181B' }]}
                          numberOfLines={2}
                        >
                          {item.name}
                        </Text>
                        <View style={styles.recommendedBottomRow}>
                          <Text style={styles.recommendedPrice}>{item.price}</Text>
                          {item.moq ? (
                            <View
                              style={[
                                styles.recommendedMoqBadge,
                                { backgroundColor: isDarkMode ? '#27272A' : '#F3F4F6' },
                              ]}
                            >
                              <Text
                                style={[styles.recommendedMoqText, { color: isDarkMode ? '#D4D4D8' : '#4B5563' }]}
                              >
                                {item.moq}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Pinned Bottom Inquire Bar with Scroll Fade Animation */}
      <Animated.View
        pointerEvents={inquireVisible ? 'auto' : 'none'}
        style={[
          styles.stickyBottomBar,
          {
            backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
            borderTopColor: isDarkMode ? '#27272A' : '#F3F4F6',
            opacity: buttonOpacity,
            transform: [{ translateY: buttonTranslateY }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.inquireButton,
            { backgroundColor: '#2196F3' },
          ]}
          onPress={handleInquire}
          activeOpacity={0.88}
        >
          <Text
            style={[
              styles.inquireButtonText,
              { color: '#FFFFFF' },
            ]}
          >
            Inquire
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Write a Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowReviewModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: isDarkMode ? '#1E1E20' : '#FFFFFF' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#18181B' }]}>
                {editingReviewId ? 'Edit Your Review' : 'Write a Review'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowReviewModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#18181B'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: isDarkMode ? '#A1A1AA' : '#6B7280' }]}>
              {product.name}
            </Text>

            {/* Star Selector */}
            <View style={styles.modalStarSelector}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setNewRating(star)}
                  style={{ padding: 4 }}
                >
                  <Ionicons
                    name={star <= newRating ? 'star' : 'star-outline'}
                    size={32}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Author Name Input */}
            <Text style={[styles.inputLabel, { color: isDarkMode ? '#E4E4E7' : '#374151' }]}>
              Your Name / Company
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDarkMode ? '#27272A' : '#F9FAFB',
                  borderColor: isDarkMode ? '#3F3F46' : '#E5E7EB',
                  color: isDarkMode ? '#FFFFFF' : '#18181B',
                },
              ]}
              placeholder="e.g. Acme Health Products"
              placeholderTextColor={isDarkMode ? '#71717A' : '#9CA3AF'}
              value={newAuthor}
              onChangeText={setNewAuthor}
            />

            {/* Comment Input */}
            <Text style={[styles.inputLabel, { color: isDarkMode ? '#E4E4E7' : '#374151' }]}>
              Your Review
            </Text>
            <TextInput
              style={[
                styles.textAreaInput,
                {
                  backgroundColor: isDarkMode ? '#27272A' : '#F9FAFB',
                  borderColor: isDarkMode ? '#3F3F46' : '#E5E7EB',
                  color: isDarkMode ? '#FFFFFF' : '#18181B',
                },
              ]}
              placeholder="Share details of the formulation quality, stability, delivery..."
              placeholderTextColor={isDarkMode ? '#71717A' : '#9CA3AF'}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Photos Upload Section */}
            <View style={styles.photoUploadHeaderRow}>
              <Text style={[styles.inputLabel, { color: isDarkMode ? '#E4E4E7' : '#374151', marginBottom: 0 }]}>
                Insert Product Photos
              </Text>
              <Text style={[styles.photoCounterText, { color: isDarkMode ? '#A1A1AA' : '#6B7280' }]}>
                {newPhotos.length}/4
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.modalPhotosScroll}
              contentContainerStyle={styles.modalPhotosScrollContent}
            >
              {newPhotos.map((uri, idx) => (
                <View key={idx} style={styles.modalPhotoItem}>
                  <Image source={{ uri }} style={styles.modalPhotoThumb} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removePhotoBadge}
                    onPress={() => handleRemovePhoto(idx)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}

              {newPhotos.length < 4 && (
                <TouchableOpacity
                  style={[
                    styles.addPhotoBox,
                    {
                      borderColor: isDarkMode ? '#3F3F46' : '#D1D5DB',
                      backgroundColor: isDarkMode ? '#27272A' : '#F9FAFB',
                    },
                  ]}
                  onPress={handleAddPhotoPrompt}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={24} color={isDarkMode ? '#A1A1AA' : '#6B7280'} />
                  <Text style={[styles.addPhotoBoxText, { color: isDarkMode ? '#A1A1AA' : '#6B7280' }]}>
                    Add Photo
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Modal Submit Button */}
            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleSubmitReview}
              activeOpacity={0.85}
            >
              <Text style={styles.modalSubmitBtnText}>
                {editingReviewId ? 'Update Review' : 'Submit Review'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Fullscreen Photo Preview Modal */}
      <Modal
        visible={!!previewPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewPhoto(null)}
      >
        <View style={styles.fullscreenModalOverlay}>
          <TouchableOpacity
            style={styles.fullscreenCloseBtn}
            onPress={() => setPreviewPhoto(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close-circle" size={36} color="#FFFFFF" />
          </TouchableOpacity>
          {previewPhoto && (
            <Image
              source={previewPhoto}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Custom Designed Attach Photo Modal */}
      <Modal
        visible={showPhotoPickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotoPickerModal(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowPhotoPickerModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.pickerModalCard,
              {
                backgroundColor: isDarkMode ? '#1E1E20' : '#FFFFFF',
                borderColor: isDarkMode ? '#27272A' : '#E5E7EB',
              },
            ]}
          >
            {/* Header */}
            <View style={styles.pickerModalHeader}>
              <View style={styles.pickerHeaderLeft}>
                <View style={styles.pickerTitleIconBadge}>
                  <Ionicons name="camera" size={18} color="#2196F3" />
                </View>
                <View>
                  <Text style={[styles.pickerModalTitle, { color: isDarkMode ? '#FFFFFF' : '#18181B' }]}>
                    Attach Product Photo
                  </Text>
                  <Text style={[styles.pickerModalSubtitle, { color: isDarkMode ? '#A1A1AA' : '#6B7280' }]}>
                    Select how you want to insert a photo:
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowPhotoPickerModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={[
                  styles.pickerCloseBtn,
                  { backgroundColor: isDarkMode ? '#27272A' : '#F3F4F6' },
                ]}
              >
                <Ionicons name="close" size={18} color={isDarkMode ? '#FFFFFF' : '#374151'} />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <View style={styles.pickerOptionsList}>
              {/* Option 1: Choose from Library */}
              <TouchableOpacity
                style={[
                  styles.pickerOptionCard,
                  {
                    backgroundColor: isDarkMode ? '#27272A' : '#F9FAFB',
                    borderColor: isDarkMode ? '#3F3F46' : '#E5E7EB',
                  },
                ]}
                activeOpacity={0.75}
                onPress={() => {
                  setShowPhotoPickerModal(false);
                  setTimeout(() => handlePickFromLibrary(), 250);
                }}
              >
                <View style={[styles.pickerOptionIconCircle, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="images" size={22} color="#4F46E5" />
                </View>
                <View style={styles.pickerOptionTextCol}>
                  <Text style={[styles.pickerOptionTitle, { color: isDarkMode ? '#FFFFFF' : '#18181B' }]}>
                    Choose from Library
                  </Text>
                  <Text style={[styles.pickerOptionDesc, { color: isDarkMode ? '#A1A1AA' : '#6B7280' }]}>
                    Upload saved photo from your device gallery
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={isDarkMode ? '#71717A' : '#9CA3AF'} />
              </TouchableOpacity>

              {/* Option 2: Take Photo */}
              <TouchableOpacity
                style={[
                  styles.pickerOptionCard,
                  {
                    backgroundColor: isDarkMode ? '#27272A' : '#F9FAFB',
                    borderColor: isDarkMode ? '#3F3F46' : '#E5E7EB',
                  },
                ]}
                activeOpacity={0.75}
                onPress={() => {
                  setShowPhotoPickerModal(false);
                  setTimeout(() => handleTakePhoto(), 250);
                }}
              >
                <View style={[styles.pickerOptionIconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="camera" size={22} color="#0284C7" />
                </View>
                <View style={styles.pickerOptionTextCol}>
                  <Text style={[styles.pickerOptionTitle, { color: isDarkMode ? '#FFFFFF' : '#18181B' }]}>
                    Take Photo
                  </Text>
                  <Text style={[styles.pickerOptionDesc, { color: isDarkMode ? '#A1A1AA' : '#6B7280' }]}>
                    Open your camera to snap a new picture
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={isDarkMode ? '#71717A' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={[
                styles.pickerCancelBtn,
                { backgroundColor: isDarkMode ? '#27272A' : '#F3F4F6' },
              ]}
              onPress={() => setShowPhotoPickerModal(false)}
              activeOpacity={0.75}
            >
              <Text style={[styles.pickerCancelBtnText, { color: isDarkMode ? '#E4E4E7' : '#374151' }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Custom Designed Review Feedback / Success Modal */}
      <Modal
        visible={reviewAlertModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setReviewAlertModal((prev) => ({ ...prev, visible: false }))}
      >
        <TouchableOpacity
          style={styles.feedbackModalOverlay}
          activeOpacity={1}
          onPress={() => setReviewAlertModal((prev) => ({ ...prev, visible: false }))}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.feedbackModalCard,
              {
                backgroundColor: isDarkMode ? '#1E1E20' : '#FFFFFF',
                borderColor: isDarkMode ? '#27272A' : '#E5E7EB',
              },
            ]}
          >
            {/* Top Status Badge */}
            <View style={styles.feedbackIconWrapper}>
              <View
                style={[
                  styles.feedbackOuterRing,
                  {
                    backgroundColor:
                      reviewAlertModal.type === 'delete' || reviewAlertModal.type === 'confirm_delete'
                        ? 'rgba(239, 68, 68, 0.12)'
                        : reviewAlertModal.type === 'warning'
                        ? 'rgba(245, 158, 11, 0.12)'
                        : 'rgba(33, 150, 243, 0.14)',
                  },
                ]}
              >
                <View
                  style={[
                    styles.feedbackInnerCircle,
                    {
                      backgroundColor:
                        reviewAlertModal.type === 'delete' || reviewAlertModal.type === 'confirm_delete'
                          ? '#EF4444'
                          : reviewAlertModal.type === 'warning'
                          ? '#F59E0B'
                          : '#2196F3',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      reviewAlertModal.type === 'delete' || reviewAlertModal.type === 'confirm_delete'
                        ? 'trash'
                        : reviewAlertModal.type === 'warning'
                        ? 'alert-circle'
                        : 'checkmark'
                    }
                    size={28}
                    color="#FFFFFF"
                  />
                </View>
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.feedbackModalTitle, { color: isDarkMode ? '#FFFFFF' : '#18181B' }]}>
              {reviewAlertModal.title}
            </Text>

            {/* Message Body */}
            <Text style={[styles.feedbackModalMessage, { color: isDarkMode ? '#A1A1AA' : '#6B7280' }]}>
              {reviewAlertModal.message}
            </Text>

            {/* Action Buttons */}
            {reviewAlertModal.type === 'confirm_delete' ? (
              <View style={styles.feedbackButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.feedbackCancelBtn,
                    { backgroundColor: isDarkMode ? '#27272A' : '#F3F4F6' },
                  ]}
                  onPress={() => setReviewAlertModal((prev) => ({ ...prev, visible: false }))}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.feedbackCancelBtnText,
                      { color: isDarkMode ? '#E4E4E7' : '#374151' },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.feedbackConfirmDeleteBtn, { backgroundColor: '#EF4444' }]}
                  onPress={() => {
                    const confirmAction = reviewAlertModal.onConfirm;
                    setReviewAlertModal((prev) => ({ ...prev, visible: false }));
                    if (confirmAction) {
                      setTimeout(() => confirmAction(), 150);
                    }
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={styles.feedbackActionBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.feedbackActionBtn,
                  {
                    backgroundColor:
                      reviewAlertModal.type === 'delete'
                        ? '#EF4444'
                        : '#2196F3',
                  },
                ]}
                onPress={() => setReviewAlertModal((prev) => ({ ...prev, visible: false }))}
                activeOpacity={0.88}
              >
                <Text style={styles.feedbackActionBtnText}>OK</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroWrapper: {
    width: '100%',
    height: 380,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 24,
    zIndex: 10,
  },
  circularIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  heroImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: -10,
  },
  heroProductImage: {
    width: width * 0.85,
    height: 250,
    resizeMode: 'contain',
  },
  floatingFavoriteButton: {
    position: 'absolute',
    bottom: 12,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#18181B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  detailsContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  titlePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  productName: {
    fontSize: 26,
    fontWeight: '800',
    flex: 1,
    marginRight: 12,
    letterSpacing: -0.4,
  },
  productPrice: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  ratingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCountText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  productDescriptionHeading: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: '400',
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  specLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  specVal: {
    fontWeight: '700',
  },
  // Reviews Section Styles (Matching Reference Image 2)
  reviewsSection: {
    marginTop: 12,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  reviewsSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  ratingSummaryContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  bigRatingText: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 48,
  },
  bigStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  basedOnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  breakdownContainer: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  breakdownLabel: {
    width: 90,
    fontSize: 11,
    fontWeight: '500',
  },
  breakdownTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginLeft: 6,
  },
  breakdownFill: {
    height: '100%',
    borderRadius: 3,
  },
  starCategoriesScroll: {
    marginBottom: 16,
    marginTop: -4,
  },
  starCategoriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  starCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  starCategoryChipActive: {
    borderColor: 'transparent',
  },
  starCategoryChipInactive: {
    borderColor: '#E4E4E7',
  },
  starCategoryChipText: {
    fontSize: 12,
  },
  emptyCategoryView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyCategoryText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 12,
  },
  clearFilterBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  clearFilterBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewsListContainer: {
    marginTop: 2,
    marginBottom: 16,
  },
  reviewCard: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: '#E5E7EB',
  },
  reviewAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reviewAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewAuthorCol: {
    flex: 1,
  },
  authorNameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  reviewAuthorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  youBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginLeft: 6,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  reviewStarRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingNum: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  reviewMetaCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  ownerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ownerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 3,
  },
  ownerActionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
    marginLeft: 3,
  },
  reviewTimeAgo: {
    fontSize: 11,
    fontWeight: '500',
  },
  reviewCommentBody: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400',
  },
  writeReviewButton: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  writeReviewButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0284C7',
  },
  // Pinned Bottom Add to Cart Bar (Matching Reference Image 1)
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  inquireButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
  inquireButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Review Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 14,
  },
  modalStarSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  textAreaInput: {
    height: 90,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  photoUploadHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoCounterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalPhotosScroll: {
    marginBottom: 16,
  },
  modalPhotosScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  modalPhotoItem: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  modalPhotoThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  removePhotoBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 2,
    zIndex: 5,
  },
  addPhotoBox: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoBoxText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  reviewPhotosRow: {
    marginTop: 8,
  },
  reviewPhotosContent: {
    gap: 8,
  },
  reviewPhotoThumbWrapper: {
    width: 74,
    height: 74,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  reviewPhotoThumb: {
    width: '100%',
    height: '100%',
  },
  fullscreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 28,
    right: 20,
    zIndex: 10,
  },
  fullscreenImage: {
    width: '92%',
    height: '80%',
  },
  modalSubmitBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#18181B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  recommendedSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    marginBottom: 16,
  },
  recommendedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  recommendedSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  recommendedScrollContent: {
    paddingRight: 8,
    gap: 12,
  },
  recommendedCard: {
    width: 148,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  recommendedImageWrapper: {
    width: '100%',
    height: 124,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendedImage: {
    width: '100%',
    height: '100%',
  },
  recommendedInfo: {
    padding: 10,
  },
  recommendedCategory: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  recommendedName: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    minHeight: 34,
    marginBottom: 8,
  },
  recommendedBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendedPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0284C7',
  },
  recommendedMoqBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedMoqText: {
    fontSize: 10,
    fontWeight: '600',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  pickerModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pickerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  pickerTitleIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(33, 150, 243, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  pickerModalSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  pickerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerOptionsList: {
    gap: 12,
    marginBottom: 16,
  },
  pickerOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  pickerOptionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  pickerOptionTextCol: {
    flex: 1,
  },
  pickerOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  pickerOptionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  pickerCancelBtn: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  feedbackModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  feedbackIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  feedbackOuterRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackInnerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 8,
  },
  feedbackModalMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  feedbackActionBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  feedbackActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  feedbackButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  feedbackCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackCancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  feedbackConfirmDeleteBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  errorButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
  },
});

