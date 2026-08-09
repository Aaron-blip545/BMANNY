import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, LoginColors } from '@/constants/theme';

type StatCard = {
  label: string;
  value: string;
  change: string;
};

type QuickAction = {
  title: string;
  subtitle: string;
  icon: { ios: string; android: string; web: string };
};

type ActivityItem = {
  title: string;
  detail: string;
  time: string;
};

const stats: StatCard[] = [
  { label: 'Active Partners', value: '128', change: '+12 this month' },
  { label: 'Open Requests', value: '24', change: '6 need review' },
  { label: 'Completed Deals', value: '56', change: '+8 this week' },
];

const quickActions: QuickAction[] = [
  {
    title: 'New Partner',
    subtitle: 'Add a partner profile',
    icon: { ios: 'person.badge.plus', android: 'person_add', web: 'person_add' },
  },
  {
    title: 'View Reports',
    subtitle: 'Track performance',
    icon: { ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' },
  },
  {
    title: 'Messages',
    subtitle: 'Check inbox',
    icon: { ios: 'envelope', android: 'mail', web: 'mail' },
  },
  {
    title: 'Settings',
    subtitle: 'Manage account',
    icon: { ios: 'gearshape', android: 'settings', web: 'settings' },
  },
];

const recentActivity: ActivityItem[] = [
  {
    title: 'Partner onboarding approved',
    detail: 'Metro Logistics joined the network',
    time: '2h ago',
  },
  {
    title: 'New request submitted',
    detail: 'Warehouse expansion in Cebu',
    time: '5h ago',
  },
  {
    title: 'Deal marked complete',
    detail: 'Retail distribution contract closed',
    time: 'Yesterday',
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.greeting}>Good afternoon</Text>
            <Text style={styles.brandTitle}>BMANNY PARTNERS INC.</Text>
          </View>
          <Pressable style={styles.profileButton}>
            <SymbolView
              name={{ ios: 'person.circle.fill', android: 'account_circle', web: 'account_circle' }}
              size={36}
              tintColor="#FFFFFF"
            />
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Dashboard Overview</Text>
          <Text style={styles.summaryValue}>Welcome back to your partner hub</Text>
          <Text style={styles.summaryHint}>Track partners, requests, and deals in one place.</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + BottomTabInset + 24 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statChange}>{stat.change}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <Pressable key={action.title} style={styles.actionCard}>
                <View style={styles.actionIconWrap}>
                  <SymbolView name={action.icon} size={22} tintColor={LoginColors.primary} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {recentActivity.map((item) => (
              <View key={item.title} style={styles.activityItem}>
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activityDetail}>{item.detail}</Text>
                </View>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable style={styles.signOutButton} onPress={() => router.replace('/')}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F8',
  },
  header: {
    backgroundColor: LoginColors.header,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greeting: {
    color: '#E8E4FF',
    fontSize: 14,
    marginBottom: 4,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  profileButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 18,
    padding: 18,
    gap: 6,
  },
  summaryLabel: {
    color: '#D9D4FF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  summaryHint: {
    color: '#E8E4FF',
    fontSize: 13,
    lineHeight: 18,
  },
  content: {
    flex: 1,
    marginTop: -16,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 24,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '31%',
    flexGrow: 1,
    minWidth: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: LoginColors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: LoginColors.primary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
  statChange: {
    fontSize: 11,
    color: LoginColors.textMuted,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    flexGrow: 1,
    minWidth: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: LoginColors.border,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  actionSubtitle: {
    fontSize: 12,
    color: LoginColors.textMuted,
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LoginColors.border,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F3',
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: LoginColors.primary,
    marginTop: 5,
  },
  activityContent: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  activityDetail: {
    fontSize: 13,
    color: LoginColors.textMuted,
    lineHeight: 18,
  },
  activityTime: {
    fontSize: 11,
    color: LoginColors.textMuted,
  },
  signOutButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  signOutText: {
    color: LoginColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
