import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getMe, logout, resolveImageUrl } from '../services/api';
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

export default function ProfileScreen() {
  const { colors, isDarkMode } = useTheme();
  const { profileImage } = useLocalSearchParams<{ profileImage: string }>();
  const [avatarImage, setAvatarImage]           = useState<string | null>(profileImage || null);
  const [userName, setUserName]                 = useState('');
  const [email, setEmail]                       = useState('');
  const [showLogoutModal, setShowLogoutModal]   = useState(false);
  const [isLoggingOut, setIsLoggingOut]         = useState(false);

  useEffect(() => {
    let isMounted = true;

    getMe()
      .then((user) => {
        if (!isMounted) return;
        setUserName(user?.full_name ?? 'BMANNY customer');
        setEmail(user?.email ?? '');

        const businessClient = user?.business_client ?? user?.businessClient;

        const savedAvatar = businessClient?.profile_pic_url ?? businessClient?.profile_pic;
        if (!profileImage && savedAvatar) {
          setAvatarImage(resolveImageUrl(savedAvatar));
        }
      })
      .catch(() => {
        if (isMounted) setUserName('BMANNY customer');
      });

    return () => { isMounted = false; };
  }, [profileImage]);

  const initials = useMemo(() => {
    const parts = userName.trim().split(/\s+/).filter(Boolean);
    return parts.length
      ? parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase()
      : 'B';
  }, [userName]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowLogoutModal(false);
      router.dismissAll();
      router.replace('/login');
    } catch (e) {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ── Profile Section ──────────────────────────────────────── */}
        <View style={[styles.profileSection, { borderBottomColor: colors.border }]}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {avatarImage ? (
              <Image source={{ uri: avatarImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#2196F3' }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.name, { color: colors.text }]}>{userName}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{email}</Text>

          {/* Edit profile button */}
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: '#2196F3' }]}
            // @ts-ignore
            onPress={() => router.push('/edit-profile')}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ── Menu Section ────────────────────────────────────────── */}
        <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.text }]}>Settings</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: '#ef4444' }]}>Logout</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Navigation Bar */}
      <MobileNavDock activeTab="profile" />

      {/* Custom Designed Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isLoggingOut) setShowLogoutModal(false);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            if (!isLoggingOut) setShowLogoutModal(false);
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.modalCard,
              {
                backgroundColor: isDarkMode ? '#1E1E20' : '#FFFFFF',
                borderColor: isDarkMode ? '#27272A' : '#E5E7EB',
              },
            ]}
          >
            {/* Top Status Icon Badge */}
            <View style={styles.modalIconWrapper}>
              <View style={styles.modalOuterRing}>
                <View style={styles.modalInnerCircle}>
                  <Ionicons name="log-out" size={26} color="#FFFFFF" />
                </View>
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#18181B' }]}>
              Logout
            </Text>

            {/* Subtitle Message */}
            <Text style={[styles.modalMessage, { color: isDarkMode ? '#A1A1AA' : '#6B7280' }]}>
              Are you sure you want to log out?
            </Text>

            {/* Action Buttons Row */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.modalCancelBtn,
                  { backgroundColor: isDarkMode ? '#27272A' : '#F3F4F6' },
                ]}
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.modalCancelBtnText,
                    { color: isDarkMode ? '#E4E4E7' : '#374151' },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalLogoutBtn}
                onPress={confirmLogout}
                disabled={isLoggingOut}
                activeOpacity={0.88}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalLogoutBtnText}>Logout</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },

  /* Profile section */
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  avatarContainer: { marginBottom: 15, position: 'relative' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#ffffff', fontSize: 28, fontWeight: '800' },
  name: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 16 },

  editButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginBottom: 10,
  },
  editButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  /* Menu */
  menuSection: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
  },
  menuIcon: { marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, fontWeight: '600' },
  menuSubText: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  /* Navigation bar */
  navigationBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 20,
  },
  navItem: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  navText: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  navIcon: { width: 24, height: 24, resizeMode: 'contain' },

  /* Custom Logout Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
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
  modalIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalOuterRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInnerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalLogoutBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  modalLogoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
