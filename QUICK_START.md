# 🚀 ReasoMate Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- Windows PC for server (or any computer)
- Android phones with Expo Go app installed

## Step 1: Start the Server (Petra Node)

```bash
cd carrier-app
npm install
npm start
```

The server will start at `http://0.0.0.0:5000`

**Find your PC's IP address:**
- Windows: `ipconfig` (look for IPv4 Address)
- Your server will be at `http://YOUR_IP:5000`

## Step 2: Start the Client (Liora Node)

```bash
cd client-app
npm install
npx expo start --host lan
```

This will show a QR code. Scan it with Expo Go on your Android phone.

## Step 3: Configure & Test

1. **On your phone, open the app**
2. **Go to Profile tab**
3. **Set Carrier Base to:** `http://YOUR_PC_IP:5000`
4. **Register with a handle and sigil**
5. **Test the Feed and Messages tabs**

## Troubleshooting

**Server not accessible?**
- Check Windows Firewall (allow port 5000)
- Ensure PC and phone are on same WiFi/hotspot

**Expo errors?**
- Try: `npm install --legacy-peer-deps`
- Use Node.js 18 (not 20+)

**Can't scan QR?**
- Try: `npx expo start --tunnel`

## Testing Multiple Users

1. Register different users on different phones
2. Post pulses in Feed tab
3. Send messages in Messages tab
4. Watch real-time updates across devices

## Web Testing (Development)

You can also test the web version:
```bash
cd client-app
npx expo start --web
```

Then open `http://localhost:19006` in your browser.