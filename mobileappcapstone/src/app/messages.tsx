import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getConversations } from '../services/api';

interface Conversation {
  inquiry_id: number | null;
  other_user_id: number;
  other_user_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reloads every time this screen comes into focus - so unread counts
  // stay fresh after you read a conversation and come back.
  useFocusEffect(useCallback(() => { loadConversations(); }, [loadConversations]));

  function openConversation(conv: Conversation) {
    router.push({
      pathname: '/chat-detail',
      params: {
        otherUserId: conv.other_user_id,
        otherUserName: conv.other_user_name,
        inquiryId: conv.inquiry_id ?? '',
      },
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#ff6b35" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={loadConversations} tintColor="#ff6b35" />}
      >
        {conversations.length === 0 ? (
          <Text style={{ color: '#b8b8c0', textAlign: 'center', marginTop: 40 }}>
            No conversations yet.
          </Text>
        ) : (
          conversations.map((conv) => (
            <TouchableOpacity
              key={`${conv.inquiry_id}-${conv.other_user_id}`}
              style={styles.conversationItem}
              onPress={() => openConversation(conv)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{conv.other_user_name.substring(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.name}>{conv.other_user_name}</Text>
                  <Text style={styles.time}>{new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={styles.conversationFooter}>
                  <Text style={styles.lastMessage} numberOfLines={1}>{conv.last_message}</Text>
                  {conv.unread_count > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>{conv.unread_count}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '800', color: '#ff6b35' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  conversationItem: { flexDirection: 'row', backgroundColor: '#1a1a2e', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a40' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ff6b35', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  conversationContent: { flex: 1 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  time: { fontSize: 12, color: '#b8b8c0' },
  conversationFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { fontSize: 14, color: '#b8b8c0', flex: 1, marginRight: 8 },
  unreadBadge: { backgroundColor: '#ff6b35', borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  unreadCount: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
});