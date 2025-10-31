import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useUser } from '../../ctx/UserContext';
import { WS_RECONNECT_INTERVAL } from '../../config';

interface Message {
  id: string;
  thread_id: string;
  from_id: string;
  to_id: string;
  body: string;
  created_at: number;
}

interface User {
  id: string;
  handle: string;
  sigil?: string;
}

interface Thread {
  id: string;
  a_id: string;
  b_id: string;
  last_at: number;
}

export default function ChatScreen() {
  const { uid, threadId } = useLocalSearchParams<{ uid: string; threadId?: string }>();
  const { user, carrierBase } = useUser();
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user && uid) {
      loadInitialData();
      connectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user, uid, carrierBase]);

  const loadInitialData = async () => {
    await Promise.all([loadOtherUser(), loadOrCreateThread()]);
  };

  const loadOtherUser = async () => {
    try {
      const response = await fetch(`${carrierBase}/users`);
      if (response.ok) {
        const users = await response.json();
        const foundUser = users.find((u: User) => u.id === uid);
        if (foundUser) {
          setOtherUser(foundUser);
        } else {
          Alert.alert('Error', 'User not found');
          router.back();
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      Alert.alert('Error', 'Could not load user information');
    }
  };

  const loadOrCreateThread = async () => {
    if (!user) return;

    try {
      let thread: Thread;

      if (threadId) {
        // Use existing thread
        const response = await fetch(`${carrierBase}/threads/${user.id}`);
        if (response.ok) {
          const threads = await response.json();
          const foundThread = threads.find((t: Thread) => t.id === threadId);
          if (foundThread) {
            thread = foundThread;
          } else {
            throw new Error('Thread not found');
          }
        } else {
          throw new Error('Failed to load threads');
        }
      } else {
        // Create new thread
        const response = await fetch(`${carrierBase}/thread`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            a_id: user.id,
            b_id: uid,
          }),
        });

        if (response.ok) {
          thread = await response.json();
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create thread');
        }
      }

      setCurrentThread(thread);
      await loadMessages(thread.id);
    } catch (error) {
      console.error('Error with thread:', error);
      Alert.alert('Error', 'Could not load or create conversation');
    }
  };

  const loadMessages = async (threadId: string) => {
    try {
      const response = await fetch(`${carrierBase}/messages/${threadId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        // Scroll to bottom after loading messages
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const connectWebSocket = () => {
    try {
      const wsUrl = carrierBase.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Attempt to reconnect
        setTimeout(connectWebSocket, WS_RECONNECT_INTERVAL);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      setIsConnected(false);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const handleWebSocketMessage = (message: any) => {
    if (message.type === 'message.new' && currentThread) {
      const newMsg = message.data;
      // Only add message if it belongs to current thread
      if (newMsg.thread_id === currentThread.id) {
        setMessages(prev => [...prev, newMsg]);
        // Scroll to bottom when new message arrives
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }
  };

  const sendMessage = async () => {
    if (!user || !currentThread || !newMessage.trim()) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${carrierBase}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thread_id: currentThread.id,
          from_id: user.id,
          to_id: uid,
          body: newMessage.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewMessage('');
        // If WebSocket is not connected, manually add the message
        if (!isConnected) {
          setMessages(prev => [...prev, data.message]);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      } else {
        Alert.alert('Error', data.error || 'Failed to send message');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not send message. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isFromMe = item.from_id === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isFromMe ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isFromMe ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isFromMe ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.body}
          </Text>
          <Text style={[
            styles.messageTime,
            isFromMe ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {new Date(item.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (!otherUser) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen 
        options={{ 
          title: `${otherUser.sigil ? otherUser.sigil + ' ' : ''}${otherUser.handle}`,
          headerShown: true,
        }} 
      />
      
      {/* Connection Status */}
      <View style={[styles.statusBar, { backgroundColor: isConnected ? '#34C759' : '#FF9500' }]}>
        <Text style={styles.statusText}>
          {isConnected ? '🟢 Connected' : '🟡 Offline'}
        </Text>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Start your conversation with {otherUser.handle}!
            </Text>
          </View>
        }
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, { opacity: isLoading || !newMessage.trim() ? 0.6 : 1 }]} 
          onPress={sendMessage}
          disabled={isLoading || !newMessage.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8E8E93',
  },
  statusBar: {
    padding: 4,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  messageContainer: {
    marginVertical: 4,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#1C1C1E',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#8E8E93',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});