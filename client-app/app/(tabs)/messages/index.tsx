import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '../../ctx/UserContext';

interface Thread {
  id: string;
  a_id: string;
  b_id: string;
  last_at: number;
}

interface User {
  id: string;
  handle: string;
  sigil?: string;
}

interface Message {
  id: string;
  thread_id: string;
  from_id: string;
  to_id: string;
  body: string;
  created_at: number;
}

export default function MessagesScreen() {
  const { user, carrierBase } = useUser();
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [lastMessages, setLastMessages] = useState<{ [threadId: string]: Message }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, carrierBase]);

  const loadData = async () => {
    await Promise.all([loadThreads(), loadUsers()]);
  };

  const loadThreads = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${carrierBase}/threads/${user.id}`);
      if (response.ok) {
        const threadsData = await response.json();
        setThreads(threadsData);
        
        // Load last message for each thread
        const lastMessagesMap: { [threadId: string]: Message } = {};
        
        for (const thread of threadsData) {
          try {
            const messagesResponse = await fetch(`${carrierBase}/messages/${thread.id}`);
            if (messagesResponse.ok) {
              const messages = await messagesResponse.json();
              if (messages.length > 0) {
                lastMessagesMap[thread.id] = messages[messages.length - 1];
              }
            }
          } catch (error) {
            console.error(`Error loading messages for thread ${thread.id}:`, error);
          }
        }
        
        setLastMessages(lastMessagesMap);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(`${carrierBase}/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const getOtherUserId = (thread: Thread) => {
    return thread.a_id === user?.id ? thread.b_id : thread.a_id;
  };

  const getUserInfo = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser || { id: userId, handle: 'Unknown', sigil: '' };
  };

  const openThread = (thread: Thread) => {
    const otherUserId = getOtherUserId(thread);
    router.push(`/messages/${otherUserId}?threadId=${thread.id}`);
  };

  const startNewChat = () => {
    // Show list of users to start a new chat
    const availableUsers = users.filter(u => u.id !== user?.id);
    
    if (availableUsers.length === 0) {
      Alert.alert('No Users', 'No other users available to chat with.');
      return;
    }

    const userOptions = availableUsers.map(u => ({
      text: `${u.sigil ? u.sigil + ' ' : ''}${u.handle}`,
      onPress: () => router.push(`/messages/${u.id}`),
    }));

    Alert.alert(
      'Start New Chat',
      'Select a user to start chatting with:',
      [
        ...userOptions,
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderThread = ({ item }: { item: Thread }) => {
    const otherUserId = getOtherUserId(item);
    const otherUser = getUserInfo(otherUserId);
    const lastMessage = lastMessages[item.id];

    return (
      <TouchableOpacity style={styles.threadItem} onPress={() => openThread(item)}>
        <View style={styles.threadHeader}>
          <Text style={styles.threadHandle}>
            {otherUser.sigil && `${otherUser.sigil} `}
            {otherUser.handle}
          </Text>
          <Text style={styles.threadTime}>
            {new Date(item.last_at).toLocaleDateString()}
          </Text>
        </View>
        
        {lastMessage && (
          <Text style={styles.lastMessage} numberOfLines={2}>
            {lastMessage.from_id === user?.id ? 'You: ' : ''}
            {lastMessage.body}
          </Text>
        )}
        
        <Text style={styles.threadId}>Thread: {item.id.slice(0, 8)}...</Text>
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noUserText}>
          Please register in the Profile tab to use Messages
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* New Chat Button */}
      <TouchableOpacity style={styles.newChatButton} onPress={startNewChat}>
        <Text style={styles.newChatButtonText}>+ Start New Chat</Text>
      </TouchableOpacity>

      {/* Threads List */}
      <FlatList
        data={threads}
        renderItem={renderThread}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No conversations yet.{'\n'}
              Tap "Start New Chat" to begin messaging!
            </Text>
          </View>
        }
      />
    </View>
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
  noUserText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  newChatButton: {
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  newChatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  threadItem: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  threadHandle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  threadTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  lastMessage: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 5,
    lineHeight: 18,
  },
  threadId: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'monospace',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});