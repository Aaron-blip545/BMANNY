import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getConversation, sendMessage, markConversationRead } from '../services/api';

interface Message {
  message_id: number;
  sender_id: number;
  message_body: string;
  created_at: string;
}

export default function ChatDetailScreen() {
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{otherUserName?.toString().substring(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.headerTitle}>{otherUserName}</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#ff6b35" />
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {messages.map((message) => (
              <View key={message.message_id} style={[styles.messageBubble, isMine(message) ? styles.userMessage : styles.otherMessage]}>
                <Text style={styles.messageText}>{message.message_body}</Text>
                <Text style={styles.messageTime}>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#666"
              value={text}
              onChangeText={setText}
            />
            <TouchableOpacity style={[styles.sendButton, sending && { opacity: 0.6 }]} onPress={handleSend} disabled={sending}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a2a40' },
  backButton: { backgroundColor: '#ff6b35', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, marginRight: 12 },
  backButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  headerContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ff6b35', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerAvatarText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  messagesScroll: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 20 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 12 },
  userMessage: { backgroundColor: '#ff6b35', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  otherMessage: { backgroundColor: '#1a1a2e', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 14, color: '#ffffff', marginBottom: 4 },
  messageTime: { fontSize: 11, color: '#b8b8c0', textAlign: 'right' },
  inputContainer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#2a2a40', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 20, padding: 12, paddingHorizontal: 16, color: '#ffffff', marginRight: 12 },
  sendButton: { backgroundColor: '#ff6b35', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20 },
  sendButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});