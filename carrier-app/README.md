# Petra Node - ReasoMate Carrier Server

Petra Node is the server component of ReasoMate, providing REST API and WebSocket functionality for decentralized local-LAN messaging.

## Features

- **REST API**: Complete endpoints for user registration, pulses, messages, and threads
- **WebSocket**: Real-time broadcasting of events (user.registered, pulse.new, message.new, thread.new)
- **Local Storage**: Uses lowdb with JSON file for maximum portability
- **CORS Enabled**: Allows cross-origin requests for LAN clients
- **Zero Configuration**: Works out of the box on any Windows PC

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Windows 10/11 PC connected to LAN/hotspot

### Installation & Run

```bash
cd carrier-app
npm install
npm start
```

The server will start on `http://0.0.0.0:5000` and create a `data/db.json` file automatically.

### Test Server

```bash
# Health check
curl http://localhost:5000/ping

# Should return: {"ok":true,"now":1234567890}
```

## API Endpoints

### Health
- `GET /ping` - Health check

### Users
- `POST /register` - Register new user `{handle, sigil?}`
- `GET /users` - Get all users

### Pulses (Feed)
- `POST /pulse` - Post new pulse `{user_id, body, tag?}`
- `GET /pulses` - Get latest 50 pulses

### Messaging
- `GET /threads/:user_id` - Get threads for user
- `POST /thread` - Create/get thread `{a_id, b_id}`
- `GET /messages/:thread_id` - Get messages for thread
- `POST /message` - Send message `{thread_id, from_id, to_id, body}`

### WebSocket Events
Connect to `ws://HOST:5000/ws` to receive:
- `user.registered` - New user joined
- `pulse.new` - New pulse posted
- `message.new` - New message sent
- `thread.new` - New thread created

## Data Storage

All data is stored in `data/db.json` with the following structure:

```json
{
  "users": [],
  "pulses": [],
  "messages": [],
  "threads": []
}
```

## Network Setup

1. **Connect PC to LAN/Hotspot**: Ensure your Windows PC is connected to the same network as client devices
2. **Find PC IP**: Run `ipconfig` to find your LAN IP (usually 192.168.x.x)
3. **Start Server**: Run `npm start`
4. **Configure Clients**: Point clients to `http://YOUR_PC_IP:5000`

## Troubleshooting

### Server won't start
- Check if port 5000 is available: `netstat -an | findstr :5000`
- Try different port: `PORT=5001 npm start`

### Clients can't connect
- Verify PC firewall allows port 5000
- Check PC IP with `ipconfig`
- Ensure all devices on same network
- Test with: `curl http://PC_IP:5000/ping`

### WebSocket issues
- Modern browsers block insecure WebSocket on HTTPS pages
- Use HTTP clients or enable mixed content in browser
- Check browser console for connection errors

## Development

### File Structure
```
carrier-app/
├── package.json
├── src/
│   ├── server.js      # Main Express server
│   ├── db.js          # Database initialization
│   ├── ws.js          # WebSocket handling
│   ├── utils.js       # Helper functions
│   └── schema.md      # Data models documentation
├── data/
│   └── db.json        # Created at runtime
└── README.md
```

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server (same as start)

## License

MIT