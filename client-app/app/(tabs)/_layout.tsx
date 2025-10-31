import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <Text style={{ 
      fontSize: 20, 
      color: focused ? '#007AFF' : '#8E8E93' 
    }}>
      {name === 'feed' ? '📰' : 
       name === 'dm' ? '💬' : 
       name === 'messages' ? '📨' : 
       name === 'profile' ? '👤' : '❓'}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#F8F9FA',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: '#F8F9FA',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          headerTitle: '📰 Feed',
          tabBarIcon: ({ focused }) => <TabBarIcon name="feed" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dm"
        options={{
          title: 'DM',
          headerTitle: '💬 DM/Pulse',
          tabBarIcon: ({ focused }) => <TabBarIcon name="dm" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          headerTitle: '📨 Messages',
          tabBarIcon: ({ focused }) => <TabBarIcon name="messages" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: '👤 Profile',
          tabBarIcon: ({ focused }) => <TabBarIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}