# Liora Node - ReasoMate Client App

Liora Node is the React Native client for ReasoMate, providing a WhatsApp-like interface for decentralized local-LAN messaging.

## Features

- **Expo Router Tabs**: Feed, DM/Pulse, Messages, Profile navigation
- **Real-time Messaging**: WebSocket support with polling fallback
- **Offline-First**: Works on local LAN without internet
- **Persistent Storage**: User data and carrier settings saved locally
- **Simple Registration**: One-time setup, no repeated forms

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Android phone with Expo Go app
- Petra Node server running on same LAN

### Installation & Run

```bash
cd client-app
npm install
npx expo start --host lan
```

Scan the QR code with Expo Go on your Android device.

## First Time Setup

1. **Open Profile Tab**: Configure Petra Node connection
2. **Set Carrier Base**: Enter your PC's LAN IP (e.g., `http://192.168.43.1:5000`)
3. **Test Connection**: Verify server is reachable
4. **Register**: Enter your handle and optional sigil
5. **Start Messaging**: Use Feed, DM, and Messages tabs

## App Structure

### Tabs Overview

#### 📰 Feed
- View all public pulses from users
- Post new pulses to share with everyone
- Real-time updates via WebSocket
- Pull to refresh

#### 💬 DM/Pulse
- Quick message composer
- Send as public pulse OR private DM
- Select recipient for direct messages
- Character counter (280 chars)

#### 📨 Messages
- List all your conversation threads
- Start new chats with other users
- Real-time message delivery
- Thread-based conversations

#### 👤 Profile
- Configure Petra Node server IP
- User registration and management
- Connection testing
- App information

### Technical Details

#### Expo Configuration
- **Expo SDK**: ~54.0.21
- **React**: 18.2.0
- **React Native**: 0.74.1
- **Expo Router**: ~6.0.14

#### Storage
- **AsyncStorage**: User data and carrier settings
- **Keys**: `rm:user`, `rm:carrier`
- **Auto-login**: No repeated registration

#### Networking
- **REST API**: All CRUD operations
- **WebSocket**: Real-time events at `/ws`
- **Fallback**: Polling every 10s when offline
- **CORS**: Enabled for LAN access

## Network Setup

### Find Your PC's IP
1. On Windows PC running Petra Node: `ipconfig`
2. Look for "Wireless LAN adapter" or "Ethernet adapter"
3. Note the IPv4 Address (e.g., 192.168.43.1)

### Configure Client
1. Open Profile tab in app
2. Enter: `http://YOUR_PC_IP:5000`
3. Tap "Test Connection"
4. Should show "Connected to Petra Node successfully!"

## Usage Guide

### Posting Pulses
1. Go to Feed tab
2. Type message in input field
3. Tap "Post" - appears on all connected devices

### Direct Messaging
1. Go to DM tab
2. Type your message
3. Select a user from the list
4. Tap "Send as DM"

### Managing Conversations
1. Go to Messages tab
2. Tap "Start New Chat" to begin
3. Select user from list
4. Chat opens with real-time messaging

## Troubleshooting

### Can't Connect to Server
- Verify PC and phone on same WiFi/hotspot
- Check PC firewall allows port 5000
- Test server: `curl http://PC_IP:5000/ping`
- Try different IP format (192.168.x.x vs 10.0.x.x)

### WebSocket Issues
- App shows "🟡 Offline (polling)" - normal fallback
- Messages still work via polling every 10s
- Check browser console for WebSocket errors

### Registration Problems
- Handle already exists - try different name
- Server not responding - check connection
- Clear app data: Profile → Logout

### Messages Not Appearing
- Pull down to refresh in Feed/Messages
- Check WebSocket connection status
- Verify other user is registered

## Development

### File Structure
```
client-app/
├── package.json           # Dependencies and scripts
├── app.json              # Expo configuration
├── App.js                # Entry point
├── app/
│   ├── _layout.tsx       # Root layout with UserProvider
│   ├── config.ts         # App configuration
│   ├── ctx/
│   │   └── UserContext.tsx  # User state management
│   └── (tabs)/
│       ├── _layout.tsx   # Tab navigation
│       ├── feed.tsx      # Feed screen
│       ├── dm.tsx        # DM/Pulse screen
│       ├── profile.tsx   # Profile screen
│       └── messages/
│           ├── index.tsx # Messages list
│           └── [uid].tsx # Individual chat
└── assets/               # App icons and images
```

### Scripts
- `npm start` - Start Expo development server
- `npm run android` - Start with Android focus
- `npm run web` - Start web version (limited functionality)

### Key Components
- **UserContext**: Global state for user and carrier
- **WebSocket**: Real-time event handling
- **AsyncStorage**: Persistent local storage
- **Expo Router**: File-based navigation

## API Integration

### REST Endpoints Used
- `GET /ping` - Health check
- `POST /register` - User registration
- `GET /users` - List all users
- `POST /pulse` - Post public pulse
- `GET /pulses` - Get feed pulses
- `GET /threads/:user_id` - Get user threads
- `POST /thread` - Create/get thread
- `GET /messages/:thread_id` - Get thread messages
- `POST /message` - Send message

### WebSocket Events
- `user.registered` - New user joined
- `pulse.new` - New pulse posted
- `message.new` - New message sent
- `thread.new` - New thread created

## Offline Behavior

- **No Internet Required**: Works entirely on LAN
- **WebSocket Fallback**: Automatic polling when disconnected
- **Persistent Storage**: Settings survive app restarts
- **Connection Status**: Visual indicators for connectivity

## Security & Privacy

- **Local Network Only**: No data leaves your LAN
- **No Cloud Storage**: All data on Petra Node server
- **Simple Authentication**: Handle-based, no passwords
- **Open Protocol**: Inspect all network traffic

## License

MIT