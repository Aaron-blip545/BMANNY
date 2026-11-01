import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getSalesAgents } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

interface SalesAgent {
  user_id: number;
  full_name: string;
}

export default function NewChatScreen() {
  const { colors } = useTheme();
  const [agents, setAgents] = useState<SalesAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAgents(await getSalesAgents());
    } catch (err: any) {
      setError(err.message || 'Unable to load Sales Agents right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  function openChat(agent: SalesAgent) {
    router.replace({
      pathname: '/chat-detail',
      params: {
        otherUserId: agent.user_id,
        otherUserName: agent.full_name,
      },
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to messages"
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={23} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>New chat</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Choose a Sales Agent to contact</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#2196F3" size="large" />
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>Loading Sales Agents…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={38} color={colors.textSecondary} />
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadAgents}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : agents.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="people-outline" size={42} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Sales Agent is available</Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>Please try again later.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>Your chat is private and can only be opened with a Sales Agent.</Text>
          {agents.map((agent) => (
            <TouchableOpacity
              key={agent.user_id}
              style={[styles.agentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => openChat(agent)}
              activeOpacity={0.78}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{agent.full_name.substring(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.agentInfo}>
                <Text style={[styles.agentName, { color: colors.text }]}>{agent.full_name}</Text>
                <Text style={[styles.agentRole, { color: colors.textSecondary }]}>Sales Agent</Text>
              </View>
              <Ionicons name="chevron-forward" size={21} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  listContent: { padding: 20, paddingBottom: 36 },
  helperText: { fontSize: 13, lineHeight: 19, marginBottom: 16 },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  avatarText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
  agentInfo: { flex: 1 },
  agentName: { fontSize: 16, fontWeight: '700' },
  agentRole: { fontSize: 13, marginTop: 3 },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 12 },
  stateText: { textAlign: 'center', fontSize: 14, lineHeight: 20, marginTop: 12 },
  retryButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 18,
  },
  retryText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
