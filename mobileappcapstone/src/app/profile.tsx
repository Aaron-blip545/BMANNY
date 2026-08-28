import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getMe, logout } from '../services/api';

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
  const { colors } = useTheme();
  const { profileImage } = useLocalSearchParams<{ profileImage: string }>();
  const [avatarImage, setAvatarImage] = useState<string | null>(profileImage || null);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    let isMounted = true;

    getMe()
      .then((user) => {
        if (!isMounted) return;
        setUserName(user?.full_name ?? 'BMANNY customer');
        setEmail(user?.email ?? '');

        const savedAvatar = user?.business_client?.profile_pic ?? user?.businessClient?.profile_pic;
        if (!profileImage && savedAvatar) {
          setAvatarImage(savedAvatar);
        }
      })
      .catch(() => {
        // Keep the profile usable if the connection is temporarily unavailable.
        if (isMounted) {
          setUserName('BMANNY customer');
        }
      });

    return () => {
      isMounted = false;
    };
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
            await logout(); // clears the Sanctum token from SecureStore
            // Replace the entire stack with the login screen so
            // pressing Back cannot return to authenticated screens.
            router.dismissAll();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.profileSection, { borderBottomColor: colors.border }]}>
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
          <TouchableOpacity style={[styles.editButton, { backgroundColor: '#2196F3' }]} onPress={() => {
            // @ts-ignore
            router.push('/edit-profile');
          }}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => router.push('/settings')}>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
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
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },

  /* NAVIGATION BAR */
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
});
