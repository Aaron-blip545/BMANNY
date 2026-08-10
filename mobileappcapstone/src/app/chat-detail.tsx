import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function ChatDetailScreen() {
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{name?.toString().substring(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.headerTitle}>{name}</Text>
        </View>
      </View>

      <ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesContent}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.isUser ? styles.userMessage : styles.otherMessage,
            ]}
          >
            <Text style={styles.messageText}>{message.text}</Text>
            <Text style={styles.messageTime}>{message.time}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
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
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  backButton: {
    backgroundColor: '#ff4500',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: '#ff4500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
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
    borderRadius: 12,
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: '#ff4500',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#16213e',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#a0a0a0',
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2d2d44',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 12,
    paddingHorizontal: 16,
    color: '#fff',
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#ff4500',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
