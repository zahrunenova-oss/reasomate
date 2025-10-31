import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, DEFAULT_CARRIER_BASE } from '../config';

interface User {
  id: string;
  handle: string;
  sigil?: string;
  created_at: number;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  carrierBase: string;
  setCarrierBase: (base: string) => void;
  isLoading: boolean;
  clearData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUserState] = useState<User | null>(null);
  const [carrierBase, setCarrierBaseState] = useState<string>(DEFAULT_CARRIER_BASE);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from storage on mount
  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const [storedUser, storedCarrier] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.CARRIER)
      ]);

      if (storedUser) {
        setUserState(JSON.parse(storedUser));
      }

      if (storedCarrier) {
        setCarrierBaseState(storedCarrier);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = async (newUser: User | null) => {
    try {
      setUserState(newUser);
      if (newUser) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const setCarrierBase = async (base: string) => {
    try {
      setCarrierBaseState(base);
      await AsyncStorage.setItem(STORAGE_KEYS.CARRIER, base);
    } catch (error) {
      console.error('Error saving carrier base:', error);
    }
  };

  const clearData = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.CARRIER)
      ]);
      setUserState(null);
      setCarrierBaseState(DEFAULT_CARRIER_BASE);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  const value: UserContextType = {
    user,
    setUser,
    carrierBase,
    setCarrierBase,
    isLoading,
    clearData
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}