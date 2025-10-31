import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '../ctx/UserContext';

interface User {
  id: string;
  handle: string;
  sigil?: string;
}

export default function DMScreen() {
  const { user, carrierBase } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [quickMessage, setQuickMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user, carrierBase]);

  const loadUsers = async () => {
    try {
      const response = await fetch(`${carrierBase}/users`);
      if (response.ok) {
        const data = await response.json();
        // Filter out current user
        const otherUsers = data.filter((u: User) => u.id !== user?.id);
        setUsers(otherUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const sendQuickDM = async () => {
    if (!user || !selectedUser || !quickMessage.trim()) {
      Alert.alert('Error', 'Please select a user and enter a message');
      return;
    }

    try {
      setIsLoading(true);

      // First, create or get thread
      const threadResponse = await fetch(`${carrierBase}/thread`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          a_id: user.id,
          b_id: selectedUser.id,
        }),
      });

      if (!threadResponse.ok) {
        const error = await threadResponse.json();
        throw new Error(error.error || 'Failed to create thread');
      }

      const thread = await threadResponse.json();

      // Then send the message
      const messageResponse = await fetch(`${carrierBase}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thread_id: thread.id,
          from_id: user.id,
          to_id: selectedUser.id,
          body: quickMessage.trim(),
        }),
      });

      const messageData = await messageResponse.json();

      if (messageResponse.ok) {
        setQuickMessage('');
        setSelectedUser(null);
        Alert.alert(
          'Message Sent!',
          `Your message was sent to ${selectedUser.handle}`,
          [
            { text: 'OK' },
            { 
              text: 'Open Chat', 
              onPress: () => router.push(`/messages/${selectedUser.id}?threadId=${thread.id}`)
            }
          ]
        );
      } else {
        Alert.alert('Error', messageData.error || 'Failed to send message');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not send message. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const postAsPulse = async () => {
    if (!user || !quickMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${carrierBase}/pulse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          body: quickMessage.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setQuickMessage('');
        Alert.alert(
          'Pulse Posted!',
          'Your pulse has been posted to the feed',
          [
            { text: 'OK' },
            { text: 'View Feed', onPress: () => router.push('/feed') }
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to post pulse');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not post pulse. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        selectedUser?.id === item.id && styles.selectedUserItem
      ]}
      onPress={() => setSelectedUser(selectedUser?.id === item.id ? null : item)}
    >
      <Text style={[
        styles.userHandle,
        selectedUser?.id === item.id && styles.selectedUserHandle
      ]}>
        {item.sigil && `${item.sigil} `}
        {item.handle}
      </Text>
      <Text style={styles.userId}>ID: {item.id.slice(0, 8)}...</Text>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noUserText}>
          Please register in the Profile tab to use DM/Pulse
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Message Input */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Quick Message</Text>
        <TextInput
          style={styles.messageInput}
          value={quickMessage}
          onChangeText={setQuickMessage}
          placeholder="Type your message here..."
          multiline
          maxLength={280}
        />
        <Text style={styles.charCount}>{quickMessage.length}/280</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.pulseButton]} 
          onPress={postAsPulse}
          disabled={isLoading || !quickMessage.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Text style={styles.actionButtonText}>📰 Post as Pulse</Text>
              <Text style={styles.actionButtonSubtext}>Share with everyone</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.dmButton]} 
          onPress={sendQuickDM}
          disabled={isLoading || !quickMessage.trim() || !selectedUser}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Text style={styles.actionButtonText}>
                💬 Send as DM
                {selectedUser && ` to ${selectedUser.handle}`}
              </Text>
              <Text style={styles.actionButtonSubtext}>
                {selectedUser ? 'Private message' : 'Select a user below'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* User Selection */}
      <View style={styles.userSection}>
        <Text style={styles.sectionTitle}>
          Select User for DM {selectedUser && `(${selectedUser.handle} selected)`}
        </Text>
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          style={styles.userList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No other users available.{'\n'}
                Ask others to register first!
              </Text>
            </View>
          }
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickActionButton} 
          onPress={() => router.push('/messages')}
        >
          <Text style={styles.quickActionText}>📨 View All Chats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton} 
          onPress={() => router.push('/feed')}
        >
          <Text style={styles.quickActionText}>📰 View Feed</Text>
        </TouchableOpacity>
      </View>
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
  inputSection: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1C1C1E',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 5,
  },
  actionSection: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
  pulseButton: {
    backgroundColor: '#34C759',
  },
  dmButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  userSection: {
    flex: 1,
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userList: {
    flex: 1,
  },
  userItem: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 2,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedUserItem: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  userHandle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  selectedUserHandle: {
    color: '#007AFF',
  },
  userId: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 15,
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#8E8E93',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});