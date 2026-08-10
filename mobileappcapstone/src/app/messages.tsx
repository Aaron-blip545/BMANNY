import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';

export default function MessagesScreen() {
  const conversations = [
    {
      id: 1,
      name: 'Premium Coffee Blend',
      lastMessage: 'Thank you for your order! Your package is on the way.',
      time: '2:30 PM',
      unread: 2,
      avatar: 'PC',
    },
    {
      id: 2,
      name: 'Energy Boost Supplement',
      lastMessage: 'We have new stock available for your favorite supplements.',
      time: '1:15 PM',
      unread: 0,
      avatar: 'EB',
    },
    {
      id: 3,
      name: 'Organic Protein Powder',
      lastMessage: 'Your order has been delivered successfully.',
      time: 'Yesterday',
      unread: 0,
      avatar: 'OP',
    },
    {
      id: 4,
      name: 'Focus Formula',
      lastMessage: 'Check out our new arrivals this week!',
      time: '2 days ago',
      unread: 1,
      avatar: 'FF',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {conversations.map((conversation) => (
          <TouchableOpacity
            key={conversation.id}
            style={styles.conversationItem}
            onPress={() => {
              // @ts-ignore
              router.push('/chat-detail');
            }}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{conversation.avatar}</Text>
            </View>
            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text style={styles.name}>{conversation.name}</Text>
                <Text style={styles.time}>{conversation.time}</Text>
              </View>
              <View style={styles.conversationFooter}>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {conversation.lastMessage}
                </Text>
                {conversation.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{conversation.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff4500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff4500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: '#fff',
  },
  time: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#a0a0a0',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#ff4500',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
