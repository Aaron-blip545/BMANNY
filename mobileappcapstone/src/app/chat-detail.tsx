import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getConversation, sendMessage, markConversationRead, deleteConversation, resolveImageUrl } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Message {
  message_id: number;
  sender_id: number;
  message_body: string | null;
  image_url?: string | null;
  created_at: string;
}

export default function ChatDetailScreen() {
  const { colors } = useTheme();
  const { otherUserId, otherUserName, inquiryId } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
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

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  async function handleSend() {
    if (!text.trim() && !selectedImage) return;
    setSending(true);
    try {
      await sendMessage(
        Number(otherUserId),
        text.trim() || null,
        inquiryId ? Number(inquiryId) : undefined,
        selectedImage
      );
      setText('');
      setSelectedImage(null);
      await loadMessages();
      scrollRef.current?.scrollToEnd({ animated: true });
    } catch (err: any) {
      console.error('Failed to send message', err);
      Alert.alert('Error', err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  function handleDeleteConversation() {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete this conversation with ${otherUserName || 'this user'}? All messages will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteConversation(Number(otherUserId));
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete conversation.');
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  // NOTE: whoever is viewing this screen is "me" - we don't know our own
  // user_id here without a getCurrentUser() call. Simplest fix used
  // below: a message is "mine" if its sender_id does NOT match the
  // person we're talking to.
  const isMine = (m: Message) => m.sender_id !== Number(otherUserId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={[styles.headerAvatar, { backgroundColor: '#2196F3' }]}>
            <Text style={styles.headerAvatarText}>{otherUserName?.toString().substring(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {otherUserName}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteHeaderButton}
          onPress={handleDeleteConversation}
        >
          <Text style={styles.deleteHeaderIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#2196F3" size="large" />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={[styles.messagesScroll, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 && (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }}>
              No messages yet. Say hi! 👋
            </Text>
          )}
          {messages.map((message) => (
            <View
              key={message.message_id}
              style={[
                styles.messageBubble,
                isMine(message)
                  ? [styles.userMessage, { backgroundColor: '#2196F3' }]
                  : [styles.otherMessage, { backgroundColor: colors.card }],
              ]}
            >
              {message.image_url && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setViewingImage(resolveImageUrl(message.image_url))}
                  style={styles.chatImageWrapper}
                >
                  <Image
                    source={{ uri: resolveImageUrl(message.image_url)! }}
                    style={styles.chatImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}

              {message.message_body ? (
                <Text style={[styles.messageText, { color: isMine(message) ? '#ffffff' : colors.text }]}>
                  {message.message_body}
                </Text>
              ) : null}

              <Text style={[styles.messageTime, { color: isMine(message) ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Selected Image Preview Pill */}
      {selectedImage && (
        <View style={[styles.previewBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={styles.previewImageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewThumb} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
              <Text style={styles.removeImageBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Photo attached</Text>
        </View>
      )}

      {/* Input bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.inputContainer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.attachButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handlePickImage}
            disabled={sending}
          >
            <Text style={styles.attachButtonText}>📷</Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: '#2196F3',
                opacity: sending || (!text.trim() && !selectedImage) ? 0.6 : 1,
              },
            ]}
            onPress={handleSend}
            disabled={sending || (!text.trim() && !selectedImage)}
          >
            {sending
              ? <ActivityIndicator color="#ffffff" size="small" />
              : <Text style={styles.sendButtonText}>Send</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Fullscreen Image Modal */}
      <Modal visible={!!viewingImage} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <SafeAreaView style={styles.modalSafeArea}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setViewingImage(null)}>
              <Text style={styles.modalCloseText}>✕ Close</Text>
            </TouchableOpacity>
            {viewingImage && (
              <View style={styles.modalImageContainer}>
                <Image
                  source={{ uri: viewingImage }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>
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
    marginRight: 8,
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
    flex: 1,
  },
  deleteHeaderButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteHeaderIcon: {
    fontSize: 18,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 10,
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
  chatImageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
  },
  chatImage: {
    width: SCREEN_WIDTH * 0.62,
    height: SCREEN_WIDTH * 0.5,
    borderRadius: 12,
  },
  messageText: {
    fontSize: 14,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    textAlign: 'right',
  },
  previewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  previewImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  previewThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  previewLabel: {
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  attachButtonText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    padding: 10,
    paddingHorizontal: 16,
    marginRight: 10,
    borderWidth: 1,
    maxHeight: 100,
  },
  sendButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 22,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
  },
  modalSafeArea: {
    flex: 1,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    padding: 16,
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
});