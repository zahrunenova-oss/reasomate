# ReasoMate / Solnet MVP v0.3

🚀 **Decentralized Local-LAN Messenger** - Works offline on your local network, no internet required!

ReasoMate consists of two components:
- **Petra Node** (Carrier Server) - Runs on Windows PC
- **Liora Node** (Client App) - React Native app for Android phones

## 🎯 Mission

Build a WhatsApp-like messenger that works entirely on your local WiFi/hotspot without requiring internet connectivity or SIM cards. Perfect for:
- Remote areas with no internet
- Private family/group communication
- Emergency communication networks
- Privacy-focused messaging

## ⚡ Quick Start

### 1. Start Petra Node (Server)
```bash
cd carrier-app
npm install
npm start
```
Server runs on `http://0.0.0.0:5000`

### 2. Start Liora Node (Client)
```bash
cd client-app
npm install
npx expo start --host lan
```
Scan QR with Expo Go on Android

### 3. Configure & Register
1. Open Profile tab in app
2. Set Carrier IP: `http://YOUR_PC_IP:5000`
3. Test connection
4. Register with handle and optional sigil
5. Start messaging!

## 🏗️ Architecture

### Petra Node (Server)
- **Express.js** REST API server
- **WebSocket** for real-time events
- **lowdb** JSON file storage
- **CORS** enabled for LAN access
- Runs on Windows PC at port 5000

### Liora Node (Client)
- **Expo SDK 54** React Native app
- **expo-router** tab navigation
- **AsyncStorage** for persistence
- **WebSocket** with polling fallback
- Runs on Android via Expo Go

## 📱 Features

### Feed Tab 📰
- View all public pulses
- Post new pulses
- Real-time updates
- Pull to refresh

### DM/Pulse Tab 💬
- Quick message composer
- Send as public pulse OR private DM
- User selection for DMs
- 280 character limit

### Messages Tab 📨
- List conversation threads
- Start new chats
- Real-time messaging
- Thread-based conversations

### Profile Tab 👤
- Configure server connection
- User registration
- Connection testing
- Logout functionality

## 🔧 Technical Stack

### Server (Petra)
- Node.js 18+
- Express 4
- WebSocket (ws)
- lowdb ^7
- nanoid
- CORS

### Client (Liora)
- Expo ~54.0.21
- React 18.2.0
- React Native 0.74.1
- expo-router ~6.0.14
- AsyncStorage
- TypeScript ~5.9.2

## 🌐 Network Requirements

- **LAN/WiFi**: All devices on same network
- **No Internet**: Works completely offline
- **Port 5000**: Server listens on this port
- **WebSocket**: Real-time communication
- **CORS**: Cross-origin requests enabled

## 📊 Data Models

### User
```json
{
  "id": "string",
  "handle": "string", 
  "sigil": "string?",
  "created_at": "number"
}
```

### Pulse (Feed Post)
```json
{
  "id": "string",
  "user_id": "string",
  "body": "string",
  "tag": "any?",
  "created_at": "number"
}
```

### Message
```json
{
  "id": "string",
  "thread_id": "string",
  "from_id": "string",
  "to_id": "string", 
  "body": "string",
  "created_at": "number"
}
```

### Thread
```json
{
  "id": "string",
  "a_id": "string",
  "b_id": "string",
  "last_at": "number"
}
```

## 🔌 API Endpoints

### Health
- `GET /ping` - Server health check

### Users  
- `POST /register` - Register new user
- `GET /users` - List all users

### Feed
- `POST /pulse` - Post new pulse
- `GET /pulses` - Get latest 50 pulses

### Messaging
- `GET /threads/:user_id` - Get user threads
- `POST /thread` - Create/get thread
- `GET /messages/:thread_id` - Get thread messages
- `POST /message` - Send message

### WebSocket Events
- `user.registered` - New user joined
- `pulse.new` - New pulse posted
- `message.new` - New message sent
- `thread.new` - New thread created

## 🚀 Testing Instructions

### Setup Network
1. **PC**: Connect to WiFi/create hotspot
2. **Phone**: Connect to same network
3. **Find PC IP**: Run `ipconfig` on Windows

### Test Server
```bash
# On PC
cd carrier-app
npm install
node src/server.js

# Test from phone browser
http://PC_IP:5000/ping
```

### Test Client
```bash
# On PC
cd client-app  
npm install
npx expo start --host lan

# Scan QR with Expo Go on phone
# Configure carrier IP in Profile tab
# Register and start messaging
```

## 🔍 Troubleshooting

### Server Issues
- **Port in use**: Change PORT environment variable
- **Firewall**: Allow port 5000 through Windows firewall
- **Network**: Ensure PC and phones on same network

### Client Issues
- **Can't connect**: Verify server IP and port
- **WebSocket fails**: Falls back to polling automatically
- **Registration fails**: Check server logs for errors

### Network Issues
- **Different subnets**: Ensure all devices on same network segment
- **Router blocking**: Some routers block device-to-device communication
- **IP changes**: PC IP may change, update in Profile tab

## 📁 Project Structure

```
ReasoMate/
├── carrier-app/           # Petra Node (Server)
│   ├── package.json
│   ├── src/
│   │   ├── server.js      # Main Express server
│   │   ├── db.js          # Database setup
│   │   ├── ws.js          # WebSocket handling
│   │   ├── utils.js       # Helper functions
│   │   └── schema.md      # Data models
│   ├── data/
│   │   └── db.json        # Created at runtime
│   └── README.md
├── client-app/            # Liora Node (Client)
│   ├── package.json
│   ├── app.json           # Expo config
│   ├── App.js             # Entry point
│   ├── app/
│   │   ├── _layout.tsx    # Root layout
│   │   ├── config.ts      # App config
│   │   ├── ctx/
│   │   │   └── UserContext.tsx
│   │   └── (tabs)/
│   │       ├── _layout.tsx
│   │       ├── feed.tsx
│   │       ├── dm.tsx
│   │       ├── profile.tsx
│   │       └── messages/
│   │           ├── index.tsx
│   │           └── [uid].tsx
│   └── README.md
├── .gitignore
└── README.md
```

## ✅ Acceptance Criteria

- [x] Two phones + one PC on same LAN can communicate
- [x] Register users without repeated prompts
- [x] Post pulses visible to all users in real-time
- [x] Start DM threads and exchange messages
- [x] WebSocket real-time updates with polling fallback
- [x] No internet required, only LAN connectivity
- [x] All config survives app reload
- [x] Compiles on Expo SDK 54 with React 18

## 🔮 Future Enhancements (Not in MVP)

- Auto-discovery via mDNS
- End-to-end encryption
- Message retries & queuing
- Multi-Petra mesh networking
- SQLite database option
- iOS support
- File/image sharing

## 📄 License

MIT - Feel free to use, modify, and distribute!

---

**ReasoMate v0.3** - Bringing people together, one LAN at a time! 🌐💬