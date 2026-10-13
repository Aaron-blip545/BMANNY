import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface MobileNavDockProps {
  activeTab: 'home' | 'orders' | 'messages' | 'profile';
}

export function MobileNavDock({ activeTab }: MobileNavDockProps) {
  const { colors, isDarkMode } = useTheme();

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

  return (
    <View style={[styles.dockContainer, { backgroundColor: dockBg, borderColor: dockBorder }]}>
      <View style={styles.navRow}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.navItem}
              onPress={() => {
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
                  <Ionicons
                    name={item.iconFilled}
                    size={20}
                    color="#2196F3"
                  />
                  <Text style={[styles.activeLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                  <View style={styles.indicatorBar} />
                </View>
              ) : (
                <View style={styles.inactiveTab}>
                  <Ionicons
                    name={item.iconOutline}
                    size={21}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.inactiveLabel, { color: colors.textSecondary }]}>
                    {item.label}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dockContainer: {
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 24 : 12,
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
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
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
