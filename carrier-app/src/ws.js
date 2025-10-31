import { WebSocketServer } from 'ws';

let wss = null;

function initWebSocket(server) {
  wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  wss.on('connection', (ws, req) => {
    console.log(`WebSocket client connected from ${req.socket.remoteAddress}`);
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('WebSocket server initialized at /ws');
  return wss;
}

function broadcast(event) {
  if (!wss) return;
  
  const message = JSON.stringify(event);
  
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      try {
        client.send(message);
      } catch (error) {
        console.error('Error broadcasting to client:', error);
      }
    }
  });
  
  console.log(`Broadcasted event: ${event.type}`);
}

export { initWebSocket, broadcast };