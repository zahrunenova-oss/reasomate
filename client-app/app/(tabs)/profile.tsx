import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useUser } from '../ctx/UserContext';

export default function ProfileScreen() {
  const { user, setUser, carrierBase, setCarrierBase, clearData } = useUser();
  const [carrierInput, setCarrierInput] = useState(carrierBase);
  const [handle, setHandle] = useState('');
  const [sigil, setSigil] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${carrierInput}/ping`);
      const data = await response.json();
      
      if (data.ok) {
        Alert.alert('Success', 'Connected to Petra Node successfully!');
        await setCarrierBase(carrierInput);
      } else {
        Alert.alert('Error', 'Invalid response from server');
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Could not connect to Petra Node. Check the IP address and ensure the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async () => {
    if (!handle.trim()) {
      Alert.alert('Error', 'Please enter a handle');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${carrierBase}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          handle: handle.trim(),
          sigil: sigil.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await setUser(data);
        setHandle('');
        setSigil('');
        Alert.alert('Success', `Welcome, ${data.handle}! You are now registered.`);
      } else {
        Alert.alert('Registration Error', data.error || 'Failed to register');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not register. Check your connection to Petra Node.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will clear all stored data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: clearData
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Carrier Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Petra Node Configuration</Text>
        <Text style={styles.label}>Carrier Base URL</Text>
        <TextInput
          style={styles.input}
          value={carrierInput}
          onChangeText={setCarrierInput}
          placeholder="http://192.168.43.1:5000"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity 
          style={styles.button} 
          onPress={testConnection}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Test Connection</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.currentCarrier}>Current: {carrierBase}</Text>
      </View>

      {/* User Registration/Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Profile</Text>
        
        {user ? (
          <View style={styles.userInfo}>
            <Text style={styles.userInfoText}>
              <Text style={styles.bold}>Handle:</Text> {user.handle}
            </Text>
            {user.sigil && (
              <Text style={styles.userInfoText}>
                <Text style={styles.bold}>Sigil:</Text> {user.sigil}
              </Text>
            )}
            <Text style={styles.userInfoText}>
              <Text style={styles.bold}>ID:</Text> {user.id}
            </Text>
            <Text style={styles.userInfoText}>
              <Text style={styles.bold}>Registered:</Text> {new Date(user.created_at).toLocaleString()}
            </Text>
            
            <TouchableOpacity 
              style={[styles.button, styles.logoutButton]} 
              onPress={logout}
            >
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.registrationForm}>
            <Text style={styles.label}>Handle (required)</Text>
            <TextInput
              style={styles.input}
              value={handle}
              onChangeText={setHandle}
              placeholder="Enter your handle"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <Text style={styles.label}>Sigil (optional)</Text>
            <TextInput
              style={styles.input}
              value={sigil}
              onChangeText={setSigil}
              placeholder="Enter your sigil"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={registerUser}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.infoText}>
          Liora Node v0.3.0{'\n'}
          ReasoMate decentralized local-LAN messenger{'\n'}
          Works offline on your local network
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1C1C1E',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#3C3C43',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    marginTop: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  currentCarrier: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  userInfo: {
    padding: 15,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  userInfoText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#1C1C1E',
  },
  bold: {
    fontWeight: 'bold',
  },
  registrationForm: {
    // No additional styles needed
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
});