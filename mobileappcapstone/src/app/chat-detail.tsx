import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getConversation, sendMessage, markConversationRead } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

interface Message {
  message_id: number;
  sender_id: number;
  message_body: string;
  created_at: string;
}

export default function ChatDetailScreen() {
  const { colors } = useTheme();
  const { otherUserId, otherUserName, inquiryId } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadMessages();
    markConversationRead(Number(otherUserId)).catch(() => { });

    // Poll every 4 seconds so replies from the sales agent (web) appear
    // automatically while the customer has this conversation open.
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [otherUserId]);

  async function loadMessages() {
    try {
      const data = await getConversation(Number(otherUserId));
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendMessage(Number(otherUserId), text.trim(), inquiryId ? Number(inquiryId) : undefined);
      setText('');
      await loadMessages();
      scrollRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  }

  // NOTE: whoever is viewing this screen is "me" - we don't know our own
  // user_id here without a getCurrentUser() call. Simplest fix used
  // below: a message is "mine" if its sender_id does NOT match the
  // person we're talking to.
  const isMine = (m: Message) => m.sender_id !== Number(otherUserId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={[styles.headerAvatar, { backgroundColor: '#2196F3' }]}>
            <Text style={styles.headerAvatarText}>{otherUserName?.toString().substring(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{otherUserName}</Text>
        </View>
      </View>

      <ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesContent}>
        {messages.map((message) => (
          <View
            key={message.message_id}
            style={[
              styles.messageBubble,
              isMine(message) ? [styles.userMessage, { backgroundColor: '#2196F3' }] : [styles.otherMessage, { backgroundColor: colors.card }],
            ]}
          >
            <Text style={[styles.messageText, { color: isMine(message) ? '#ffffff' : colors.text }]}>{message.message_body}</Text>
            <Text style={[styles.messageTime, { color: colors.textSecondary }]}>{new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="Type a message..."
          placeholderTextColor="#666"
        />
        <TouchableOpacity style={[styles.sendButton, { backgroundColor: '#2196F3' }]} onPress={handleSend} disabled={sending}>
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
    backgroundColor: '#2196F3',
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