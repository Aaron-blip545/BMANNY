import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

export default function ChatDetailScreen() {
  const { colors } = useTheme();
  const { name } = useLocalSearchParams();

  const messages = [
    {
      id: 1,
      text: 'Hello! I have a question about your Premium Coffee Blend.',
      isUser: true,
      time: '2:15 PM',
    },
    {
      id: 2,
      text: 'Hi! Of course, I\'d be happy to help. What would you like to know?',
      isUser: false,
      time: '2:16 PM',
    },
    {
      id: 3,
      text: 'Is it organic and what are the main ingredients?',
      isUser: true,
      time: '2:17 PM',
    },
    {
      id: 4,
      text: 'Yes, it\'s 100% organic. The main ingredients include organic Arabica coffee beans, natural caffeine, and essential vitamins for energy boost.',
      isUser: false,
      time: '2:18 PM',
    },
    {
      id: 5,
      text: 'Thank you for your order! Your package is on the way.',
      isUser: false,
      time: '2:30 PM',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{name?.toString().substring(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{name}</Text>
        </View>
      </View>

      <ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesContent}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.isUser ? styles.userMessage : [styles.otherMessage, { backgroundColor: colors.card }],
            ]}
          >
            <Text style={[styles.messageText, { color: message.isUser ? '#ffffff' : colors.text }]}>{message.text}</Text>
            <Text style={[styles.messageTime, { color: colors.textSecondary }]}>{message.time}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="Type a message..."
          placeholderTextColor="#666"
        />
        <TouchableOpacity style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    backgroundColor: '#ff6b35',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginRight: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff6b35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: '#ff6b35',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    padding: 12,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#ff6b35',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
