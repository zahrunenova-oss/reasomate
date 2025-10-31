import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useUser } from '../ctx/UserContext';
import { WS_RECONNECT_INTERVAL, POLLING_INTERVAL } from '../config';

interface Pulse {
  id: string;
  user_id: string;
  body: string;
  tag?: any;
  created_at: number;
}

interface User {
  id: string;
  handle: string;
  sigil?: string;
}

export default function FeedScreen() {
  const { user, carrierBase } = useUser();
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newPulse, setNewPulse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      loadInitialData();
      connectWebSocket();
      startPolling();
    }

    return () => {
      disconnectWebSocket();
      stopPolling();
    };
  }, [user, carrierBase]);

  const loadInitialData = async () => {
    await Promise.all([loadPulses(), loadUsers()]);
  };

  const loadPulses = async () => {
    try {
      const response = await fetch(`${carrierBase}/pulses`);
      if (response.ok) {
        const data = await response.json();
        setPulses(data);
      }
    } catch (error) {
      console.error('Error loading pulses:', error);
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

  const startPolling = () => {
    pollingRef.current = setInterval(() => {
      if (!isConnected) {
        loadPulses();
      }
    }, POLLING_INTERVAL);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'pulse.new':
        setPulses(prev => [message.data, ...prev]);
        break;
      case 'user.registered':
        setUsers(prev => [...prev, message.data]);
        break;
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  };

  const postPulse = async () => {
    if (!user) {
      Alert.alert('Error', 'Please register first in the Profile tab');
      return;
    }

    if (!newPulse.trim()) {
      Alert.alert('Error', 'Please enter a pulse message');
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
          body: newPulse.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewPulse('');
        // If WebSocket is not connected, manually add the pulse
        if (!isConnected) {
          setPulses(prev => [data.pulse, ...prev]);
        }
      } else {
        Alert.alert('Error', data.error || 'Failed to post pulse');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not post pulse. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
  };

  const getUserHandle = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.handle : 'Unknown';
  };

  const getUserSigil = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser?.sigil || '';
  };

  const renderPulse = ({ item }: { item: Pulse }) => (
    <View style={styles.pulseItem}>
      <View style={styles.pulseHeader}>
        <Text style={styles.pulseHandle}>
          {getUserSigil(item.user_id) && `${getUserSigil(item.user_id)} `}
          {getUserHandle(item.user_id)}
        </Text>
        <Text style={styles.pulseTime}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
      <Text style={styles.pulseBody}>{item.body}</Text>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noUserText}>
          Please register in the Profile tab to use the Feed
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Connection Status */}
      <View style={[styles.statusBar, { backgroundColor: isConnected ? '#34C759' : '#FF9500' }]}>
        <Text style={styles.statusText}>
          {isConnected ? '🟢 Connected' : '🟡 Offline (polling)'}
        </Text>
      </View>

      {/* New Pulse Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newPulse}
          onChangeText={setNewPulse}
          placeholder="What's on your mind?"
          multiline
          maxLength={280}
        />
        <TouchableOpacity 
          style={[styles.postButton, { opacity: isLoading ? 0.6 : 1 }]} 
          onPress={postPulse}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Pulses List */}
      <FlatList
        data={pulses}
        renderItem={renderPulse}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pulses yet. Be the first to post!</Text>
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
  statusBar: {
    padding: 8,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
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
  postButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  postButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  pulseItem: {
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
  pulseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pulseHandle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  pulseTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  pulseBody: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 22,
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