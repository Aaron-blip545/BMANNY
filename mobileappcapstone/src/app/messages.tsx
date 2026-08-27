import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { getConversations, deleteConversation } from '../services/api';

interface Conversation {
  id: number;
  other_user_id: number;
  other_user_name: string;
  inquiry_id?: number;
  avatar: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
}

const HomeIcon = ({ colors }: { colors: any }) => (
  <Image source={require('@/assets/images/homepageicon/home.png')} style={styles.navIcon} tintColor={colors.text} />
);

const OrdersIcon = ({ colors }: { colors: any }) => (
  <Image source={require('@/assets/images/homepageicon/booking.png')} style={styles.navIcon} tintColor={colors.text} />
);

const MessagesIcon = ({ colors }: { colors: any }) => (
  <Image source={require('@/assets/images/homepageicon/messages.png')} style={styles.navIcon} tintColor={colors.text} />
);

const ProfileIcon = ({ colors }: { colors: any }) => (
  <Image source={require('@/assets/images/homepageicon/profile.png')} style={styles.navIcon} tintColor={colors.text} />
);

export default function MessagesScreen() {
  const { colors } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const raw = await getConversations();
      // Map the API's snake_case fields to the new camelCase interface
      // so the template can use conversation.name, .lastMessage, etc.
      const mapped: Conversation[] = (raw ?? []).map((c: any) => ({
        // Use other_user_id as the stable key — conversations are now
        // grouped per-person on the backend, not per-inquiry.
        id:              c.other_user_id,
        other_user_id:   c.other_user_id,
        other_user_name: c.other_user_name,
        inquiry_id:      c.inquiry_id ?? undefined,
        avatar:          (c.other_user_name ?? '?').substring(0, 2).toUpperCase(),
        name:            c.other_user_name,
        lastMessage:     c.last_message || '📷 Photo',
        time:            c.last_message_at
          ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
        unread:          c.unread_count ?? 0,
      }));
      setConversations(mapped);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reloads every time this screen comes into focus - so unread counts
  // stay fresh after you read a conversation and come back.
  // Also polls every 5 seconds so messages from the sales agent (web)
  // appear without needing a manual pull-to-refresh.
  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  function openConversation(conv: Conversation) {
    router.push({
      pathname: '/chat-detail',
      params: {
        otherUserId:   conv.other_user_id,
        otherUserName: conv.other_user_name,
        // Don't pass inquiryId — conversations are now per-person, not
        // per-inquiry. The user can reference any inquiry in the chat.
      },
    });
  }

  function handleDeleteConversation(conv: Conversation) {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete the conversation with ${conv.name}? All messages will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(conv.other_user_id);
              setConversations((prev) => prev.filter((item) => item.id !== conv.id));
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete conversation.');
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#2196F3" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
      </View>

      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {conversations.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>💬</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '600' }}>No conversations yet.</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 6, textAlign: 'center', paddingHorizontal: 32 }}>
              Submit an inquiry and a sales agent will reach out to you here.
            </Text>
          </View>
        ) : (
          conversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              style={[styles.conversationItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => openConversation(conversation)}
              onLongPress={() => handleDeleteConversation(conversation)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{conversation.avatar}</Text>
              </View>
              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <Text style={[styles.name, { color: colors.text }]}>{conversation.name}</Text>
                  <Text style={[styles.time, { color: colors.textSecondary }]}>{conversation.time}</Text>
                </View>
                <View style={styles.conversationFooter}>
                  <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                    {conversation.lastMessage}
                  </Text>
                  <View style={styles.actionRow}>
                    {conversation.unread > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>{conversation.unread}</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.deleteRowBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.deleteRowIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
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
          <Text style={[styles.navText, { color: '#2196F3' }]}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
          <ProfileIcon colors={colors} />
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Profile</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ff6b35',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteRowBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  deleteRowIcon: {
    fontSize: 14,
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