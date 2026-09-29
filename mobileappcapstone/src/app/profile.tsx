import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getMe, logout, resolveImageUrl } from '../services/api';

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

type VerificationStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

/** Small badge displayed below the user's name on the profile screen. */
function VerificationBadge({ status }: { status: VerificationStatus }) {
  const config = {
    not_submitted: { icon: 'shield-outline' as const,       color: '#f59e0b', label: 'Unverified'    },
    pending:       { icon: 'time-outline' as const,          color: '#3b82f6', label: 'Under Review'  },
    approved:      { icon: 'shield-checkmark' as const,      color: '#10b981', label: 'Verified'      },
    rejected:      { icon: 'shield-half-outline' as const,   color: '#ef4444', label: 'Rejected'      },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.color + '20', borderColor: config.color + '50' }]}>
      <Ionicons name={config.icon} size={13} color={config.color} />
      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { profileImage } = useLocalSearchParams<{ profileImage: string }>();
  const [avatarImage, setAvatarImage]           = useState<string | null>(profileImage || null);
  const [userName, setUserName]                 = useState('');
  const [email, setEmail]                       = useState('');
  const [registrationNumber, setRegNumber]      = useState<string | null>(null);
  const [verificationStatus, setVerifStatus]    = useState<VerificationStatus>('not_submitted');

  useEffect(() => {
    let isMounted = true;

    getMe()
      .then((user) => {
        if (!isMounted) return;
        setUserName(user?.full_name ?? 'BMANNY customer');
        setEmail(user?.email ?? '');

        if (user?.registration_number) {
          setRegNumber(user.registration_number);
        }

        const businessClient = user?.business_client ?? user?.businessClient;

        if (businessClient?.verification_status) {
          setVerifStatus(businessClient.verification_status as VerificationStatus);
        }

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
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.dismissAll();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const isVerified = verificationStatus === 'approved';

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
            {/* Verification overlay dot */}
            <View style={[
              styles.avatarBadgeDot,
              { backgroundColor: isVerified ? '#10b981' : '#f59e0b' },
            ]}>
              <Ionicons
                name={isVerified ? 'checkmark' : 'alert'}
                size={10}
                color="#fff"
              />
            </View>
          </View>

          <Text style={[styles.name, { color: colors.text }]}>{userName}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{email}</Text>

          {/* Verification badge */}
          <VerificationBadge status={verificationStatus} />

          {/* Registration number */}
          {registrationNumber && (
            <Text style={[styles.regNum, { color: colors.textSecondary }]}>
              ID: {registrationNumber}
            </Text>
          )}

          {/* Edit profile button */}
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: '#2196F3' }]}
            // @ts-ignore
            onPress={() => router.push('/edit-profile')}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          {/* Get Verified CTA — shown unless already approved */}
          {!isVerified && (
            <TouchableOpacity
              style={[styles.verifyButton, {
                borderColor: verificationStatus === 'pending' ? '#3b82f6' : '#f59e0b',
                backgroundColor: verificationStatus === 'pending' ? 'rgba(59,130,246,0.08)' : 'rgba(245,158,11,0.08)',
              }]}
              // @ts-ignore
              onPress={() => router.push('/verification')}
            >
              <Ionicons
                name={verificationStatus === 'pending' ? 'time-outline' : 'shield-outline'}
                size={16}
                color={verificationStatus === 'pending' ? '#3b82f6' : '#f59e0b'}
              />
              <Text style={[styles.verifyButtonText, {
                color: verificationStatus === 'pending' ? '#3b82f6' : '#f59e0b',
              }]}>
                {verificationStatus === 'pending'
                  ? 'Verification Pending…'
                  : verificationStatus === 'rejected'
                    ? 'Re-submit Verification'
                    : 'Get Verified'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Menu Section ────────────────────────────────────────── */}
        <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>

          {/* Verification status entry */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            // @ts-ignore
            onPress={() => router.push('/verification')}
          >
            <Ionicons
              name={isVerified ? 'shield-checkmark' : 'shield-outline'}
              size={24}
              color={isVerified ? '#10b981' : '#f59e0b'}
              style={styles.menuIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuText, { color: colors.text }]}>Verification</Text>
              <Text style={[styles.menuSubText, {
                color: {
                  not_submitted: '#f59e0b',
                  pending: '#3b82f6',
                  approved: '#10b981',
                  rejected: '#ef4444',
                }[verificationStatus],
              }]}>
                {{
                  not_submitted: 'Not submitted yet',
                  pending: 'Under review',
                  approved: 'Approved ✓',
                  rejected: 'Rejected — tap to re-submit',
                }[verificationStatus]}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

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
          <ProfileIcon colors={colors} isActive={true} />
          <Text style={[styles.navText, { color: '#2196F3' }]}>Profile</Text>
        </TouchableOpacity>
      </View>
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
  avatarBadgeDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 10 },

  /* Verification badge */
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },

  regNum: { fontSize: 12, marginBottom: 16, letterSpacing: 0.3 },

  editButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginBottom: 10,
  },
  editButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  /* Get Verified CTA */
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    marginTop: 4,
  },
  verifyButtonText: { fontSize: 13, fontWeight: '700' },

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
});
