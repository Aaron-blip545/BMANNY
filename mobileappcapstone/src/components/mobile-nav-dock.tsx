import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  AppState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getNotifications, markNotificationRead } from '../services/api';
import { subscribeToRealtime } from '../services/realtime';

interface MobileNavDockProps {
  activeTab: 'home' | 'orders' | 'messages' | 'profile';
}

const ORDER_NOTIFICATION_TYPES = ['inquiry', 'quotation', 'order', 'payment', 'product_request', 'follow_up'];

export function MobileNavDock({ activeTab }: MobileNavDockProps) {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [attention, setAttention] = useState({ orders: 0, messages: 0 });

  const loadAttention = useCallback(async () => {
    try {
      const data = await getNotifications();
      const unread = (data.notifications ?? []).filter((item: any) => !item.is_read);
      setAttention({
        messages: unread.filter((item: any) => item.type === 'message').length,
        // The Orders tab contains inquiries, quotations, payments, and orders, so one
        // count here tells the customer which tab has an update to review.
        orders: unread.filter((item: any) => ORDER_NOTIFICATION_TYPES.includes(item.type)).length,
      });
    } catch {
      // Navigation stays usable if the notification request is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    loadAttention();
    const unsubscribe = subscribeToRealtime((event) => {
      if (event.type === 'notification.created' || event.type === 'chat.message.created') {
        loadAttention();
      }
    });
    const interval = setInterval(() => {
      loadAttention();
    }, 6000);
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        loadAttention();
      }
    });
    return () => {
      unsubscribe();
      clearInterval(interval);
      appStateSub.remove();
    };
  }, [loadAttention]);

  const clearTabAttention = useCallback(async (tab: 'orders' | 'messages') => {
    const types = tab === 'messages' ? ['message'] : ORDER_NOTIFICATION_TYPES;

    setAttention((current) => ({ ...current, [tab]: 0 }));

    try {
      const data = await getNotifications();
      const relevantUnread = (data.notifications ?? []).filter(
        (item: any) => !item.is_read && types.includes(item.type),
      );
      await Promise.all(relevantUnread.map((item: any) => markNotificationRead(item.notification_id)));
    } finally {
      await loadAttention();
    }
  }, [loadAttention]);

  const navItems: Array<{
    id: 'home' | 'orders' | 'messages' | 'profile';
    label: string;
    route: string;
    iconOutline: keyof typeof Ionicons.glyphMap;
    iconFilled: keyof typeof Ionicons.glyphMap;
  }> = [
    {
      id: 'home',
      label: 'Home',
      route: '/home',
      iconOutline: 'home-outline',
      iconFilled: 'home',
    },
    {
      id: 'orders',
      label: 'Orders',
      route: '/orders',
      iconOutline: 'checkmark-circle-outline',
      iconFilled: 'checkmark-circle',
    },
    {
      id: 'messages',
      label: 'Messages',
      route: '/messages',
      iconOutline: 'chatbubble-ellipses-outline',
      iconFilled: 'chatbubble-ellipses',
    },
    {
      id: 'profile',
      label: 'Profile',
      route: '/profile',
      iconOutline: 'person-outline',
      iconFilled: 'person',
    },
  ];

  const dockBg = isDarkMode ? '#1a2232' : '#ffffff';
  const dockBorder = isDarkMode ? 'rgba(255, 255, 255, 0.14)' : '#e2e8f0';
  const squircleBg = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(33, 150, 243, 0.12)';
  const squircleBorder = isDarkMode ? 'rgba(255, 255, 255, 0.18)' : 'rgba(33, 150, 243, 0.25)';

  const bottomSafePadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 12) + 6;

  return (
    <View style={[styles.safeWrapper, { backgroundColor: colors.background, paddingBottom: bottomSafePadding }]}>
      <View style={[styles.dockContainer, { backgroundColor: dockBg, borderColor: dockBorder }]}>
        <View style={styles.navRow}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const count = item.id === 'messages' ? attention.messages : item.id === 'orders' ? attention.orders : 0;
            const hasAttention = count > 0;
            const badgeText = count > 99 ? '99+' : String(count);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.navItem}
                onPress={() => {
                  if (item.id === 'orders' || item.id === 'messages') {
                    void clearTabAttention(item.id);
                  }
                  if (!isActive) {
                    router.push(item.route as any);
                  }
                }}
                activeOpacity={0.7}
              >
                {isActive ? (
                  <View
                    style={[
                      styles.activeSquircle,
                      { backgroundColor: squircleBg, borderColor: squircleBorder },
                    ]}
                  >
                    <View style={styles.iconWrapper}>
                      <Ionicons
                        name={item.iconFilled}
                        size={20}
                        color="#2196F3"
                      />
                      {hasAttention && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{badgeText}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.activeLabel, { color: colors.text }]}>
                      {item.label}
                    </Text>
                    <View style={styles.indicatorBar} />
                  </View>
                ) : (
                  <View style={styles.inactiveTab}>
                    <View style={styles.iconWrapper}>
                      <Ionicons
                        name={item.iconOutline}
                        size={21}
                        color={hasAttention ? '#2196F3' : colors.textSecondary}
                      />
                      {hasAttention && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{badgeText}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.inactiveLabel, { color: hasAttention ? '#2196F3' : colors.textSecondary }]}>
                      {item.label}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeWrapper: {
    paddingTop: 6,
  },
  dockContainer: {
    marginHorizontal: 16,
    borderRadius: 26,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1a2232',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSquircle: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  inactiveTab: {
    position: 'relative',
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
  },
  attentionLine: {
    position: 'absolute',
    top: 0,
    width: 18,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#2196F3',
  },
  activeLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  inactiveLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  indicatorBar: {
    width: 20,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#2196F3',
    marginTop: 3,
  },
});
