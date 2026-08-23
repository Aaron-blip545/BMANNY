import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Dimensions, Modal } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

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

export default function HomeScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { width } = Dimensions.get('window');

  // Notification data based on project models (User, Message, Order)
  const [notifications] = useState([
    {
      id: 1,
      type: 'message',
      user: { full_name: 'John Doe', user_id: 1 },
      action: 'sent you a message',
      description: 'Regarding your inquiry about Premium Coffee Protein',
      timestamp: '2 hours ago',
      avatarColor: '#2196F3'
    },
    {
      id: 2,
      type: 'order',
      user: { full_name: 'Alice Smith', user_id: 2 },
      action: 'order status updated',
      description: 'Order #1234 is now processing',
      timestamp: '5 hours ago',
      avatarColor: '#FF5722'
    },
    {
      id: 3,
      type: 'inquiry',
      user: { full_name: 'Mike Johnson', user_id: 3 },
      action: 'new quotation received',
      description: 'Quotation for Organic Coffee Energy is ready for review',
      timestamp: '1 day ago',
      avatarColor: '#4CAF50'
    }
  ]);

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

  const filteredProducts = coffeeSupplements.filter(product =>
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
          <TouchableOpacity style={styles.notificationIcon} onPress={() => setShowNotifications(true)}>
            <Ionicons name="notifications-outline" size={28} color="#2196F3" />
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
            <TouchableOpacity style={styles.carouselInquireButton} onPress={() => router.push('/chat-detail')}>
              <Text style={styles.carouselInquireButtonText}>Inquire</Text>
            </TouchableOpacity>
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
            <TouchableOpacity onPress={() => setShowNotifications(false)}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.notificationTitle, { color: colors.text }]}>Notifications</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.notificationList}>
            {notifications.map((notification) => {
              const initials = notification.user.full_name
                .split(' ')
                .map((name: string) => name[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              
              return (
                <View key={notification.id} style={styles.notificationItem}>
                  <View style={styles.notificationAvatarContainer}>
                    <View style={[styles.notificationAvatar, { backgroundColor: notification.avatarColor }]}>
                      <Text style={styles.avatarInitials}>{initials}</Text>
                    </View>
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={[styles.notificationName, { color: colors.text }]}>{notification.user.full_name}</Text>
                    <Text style={[styles.notificationAction, { color: colors.text }]}>{notification.action}</Text>
                    <Text style={[styles.notificationDescription, { color: colors.textSecondary }]}>{notification.description}</Text>
                    <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>{notification.timestamp}</Text>
                  </View>
                </View>
              );
            })}
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
    marginRight: 6,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2196F3',
    flex: 1,
  },
  notificationIcon: {
    padding: 8,
  },
  searchContainer: {
    marginBottom: 20,
  },
  carouselContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  carouselImage: {
    width: Dimensions.get('window').width - 40,
    height: 180,
    borderRadius: 12,
  },
  carouselInquireButton: {
    position: 'absolute',
    bottom: 40,
    left: 12,
    backgroundColor: '#2196F3',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 4,
  },
  carouselInquireButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  featuredProductTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#2196F3',
    width: 20,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchField: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBox: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  notificationList: {
    maxHeight: 300,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationAvatarContainer: {
    marginRight: 12,
  },
  notificationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  notificationContent: {
    flex: 1,
  },
  notificationName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationAction: {
    fontSize: 14,
    marginBottom: 2,
  },
  notificationDescription: {
    fontSize: 13,
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 14,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
});
